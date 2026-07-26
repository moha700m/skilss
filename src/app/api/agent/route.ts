import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/core.mjs";
import type { AgentCatalogSnapshot, AgentMessage } from "@/lib/agent/types";
import { skills, snapshot } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_768;
const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARACTERS = 4_000;
const MAX_TOTAL_CHARACTERS = 12_000;

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: responseHeaders },
  );
}

async function readLimitedBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RangeError("body-too-large");
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("body-too-large");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(body);
}

function validateMessages(value: unknown): AgentMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;
  let totalCharacters = 0;
  const messages: AgentMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const role = Reflect.get(item, "role");
    const content = Reflect.get(item, "content");
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;

    const cleaned = content
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .trim();
    if (!cleaned || cleaned.length > MAX_MESSAGE_CHARACTERS) return null;
    totalCharacters += cleaned.length;
    if (totalCharacters > MAX_TOTAL_CHARACTERS) return null;
    messages.push({ role, content: cleaned });
  }

  if (!messages.some((message) => message.role === "user")) return null;
  return messages;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLocaleLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return errorResponse("Content-Type must be application/json.", 415);
  }

  let payload: unknown;
  try {
    const body = await readLimitedBody(request);
    payload = JSON.parse(body);
  } catch (error) {
    if (error instanceof RangeError && error.message === "body-too-large") {
      return errorResponse("Request body is too large.", 413);
    }
    return errorResponse("Request body must contain valid UTF-8 JSON.", 400);
  }

  if (!payload || typeof payload !== "object") {
    return errorResponse("Request body must be an object.", 400);
  }

  const messages = validateMessages(Reflect.get(payload, "messages"));
  if (!messages) {
    return errorResponse(
      `messages must contain 1-${MAX_MESSAGES} valid user/assistant messages within the request limits.`,
      400,
    );
  }

  const response = runAgent({
    messages,
    skills,
    snapshot: snapshot as AgentCatalogSnapshot,
  });

  return NextResponse.json(response, { headers: responseHeaders });
}
