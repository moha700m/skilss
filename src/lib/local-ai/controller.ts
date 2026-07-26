import {
  LOCAL_AI_MODEL_ID,
  resolveGenerationOptions,
  type LocalAIControllerEvent,
  type LocalAIErrorCode,
  type LocalAIGenerationOptions,
  type LocalAIGenerationResult,
  type LocalAIGroundingPacket,
  type LocalAIModelInfo,
  type LocalAIWorkerError,
  type LocalAIWorkerEvent,
  type LocalAIWorkerRequest,
} from "./protocol";

export type LocalAIEventListener = (event: LocalAIControllerEvent) => void;

export class LocalAIControllerError extends Error {
  readonly code: LocalAIErrorCode;
  readonly recoverable: boolean;

  constructor(error: LocalAIWorkerError) {
    super(error.message);
    this.name = "LocalAIControllerError";
    this.code = error.code;
    this.recoverable = error.recoverable;
  }
}

interface PendingLoad {
  requestId: string;
  promise: Promise<LocalAIModelInfo>;
  resolve(model: LocalAIModelInfo): void;
  reject(error: LocalAIControllerError): void;
}

interface PendingGeneration {
  requestId: string;
  startedAt: number;
  partialText: string;
  watchdog: ReturnType<typeof setTimeout>;
  resolve(result: LocalAIGenerationResult): void;
  reject(error: LocalAIControllerError): void;
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkerEvent(value: unknown): value is LocalAIWorkerEvent {
  if (!isObject(value) || typeof value.type !== "string") return false;
  if (value.type === "result") {
    return isObject(value.result) && typeof value.result.requestId === "string";
  }
  return (
    ["progress", "ready", "token", "cancelled", "error"].includes(value.type) &&
    typeof value.requestId === "string"
  );
}

function controllerError(
  code: LocalAIErrorCode,
  message: string,
  recoverable: boolean,
): LocalAIControllerError {
  return new LocalAIControllerError({ code, message, recoverable });
}

/**
 * Lazy client for the on-device model worker.
 *
 * Constructing this class performs no import, worker creation, or model
 * download. `load()` and `generate()` are the explicit opt-in boundaries.
 */
export class LocalAIController {
  private worker: Worker | null = null;
  private readyModel: LocalAIModelInfo | null = null;
  private pendingLoad: PendingLoad | null = null;
  private pendingGeneration: PendingGeneration | null = null;
  private readonly listeners = new Set<LocalAIEventListener>();

  subscribe(listener: LocalAIEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get isStarted(): boolean {
    return this.worker !== null;
  }

  get isReady(): boolean {
    return this.readyModel !== null;
  }

  get isGenerating(): boolean {
    return this.pendingGeneration !== null;
  }

  /** Explicitly creates the worker and downloads/loads the cached model. */
  load(): Promise<LocalAIModelInfo> {
    if (this.readyModel) return Promise.resolve(this.readyModel);
    if (this.pendingLoad) return this.pendingLoad.promise;

    const worker = this.ensureWorker();
    const requestId = createRequestId();
    let resolvePromise: (model: LocalAIModelInfo) => void = () => undefined;
    let rejectPromise: (error: LocalAIControllerError) => void = () => undefined;
    const promise = new Promise<LocalAIModelInfo>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    this.pendingLoad = {
      requestId,
      promise,
      resolve: resolvePromise,
      reject: rejectPromise,
    };
    this.post(worker, { type: "load", requestId });
    return promise;
  }

  /**
   * Generates text grounded in a bounded packet. It never accepts tool
   * definitions and returns no executable actions.
   */
  async generate(
    packet: LocalAIGroundingPacket,
    options: LocalAIGenerationOptions = {},
  ): Promise<LocalAIGenerationResult> {
    if (this.pendingGeneration) {
      throw controllerError(
        "BUSY",
        "The local model is already generating a response.",
        true,
      );
    }
    if (!packet.query.trim()) {
      throw controllerError("INVALID_REQUEST", "The query cannot be empty.", true);
    }

    await this.load();
    // Two callers can await the same first-load promise. Re-check after that
    // boundary so only one generation can claim the worker.
    if (this.pendingGeneration) {
      throw controllerError(
        "BUSY",
        "The local model is already generating a response.",
        true,
      );
    }
    const worker = this.ensureWorker();
    const resolvedOptions = resolveGenerationOptions(options);
    const requestId = createRequestId();
    const startedAt = performance.now();

    return new Promise<LocalAIGenerationResult>((resolve, reject) => {
      const watchdog = setTimeout(() => {
        const pending = this.pendingGeneration;
        if (!pending || pending.requestId !== requestId) return;

        const result: LocalAIGenerationResult = {
          requestId,
          text: pending.partialText,
          finishReason: "timeout",
          modelId: LOCAL_AI_MODEL_ID,
          elapsedMs: Math.max(0, Math.round(performance.now() - pending.startedAt)),
        };
        this.pendingGeneration = null;
        this.emit({ type: "result", result });
        pending.resolve(result);
        this.terminateWorker("error", false);
      }, resolvedOptions.timeoutMs + 2_000);

      this.pendingGeneration = {
        requestId,
        startedAt,
        partialText: "",
        watchdog,
        resolve,
        reject,
      };
      this.post(worker, {
        type: "generate",
        requestId,
        packet,
        options: resolvedOptions,
      });
    });
  }

  /** Requests cooperative cancellation and preserves already streamed text. */
  cancel(): boolean {
    if (!this.worker || !this.pendingGeneration) return false;
    this.post(this.worker, {
      type: "cancel",
      requestId: this.pendingGeneration.requestId,
    });
    return true;
  }

  /** Releases GPU/worker resources. A later load() starts a fresh worker. */
  terminate(): void {
    if (this.worker) this.post(this.worker, { type: "dispose" });
    this.terminateWorker("manual", true);
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      throw controllerError(
        "WEBGPU_UNAVAILABLE",
        "Local AI requires a browser with module workers and WebGPU.",
        false,
      );
    }

    const localNavigator = navigator as Navigator & { gpu?: unknown };
    if (!localNavigator.gpu) {
      throw controllerError(
        "WEBGPU_UNAVAILABLE",
        "WebGPU is unavailable in this browser.",
        false,
      );
    }

    const worker = new Worker(
      new URL("../../workers/local-ai.worker.ts", import.meta.url),
      { type: "module", name: "skillatlas-local-ai" },
    );
    worker.addEventListener("message", this.handleMessage);
    worker.addEventListener("error", this.handleWorkerError);
    worker.addEventListener("messageerror", this.handleWorkerMessageError);
    this.worker = worker;
    this.emit({ type: "worker-started" });
    return worker;
  }

