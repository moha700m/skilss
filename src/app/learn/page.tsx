import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Cable,
  CheckCircle2,
  FileCode2,
  FolderTree,
  Search,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Localized } from "@/components/localized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "دليل استخدام المهارات",
  description: "افهم الفرق بين المهارات والأدوات وMCP، وتعلّم كيف تراجع مهارة وتثبتها بأمان.",
  alternates: { canonical: "/learn" },
};

const cloneCommand = "git clone --depth 1 https://github.com/ComposioHQ/awesome-claude-skills.git";

export default function LearnPage() {
  return (
    <>
      <section className="border-b bg-card/35">
        <div className="page-shell py-16 sm:py-24">
          <Badge variant="outline" className="mb-5 gap-1.5"><BookOpenCheck className="size-3" /><Localized ar="دليل عملي" en="Practical guide" /></Badge>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"><Localized ar="المهارة تعلّم الوكيل كيف يعمل، لا ماذا يستطيع الوصول إليه." en="A skill teaches the agent how to work—not what it can access." /></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground"><Localized ar="هذا الفرق الصغير يمنع كثيرًا من الالتباس. افهم الطبقات الثلاث، ثم راجع المصدر قبل أن تضيف أي ملفات إلى وكيلك." en="That distinction clears up a lot of confusion. Understand the three layers, then inspect the source before adding files to your agent." /></p>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { icon: FileCode2, number: "01", title: <Localized key="t1" ar="المهارة / Skill" en="Skill" />, description: <Localized key="d1" ar="تعليمات وسياق وخطوات عمل قابلة لإعادة الاستخدام. غالبًا تبدأ بملف SKILL.md." en="Reusable instructions, context, and workflow. It usually starts with SKILL.md." /> },
            { icon: Wrench, number: "02", title: <Localized key="t2" ar="الأداة / Tool" en="Tool" />, description: <Localized key="d2" ar="وظيفة محددة يستدعيها الوكيل: بحث، قراءة ملف، إرسال رسالة، أو تشغيل أمر." en="A specific callable capability: search, read a file, send a message, or run a command." /> },
            { icon: Cable, number: "03", title: <Localized key="t3" ar="الاتصال / MCP" en="MCP connection" />, description: <Localized key="d3" ar="الطبقة التي توصل الوكيل بأنظمة خارجية وتتعامل مع اكتشاف الأدوات والمصادقة." en="The layer connecting an agent to outside systems, including tool discovery and authentication." /> },
          ].map(({ icon: Icon, number, title, description }) => (
            <Card key={number} className="relative overflow-hidden">
              <CardHeader className="gap-5">
                <div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="size-5" /></span><span className="font-mono text-xs text-muted-foreground">{number}</span></div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm leading-7 text-muted-foreground">{description}</p></CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start sm:mt-24">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold text-primary"><Localized ar="تثبيت واعٍ" en="Deliberate install" /></p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"><Localized ar="راجع أولًا. انسخ ثانيًا." en="Inspect first. Copy second." /></h2>
            <p className="mt-4 leading-7 text-muted-foreground"><Localized ar="المهارة مجلد، وليست أمرًا سحريًا. ملفات scripts قد تنفذ عمليات على جهازك أو خدماتك، لذلك يعرضها الدليل كإشارة تحذير لا كشارة جودة." en="A skill is a folder, not a magic command. Scripts may act on your machine or services, so the directory flags them as a review signal—not a quality badge." /></p>
          </div>
          <div className="space-y-4">
            {[
              { icon: Search, title: <Localized key="s1" ar="اختر المهارة المناسبة" en="Choose the right skill" />, description: <Localized key="p1" ar="اقرأ الوصف، المصدر، والترخيص المكتشف. لا تعتمد على الاسم وحده." en="Read its description, source, and detected license. Do not rely on the name alone." /> },
              { icon: FolderTree, title: <Localized key="s2" ar="افحص شجرة الملفات" en="Inspect the file tree" />, description: <Localized key="p2" ar="ابدأ بـ SKILL.md، ثم راجع scripts وreferences وassets إن وجدت." en="Start with SKILL.md, then review scripts, references, and assets when present." /> },
              { icon: Terminal, title: <Localized key="s3" ar="انسخ المجلد كاملًا" en="Copy the complete folder" />, description: <Localized key="p3" ar="ضعه في مجلد المهارات الذي توثقه منصتك مع الحفاظ على الملفات المساعدة." en="Place it in the skills directory documented by your platform, preserving helper files." /> },
              { icon: CheckCircle2, title: <Localized key="s4" ar="ابدأ بمهمة منخفضة المخاطر" en="Start with a low-risk task" />, description: <Localized key="p4" ar="اختبر تفعيل المهارة قبل منحها أدوات كتابة أو وصولًا إلى حسابات مهمة." en="Test activation before granting write tools or access to important accounts." /> },
            ].map(({ icon: Icon, title, description }, index) => (
              <div key={index} className="flex gap-4 rounded-2xl border bg-card/60 p-5 sm:p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" /></span>
                <div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-card/40">
        <div className="page-shell grid gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="outline" className="mb-4"><ShieldCheck className="size-3" /><Localized ar="قائمة تحقق" en="Checklist" /></Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl"><Localized ar="قبل أن تثبّت أي مهارة" en="Before installing any skill" /></h2>
            <div className="mt-7 grid gap-3">
              {[
                <Localized key="c1" ar="المصدر معروف والرابط يعمل." en="The source is known and reachable." />,
                <Localized key="c2" ar="راجعت SKILL.md ولم تجد تعليمات تتجاوز المهمة." en="You reviewed SKILL.md for instructions beyond the task." />,
                <Localized key="c3" ar="راجعت السكربتات والاعتماديات يدويًا." en="You manually reviewed scripts and dependencies." />,
                <Localized key="c4" ar="فهمت الترخيص أو قررت عدم إعادة توزيع الملفات." en="You understand the license or will not redistribute files." />,
                <Localized key="c5" ar="الأدوات والصلاحيات الممنوحة هي الحد الأدنى." en="Granted tools and permissions are the minimum necessary." />,
              ].map((item, index) => <div key={index} className="flex items-start gap-3 text-sm leading-6"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-chart-2" /><span>{item}</span></div>)}
            </div>
          </div>
          <Card className="overflow-hidden bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3"><span className="font-mono text-xs text-muted-foreground">Terminal</span><CopyButton text={cloneCommand} /></div>
            <CardContent className="p-0">
              <pre className="overflow-x-auto p-5 text-start font-mono text-sm leading-7" dir="ltr"><code>{cloneCommand}</code></pre>
              <div className="border-t bg-muted/35 p-5 text-sm leading-6 text-muted-foreground"><Localized ar="بعد التنزيل، لا تنسخ أي مجلد قبل مراجعته. صفحة كل مهارة في الدليل تعطيك رابط المصدر والمسار إن كان متاحًا." en="After cloning, do not copy a folder before reviewing it. Each skill page provides its source link and repository path when available." /></div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="rounded-3xl border bg-foreground p-8 text-background sm:p-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl"><h2 className="text-3xl font-semibold tracking-tight"><Localized ar="جاهز لاختيار أول مهارة؟" en="Ready to choose your first skill?" /></h2><p className="mt-3 leading-7 text-background/65"><Localized ar="ابحث بالمهمة بدل اسم الأداة، ثم قارن المصدر والملفات قبل التثبيت." en="Search by outcome instead of tool name, then compare source and files before installing." /></p></div>
          <Button size="lg" variant="secondary" className="mt-6 h-11 gap-2 px-5 lg:mt-0" asChild><Link href="/explore"><Localized ar="فتح الدليل" en="Open directory" /><span className="only-ar"><ArrowLeft className="size-4" /></span><span className="only-en"><ArrowRight className="size-4" /></span></Link></Button>
        </div>
      </section>
    </>
  );
}
