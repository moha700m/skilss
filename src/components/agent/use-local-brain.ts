"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectLocalAICapabilities,
  LocalAIController,
  type LocalAICapabilities,
  type LocalAIGenerationResult,
  type LocalAIGroundingPacket,
  type LocalAIModelInfo,
} from "@/lib/local-ai";

export type LocalBrainPhase =
  | "checking"
  | "available"
  | "unsupported"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface LocalBrainState {
  phase: LocalBrainPhase;
  capabilities: LocalAICapabilities | null;
  model: LocalAIModelInfo | null;
  progress: number | null;
  progressLabel: string | null;
  streamedText: string;
  errorCode: string | null;
}

const initialState: LocalBrainState = {
  phase: "checking",
  capabilities: null,
  model: null,
  progress: null,
  progressLabel: null,
  streamedText: "",
  errorCode: null,
};

export function useLocalBrain() {
  const [state, setState] = useState<LocalBrainState>(initialState);
  const controllerRef = useRef<LocalAIController | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    void detectLocalAICapabilities().then((capabilities) => {
      if (!active) return;
      setState((current) => ({
        ...current,
        capabilities,
        phase: capabilities.recommended ? "available" : "unsupported",
      }));
    });

    return () => {
      active = false;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      controllerRef.current?.terminate();
      controllerRef.current = null;
    };
  }, []);

  const ensureController = useCallback(() => {
    if (controllerRef.current) return controllerRef.current;

    const controller = new LocalAIController();
    unsubscribeRef.current = controller.subscribe((event) => {
      if (event.type === "progress") {
        setState((current) => ({
          ...current,
          phase: event.progress.phase === "ready" ? "ready" : "loading",
          progress: event.progress.percent ?? current.progress,
          progressLabel: event.progress.file ?? event.progress.status,
          errorCode: null,
        }));
      } else if (event.type === "ready") {
        setState((current) => ({
          ...current,
          phase: "ready",
          model: event.model,
          progress: 100,
          progressLabel: "ready",
          errorCode: null,
        }));
      } else if (event.type === "token") {
        setState((current) => ({ ...current, streamedText: event.text }));
      } else if (event.type === "error") {
        setState((current) => ({
          ...current,
          phase: "error",
          errorCode: event.error.code,
          progressLabel: event.error.message,
        }));
      }
    });
    controllerRef.current = controller;
    return controller;
  }, []);

  const enable = useCallback(async () => {
    if (!state.capabilities?.recommended) return false;
    setState((current) => ({
      ...current,
      phase: "loading",
      progress: 0,
      progressLabel: "initializing",
      errorCode: null,
    }));
    try {
      const model = await ensureController().load();
      setState((current) => ({
        ...current,
        phase: "ready",
        model,
        progress: 100,
        progressLabel: "ready",
      }));
      return true;
    } catch (error) {
      if (!controllerRef.current) return false;
      setState((current) => ({
        ...current,
        phase: "error",
        errorCode: error instanceof Error ? error.name : "MODEL_LOAD_FAILED",
        progressLabel: error instanceof Error ? error.message : "Model load failed",
      }));
      return false;
    }
  }, [ensureController, state.capabilities?.recommended]);

  const generate = useCallback(async (
    packet: LocalAIGroundingPacket,
  ): Promise<LocalAIGenerationResult | null> => {
    const controller = controllerRef.current;
    if (!controller?.isReady) return null;

    setState((current) => ({
      ...current,
      phase: "generating",
      streamedText: "",
      errorCode: null,
    }));
    try {
      const result = await controller.generate(packet, {
        maxNewTokens: 384,
        timeoutMs: 120_000,
      });
      setState((current) => ({
        ...current,
        phase: "ready",
        streamedText: result.text,
      }));
      return result;
    } catch (error) {
      if (!controllerRef.current) return null;
      setState((current) => ({
        ...current,
        phase: "error",
        errorCode: error instanceof Error ? error.name : "GENERATION_FAILED",
        progressLabel: error instanceof Error ? error.message : "Generation failed",
      }));
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    const cancelled = controllerRef.current?.cancel() ?? false;
    if (cancelled) {
      setState((current) => ({ ...current, phase: "ready" }));
    }
    return cancelled;
  }, []);

  const disable = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    controllerRef.current?.terminate();
    controllerRef.current = null;
    setState((current) => ({
      ...initialState,
      capabilities: current.capabilities,
      phase: current.capabilities?.recommended ? "available" : "unsupported",
    }));
  }, []);

  return { state, enable, generate, cancel, disable };
}
