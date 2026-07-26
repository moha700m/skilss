"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type {
  AgentAction,
  AgentMessage,
  AgentSkillMatch,
} from "@/components/agent/agent-types";
import type { AgentResearchSource } from "@/lib/agent/research";

const storageKey = "skillatlas-agent-history-v1";
const historyEvent = "skillatlas-agent-history-change";
const emptyHistory = "[]";
const maximumMessages = 40;

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(historyEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(historyEvent, onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(storageKey) ?? emptyHistory;
}

function getServerSnapshot() {
  return emptyHistory;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function bounded(value: unknown, length: number) {
  return typeof value === "string" ? value.slice(0, length) : undefined;
}

function parseMatch(value: unknown): AgentSkillMatch | null {
  if (!isRecord(value)) return null;
  const id = bounded(value.id, 240);
  const slug = bounded(value.slug, 240);
  const name = bounded(value.name, 240);
  const description = bounded(value.description, 1_200);
  const category = bounded(value.category, 160);
  if (!id || !slug || !name || !description || !category) return null;
  return {
    id,
    slug,
    name,
    description,
    category,
    sourceUrl: bounded(value.sourceUrl, 1_000),
    installCommand: bounded(value.installCommand, 8_000),
  };
}

function parseSource(value: unknown): AgentResearchSource | null {
  if (!isRecord(value)) return null;
  const provider = value.provider;
  if (provider !== "github" && provider !== "npm" && provider !== "wikipedia") return null;
  const id = bounded(value.id, 240);
  const title = bounded(value.title, 240);
  const snippet = bounded(value.snippet, 600);
  const rawUrl = bounded(value.url, 1_000);
  if (!id || !title || !snippet || !rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== "github.com" &&
        url.hostname !== "www.npmjs.com" &&
        !url.hostname.endsWith(".wikipedia.org"))
    ) return null;
    return { id, provider, title, snippet, url: url.toString(), meta: bounded(value.meta, 160) };
  } catch {
    return null;
  }
}

function parseAction(value: unknown): AgentAction | null {
  if (!isRecord(value) || typeof value.label !== "string") return null;
  const type = value.type;
  if (
    type !== "navigate" &&
    type !== "open_skill" &&
    type !== "search" &&
    type !== "favorite" &&
    type !== "copy" &&
    type !== "open_source"
  ) return null;
  return {
    type,
    label: value.label.slice(0, 180),
    href: bounded(value.href, 1_000),
    text: bounded(value.text, 8_000),
    skillId: bounded(value.skillId, 240),
  };
}

function parseAgentMessage(value: unknown): AgentMessage | null {
  if (!isRecord(value)) return null;
  const id = bounded(value.id, 240);
  const content = bounded(value.content, 12_000);
  const createdAt = bounded(value.createdAt, 80);
  if (!id || !content || !createdAt || (value.role !== "user" && value.role !== "assistant")) {
    return null;
  }

  const matches = Array.isArray(value.matches)
    ? value.matches.flatMap((entry) => {
        const parsed = parseMatch(entry);
        return parsed ? [parsed] : [];
      }).slice(0, 8)
    : undefined;
  const sources = Array.isArray(value.sources)
    ? value.sources.flatMap((entry) => {
        const parsed = parseSource(entry);
        return parsed ? [parsed] : [];
      }).slice(0, 9)
    : undefined;
  const actions = Array.isArray(value.actions)
    ? value.actions.flatMap((entry) => {
        const parsed = parseAction(entry);
        return parsed ? [parsed] : [];
      }).slice(0, 8)
    : undefined;
  const meta = isRecord(value.meta) ? {
    mode: bounded(value.meta.mode, 80),
    syncedAt: bounded(value.meta.syncedAt, 80),
    totalSkills: typeof value.meta.totalSkills === "number" ? value.meta.totalSkills : undefined,
    researchedAt: bounded(value.meta.researchedAt, 80),
    localModel: bounded(value.meta.localModel, 180),
  } : undefined;

  return { id, role: value.role, content, createdAt, matches, sources, actions, meta };
}

function parseHistory(raw: string) {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const message = parseAgentMessage(entry);
      return message ? [message] : [];
    }).slice(-maximumMessages);
  } catch {
    return [];
  }
}

function writeHistory(messages: AgentMessage[]) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(messages.slice(-maximumMessages)),
  );
  window.dispatchEvent(new Event(historyEvent));
}

export function createAgentMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `atlas-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAgentHistory() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const messages = useMemo(() => parseHistory(raw), [raw]);

  const appendMessage = useCallback((message: AgentMessage) => {
    const current = parseHistory(getSnapshot());
    writeHistory([...current, message]);
  }, []);

  const clearHistory = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(historyEvent));
  }, []);

  return { messages, appendMessage, clearHistory };
}
