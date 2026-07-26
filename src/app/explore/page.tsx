import type { Metadata } from "next";
import { DirectoryShell } from "@/components/directory-shell";
import { skills } from "@/lib/skills";

export const metadata: Metadata = {
  title: "استكشف المهارات",
  description: "ابحث وصفِّ مئات المهارات العملية لوكلاء الذكاء الاصطناعي حسب المهمة والفئة والمصدر.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  return (
    <DirectoryShell
      skills={skills}
      initialQuery={params.q ?? ""}
      initialCategory={params.category ?? ""}
    />
  );
}
