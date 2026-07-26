import type { NextRequest } from "next/server";

const MAX_QUERY_LENGTH = 160;
const MAX_BODY_BYTES = 4_096;
const MAX_REQUESTS_PER_MINUTE = 12;
const MAX_RATE_BUCKETS = 2_048;
const REQUEST_TIMEOUT_MS = 6_000;

type ProviderId = "github" | "npm" | "wikipedia";

interface ResearchSource {
  id: string;
  provider: ProviderId;
  title: string;
  url: string;
  snippet: string;
  meta?: string;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

const technicalTerms: Array<[RegExp, string]> = [
  [/ذكاء\s*اصطناعي/giu, "artificial intelligence"],
  [/وكل(?:اء|يل)/giu, "AI agent"],
  [/مهارات?/giu, "skills"],
  [/تحليل\s*بيانات/giu, "data analysis"],
  [/برمج(?:ة|يات)/giu, "programming"],
  [/تطوير/giu, "development"],
  [/تصميم/giu, "design"],
  [/أتمتة|اتمتة/giu, "automation"],
  [/بحث/giu, "search"],
];

function normalizeQuery(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

function technicalQuery(query: string) {
  let translated = query;
  for (const [pattern, replacement] of technicalTerms) {
    translated = translated.replace(pattern, ` ${replacement} `);
  }

  const tokens = translated.match(/[a-z0-9@._/-]{2,}/gi) ?? [];
  const generic = new Set(["ai", "artificial", "intelligence", "skills", "programming", "development"]);
  const distinctive = tokens.filter((token) => !generic.has(token.toLowerCase()));
  const fallback = tokens.filter((token) => generic.has(token.toLowerCase()));

  return [...new Set([...distinctive.slice(0, 3), ...fallback.slice(0, 2)])].join(" ") || query;
}

function plainText(value: unknown, limit = 280) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("x-real-ip") || "anonymous")
    .replace(/[^a-f0-9:.\[\]-]/gi, "")
    .slice(0, 96) || "anonymous";
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host") || requestUrl.host;
    const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
    const publicOrigin = `${protocol}://${host}`;

    return origin === publicOrigin || origin === requestUrl.origin;
  } catch {
    return false;
  }
}

function consumeRateLimit(key: string) {
  const now = Date.now();
  if (rateBuckets.size >= MAX_RATE_BUCKETS) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now || rateBuckets.size >= MAX_RATE_BUCKETS) {
        rateBuckets.delete(bucketKey);
      }
      if (rateBuckets.size < MAX_RATE_BUCKETS) break;
    }
  }
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

async function fetchJson(url: string, headers?: HeadersInit) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function readLimitedJson(request: NextRequest): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RangeError("body_too_large");
  }
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("body_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

async function searchGitHub(query: string): Promise<ResearchSource[]> {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", `${technicalQuery(query)} in:name,description`);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "3");

  const data = (await fetchJson(url.toString(), {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "SkillAtlas-Keyless-Research/1.0",
  })) as { items?: Array<Record<string, unknown>> };

  return (data.items ?? []).flatMap((item) => {
    const fullName = plainText(item.full_name, 100);
    const htmlUrl = typeof item.html_url === "string" ? item.html_url : "";
    if (!fullName || !htmlUrl.startsWith("https://github.com/")) return [];

    const stars = typeof item.stargazers_count === "number" ? item.stargazers_count : 0;
    const language = plainText(item.language, 40);
    return [
      {
        id: `github:${fullName}`,
        provider: "github" as const,
        title: fullName,
        url: htmlUrl,
        snippet: plainText(item.description) || "Public GitHub repository",
        meta: [language, `${stars.toLocaleString("en-US")} ★`].filter(Boolean).join(" · "),
      },
    ];
  });
}

async function searchNpm(query: string): Promise<ResearchSource[]> {
  const url = new URL("https://registry.npmjs.org/-/v1/search");
  url.searchParams.set("text", technicalQuery(query));
  url.searchParams.set("size", "3");

  const data = (await fetchJson(url.toString(), {
    Accept: "application/json",
    "User-Agent": "SkillAtlas-Keyless-Research/1.0",
  })) as { objects?: Array<{ package?: Record<string, unknown> }> };

  return (data.objects ?? []).flatMap((entry) => {
    const name = plainText(entry.package?.name, 100);
    if (!name || !/^[@a-z0-9._/-]+$/i.test(name)) return [];

    const version = plainText(entry.package?.version, 40);
    return [
      {
        id: `npm:${name}`,
        provider: "npm" as const,
        title: name,
        url: `https://www.npmjs.com/package/${encodeURIComponent(name)}`,
        snippet: plainText(entry.package?.description) || "Public npm package",
        meta: version ? `v${version}` : undefined,
      },
    ];
  });
}

async function searchWikipedia(query: string): Promise<ResearchSource[]> {
  const language = /[\u0600-\u06FF]/.test(query) ? "ar" : "en";
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "3");
  url.searchParams.set("format", "json");
  url.searchParams.set("utf8", "1");
  url.searchParams.set("origin", "*");

  const data = (await fetchJson(url.toString(), {
    Accept: "application/json",
    "User-Agent": "SkillAtlas-Keyless-Research/1.0",
  })) as { query?: { search?: Array<Record<string, unknown>> } };

  return (data.query?.search ?? []).flatMap((item) => {
    const title = plainText(item.title, 140);
    const pageId = typeof item.pageid === "number" ? item.pageid : 0;
    if (!title || !pageId) return [];

    return [
      {
        id: `wikipedia:${language}:${pageId}`,
        provider: "wikipedia" as const,
        title,
        url: `https://${language}.wikipedia.org/?curid=${pageId}`,
        snippet: plainText(item.snippet) || title,
        meta: language === "ar" ? "ويكيبيديا العربية" : "English Wikipedia",
      },
    ];
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return Response.json({ error: "unsupported_media_type" }, { status: 415 });
  }

  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "cross_origin_request_blocked" }, { status: 403 });
  }

  const rate = consumeRateLimit(getClientKey(request));
  if (!rate.allowed) {
    return Response.json(
      { error: "rate_limited", retryAfter: rate.retryAfter },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await readLimitedJson(request);
  } catch (error) {
    if (error instanceof RangeError) {
      return Response.json({ error: "body_too_large" }, { status: 413 });
    }
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const query = normalizeQuery((body as { query?: unknown } | null)?.query);
  if (query.length < 2) {
    return Response.json({ error: "query_too_short" }, { status: 400 });
  }

  const providers = await Promise.allSettled([
    searchGitHub(query),
    searchNpm(query),
    searchWikipedia(query),
  ]);
  const ids: ProviderId[] = ["github", "npm", "wikipedia"];
  const sources = providers.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const status = providers.map((result, index) => ({
    id: ids[index],
    status: result.status === "fulfilled" ? "ok" : "unavailable",
    count: result.status === "fulfilled" ? result.value.length : 0,
  }));

  return Response.json(
    {
      query,
      sources,
      providers: status,
      fetchedAt: new Date().toISOString(),
      privacy:
        "The query is sent only to the listed public providers. SkillAtlas uses no AI API key and stores no server-side chat history.",
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
