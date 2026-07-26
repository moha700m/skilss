"use client";

import { Bot, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const AgentChat = dynamic(
  () => import("@/components/agent/agent-chat").then((module) => module.AgentChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-muted-foreground">
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="ms-2">Atlas Zero</span>
      </div>
    ),
  },
);

export function AgentDock() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/agent" || pathname.startsWith("/agent/")) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="lg"
          className="fixed bottom-4 end-4 z-40 h-14 gap-2 rounded-full px-4 shadow-xl shadow-primary/25 sm:bottom-6 sm:end-6"
          aria-label={locale === "ar" ? "فتح وكيل أطلس" : "Open Atlas Agent"}
        >
          <span className="relative">
            <Bot className="size-5" />
            <span className="absolute -end-1 -top-1 size-2.5 rounded-full border-2 border-primary bg-chart-2" aria-hidden="true" />
          </span>
          <span>{locale === "ar" ? "وكيل أطلس" : "Atlas Agent"}</span>
          <Sparkles className="size-3.5 opacity-75" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-[calc(100%-0.75rem)] max-w-none gap-0 overflow-hidden border bg-background p-0 sm:w-[30rem] sm:max-w-[30rem]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{locale === "ar" ? "وكيل أطلس" : "Atlas Agent"}</SheetTitle>
          <SheetDescription>
            {locale === "ar"
              ? "مساعد بلا مفتاح للبحث في مكتبة المهارات وتنفيذ إجراءات الموقع."
              : "A keyless assistant for searching the skill library and taking in-site actions."}
          </SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute end-3 top-3 z-10 size-9"
            aria-label={locale === "ar" ? "إغلاق الوكيل" : "Close agent"}
          >
            <X className="size-4" />
          </Button>
        </SheetClose>
        {open ? <AgentChat variant="dock" autoFocus onNavigate={() => setOpen(false)} /> : null}
      </SheetContent>
    </Sheet>
  );
}
