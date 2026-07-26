/**
 * Serializable contract shared by the browser controller and the local-AI worker.
 * Keep this file free of browser globals so it can also be imported during SSR.
 */

export const LOCAL_AI_MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX" as const;
export const LOCAL_AI_DEVICE = "webgpu" as const;
export const LOCAL_AI_DTYPE = "q4f16" as const;

export const LOCAL_AI_DEFAULT_MAX_NEW_TOKENS = 384;
export const LOCAL_AI_MAX_NEW_TOKENS = 768;
export const LOCAL_AI_DEFAULT_TIMEOUT_MS = 120_000;
export const LOCAL_AI_MAX_TIMEOUT_MS = 300_000;

export type LocalAILocale = "ar" | "en";
export type LocalAIConversationRole = "user" | "assistant";

export interface LocalAIConversationTurn {
  role: LocalAIConversationRole;
  content: string;
}

export type LocalAIGroundingKind =
  | "skill"
  | "catalog"
  | "web"
  | "github"
  | "page"
  | "note";

export interface LocalAIGroundingItem {
  id: string;
  kind: LocalAIGroundingKind;
  title: string;
  excerpt: string;
  url?: string;
  metadata?: ReadonlyArray<string>;
}

export interface LocalAICatalogGrounding {
  totalSkills?: number;
  syncedAt?: string;
  upstreamCommit?: string;
  category?: string;
}

/**
 * The trusted application creates this packet. Retrieved text is treated as
 * untrusted evidence by the planner and never as executable instructions.
 */
export interface LocalAIGroundingPacket {
  locale: LocalAILocale;
  query: string;
  conversation?: ReadonlyArray<LocalAIConversationTurn>;
  catalog?: LocalAICatalogGrounding;
  sources?: ReadonlyArray<LocalAIGroundingItem>;
  constraints?: ReadonlyArray<string>;
  currentPage?: {
    title: string;
    path: string;
  };
}

export interface LocalAIGenerationOptions {
  maxNewTokens?: number;
  timeoutMs?: number;
}

export interface LocalAIResolvedGenerationOptions {
  maxNewTokens: number;
  timeoutMs: number;
}

export type LocalAIFinishReason =
  | "complete"
  | "cancelled"
  | "timeout"
  | "max_tokens";

export interface LocalAIGenerationResult {
  requestId: string;
  text: string;
  finishReason: LocalAIFinishReason;
  modelId: string;
  elapsedMs: number;
}

export type LocalAIProgressPhase =
  | "initializing"
  | "downloading"
  | "loading"
  | "ready";

export interface LocalAIModelProgress {
  phase: LocalAIProgressPhase;
  status: string;
  file?: string;
  loadedBytes?: number;
  totalBytes?: number;
  percent?: number;
}

export interface LocalAIModelInfo {
  modelId: typeof LOCAL_AI_MODEL_ID;
  device: typeof LOCAL_AI_DEVICE;
  dtype: typeof LOCAL_AI_DTYPE;
  cache: "browser-cache";
}

export type LocalAIErrorCode =
  | "BUSY"
  | "CANCELLED"
  | "DISPOSED"
  | "INVALID_REQUEST"
  | "MODEL_LOAD_FAILED"
  | "GENERATION_FAILED"
  | "WEBGPU_UNAVAILABLE"
  | "WORKER_ERROR";

export interface LocalAIWorkerError {
  code: LocalAIErrorCode;
  message: string;
  recoverable: boolean;
}

export type LocalAIWorkerRequest =
  | {
      type: "load";
      requestId: string;
    }
  | {
      type: "generate";
      requestId: string;
      packet: LocalAIGroundingPacket;
      options: LocalAIResolvedGenerationOptions;
    }
  | {
      type: "cancel";
      requestId?: string;
    }
  | {
      type: "dispose";
    };

export type LocalAIWorkerEvent =
  | {
      type: "progress";
      requestId: string;
      progress: LocalAIModelProgress;
    }
  | {
      type: "ready";
      requestId: string;
      model: LocalAIModelInfo;
    }
  | {
      type: "token";
      requestId: string;
      token: string;
      text: string;
    }
  | {
      type: "result";
      result: LocalAIGenerationResult;
    }
  | {
      type: "cancelled";
      requestId: string;
    }
  | {
      type: "error";
      requestId: string;
      error: LocalAIWorkerError;
    };

export type LocalAIControllerEvent =
  | LocalAIWorkerEvent
  | {
      type: "worker-started";
    }
  | {
      type: "worker-terminated";
      reason: "manual" | "error";
    };

export function resolveGenerationOptions(
  options: LocalAIGenerationOptions = {},
): LocalAIResolvedGenerationOptions {
  const requestedTokens = Number.isFinite(options.maxNewTokens)
    ? Math.trunc(options.maxNewTokens ?? LOCAL_AI_DEFAULT_MAX_NEW_TOKENS)
    : LOCAL_AI_DEFAULT_MAX_NEW_TOKENS;
  const requestedTimeout = Number.isFinite(options.timeoutMs)
    ? Math.trunc(options.timeoutMs ?? LOCAL_AI_DEFAULT_TIMEOUT_MS)
    : LOCAL_AI_DEFAULT_TIMEOUT_MS;

  return {
    maxNewTokens: Math.min(
      LOCAL_AI_MAX_NEW_TOKENS,
      Math.max(1, requestedTokens),
    ),
    timeoutMs: Math.min(
      LOCAL_AI_MAX_TIMEOUT_MS,
      Math.max(5_000, requestedTimeout),
    ),
  };
}
