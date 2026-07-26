export interface LocalAICapabilities {
  browser: boolean;
  secureContext: boolean;
  moduleWorker: boolean;
  webGPU: boolean;
  adapterAvailable: boolean;
  shaderF16: boolean;
  browserCache: boolean;
  hardwareConcurrency?: number;
  deviceMemoryGiB?: number;
  recommended: boolean;
  blockers: ReadonlyArray<
    | "NOT_IN_BROWSER"
    | "INSECURE_CONTEXT"
    | "WORKER_UNAVAILABLE"
    | "WEBGPU_UNAVAILABLE"
    | "GPU_ADAPTER_UNAVAILABLE"
    | "SHADER_F16_UNAVAILABLE"
    | "CACHE_UNAVAILABLE"
  >;
}
interface GPUFeatureSetLike {
  has(feature: string): boolean;
}

interface GPUAdapterLike {
  features: GPUFeatureSetLike;
}

interface GPULike {
  requestAdapter(options?: {
    powerPreference?: "low-power" | "high-performance";
  }): Promise<GPUAdapterLike | null>;
}

type NavigatorWithLocalAI = Navigator & {
  gpu?: GPULike;
  deviceMemory?: number;
};

/** Detects local inference support without loading code or downloading a model. */
export async function detectLocalAICapabilities(): Promise<LocalAICapabilities> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      browser: false,
      secureContext: false,
      moduleWorker: false,
      webGPU: false,
      adapterAvailable: false,
      shaderF16: false,
      browserCache: false,
      recommended: false,
      blockers: ["NOT_IN_BROWSER"],
    };
  }

  const localNavigator = navigator as NavigatorWithLocalAI;
  const secureContext = window.isSecureContext;
  const moduleWorker = typeof Worker !== "undefined";
  const webGPU = Boolean(localNavigator.gpu);
  const browserCache = typeof caches !== "undefined";
  let adapterAvailable = false;
  let shaderF16 = false;

  if (localNavigator.gpu) {
    try {
      const adapter = await localNavigator.gpu.requestAdapter({
        powerPreference: "high-performance",
      });
      adapterAvailable = adapter !== null;
      shaderF16 = adapter?.features.has("shader-f16") ?? false;
    } catch {
      adapterAvailable = false;
    }
  }

  const blockers: LocalAICapabilities["blockers"][number][] = [];
  if (!secureContext) blockers.push("INSECURE_CONTEXT");
  if (!moduleWorker) blockers.push("WORKER_UNAVAILABLE");
  if (!webGPU) blockers.push("WEBGPU_UNAVAILABLE");
  else if (!adapterAvailable) blockers.push("GPU_ADAPTER_UNAVAILABLE");
  if (adapterAvailable && !shaderF16) blockers.push("SHADER_F16_UNAVAILABLE");
  if (!browserCache) blockers.push("CACHE_UNAVAILABLE");

  return {
    browser: true,
    secureContext,
    moduleWorker,
    webGPU,
    adapterAvailable,
    shaderF16,
    browserCache,
    hardwareConcurrency: Number.isFinite(localNavigator.hardwareConcurrency)
      ? localNavigator.hardwareConcurrency
      : undefined,
    deviceMemoryGiB: Number.isFinite(localNavigator.deviceMemory)
      ? localNavigator.deviceMemory
      : undefined,
    recommended:
      secureContext && moduleWorker && adapterAvailable && shaderF16 && browserCache,
    blockers,
  };
}
