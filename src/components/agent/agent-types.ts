import type { AgentResearchSource } from "@/lib/agent/research";

export type AgentRole = "user" | "assistant";

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
  text?: string;
  skillId?: string;
}

export interface AgentSkillMatch {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  sourceUrl?: string;
  installCommand?: string;
}

export interface AgentMeta {
  mode?: string;
  syncedAt?: string;
  totalSkills?: number;
  researchedAt?: string;
  localModel?: string;
}

export interface AgentResponse {
  reply: string;
  locale: "ar" | "en";
  matches: AgentSkillMatch[];
  actions: AgentAction[];
  meta: AgentMeta;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: string;
  matches?: AgentSkillMatch[];
  sources?: AgentResearchSource[];
  actions?: AgentAction[];
  meta?: AgentMeta;
}
