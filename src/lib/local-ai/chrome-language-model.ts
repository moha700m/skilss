import { buildLocalPlannerMessages } from "./planner";
import type {
  LocalAIGenerationOptions,
  LocalAIGenerationResult,
  LocalAIGroundingPacket,
} from "./protocol";
import { resolveGenerationOptions } from "./protocol";

export const CHROME_LANGUAGE_MODEL_ID = "browser-language-model" as const;

export type ChromeLanguageModelAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable"
  | "unknown";

export interface ChromeLanguageModelCapability {
  apiPresent: boolean;
  availability: ChromeLanguageModelAvailability;
  englishOnly: true;
}

export type ChromeLanguageModelEvent = {
  type: "token";
  token: string;
  text: string;
};

export type ChromeLanguageModelEventListener = (
  event: ChromeLanguageModelEvent,
) => void;

export interface ChromeLanguageModelCreateOptions {
  onDownloadProgress?(percent: number): void;
}

interface LanguageModelLanguageOptions {
  expectedInputs: ReadonlyArray<{
    type: "text";
    languages: ReadonlyArray<"en">;
  }>;
  expectedOutputs: ReadonlyArray<{
    type: "text";
    languages: ReadonlyArray<"en">;
  }>;
}

interface DownloadProgressEventLike extends Event {
  loaded: number;
}

interface LanguageModelCreateMonitorLike {
  addEventListener(
    type: "downloadprogress",
    listener: (event: DownloadProgressEventLike) => void,
  ): void;
}

interface LanguageModelCreateOptions extends LanguageModelLanguageOptions {
  monitor(monitor: LanguageModelCreateMonitorLike): void;
}

interface LanguageModelPromptOptions {
  signal?: AbortSignal;
}

interface LanguageModelSessionLike {
  promptStreaming(
    prompt: string,
    options?: LanguageModelPromptOptions,
  ): ReadableStream<string>;
  destroy(): void;
}

interface LanguageModelConstructorLike {
  availability(options: LanguageModelLanguageOptions): Promise<string>;
  create(options: LanguageModelCreateOptions): Promise<LanguageModelSessionLike>;
}

type GlobalWithLanguageModel = typeof globalThis & {
  LanguageModel?: LanguageModelConstructorLike;
};

const ENGLISH_OPTIONS: LanguageModelLanguageOptions = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

function getLanguageModel(): LanguageModelConstructorLike | undefined {
  return (globalThis as GlobalWithLanguageModel).LanguageModel;
}

function normalizeAvailability(value: string): ChromeLanguageModelAvailability {
  if (
    value === "available" ||
    value === "downloadable" ||
    value === "downloading" ||
    value === "unavailable"
  ) {
    return value;
  }
  return "unknown";
}

/** Probes the optional browser API without creating a session or downloading. */
export async function detectChromeLanguageModel(): Promise<ChromeLanguageModelCapability> {
  const languageModel = getLanguageModel();
  if (!languageModel) {
    return { apiPresent: false, availability: "unavailable", englishOnly: true };
  }

  try {
    const availability = await languageModel.availability(ENGLISH_OPTIONS);
    return {
      apiPresent: true,
      availability: normalizeAvailability(availability),
      englishOnly: true,
    };
  } catch {
    return { apiPresent: true, availability: "unknown", englishOnly: true };
  }
}

export class ChromeLanguageModelError extends Error {
  readonly code:
    | "API_UNAVAILABLE"
    | "LANGUAGE_UNSUPPORTED"
    | "BUSY"
    | "CREATE_FAILED";

  constructor(
    code: ChromeLanguageModelError["code"],
    message: string,
  ) {
    super(message);
    this.name = "ChromeLanguageModelError";
    this.code = code;
  }
}

/**
 * Optional adapter for Chrome's built-in Prompt API. This adapter deliberately
 * advertises and accepts English only; Arabic requests use the Qwen WebGPU path.
 */
export class ChromeLanguageModelAdapter {
  private readonly listeners = new Set<ChromeLanguageModelEventListener>();
  private generating = false;

  private constructor(private readonly session: LanguageModelSessionLike) {}

  static async create(
    options: ChromeLanguageModelCreateOptions = {},
  ): Promise<ChromeLanguageModelAdapter> {
    const languageModel = getLanguageModel();
    if (!languageModel) {
      throw new ChromeLanguageModelError(
        "API_UNAVAILABLE",
        "The browser LanguageModel API is unavailable.",
      );
    }

    try {
      const session = await languageModel.create({
        ...ENGLISH_OPTIONS,
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            const loaded = Number.isFinite(event.loaded) ? event.loaded : 0;
            const percent = Math.max(
              0,
              Math.min(100, Math.round(loaded * 1_000) / 10),
            );
            options.onDownloadProgress?.(percent);
          });
        },
      });
      const adapter = new ChromeLanguageModelAdapter(session);
      return adapter;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Session creation failed.";
      throw new ChromeLanguageModelError("CREATE_FAILED", message);
    }
  }

  subscribe(listener: ChromeLanguageModelEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async generate(
    packet: LocalAIGroundingPacket,
    options: LocalAIGenerationOptions & { signal?: AbortSignal } = {},
  ): Promise<LocalAIGenerationResult> {
    if (packet.locale !== "en") {
      throw new ChromeLanguageModelError(
        "LANGUAGE_UNSUPPORTED",
        "The built-in LanguageModel adapter is intentionally restricted to English.",
      );
    }
    if (this.generating) {
      throw new ChromeLanguageModelError(
        "BUSY",
        "The built-in language model is already generating.",
      );
    }

    this.generating = true;
    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startedAt = performance.now();
    const resolved = resolveGenerationOptions(options);
    const timeoutController = new AbortController();
    let timedOut = false;
    let text = "";
    const onExternalAbort = () => timeoutController.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", onExternalAbort, { once: true });
    if (options.signal?.aborted) onExternalAbort();
    const timeout = setTimeout(() => {
      timedOut = true;
      timeoutController.abort(new DOMException("Timed out", "TimeoutError"));
    }, resolved.timeoutMs);

    try {
      const prompt = buildLocalPlannerMessages(packet)
        .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
        .join("\n\n");
      const stream = this.session.promptStreaming(prompt, {
        signal: timeoutController.signal,
      });
      const reader = stream.getReader();

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        // Chrome versions have shipped both cumulative and incremental chunks.
        const token = chunk.startsWith(text) ? chunk.slice(text.length) : chunk;
        text = chunk.startsWith(text) ? chunk : text + chunk;
        if (token) this.emit({ type: "token", token, text });
      }

      return {
        requestId,
        text: text.trim(),
        finishReason: "complete",
        // Chrome chooses its built-in model and exposes no stable model id.
        modelId: CHROME_LANGUAGE_MODEL_ID,
        elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    } catch (error: unknown) {
      if (timeoutController.signal.aborted) {
        return {
          requestId,
          text: text.trim(),
          finishReason: timedOut ? "timeout" : "cancelled",
          modelId: CHROME_LANGUAGE_MODEL_ID,
          elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
        };
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", onExternalAbort);
      this.generating = false;
    }
  }

  destroy(): void {
    this.session.destroy();
    this.listeners.clear();
  }

  private emit(event: ChromeLanguageModelEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
