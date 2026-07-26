"use client";

import Link from "next/link";
import { GitFork, Languages, Menu, Sparkles } from "lucide-react";
import { useLocale } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const repositoryUrl = "https://github.com/ComposioHQ/awesome-claude-skills";

export function SiteHeader() {
  const { locale, dictionary, toggleLocale } = useLocale();
  const links = [
    { href: "/agent", label: dictionary.nav.agent },
    { href: "/explore", label: dictionary.nav.explore },
    { href: "/learn", label: dictionary.nav.learn },
    { href: "/about", label: dictionary.nav.about },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="SkillAtlas home"
        >
          <BrandMark className="transition-transform duration-200 group-hover:rotate-6" />
          <span className="flex items-baseline gap-1.5 font-semibold tracking-tight">
            <span className="text-base">SkillAtlas</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
              {locale === "ar" ? "أطلس المهارات" : "Skills, mapped"}
            </span>
          </span>
        </Link>

        <nav className="ms-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1 md:ms-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden min-h-11 gap-2 sm:flex"
            onClick={toggleLocale}
          >
            <Languages className="size-4" />
            {locale === "ar" ? "EN" : "عربي"}
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="hidden size-11 sm:inline-flex" asChild>
            <a href={repositoryUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitFork className="size-4" />
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">{dictionary.nav.menu}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === "ar" ? "right" : "left"} className="w-[88vw] max-w-sm">
              <SheetHeader className="border-b">
                <SheetTitle className="flex items-center gap-2 text-start">
                  <BrandMark />
                  SkillAtlas
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 p-4" aria-label="Mobile">
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="flex min-h-12 items-center rounded-xl px-4 text-base font-medium hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-start text-base font-medium hover:bg-accent"
                >
                  <Languages className="size-5" />
                  {locale === "ar" ? dictionary.common.english : dictionary.common.arabic}
                </button>
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-base font-medium hover:bg-accent"
                >
                  <GitFork className="size-5" />
                  {dictionary.nav.github}
                </a>
              </nav>
              <div className="mt-auto p-4 text-sm text-muted-foreground">
                <Sparkles className="mb-3 size-5 text-primary" />
                {locale === "ar"
                  ? "دليل مستقل مفتوح المصدر لاكتشاف مهارات وكلاء الذكاء الاصطناعي."
                  : "An independent, open-source directory for agent skills."}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
