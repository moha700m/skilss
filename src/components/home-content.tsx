"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BookOpenCheck,
  Bot,
  Boxes,
  Braces,
  ChartNoAxesCombined,
  Check,
  Code2,
  FileText,
  Megaphone,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { useLocale } from "@/components/providers";
import { SkillCard } from "@/components/skill-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Skill, SkillsSnapshot } from "@/lib/types";

const categoryIcons = [FileText, Code2, ChartNoAxesCombined, Megaphone, Palette, Users, ShieldCheck, Blocks];

export function HomeContent({
  featured,
  snapshot,
  categoryCounts,
}: {
  featured: Skill[];
  snapshot: SkillsSnapshot;
  categoryCounts: Array<{ name: string; count: number }>;
}) {
  const { locale } = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const formattedDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(snapshot.syncedAt));

  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-20 opacity-70" />
        <div className="pointer-events-none absolute -start-48 top-10 -z-10 size-[32rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -end-40 top-32 -z-10 size-[26rem] rounded-full bg-chart-2/10 blur-3xl" />
        <div className="page-shell py-20 text-center sm:py-28 lg:py-32">
          <div className="eyebrow">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-chart-2" />
            </span>
            {locale === "ar" ? `تمت المزامنة ${formattedDate}` : `Synced ${formattedDate}`}
          </div>
          <h1 className="mx-auto mt-7 max-w-5xl text-balance text-4xl font-bold leading-[1.2] tracking-tight sm:text-6xl lg:text-7xl">
            {locale === "ar" ? (
              <>امنح وكيلك <span className="text-primary">مهارة جديدة.</span></>
            ) : (
              <>Give your agent <span className="text-primary">a new skill.</span></>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
            {locale === "ar"
              ? "اكتشف مهارات عملية لـ Claude وCodex وCursor وغيرها—مصنفة، قابلة للبحث، مع المصدر وخطوات التثبيت في مكان واحد."
              : "Discover practical skills for Claude, Codex, Cursor, and more—organized, searchable, and paired with source and install guidance."}
          </p>
          <HeroSearch />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{locale === "ar" ? "يعمل الدليل مع:" : "Browse for:"}</span>
            {["Claude", "Codex", "Cursor", "Gemini CLI", "Windsurf"].map((platform) => (
              <span key={platform} className="rounded-full border bg-background/70 px-2.5 py-1 font-mono">
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-card/40">
        <div className="page-shell grid grid-cols-2 divide-x divide-border py-8 sm:grid-cols-4 sm:divide-x-0">
          {[
            [snapshot.total, locale === "ar" ? "مهارة مفهرسة" : "Indexed skills"],
            [snapshot.curated, locale === "ar" ? "اختيارًا منسقًا" : "Curated picks"],
            [snapshot.automation, locale === "ar" ? "أتمتة تطبيق" : "App automations"],
            [snapshot.categories.length, locale === "ar" ? "فئة عملية" : "Practical categories"],
          ].map(([value, label], index) => (
            <div key={String(label)} className={`px-4 py-3 text-center ${index > 1 ? "border-t sm:border-t-0" : ""}`}>
              <p className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{Number(value).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-4 gap-1.5"><Sparkles className="size-3" /> {locale === "ar" ? "ابدأ من هنا" : "Start here"}</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "ar" ? "اختيارات تستحق التجربة" : "Skills worth trying"}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{locale === "ar" ? "مجموعة صغيرة من المهارات العامة قبل الغوص في الدليل الكامل." : "A small set of broadly useful skills before you dive into the full directory."}</p>
          </div>
          <Button variant="outline" className="gap-2 self-start sm:self-auto" asChild>
            <Link href="/explore">{locale === "ar" ? "كل المهارات" : "All skills"}<Arrow className="size-4" /></Link>
          </Button>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
        </div>
      </section>

      <section className="border-y bg-card/45">
        <div className="page-shell py-16 sm:py-24">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 gap-1.5"><Boxes className="size-3" /> {locale === "ar" ? "حسب المهمة" : "By outcome"}</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "ar" ? "اختر المجال، ثم ضيّق البحث" : "Choose a field, then narrow it down"}</h2>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryCounts.slice(0, 8).map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return (
                <Link
                  key={category.name}
                  href={`/explore?category=${encodeURIComponent(category.name)}`}
                  className="group flex min-h-32 flex-col justify-between rounded-2xl border bg-background/75 p-5 transition-colors hover:border-primary/50 hover:bg-accent/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="size-4" /></span>
                    <Arrow className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                  </div>
                  <div className="mt-5">
                    <p className="font-semibold" dir="auto">{category.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {category.count.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")} skills
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <Badge variant="outline" className="mb-4 gap-1.5"><BookOpenCheck className="size-3" /> {locale === "ar" ? "مسار واضح" : "A clear path"}</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "ar" ? "من الحاجة إلى مهارة خلال دقائق" : "From a need to a skill in minutes"}</h2>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{locale === "ar" ? "الدليل لا يشغّل ملفات مجهولة. يعطيك السياق والمصدر، ثم يترك قرار التثبيت لك." : "The directory never executes unknown files. It gives you context and source, then leaves installation in your hands."}</p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: Search, number: "01", title: locale === "ar" ? "صف ما تريد إنجازه" : "Describe the outcome", text: locale === "ar" ? "ابحث باللغة الطبيعية أو باسم التطبيق والمجال." : "Search naturally, or use an app or field name." },
              { icon: Braces, number: "02", title: locale === "ar" ? "راجع المصدر والملفات" : "Inspect source and files", text: locale === "ar" ? "اعرف إن كانت المهارة محلية أو خارجية وهل تتضمن سكربتات." : "See whether it is local or external and whether scripts are included." },
              { icon: Check, number: "03", title: locale === "ar" ? "ثبّت بوعي" : "Install deliberately", text: locale === "ar" ? "انسخ الخطوات، راجع SKILL.md، ثم أضفها إلى وكيلك." : "Copy the steps, review SKILL.md, then add it to your agent." },
            ].map(({ icon: Icon, number, title, text }) => (
              <Card key={number} className="bg-card/70">
                <CardContent className="flex gap-5 p-5 sm:p-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" /></span>
                  <div>
                    <p className="font-mono text-xs text-primary">{number}</p>
                    <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border bg-foreground px-6 py-12 text-background sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -end-24 -top-32 size-80 rounded-full bg-primary/35 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-background/65"><RefreshCw className="size-4" /> {locale === "ar" ? "يتجدد يوميًا من المصدر" : "Refreshed from source daily"}</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{locale === "ar" ? "هناك مهارة للعمل الذي أمامك." : "There is a skill for the work ahead."}</h2>
            <p className="mt-4 leading-7 text-background/65">{locale === "ar" ? "ابدأ من الدليل الكامل، أو تعلّم أولًا كيف تعمل المهارات وما الفرق بينها وبين الأدوات وMCP." : "Start in the full directory, or learn how skills differ from tools and MCP first."}</p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-0">
            <Button size="lg" variant="secondary" className="gap-2" asChild><Link href="/explore"><Bot className="size-4" />{locale === "ar" ? "استكشف الآن" : "Explore now"}</Link></Button>
            <Button size="lg" variant="outline" className="border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background" asChild><Link href="/learn">{locale === "ar" ? "افهم المهارات" : "Learn the model"}</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
