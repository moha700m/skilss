"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Heart, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useLocale } from "@/components/providers";
import { SkillCard } from "@/components/skill-card";
import { useFavorites } from "@/hooks/use-favorites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Skill, SkillKind, SkillSourceType } from "@/lib/types";

const allValue = "__all__";
const pageSize = 24;
const synonymMap: Record<string, string> = {
  "برمجة": "code development developer programming",
  "كود": "code programming development",
  "ملفات": "document files pdf docx spreadsheet",
  "وثائق": "document docs pdf docx",
  "كتابة": "writing content article copy",
  "محتوى": "content writing media",
  "تسويق": "marketing ads seo growth",
  "بريد": "email gmail mail",
  "اجتماعات": "meeting calendar zoom",
  "تصميم": "design image creative media",
  "بيانات": "data analytics analysis spreadsheet",
  "تحليل": "analysis analytics data",
  "بحث": "research search discovery",
  "أمن": "security systems forensics",
  "ادارة": "management productivity project organization",
  "إدارة": "management productivity project organization",
  "ترجمة": "translate translation language",
  "جداول": "spreadsheet excel xlsx data",
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .trim();
}

function queryGroups(query: string) {
  const normalized = normalize(query);
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => {
      const expansion = synonymMap[term] ?? "";
      return [...new Set([term, ...normalize(expansion).split(/\s+/).filter(Boolean)])];
    });
}

interface FiltersProps {
  category: string;
  setCategory: (value: string) => void;
  kind: "all" | SkillKind;
  setKind: (value: "all" | SkillKind) => void;
  source: "all" | SkillSourceType;
  setSource: (value: "all" | SkillSourceType) => void;
  sort: "featured" | "name";
  setSort: (value: "featured" | "name") => void;
  categories: string[];
  locale: "ar" | "en";
}

function Filters({
  category,
  setCategory,
  kind,
  setKind,
  source,
  setSource,
  sort,
  setSort,
  categories,
  locale,
}: FiltersProps) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        {locale === "ar" ? "الفئة" : "Category"}
        <Select value={category || allValue} onValueChange={(value) => setCategory(value === allValue ? "" : value)}>
          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value={allValue}>{locale === "ar" ? "كل الفئات" : "All categories"}</SelectItem>
            {categories.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {locale === "ar" ? "النوع" : "Type"}
        <Select value={kind} onValueChange={(value) => setKind(value as "all" | SkillKind)}>
          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">{locale === "ar" ? "كل الأنواع" : "All types"}</SelectItem>
            <SelectItem value="curated">{locale === "ar" ? "مهارات مختارة" : "Curated skills"}</SelectItem>
            <SelectItem value="automation">{locale === "ar" ? "أتمتة تطبيقات" : "App automations"}</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {locale === "ar" ? "المصدر" : "Source"}
        <Select value={source} onValueChange={(value) => setSource(value as "all" | SkillSourceType)}>
          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">{locale === "ar" ? "كل المصادر" : "All sources"}</SelectItem>
            <SelectItem value="internal">{locale === "ar" ? "داخل المستودع" : "In repository"}</SelectItem>
            <SelectItem value="external">{locale === "ar" ? "روابط خارجية" : "External links"}</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {locale === "ar" ? "الترتيب" : "Sort"}
        <Select value={sort} onValueChange={(value) => setSort(value as "featured" | "name")}>
          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="featured">{locale === "ar" ? "المقترحة أولًا" : "Recommended first"}</SelectItem>
            <SelectItem value="name">{locale === "ar" ? "حسب الاسم" : "Name"}</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}

