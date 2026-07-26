import { buildLocalPlannerMessages } from "../lib/local-ai/planner";
import {
  LOCAL_AI_DEVICE,
  LOCAL_AI_DTYPE,
  LOCAL_AI_MODEL_ID,
  resolveGenerationOptions,
  type LocalAIFinishReason,
  type LocalAIGenerationResult,
  type LocalAIModelProgress,
  type LocalAIWorkerError,
  type LocalAIWorkerEvent,
  type LocalAIWorkerRequest,
} from "../lib/local-ai/protocol";

interface WorkerScopeLike {
  postMessage(message: LocalAIWorkerEvent): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  close(): void;
}

interface ActiveStoppingCriteria {
  requestId: string;
  cancelled: boolean;
  timedOut: boolean;
  interrupt(): void;
}

const workerScope = globalThis as unknown as WorkerScopeLike;
let modelPromise: ReturnType<typeof createTextGenerator> | null = null;
let activeGeneration: ActiveStoppingCriteria | null = null;
const queuedCancellations = new Set<string>();

function post(event: LocalAIWorkerEvent): void {
  workerScope.postMessage(event);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkerRequest(value: unknown): value is LocalAIWorkerRequest {
  if (!isObject(value) || typeof value.type !== "string") return false;
  if (value.type === "dispose") return true;
  if (value.type === "cancel") {
    return value.requestId === undefined || typeof value.requestId === "string";
  }
  if (value.type === "load") return typeof value.requestId === "string";
  return (
    value.type === "generate" &&
    typeof value.requestId === "string" &&
    isObject(value.packet) &&
    isObject(value.options)
  );
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeProgress(value: unknown): LocalAIModelProgress {
  if (!isObject(value)) {
    return { phase: "loading", status: "loading" };
  }

  const status = readString(value, "status") ?? "loading";
  const file = readString(value, "file") ?? readString(value, "name");
  const loadedBytes = readNumber(value, "loaded");
  const totalBytes = readNumber(value, "total");
  const reportedProgress = readNumber(value, "progress");
  let percent: number | undefined;

  if (loadedBytes !== undefined && totalBytes && totalBytes > 0) {
    percent = (loadedBytes / totalBytes) * 100;
  } else if (reportedProgress !== undefined) {
    percent = reportedProgress <= 1 ? reportedProgress * 100 : reportedProgress;
  }

  const normalizedStatus = status.toLocaleLowerCase();
  const phase: LocalAIModelProgress["phase"] =
    normalizedStatus === "ready"
      ? "ready"
      : normalizedStatus.includes("download") || normalizedStatus === "progress"
        ? "downloading"
        : normalizedStatus === "initiate"
          ? "initializing"
          : "loading";

  return {
    phase,
    status,
    file,
    loadedBytes,
    totalBytes,
    percent:
      percent === undefined
        ? undefined
        : Math.max(0, Math.min(100, Math.round(percent * 10) / 10)),
  };
}

async function createTextGenerator(
  onProgress: (progress: LocalAIModelProgress) => void,
) {
  const transformers = await import("@huggingface/transformers");

  // Hugging Face files are public; browser Cache Storage avoids repeat downloads.
  transformers.env.allowLocalModels = false;
  transformers.env.useBrowserCache = true;
  // Self-host the pinned ONNX runtime bridge so local inference does not depend
  // on an executable script from a third-party CDN. Safari uses the standard
  // threaded build; other WebGPU browsers use the asyncify bridge selected by
  // Transformers.js upstream.
  const isSafari = /^((?!chrome|chromium|android).)*safari/i.test(navigator.userAgent);
  const onnxWasm = transformers.env.backends.onnx.wasm;
  if (!onnxWasm) throw new Error("The ONNX WebAssembly runtime is unavailable.");
  onnxWasm.wasmPaths = isSafari
    ? {
        mjs: "/onnx/ort-wasm-simd-threaded.mjs",
        wasm: "/onnx/ort-wasm-simd-threaded.wasm",
      }
    : {
        mjs: "/onnx/ort-wasm-simd-threaded.asyncify.mjs",
        wasm: "/onnx/ort-wasm-simd-threaded.asyncify.wasm",
      };

  const generator = await transformers.pipeline(
    "text-generation",
    LOCAL_AI_MODEL_ID,
    {
      device: LOCAL_AI_DEVICE,
      dtype: LOCAL_AI_DTYPE,
      progress_callback: (progress: unknown) => onProgress(normalizeProgress(progress)),
    },
  );

  return { generator, transformers };
}

function loadModel(requestId: string) {
  if (!modelPromise) {
    post({
      type: "progress",
      requestId,
      progress: { phase: "initializing", status: "initializing" },
    });
    modelPromise = createTextGenerator((progress) => {
      post({ type: "progress", requestId, progress });
    }).catch((error: unknown) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.slice(0, 600);
  return "Unknown local inference error.";
}

function postError(
  requestId: string,
  code: LocalAIWorkerError["code"],
  message: string,
  recoverable: boolean,
): void {
  post({
    type: "error",
    requestId,
    error: { code, message, recoverable },
  });
}

function extractGeneratedText(output: unknown): string {
  if (!Array.isArray(output) || !isObject(output[0])) return "";
  const generated = output[0].generated_text;
  if (typeof generated === "string") return generated;
  if (!Array.isArray(generated)) return "";

  for (let index = generated.length - 1; index >= 0; index -= 1) {
    const message = generated[index];
    if (isObject(message) && typeof message.content === "string") {
      return message.content;
    }
  }
  return "";
}

async function handleLoad(requestId: string): Promise<void> {
  try {
    await loadModel(requestId);
    post({
      type: "progress",
      requestId,
      progress: { phase: "ready", status: "ready", percent: 100 },
    });
    post({
      type: "ready",
      requestId,
      model: {
        modelId: LOCAL_AI_MODEL_ID,
        device: LOCAL_AI_DEVICE,
        dtype: LOCAL_AI_DTYPE,
        cache: "browser-cache",
      },
    });
  } catch (error: unknown) {
    postError(
      requestId,
      "MODEL_LOAD_FAILED",
      errorMessage(error),
      true,
    );
  }
}

async function handleGenerate(
  request: Extract<LocalAIWorkerRequest, { type: "generate" }>,
): Promise<void> {
  if (activeGeneration) {
    postError(
      request.requestId,
      "BUSY",
      "The local worker is already generating a response.",
      true,
    );
    return;
  }

  if (
    typeof request.packet.query !== "string" ||
    !request.packet.query.trim() ||
    (request.packet.locale !== "ar" && request.packet.locale !== "en")
  ) {
    postError(
      request.requestId,
      "INVALID_REQUEST",
      "The grounding packet must contain a non-empty query and a supported locale.",
      true,
    );
    return;
  }

  const options = resolveGenerationOptions(request.options);
  const startedAt = performance.now();
  let streamedText = "";
  let generatedTokenCount = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const { generator, transformers } = await loadModel(request.requestId);
    const stoppingCriteria = new transformers.InterruptableStoppingCriteria();
    const state: ActiveStoppingCriteria = {
      requestId: request.requestId,
      cancelled: false,
      timedOut: false,
      interrupt: () => stoppingCriteria.interrupt(),
    };
    activeGeneration = state;
    if (queuedCancellations.delete(request.requestId)) {
      state.cancelled = true;
      state.interrupt();
      post({ type: "cancelled", requestId: request.requestId });
    }

    timeout = setTimeout(() => {
      if (activeGeneration?.requestId !== request.requestId) return;
      activeGeneration.timedOut = true;
      activeGeneration.interrupt();
    }, options.timeoutMs);

    const streamer = new transformers.TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token: string) => {
        streamedText += token;
        post({
          type: "token",
          requestId: request.requestId,
          token,
          text: streamedText,
        });
      },
      token_callback_function: () => {
        generatedTokenCount += 1;
      },
    });

    const messages = buildLocalPlannerMessages(request.packet);
    const output: unknown = await generator(messages, {
      max_new_tokens: options.maxNewTokens,
      max_time: options.timeoutMs / 1_000,
      do_sample: false,
      streamer,
      stopping_criteria: stoppingCriteria,
    });

    if (!streamedText) streamedText = extractGeneratedText(output);
    const finishReason: LocalAIFinishReason = state.timedOut
      ? "timeout"
      : state.cancelled
        ? "cancelled"
        : generatedTokenCount >= options.maxNewTokens
          ? "max_tokens"
          : "complete";
    const result: LocalAIGenerationResult = {
      requestId: request.requestId,
      text: streamedText.trim(),
      finishReason,
      modelId: LOCAL_AI_MODEL_ID,
      elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
    post({ type: "result", result });
  } catch (error: unknown) {
    postError(
      request.requestId,
      "GENERATION_FAILED",
      errorMessage(error),
      true,
    );
  } finally {
    if (timeout) clearTimeout(timeout);
    if (activeGeneration?.requestId === request.requestId) {
      activeGeneration = null;
    }
  }
}

function handleCancel(requestId: string | undefined): void {
  if (!activeGeneration) {
    if (requestId) queuedCancellations.add(requestId);
    return;
  }
  if (requestId && activeGeneration.requestId !== requestId) return;
  activeGeneration.cancelled = true;
  activeGeneration.interrupt();
  post({ type: "cancelled", requestId: activeGeneration.requestId });
}

function handleDispose(): void {
  if (activeGeneration) activeGeneration.interrupt();
  const pendingModel = modelPromise;
  modelPromise = null;
  activeGeneration = null;
  queuedCancellations.clear();

  if (pendingModel) {
    void pendingModel
      .then(async ({ generator }) => generator.dispose())
      .catch(() => undefined)
      .finally(() => workerScope.close());
  } else {
    workerScope.close();
  }
}

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isWorkerRequest(event.data)) return;
  const request = event.data;

  switch (request.type) {
    case "load":
      void handleLoad(request.requestId);
      break;
    case "generate":
      void handleGenerate(request);
      break;
    case "cancel":
      handleCancel(request.requestId);
      break;
    case "dispose":
      handleDispose();
      break;
  }
});
