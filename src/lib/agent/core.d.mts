import type { RunAgentInput, AgentResponse } from "./types";

export function normalizeText(value: string): string;
export function detectLocale(value: string): "ar" | "en";
export function runAgent(input: RunAgentInput): AgentResponse;