  private readonly handleMessage = (message: MessageEvent<unknown>): void => {
    if (!isWorkerEvent(message.data)) return;
    const event = message.data;
    this.emit(event);

    if (event.type === "ready") {
      this.readyModel = event.model;
      if (this.pendingLoad?.requestId === event.requestId) {
        const pending = this.pendingLoad;
        this.pendingLoad = null;
        pending.resolve(event.model);
      }
      return;
    }

    if (event.type === "token") {
      if (this.pendingGeneration?.requestId === event.requestId) {
        this.pendingGeneration.partialText = event.text;
      }
      return;
    }

    if (event.type === "result") {
      if (this.pendingGeneration?.requestId === event.result.requestId) {
        const pending = this.pendingGeneration;
        this.pendingGeneration = null;
        clearTimeout(pending.watchdog);
        pending.resolve(event.result);
      }
      return;
    }

    if (event.type === "error") {
      const error = new LocalAIControllerError(event.error);
      if (this.pendingLoad?.requestId === event.requestId) {
        const pending = this.pendingLoad;
        this.pendingLoad = null;
        pending.reject(error);
      }
      if (this.pendingGeneration?.requestId === event.requestId) {
        const pending = this.pendingGeneration;
        this.pendingGeneration = null;
        clearTimeout(pending.watchdog);
        pending.reject(error);
      }
    }
  };

  private readonly handleWorkerError = (): void => {
    this.terminateWorker("error", true);
  };

  private readonly handleWorkerMessageError = (): void => {
    this.terminateWorker("error", true);
  };

  private post(worker: Worker, request: LocalAIWorkerRequest): void {
    worker.postMessage(request);
  }

  private emit(event: LocalAIControllerEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private rejectPending(error: LocalAIControllerError): void {
    if (this.pendingLoad) {
      const pending = this.pendingLoad;
      this.pendingLoad = null;
      pending.reject(error);
    }
    if (this.pendingGeneration) {
      const pending = this.pendingGeneration;
      this.pendingGeneration = null;
      clearTimeout(pending.watchdog);
      pending.reject(error);
    }
  }

  private terminateWorker(
    reason: "manual" | "error",
    rejectPending: boolean,
  ): void {
    const worker = this.worker;
    if (!worker) return;
    worker.removeEventListener("message", this.handleMessage);
    worker.removeEventListener("error", this.handleWorkerError);
    worker.removeEventListener("messageerror", this.handleWorkerMessageError);
    worker.terminate();
    this.worker = null;
    this.readyModel = null;
    if (rejectPending) {
      this.rejectPending(
        controllerError(
          reason === "manual" ? "DISPOSED" : "WORKER_ERROR",
          reason === "manual"
            ? "The local-AI worker was terminated."
            : "The local-AI worker stopped unexpectedly.",
          true,
        ),
      );
    }
    this.emit({ type: "worker-terminated", reason });
  }
}
