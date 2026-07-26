import type { Metadata } from "next";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  DatabaseZap,
  GitBranch,
  KeyRound,
  LockKeyhole,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { AgentChat } from "@/components/agent/agent-chat";
import { Localized } from "@/components/localized";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { snapshot } from "@/lib/skills";

export const metadata: Metadata = {
  title: "وكيل أطلس بلا مفتاح",
  description:
    "وكيل معرفي بلا مفتاح خارجي يفهم مكتبة SkillAtlas، يبحث في المهارات، ويجهّز إجراءات قابلة للتنفيذ داخل الموقع.",
  alternates: { canonical: "/agent" },
};

export default function AgentPage() {
  const syncedAt = new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(snapshot.syncedAt));

  return (
    <>
      <section className="relative overflow-hidden border-b bg-card/35">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />
        <div className="page-shell relative py-14 sm:py-20">
          <Badge variant="outline" className="mb-5 gap-1.5 bg-background/75">
            <Sparkles className="size-3 text-primary" />
            <Localized ar="الواجهة التنفيذية لـ SkillAtlas" en="SkillAtlas execution layer" />
          </Badge>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                <Localized
                  ar={<>وكيل يعرف المكتبة، ويحوّل طلبك إلى <span className="text-primary">خطوة قابلة للتنفيذ.</span></>}
                  en={<>An agent that knows the library and turns intent into an <span className="text-primary">actionable next step.</span></>}
                />
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                <Localized
                  ar="ابدأ بلا حساب وبلا مفتاح نموذج. المحرك الأساسي يفهم فهرس المهارات، يقارن النتائج، ويشغّل إجراءات الموقع؛ ويمكن توسيع طبقة العقل المحلي من دون تغيير تجربة المحادثة."
                  en="Start without an account or model key. The core engine understands the skill index, compares results, and runs in-site actions—and the local-brain layer can expand without changing the chat experience."
                />
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-background/75 p-4 backdrop-blur-sm">
                <KeyRound className="size-5 text-primary" />
                <p className="mt-3 text-2xl font-semibold"><Localized ar="صفر" en="Zero" /></p>
                <p className="text-xs text-muted-foreground"><Localized ar="مفاتيح مطلوبة" en="required keys" /></p>
              </div>
              <div className="rounded-2xl border bg-background/75 p-4 backdrop-blur-sm">
                <DatabaseZap className="size-5 text-primary" />
                <p className="mt-3 text-2xl font-semibold">{snapshot.total.toLocaleString("en-US")}</p>
                <p className="text-xs text-muted-foreground"><Localized ar="مهارة مفهرسة" en="indexed skills" /></p>
              </div>
              <div className="col-span-2 flex items-center gap-3 rounded-2xl border bg-background/75 p-4 backdrop-blur-sm">
                <RefreshCw className="size-5 shrink-0 text-chart-2" />
                <div>
                  <p className="text-sm font-semibold"><Localized ar="معرفة تتجدد من GitHub" en="Knowledge refreshed from GitHub" /></p>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">{snapshot.upstreamCommit.slice(0, 8)} · {syncedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-10 sm:py-14">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
          <AgentChat />

          <aside className="grid gap-4 xl:sticky xl:top-24" aria-label="Atlas Agent details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="size-4 text-primary" />
                  <Localized ar="ما الذي ينجزه الآن؟" en="What it can do now" />
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {[
                  { icon: Bot, ar: "يفهم طلبك بالعربية أو الإنجليزية.", en: "Understands Arabic or English intent." },
                  { icon: DatabaseZap, ar: "يبحث في الفهرس الكامل ويرتّب الأنسب.", en: "Searches the full index and ranks matches." },
                  { icon: MousePointerClick, ar: "يفتح، يبحث، ينسخ ويحفظ داخل الموقع.", en: "Opens, searches, copies, and saves in-site." },
                  { icon: ShieldCheck, ar: "يتحقق من نوع الهدف قبل تنفيذ الإجراء.", en: "Validates action targets before execution." },
                ].map(({ icon: Icon, ar, en }) => (
                  <div key={en} className="flex gap-3 text-sm leading-6">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <Localized ar={ar} en={en} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-foreground text-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-background">
                  <LockKeyhole className="size-4" />
                  <Localized ar="خصوصية الوضع بلا مفتاح" en="Keyless-mode privacy" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-background/70">
                <p><Localized ar="سجل المحادثة محفوظ في متصفحك، وليس في حساب سحابي." en="Chat history is stored in your browser, not a cloud account." /></p>
                <p><Localized ar="المحرك الأساسي لا يرسل نصك إلى مزود نموذج خارجي." en="The core engine does not send your text to an external model provider." /></p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wifi className="size-4 text-chart-2" />
                  <Localized ar="دورة المعرفة" en="Knowledge loop" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline"><GitBranch className="size-3" /> GitHub</Badge>
                  <span>→</span>
                  <Badge variant="outline"><DatabaseZap className="size-3" /> Index</Badge>
                  <span>→</span>
                  <Badge variant="outline"><BrainCircuit className="size-3" /> Agent</Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  <Localized ar="المعرفة مفصولة عن واجهة العقل، لذا تتحدث البيانات يوميًا دون مفتاح نموذج." en="Knowledge is decoupled from the brain UI, so data can refresh daily without a model key." />
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      <section className="border-t bg-card/30">
        <div className="page-shell grid gap-4 py-10 sm:grid-cols-3 sm:py-14">
          {[
            { number: "01", icon: CheckCircle2, ar: "اطلب النتيجة", en: "Ask for the outcome", arBody: "لا تحفظ أسماء المهارات؛ اشرح ما تريد إنجازه.", enBody: "Do not memorize skill names—describe what you need done." },
            { number: "02", icon: BrainCircuit, ar: "دع المحرك يركّب المسار", en: "Let the engine compose", arBody: "يبحث ويقارن ويقترح الإجراء التالي من الفهرس.", enBody: "It searches, compares, and proposes the next catalog action." },
            { number: "03", icon: MousePointerClick, ar: "نفّذ بنقرة", en: "Act in one click", arBody: "افتح المهارة أو احفظها أو انسخ أمرها بعد المراجعة.", enBody: "Open, save, or copy a skill command after reviewing it." },
          ].map(({ number, icon: Icon, ar, en, arBody, enBody }) => (
            <div key={number} className="flex gap-4 rounded-2xl border bg-background p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-4" /></span>
              <div>
                <span className="font-mono text-[0.65rem] text-muted-foreground">{number}</span>
                <h2 className="mt-1 font-semibold"><Localized ar={ar} en={en} /></h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground"><Localized ar={arBody} en={enBody} /></p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
