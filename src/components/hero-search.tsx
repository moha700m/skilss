"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useLocale } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/explore?q=${encodeURIComponent(value)}` : "/explore");
  }

  return (
    <form
      onSubmit={submit}
      className="relative mx-auto mt-8 flex w-full max-w-2xl items-center gap-2 rounded-2xl border bg-card p-2 shadow-2xl shadow-primary/10 ring-1 ring-foreground/5 sm:p-2.5"
    >
      <Search className="ms-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-12 flex-1 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0 sm:text-base"
        placeholder={
          locale === "ar"
            ? "مثال: كتابة محتوى، تحليل بيانات، إدارة GitHub…"
            : "Try: content writing, data analysis, GitHub…"
        }
        aria-label={locale === "ar" ? "ابحث عن مهارة" : "Search skills"}
      />
      <Button
        type="submit"
        size="lg"
        className="h-12 gap-2 px-4 sm:px-6"
        aria-label={locale === "ar" ? "ابحث في دليل المهارات" : "Search the skill directory"}
      >
        <span className="hidden sm:inline">{locale === "ar" ? "ابحث" : "Search"}</span>
        <Arrow className="size-4" />
      </Button>
    </form>
  );
}
