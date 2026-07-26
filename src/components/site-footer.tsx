"use client";

import Link from "next/link";
import { ArrowUpRight, GitFork } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useLocale } from "@/components/providers";

export function SiteFooter() {
  const { dictionary } = useLocale();

  return (
    <footer className="border-t bg-card/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <BrandMark />
            SkillAtlas
          </Link>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {dictionary.footer.description}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">{dictionary.footer.explore}</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="/agent" className="hover:text-foreground">{dictionary.nav.agent}</Link>
            <Link href="/explore" className="hover:text-foreground">{dictionary.nav.explore}</Link>
            <Link href="/learn" className="hover:text-foreground">{dictionary.nav.learn}</Link>
            <Link href="/about" className="hover:text-foreground">{dictionary.nav.about}</Link>
            <Link href="/privacy" className="hover:text-foreground">{dictionary.footer.privacy}</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">{dictionary.footer.source}</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <a
              href="https://github.com/ComposioHQ/awesome-claude-skills"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <GitFork className="size-4" /> GitHub <ArrowUpRight className="size-3" />
            </a>
            <a
              href="https://github.com/ComposioHQ/awesome-claude-skills/blob/master/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              {dictionary.footer.submitSkill}
              <ArrowUpRight className="size-3" />
            </a>
            <p className="leading-6">
              {dictionary.footer.agentUiPrefix}{" "}
              <a
                href="https://agent-elements.21st.dev/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                Agent Elements
              </a>{" "}
              {dictionary.footer.agentUiSuffix}{" "}
              <a
                href="https://21st.dev/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                21st.dev
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} SkillAtlas. {dictionary.footer.rights}</p>
          <p>{dictionary.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
