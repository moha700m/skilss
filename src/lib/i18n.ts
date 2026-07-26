import type { Locale } from "@/lib/types";

export const copy = {
  ar: {
    nav: {
      agent: "وكيل أطلس",
      explore: "استكشف",
      learn: "دليل الاستخدام",
      about: "عن المشروع",
      github: "GitHub",
      menu: "القائمة",
    },
    common: {
      arabic: "العربية",
      english: "English",
      light: "الوضع الفاتح",
      dark: "الوضع الداكن",
      source: "عرض المصدر",
      details: "عرض التفاصيل",
      copy: "نسخ",
      copied: "تم النسخ",
      internal: "داخل المستودع",
      listed: "مدرجة في دليل المصدر",
      external: "مصدر خارجي",
      curated: "مختارة",
      automation: "أتمتة تطبيق",
      unknownLicense: "ترخيص غير محدد",
      clear: "مسح الكل",
    },
    footer: {
      description:
        "واجهة اكتشاف مستقلة مبنية فوق بيانات awesome-claude-skills. نحافظ على أسماء المؤلفين وروابط المصدر، ولا نشغّل أي مهارة أو سكربت بالنيابة عنك.",
      explore: "استكشف",
      source: "المصدر",
      submitSkill: "المساهمة بمهارة",
      privacy: "الخصوصية والاستخدام الآمن",
      agentUiPrefix: "واجهة الوكيل مبنية باستخدام",
      agentUiSuffix: "من",
      rights: "بيانات الدليل بترخيص Apache-2.0؛ وقد تختلف تراخيص المهارات الفردية.",
      disclaimer: "ليس منتجًا رسميًا من Anthropic أو Composio.",
    },
  },
  en: {
    nav: {
      agent: "Atlas Agent",
      explore: "Explore",
      learn: "Get started",
      about: "About",
      github: "GitHub",
      menu: "Menu",
    },
    common: {
      arabic: "العربية",
      english: "English",
      light: "Light mode",
      dark: "Dark mode",
      source: "View source",
      details: "View details",
      copy: "Copy",
      copied: "Copied",
      internal: "In repository",
      listed: "Listed in upstream catalog",
      external: "External source",
      curated: "Curated",
      automation: "App automation",
      unknownLicense: "License not detected",
      clear: "Clear all",
    },
    footer: {
      description:
        "An independent discovery layer built on awesome-claude-skills data. Authors and source links stay visible, and no skill or script is executed for you.",
      explore: "Explore",
      source: "Source",
      submitSkill: "Submit a skill",
      privacy: "Privacy and safe use",
      agentUiPrefix: "Agent interface built with",
      agentUiSuffix: "by",
      rights: "Apache-2.0 directory data; individual skill licenses may differ.",
      disclaimer: "Not an official Anthropic or Composio product.",
    },
  },
} as const;

export type Dictionary = (typeof copy)[Locale];
