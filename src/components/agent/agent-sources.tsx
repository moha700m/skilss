"use client";

import { BookOpen, ExternalLink, GitFork, Package } from "lucide-react";
import type { AgentResearchSource } from "@/lib/agent/research";
import { Badge } from "@/components/ui/badge";

interface AgentSourcesProps {
  sources: ReadonlyArray<AgentResearchSource>;
  locale: "ar" | "en";
  compact?: boolean;
}

function providerIcon(provider: AgentResearchSource["provider"]) {
  if (provider === "github") return <GitFork className="size-3.5" />;
  if (provider === "npm") return <Package className="size-3.5" />;
  return <BookOpen className="size-3.5" />;
}

function safeSourceUrl(source: AgentResearchSource) {
  try {
    const url = new URL(source.url);
    const allowed =
      url.protocol === "https:" &&
      (url.hostname === "github.com" ||
        url.hostname === "www.npmjs.com" ||
        url.hostname.endsWith(".wikipedia.org"));
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

function balancedSources(
  sources: ReadonlyArray<AgentResearchSource>,
  limit: number,
) {
  const providers: AgentResearchSource["provider"][] = ["github", "npm", "wikipedia"];
  const buckets = providers.map((provider) =>
    sources.filter((source) => source.provider === provider),
  );
  const visible: AgentResearchSource[] = [];

  for (let index = 0; visible.length < limit; index += 1) {
    let added = false;
    for (const bucket of buckets) {
      const source = bucket[index];
      if (!source) continue;
      visible.push(source);
      added = true;
      if (visible.length === limit) break;
    }
    if (!added) break;
  }

  return visible;
}

export function AgentSources({ sources, locale, compact = false }: AgentSourcesProps) {
  const visibleSources = balancedSources(sources, compact ? 3 : 6);
  if (visibleSources.length === 0) return null;

  return (
    <section className="mt-3" aria-label={locale === "ar" ? "مصادر البحث العام" : "Public research sources"}>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs font-semibold">
          {locale === "ar" ? "مصادر حية" : "Live sources"}
        </p>
        <Badge variant="outline" className="h-5 px-1.5 text-[0.62rem] font-normal text-muted-foreground">
          GitHub · npm · Wikipedia
        </Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {visibleSources.map((source) => {
          const href = safeSourceUrl(source);
          if (!href) return null;
          return (
            <a
              key={source.id}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group min-w-0 rounded-xl border bg-background/80 p-3 outline-none transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
                {providerIcon(source.provider)}
                {source.provider}
                <ExternalLink className="ms-auto size-3 opacity-60" />
              </span>
              <span className="mt-2 block truncate text-sm font-semibold" dir="auto">
                {source.title}
              </span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground" dir="auto">
                {source.snippet}
              </span>
              {source.meta ? (
                <span className="mt-2 block truncate font-mono text-[0.62rem] text-muted-foreground">
                  {source.meta}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