export function DirectoryShell({
  skills,
  initialQuery = "",
  initialCategory = "",
}: {
  skills: Skill[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const { locale, dictionary } = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [kind, setKind] = useState<"all" | SkillKind>("all");
  const [source, setSource] = useState<"all" | SkillSourceType>("all");
  const [sort, setSort] = useState<"featured" | "name">("featured");
  const [scriptsOnly, setScriptsOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const { favorites: favoriteIds } = useFavorites();

  const categories = useMemo(
    () => [...new Set(skills.map((skill) => skill.category))].sort((a, b) => a.localeCompare(b)),
    [skills],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    const nextUrl = params.size ? `/explore?${params.toString()}` : "/explore";
    window.history.replaceState(null, "", nextUrl);
  }, [query, category]);

  const filtered = useMemo(() => {
    const groups = queryGroups(query);
    const result = skills.filter((skill) => {
      const haystack = normalize(
        `${skill.searchText} ${skill.name} ${skill.description} ${skill.category} ${skill.author ?? ""}`,
      );
      return (
        groups.every((terms) => terms.some((term) => haystack.includes(term))) &&
        (!category || skill.category === category) &&
        (kind === "all" || skill.kind === kind) &&
        (source === "all" || skill.sourceType === source) &&
        (!scriptsOnly || skill.hasScripts) &&
        (!favoritesOnly || favoriteIds.has(skill.id))
      );
    });

    return result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
      if (a.kind !== b.kind) return a.kind === "curated" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [skills, query, category, kind, source, scriptsOnly, favoritesOnly, favoriteIds, sort]);

  const hasFilters = Boolean(query || category || kind !== "all" || source !== "all" || scriptsOnly || favoritesOnly);
  const filterProps: FiltersProps = { category, setCategory, kind, setKind, source, setSource, sort, setSort, categories, locale };

  function clearFilters() {
    setQuery("");
    setCategory("");
    setKind("all");
    setSource("all");
    setScriptsOnly(false);
    setFavoritesOnly(false);
  }

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-3xl">
        <Badge variant="outline" className="mb-4 gap-1.5"><Sparkles className="size-3" /> {locale === "ar" ? "الدليل الكامل" : "Full directory"}</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{locale === "ar" ? "ابحث بالطريقة التي تفكر بها" : "Search the way you think"}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{locale === "ar" ? "ابحث بالنتيجة التي تريدها، أو صفِّ حسب الفئة والمصدر ونوع المهارة. أسماء المهارات وأوصافها الأصلية تبقى كما كتبها أصحابها." : "Search by desired outcome, or filter by category, source, and skill type. Original names and descriptions remain intact."}</p>
      </div>

      <div className="mt-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 bg-card ps-10 pe-10 text-base shadow-sm sm:text-base"
            placeholder={locale === "ar" ? "اكتب اسم تطبيق أو مهمة…" : "Type an app or task…"}
            aria-label={locale === "ar" ? "بحث الدليل" : "Search directory"}
          />
          {query && (
            <Button type="button" variant="ghost" size="icon-sm" className="absolute end-2 top-1/2 -translate-y-1/2" onClick={() => setQuery("")}>
              <X className="size-4" /><span className="sr-only">{dictionary.common.clear}</span>
            </Button>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 gap-2 lg:hidden"><SlidersHorizontal className="size-4" />{locale === "ar" ? "تصفية" : "Filter"}</Button>
          </SheetTrigger>
          <SheetContent side={locale === "ar" ? "right" : "left"}>
            <SheetHeader><SheetTitle>{locale === "ar" ? "تصفية النتائج" : "Filter results"}</SheetTitle><SheetDescription>{locale === "ar" ? "اختر ما يناسب المهمة الحالية." : "Narrow the directory for the task at hand."}</SheetDescription></SheetHeader>
            <div className="p-4"><Filters {...filterProps} /></div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card/60 p-4">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold"><Filter className="size-4" />{locale === "ar" ? "تصفية النتائج" : "Filters"}</div>
            <Filters {...filterProps} />
            <div className="mt-5 grid gap-2 border-t pt-4">
              <Button type="button" variant={scriptsOnly ? "secondary" : "ghost"} className="justify-start" onClick={() => setScriptsOnly((value) => !value)} aria-pressed={scriptsOnly}>
                <span className="size-2 rounded-full bg-chart-4" />{locale === "ar" ? "يتضمن سكربتات" : "Includes scripts"}
              </Button>
              <Button type="button" variant={favoritesOnly ? "secondary" : "ghost"} className="justify-start" onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly}>
                <Heart className="size-4" />{locale === "ar" ? "المفضلة فقط" : "Favorites only"}
              </Button>
            </div>
            {hasFilters && <Button variant="link" className="mt-3 w-full" onClick={clearFilters}>{dictionary.common.clear}</Button>}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-mono font-semibold text-foreground">{filtered.length.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}</span> {locale === "ar" ? "نتيجة" : "results"}
            </p>
            <div className="flex gap-2 lg:hidden">
              <Button type="button" size="sm" variant={scriptsOnly ? "secondary" : "outline"} onClick={() => setScriptsOnly((value) => !value)}>{locale === "ar" ? "سكربتات" : "Scripts"}</Button>
              <Button type="button" size="icon-sm" variant={favoritesOnly ? "secondary" : "outline"} onClick={() => setFavoritesOnly((value) => !value)} aria-label={locale === "ar" ? "المفضلة" : "Favorites"}><Heart className="size-4" /></Button>
            </div>
          </div>

          {filtered.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, visibleCount).map((skill) => <SkillCard key={skill.id} skill={skill} />)}
              </div>
              {visibleCount < filtered.length && (
                <div className="mt-10 flex justify-center">
                  <Button variant="outline" size="lg" className="h-11 px-6" onClick={() => setVisibleCount((count) => count + pageSize)}>
                    {locale === "ar" ? `عرض ${Math.min(pageSize, filtered.length - visibleCount)} أخرى` : `Show ${Math.min(pageSize, filtered.length - visibleCount)} more`}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/35 px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted"><Search className="size-5 text-muted-foreground" /></span>
              <h2 className="mt-5 text-xl font-semibold">{locale === "ar" ? "لا توجد نتيجة مطابقة" : "No matching skill"}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{locale === "ar" ? "جرّب كلمة أوسع أو امسح بعض الفلاتر. البحث يدعم مفردات عربية شائعة." : "Try a broader term or clear a few filters."}</p>
              <Button variant="outline" className="mt-5" onClick={clearFilters}>{dictionary.common.clear}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
