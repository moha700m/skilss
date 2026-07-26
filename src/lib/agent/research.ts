export type ResearchProvider = "github" | "npm" | "wikipedia";

export interface AgentResearchSource {
  id: string;
  provider: ResearchProvider;
  title: string;
  url: string;
  snippet: string;
  meta?: string;
}

export interface AgentResearchResponse {
  query: string;
  sources: AgentResearchSource[];
  providers: Array<{
    id: ResearchProvider;
    status: "ok" | "unavailable";
    count: number;
  }>;
  fetchedAt: string;
  privacy?: string;
}

const explicitResearchPatterns = [
  /(?:^|\s)(?:الويب|ويب|الإنترنت|الانترنت|إنترنت|انترنت)(?:\s|$)/u,
  /(?:ابحث|دور|فتش).{0,24}(?:GitHub|npm|ويكيبيديا|المصادر|النت)/iu,
  /(?:أحدث|احدث|آخر|اخر).{0,24}(?:إصدار|اصدار|معلومة|نتيجة|مشروع|حزمة|مكتبة)/u,
  /(?:search|research|look\s*up|browse).{0,24}(?:web|internet|github|npm|wikipedia|online)/iu,
  /(?:latest|current|today|newest).{0,24}(?:release|version|package|repository|information)/iu,
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProvider(value: unknown): value is ResearchProvider {
  return value === "github" || value === "npm" || value === "wikipedia";
}

function safePublicUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (
      url.hostname !== "github.com" &&
      url.hostname !== "www.npmjs.com" &&
      !url.hostname.endsWith(".wikipedia.org")
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function boundedText(value: unknown, limit: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit)
    : "";
}

function parseSource(value: unknown): AgentResearchSource | null {
  if (!isRecord(value) || !isProvider(value.provider)) return null;
  const id = boundedText(value.id, 180);
  const title = boundedText(value.title, 180);
  const snippet = boundedText(value.snippet, 360);
  const url = safePublicUrl(value.url);
  if (!id || !title || !snippet || !url) return null;

  const meta = boundedText(value.meta, 120);
  return { id, provider: value.provider, title, snippet, url, meta: meta || undefined };
}

export function isExplicitResearchRequest(query: string): boolean {
  const normalized = query.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 1_200);
  return explicitResearchPatterns.some((pattern) => pattern.test(normalized));
}

export async function fetchAgentResearch(
  query: string,
  signal?: AbortSignal,
): Promise<AgentResearchResponse> {
  const response = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });

  if (!response.ok) {
    const error = new Error(response.status === 429 ? "RATE_LIMIT" : "RESEARCH_FAILED");
    error.name = "AgentResearchError";
    throw error;
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.sources)) {
    throw new Error("INVALID_RESEARCH_RESPONSE");
  }

  const providers = Array.isArray(payload.providers)
    ? payload.providers.flatMap((provider) => {
        if (!isRecord(provider) || !isProvider(provider.id)) return [];
        return [{
          id: provider.id,
          status: provider.status === "ok" ? "ok" as const : "unavailable" as const,
          count: typeof provider.count === "number" ? Math.max(0, Math.trunc(provider.count)) : 0,
        }];
      })
    : [];

  return {
    query: boundedText(payload.query, 160) || query.slice(0, 160),
    sources: payload.sources.flatMap((source) => {
      const parsed = parseSource(source);
      return parsed ? [parsed] : [];
    }).slice(0, 9),
    providers,
    fetchedAt: boundedText(payload.fetchedAt, 80) || new Date().toISOString(),
    privacy: boundedText(payload.privacy, 400) || undefined,
  };
}
