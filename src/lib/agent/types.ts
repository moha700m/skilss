import type { Locale, Skill, SkillsSnapshot } from "@/lib/types";

export type AgentRole = "user" | "assistant";

export interface AgentMessage {
  role: AgentRole;
  content: string;
}

export type AgentIntent =
  | "help"
  | "search"
  | "compare"
  | "stats"
  | "license"
  | "sync"
  | "install"
  | "navigate"
  | "favorite"
  | "source";

export type AgentActionType =
  | "navigate"
  | "open_skill"
  | "search"
  | "favorite"
  | "copy"
  | "open_source";

export interface AgentAction {
  type: AgentActionType;
  label: string;
  href?: string;
  skillId?: string;
  text?: string;
}

export interface AgentSkillMatch
  extends Pick<
    Skill,
    | "id"
    | "slug"
    | "name"
    | "description"
    | "category"
    | "kind"
    | "sourceType"
    | "sourceUrl"
    | "license"
    | "hasScripts"
    | "featured"
  > {
  score: number;
  matchedTerms: string[];
}

export interface AgentMeta {
  mode: "keyless";
  intent: AgentIntent;
  catalogTotal: number;
  syncedAt: string;
  upstreamCommit: string;
  upstreamCommitDate: string;
  dailySync: true;
  privacy: "local-catalog";
}

export interface AgentResponse {
  reply: string;
  locale: Locale;
  matches: AgentSkillMatch[];
  actions: AgentAction[];
  meta: AgentMeta;
}

export interface AgentCatalogSnapshot
  extends Pick<
    SkillsSnapshot,
    | "total"
    | "curated"
    | "automation"
    | "internal"
    | "external"
    | "categories"
    | "syncedAt"
    | "upstreamCommit"
    | "upstreamCommitDate"
  > {
  categoryCounts?: Record<string, number>;
}

export interface RunAgentInput {
  messages: AgentMessage[];
  skills: Skill[];
  snapshot: AgentCatalogSnapshot;
}
