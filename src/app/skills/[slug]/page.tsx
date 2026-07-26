import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  CircleAlert,
  ExternalLink,
  FileCode2,
  FolderGit2,
  PackageOpen,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Terminal,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/copy-button";
import { FavoriteButton } from "@/components/favorite-button";
import { Localized } from "@/components/localized";
import { SkillCard } from "@/components/skill-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getInstallCommand,
  getRelatedSkills,
  getSkillBySlug,
  getSkillMarkdown,
  skills,
  snapshot,
} from "@/lib/skills";

export const dynamicParams = false;

export function generateStaticParams() {
  return skills.map((skill) => ({ slug: skill.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) return {};

  return {
    title: skill.name,
    description: skill.description.slice(0, 160),
    alternates: { canonical: `/skills/${skill.slug}` },
    openGraph: {
      title: `${skill.name} | SkillAtlas`,
      description: skill.description.slice(0, 200),
      type: "article",
    },
  };
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) notFound();

  const [markdown, related] = await Promise.all([
    getSkillMarkdown(skill),
    Promise.resolve(getRelatedSkills(skill, 4)),
  ]);
  const installCommand = getInstallCommand(skill);
  const body = markdown?.replace(/^---\s*[\s\S]*?\s*---\s*/, "");
  const hasAuxiliaryFiles = skill.hasScripts || skill.hasReferences || skill.hasAssets;
  return (
    <>
      <div className="border-b bg-card/35">
        <div className="page-shell py-5">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/explore" className="hover:text-foreground"><Localized ar="المهارات" en="Skills" /></Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-foreground" dir="auto">{skill.name}</span>
          </nav>
        </div>
      </div>

      <div className="page-shell py-10 sm:py-14">
        <header className="max-w-4xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge variant={skill.kind === "automation" ? "secondary" : "default"} className="gap-1.5">
              {skill.kind === "automation" ? <Boxes className="size-3" /> : <Sparkles className="size-3" />}
              {skill.kind === "automation" ? <Localized ar="أتمتة تطبيق" en="App automation" /> : <Localized ar="مهارة مختارة" en="Curated skill" />}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              {skill.sourceType === "internal" ? <FileCode2 className="size-3" /> : <ExternalLink className="size-3" />}
              {skill.sourceType === "internal"
                ? skill.repositoryPath
                  ? <Localized ar="داخل المستودع" en="In repository" />
                  : <Localized ar="مدرجة في دليل المصدر" en="Listed in upstream catalog" />
                : <Localized ar="مصدر خارجي" en="External source" />}
            </Badge>
            {skill.hasScripts && <Badge variant="outline" className="gap-1.5 border-chart-4/45 text-chart-4"><ScrollText className="size-3" /><Localized ar="يتضمن سكربتات" en="Includes scripts" /></Badge>}
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl" dir="auto">{skill.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg" dir="auto">{skill.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="h-11 gap-2 px-5" asChild>
              <a href={skill.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /><Localized ar="عرض المصدر" en="View source" /></a>
            </Button>
            {installCommand && <CopyButton text={installCommand} className="h-11 px-4" />}
            <FavoriteButton id={skill.id} className="size-11 border bg-background" />
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="min-w-0 space-y-8">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5 text-primary" /><Localized ar="نظرة عامة" en="Overview" /></CardTitle></CardHeader>
              <CardContent>
                <p className="leading-8 text-muted-foreground" dir="auto">{skill.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="secondary" dir="auto">{skill.category}</Badge>
                  {skill.author && <Badge variant="outline" dir="auto">{skill.author}</Badge>}
                </div>
              </CardContent>
            </Card>

            {installCommand && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="size-5 text-primary" /><Localized ar="تثبيت يدوي" en="Manual install" /></CardTitle></CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-3 rounded-xl border border-chart-4/25 bg-chart-4/5 p-4 text-sm leading-6 text-muted-foreground">
                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-chart-4" />
                    <p><Localized ar="راجع SKILL.md وأي ملفات مساعدة قبل النسخ. هذا الأمر لا يُشغَّل داخل الموقع، ومسار Claude Code قد يختلف حسب إصدارك ونظامك." en="Review SKILL.md and any helper files before copying. This command never runs on the site, and your Claude Code path may differ by version and operating system." /></p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border bg-background">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                      <span className="font-mono text-xs text-muted-foreground">Terminal</span>
                      <CopyButton text={installCommand} />
                    </div>
                    <pre className="overflow-x-auto p-4 text-start font-mono text-sm leading-7" dir="ltr"><code>{installCommand}</code></pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {body ? (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileCode2 className="size-5 text-primary" />SKILL.md</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose-skill" dir="auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-start p-6 sm:flex-row sm:gap-5">
                  <span className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted sm:mb-0"><ShieldAlert className="size-5 text-muted-foreground" /></span>
                  <div>
                    <h2 className="font-semibold"><Localized ar="المحتوى الكامل محفوظ لدى المصدر" en="Full content stays with the source" /></h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground"><Localized ar="لم نكتشف ترخيصًا مفتوحًا واضحًا يسمح بإعادة نشر ملف المهارة هنا. يمكنك مراجعته مباشرة في مستودعه قبل التثبيت." en="We did not detect a clear open license that permits mirroring the skill file here. Review it directly in its repository before installing." /></p>
                    <Button variant="link" className="mt-2 px-0" asChild><a href={skill.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /><Localized ar="فتح المصدر" en="Open source" /></a></Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card>
              <CardHeader><CardTitle className="text-base"><Localized ar="بيانات المهارة" en="Skill facts" /></CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  [<Localized key="l1" ar="الفئة" en="Category" />, skill.category],
                  [<Localized key="l2" ar="المصدر" en="Source" />, skill.sourceType === "internal" ? skill.repositoryPath ? <Localized key="v2" ar="داخل المستودع" en="Bundled" /> : <Localized key="v2" ar="مدرجة فقط" en="Catalog listing" /> : <Localized key="v2" ar="خارجي" en="External" />],
                  [<Localized key="l3" ar="الترخيص" en="License" />, skill.license ?? <Localized key="v3" ar="غير مكتشف" en="Not detected" />],
                  [<Localized key="l4" ar="المؤلف" en="Author" />, skill.author ?? "—"],
                ].map(([label, value], index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="max-w-[60%] text-end font-medium" dir="auto">{value}</span></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base"><Localized ar="محتويات إضافية" en="Included resources" /></CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { icon: ScrollText, label: <Localized key="scripts" ar="سكربتات" en="Scripts" />, present: skill.hasScripts },
                  { icon: BookOpen, label: <Localized key="refs" ar="مراجع" en="References" />, present: skill.hasReferences },
                  { icon: PackageOpen, label: <Localized key="assets" ar="أصول وقوالب" en="Assets & templates" />, present: skill.hasAssets },
                ].map(({ icon: Icon, label, present }, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{label}</span>
                    <span className="ms-auto text-xs text-muted-foreground">{present ? <Localized ar="نعم" en="Yes" /> : <Localized ar="لا" en="No" />}</span>
                  </div>
                ))}
                {!hasAuxiliaryFiles && <p className="pt-2 text-xs leading-5 text-muted-foreground"><Localized ar="المهارة تعتمد على ملف التعليمات فقط بحسب اللقطة الحالية." en="The current snapshot only includes the instruction file." /></p>}
              </CardContent>
            </Card>

            <div className="rounded-xl border border-dashed p-4 text-xs leading-6 text-muted-foreground">
              <FolderGit2 className="mb-2 size-4" />
              <Localized ar={`لقطة المصدر ${snapshot.upstreamCommit.slice(0, 7)}. آخر مزامنة ${new Date(snapshot.syncedAt).toLocaleDateString("ar-SA")}.`} en={`Source snapshot ${snapshot.upstreamCommit.slice(0, 7)}. Last synced ${new Date(snapshot.syncedAt).toLocaleDateString("en-US")}.`} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t pt-12 sm:mt-24 sm:pt-16">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs font-semibold text-primary"><Localized ar="تابع الاستكشاف" en="Keep exploring" /></p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"><Localized ar="مهارات قريبة" en="Related skills" /></h2></div>
              <Button variant="ghost" className="gap-2" asChild><Link href={`/explore?category=${encodeURIComponent(skill.category)}`}><Localized ar="الفئة كاملة" en="Full category" /><span className="only-ar"><ArrowLeft className="size-4" /></span><span className="only-en"><ArrowRight className="size-4" /></span></Link></Button>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <SkillCard key={item.id} skill={item} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
