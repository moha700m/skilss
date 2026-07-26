import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Braces,
  CircleAlert,
  GitFork,
  HeartHandshake,
  RefreshCw,
  Scale,
} from "lucide-react";
import { Localized } from "@/components/localized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { snapshot } from "@/lib/skills";

export const metadata: Metadata = {
  title: "عن المشروع",
  description: "تعرف على مصدر بيانات SkillAtlas، طريقة المزامنة، وحدود الترخيص والتحقق.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b bg-card/35">
        <div className="page-shell py-16 sm:py-24">
          <Badge variant="outline" className="mb-5 gap-1.5"><HeartHandshake className="size-3" /><Localized ar="مفتوح وشفاف" en="Open and transparent" /></Badge>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"><Localized ar="واجهة أفضل لقائمة قيّمة، مع إبقاء المصدر في الواجهة." en="A better interface for a valuable list—with the source kept front and center." /></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground"><Localized ar="SkillAtlas مشروع مستقل يحوّل بيانات awesome-claude-skills إلى دليل قابل للبحث. لا ينتمي رسميًا إلى Anthropic أو Composio، ولا يشغّل المهارات بالنيابة عن الزائر." en="SkillAtlas is an independent, searchable layer over awesome-claude-skills. It is not officially affiliated with Anthropic or Composio, and never executes skills for visitors." /></p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-11 gap-2 px-5" asChild><a href="https://github.com/ComposioHQ/awesome-claude-skills" target="_blank" rel="noreferrer"><GitFork className="size-4" /><Localized ar="المستودع الأصلي" en="Upstream repository" /></a></Button>
            <Button variant="outline" className="h-11 gap-2 px-5" asChild><Link href="/explore"><Localized ar="تصفح البيانات" en="Browse the data" /></Link></Button>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [snapshot.total, <Localized key="s1" ar="سجلًا مفهرسًا" en="Indexed records" />],
            [snapshot.internal, <Localized key="s2" ar="مصدرًا داخل المستودع" en="Bundled sources" />],
            [snapshot.external, <Localized key="s3" ar="مصدرًا خارجيًا" en="External sources" />],
            [snapshot.categories.length, <Localized key="s4" ar="فئة" en="Categories" />],
          ].map(([value, label]) => <Card key={String(value) + String(label)}><CardContent className="p-6"><p className="font-mono text-3xl font-semibold">{Number(value).toLocaleString()}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></CardContent></Card>)}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.75fr_1.25fr] sm:mt-24">
          <div>
            <p className="text-xs font-semibold text-primary"><Localized ar="كيف تعمل المزامنة" en="How sync works" /></p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"><Localized ar="لقطة ثابتة، لا API عند كل زيارة" en="A static snapshot, not an API call per visit" /></h2>
            <p className="mt-4 leading-7 text-muted-foreground"><Localized ar="تُبنى البيانات مسبقًا وتُختبر مع الموقع. إذا فشل المصدر أو البناء تبقى آخر لقطة سليمة متاحة بدل أن ينكسر الدليل." en="Data is built and tested ahead of time. If upstream or the build fails, the last known good snapshot stays live instead of breaking the directory." /></p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: RefreshCw, title: <Localized key="m1" ar="جلب يومي" en="Daily fetch" />, description: <Localized key="md1" ar="الجدولة تفحص التزام الفرع master وتنسخ اللقطة الجديدة فقط عند تغير المصدر." en="A scheduled job checks the master commit and creates a new snapshot only when source data changes." /> },
              { icon: Braces, title: <Localized key="m2" ar="استخراج ومصالحة" en="Extract & reconcile" />, description: <Localized key="md2" ar="نقرأ ملفات SKILL.md الفعلية وقائمة README كمصدرين منفصلين، ثم نمنع تصادم المعرّفات." en="Actual SKILL.md files and the README catalog are treated as separate sources, with stable IDs and collision handling." /> },
              { icon: CircleAlert, title: <Localized key="m3" ar="تحقق قبل النشر" en="Verify before publish" />, description: <Localized key="md3" ar="لا تُنشر اللقطة إذا فشل التحليل أو الاختبارات أو البناء؛ ولا تُشغّل أي ملفات من المستودع الخارجي." en="The snapshot is not published when parsing, tests, or the build fail—and no upstream files are executed." /> },
            ].map(({ icon: Icon, title, description }, index) => <Card key={index}><CardContent className="flex gap-4 p-5 sm:p-6"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="size-5" /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section className="border-y bg-card/40">
        <div className="page-shell grid gap-8 py-16 sm:py-24 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="size-5 text-primary" /><Localized ar="الترخيص" en="Licensing" /></CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p><Localized ar="README في المستودع يذكر Apache-2.0، لكنه ينبه أن كل مهارة قد تستخدم ترخيصًا مختلفًا. لذلك نعرض الترخيص المكتشف لكل سجل ولا نفترض ترخيصًا عامًا للملفات الفردية." en="The upstream README states Apache-2.0 while warning that individual skills may use different licenses. We display detected per-record licensing and do not assume a blanket license for every file." /></p>
              <p><Localized ar="لا نعرض النص الكامل داخل الموقع إلا عندما نكتشف تصريحًا مفتوحًا واضحًا. الروابط الخارجية تبقى لدى أصحابها." en="Full text is mirrored only when a clear open license is detected. External resources stay with their owners." /></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CircleAlert className="size-5 text-chart-4" /><Localized ar="ما الذي لا ندّعيه" en="What we do not claim" /></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p><Localized ar="الوجود في الدليل لا يعني أن المهارة آمنة أو مدققة أو متوافقة مع كل منصة." en="Directory presence does not mean a skill is safe, audited, or compatible with every platform." /></p>
              <p><Localized ar="الأرقام مأخوذة من اللقطة المولدة، وليست ادعاء “1000+” ثابتًا. بعض عناصر README قد تكون روابط قديمة أو غير متاحة." en="Counts come from the generated snapshot, not a hard-coded “1000+” claim. Some README entries may be stale or unavailable." /></p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><p className="text-xs font-semibold text-primary"><Localized ar="آخر لقطة" en="Current snapshot" /></p><h2 className="mt-3 text-2xl font-semibold tracking-tight"><span className="font-mono">{snapshot.upstreamCommit.slice(0, 12)}</span></h2><p className="mt-3 text-sm text-muted-foreground"><Localized ar={`تم التوليد في ${new Date(snapshot.syncedAt).toLocaleString("ar-SA")}`} en={`Generated ${new Date(snapshot.syncedAt).toLocaleString("en-US")}`} /></p></div>
          <Button variant="outline" className="h-11 gap-2" asChild><a href="https://github.com/ComposioHQ/awesome-claude-skills/blob/master/CONTRIBUTING.md" target="_blank" rel="noreferrer"><Localized ar="ساهم في المصدر" en="Contribute upstream" /><ArrowUpRight className="size-4" /></a></Button>
        </div>
      </section>
    </>
  );
}
