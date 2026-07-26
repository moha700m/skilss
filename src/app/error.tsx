"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { useLocale } from "@/components/providers";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLocale();
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><CircleAlert className="size-7" /></span>
      <h2 className="mt-6 text-2xl font-semibold">{locale === "ar" ? "تعذر تحميل هذه الصفحة" : "This page could not load"}</h2>
      <p className="mt-3 max-w-md leading-7 text-muted-foreground">{locale === "ar" ? "اللقطة نفسها ما زالت محفوظة. جرّب إعادة تحميل الجزء الحالي." : "The catalog snapshot is still intact. Try loading this section again."}</p>
      <Button className="mt-6 gap-2" onClick={reset}><RotateCcw className="size-4" />{locale === "ar" ? "إعادة المحاولة" : "Try again"}</Button>
    </div>
  );
}
