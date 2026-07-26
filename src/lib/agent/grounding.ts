import type {
  AgentMessage,
  AgentResponse,
} from "@/components/agent/agent-types";
import type { AgentResearchResponse } from "@/lib/agent/research";
import type { LocalAIGroundingPacket } from "@/lib/local-ai";

interface BuildAgentGroundingOptions {
  query: string;
  locale: "ar" | "en";
  conversation: ReadonlyArray<AgentMessage>;
  core: AgentResponse;
  research?: AgentResearchResponse | null;
  currentPage?: { title: string; path: string };
}

export function buildAgentGrounding({
  query,
  locale,
  conversation,
  core,
  research,
  currentPage,
}: BuildAgentGroundingOptions): LocalAIGroundingPacket {
  const skillSources = core.matches.slice(0, 5).map((skill) => ({
    id: `skill:${skill.id}`,
    kind: "skill" as const,
    title: skill.name,
    excerpt: skill.description,
    url: `/skills/${encodeURIComponent(skill.slug)}`,
    metadata: [skill.category],
  }));
  const webSources = (research?.sources ?? []).slice(0, 8).map((source) => ({
    id: source.id,
    kind: source.provider === "github" ? "github" as const : "web" as const,
    title: source.title,
    excerpt: source.snippet,
    url: source.url,
    metadata: [source.provider, source.meta].filter((item): item is string => Boolean(item)),
  }));

  return {
    locale,
    query,
    conversation: conversation.slice(-8).map(({ role, content }) => ({ role, content })),
    catalog: {
      totalSkills: core.meta.totalSkills,
      syncedAt: core.meta.syncedAt,
    },
    currentPage,
    sources: [...skillSources, ...webSources],
    constraints: [
      "Never claim that a website action ran; the user must choose an allowed action.",
      "Use the deterministic catalog result as the authority for skill names and site actions.",
      research
        ? "Cite public research results by their visible titles and do not invent missing facts."
        : "No live web research was requested for this turn.",
    ],
  };
}
