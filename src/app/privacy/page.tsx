import type { Metadata } from "next";
import {
  Database,
  Download,
  Globe2,
  KeyRound,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Localized } from "@/components/localized";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "الخصوصية والاستخدام الآمن",
  description: "كيف يتعامل SkillAtlas وAtlas Zero مع المحادثة والبحث العام والعقل المحلي بلا مفتاح API.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    icon: Database,
    ar: "المحادثة والمفضلة",
    en: "Chat and favorites",
    arBody: "تُحفظ المحادثة والمفضلة في تخزين متصفحك فقط. لا ينشئ الموقع حسابًا سحابيًا ولا قاعدة بيانات لسجل محادثتك. يمكنك مسح السجل من واجهة الوكيل، ومسح بيانات الموقع من إعدادات المتصفح.",
    enBody: "Chat history and favorites stay in browser storage. The site creates no cloud account or server database for your conversation. Clear the chat in Atlas Agent, or remove all site data in browser settings.",
  },
  {
    icon: Globe2,
    ar: "البحث العام",
    en: "Public research",
    arBody: "لا يبدأ البحث الحي إلا عند تفعيل زر الويب أو عندما تطلبه صراحةً. يُرسل نص بحث قصير إلى واجهات GitHub وnpm وWikipedia العامة فقط. قد تسجل هذه الخدمات الطلب وفق سياساتها، ولا يرسل SkillAtlas سجل المحادثة كاملًا.",
    enBody: "Live research runs only when you enable the web control or explicitly request it. A short query is sent only to public GitHub, npm, and Wikipedia endpoints. Those services may log it under their policies; SkillAtlas never sends the full chat history.",
  },
  {
    icon: Download,
    ar: "العقل المحلي",
    en: "Local brain",
    arBody: "العقل المحمول اختياري ولا يُنزّل تلقائيًا. بعد نقرتك، يجلب المتصفح نموذج Qwen العام (نحو 570MB بالإضافة إلى ملفات مساعدة) ثم يشغّله داخل Web Worker وWebGPU ويحفظ ملفاته في ذاكرة المتصفح المؤقتة.",
    enBody: "The portable brain is optional and never downloads automatically. After your click, the browser fetches the public Qwen model (about 570MB plus supporting files), runs it in a Web Worker with WebGPU, and caches model artifacts in the browser.",
  },
  {
    icon: KeyRound,
    ar: "لا مفاتيح مخفية",
    en: "No hidden model keys",
    arBody: "المحرك الأساسي حتمي ويعمل فوق فهرس المهارات. لا يحتاج مفتاح OpenAI أو Anthropic أو Gemini، ولا يرسل النص إلى نموذج مدفوع. الخدمات الخاصة وأفعال الكتابة الخارجية ستتطلب OAuth وموافقة صريحة إذا أضيفت مستقبلًا.",
    enBody: "The core engine is deterministic and works over the skills index. It needs no OpenAI, Anthropic, or Gemini key and sends no text to a paid model. Private services and external write actions will require OAuth and explicit approval if added later.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b bg-card/35">
        <div className="page-shell py-14 sm:py-20">
          <Badge variant="outline" className="mb-5 gap-1.5 bg-background/75">
            <ShieldCheck className="size-3 text-primary" />
            <Localized ar="شفافية Atlas Zero" en="Atlas Zero transparency" />
          </Badge>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            <Localized ar="الخصوصية والاستخدام الآمن" en="Privacy and safe use" />
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            <Localized
              ar="لا نعدك بكلمة «بلا مفتاح» فقط؛ نوضح أين يعمل كل جزء، ومتى يغادر نصك المتصفح، وما الذي يبقى تحت سيطرتك."
              en="Keyless is not a slogan here. This page explains where each layer runs, when text leaves the browser, and what remains under your control."
            />
          </p>
        </div>
      </section>

      <section className="page-shell py-10 sm:py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(({ icon: Icon, ar, en, arBody, enBody }) => (
            <Card key={en}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="size-4" />
                  </span>
                  <Localized ar={ar} en={en} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                <Localized ar={arBody} en={enBody} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-primary" />
              <Localized ar="حدود الاستخدام والمسؤولية" en="Use limits and responsibility" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-7 text-muted-foreground">
            <p><Localized ar="نتائج المهارات والبحث ليست تدقيقًا أمنيًا أو قانونيًا. راجع المصدر والترخيص والأذونات قبل تثبيت أي مهارة أو تشغيل سكربت." en="Skill and research results are not a security or legal audit. Review source, license, and permissions before installing a skill or running a script." /></p>
            <p><Localized ar="Atlas Zero لا ينفّذ أوامر shell ولا مشتريات ولا حذفًا ولا كتابة في حسابات خارجية. إجراءات الموقع المحدودة تظهر لك لتختارها بنفسك." en="Atlas Zero does not execute shell commands, purchases, deletion, or writes to external accounts. Its bounded site actions remain visible for you to choose." /></p>
            <p className="font-mono text-xs"><Localized ar="آخر تحديث لهذه الصفحة: 26 يوليو 2026" en="Last updated: July 26, 2026" /></p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
