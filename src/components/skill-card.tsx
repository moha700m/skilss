"use client";

import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, Boxes, FileCode2, Sparkles } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { useLocale } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Skill } from "@/lib/types";

export function SkillCard({ skill }: { skill: Skill }) {
  const { locale, dictionary } = useLocale();
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden bg-card/78 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="gap-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-primary shadow-sm">
            {skill.kind === "automation" ? <Boxes className="size-5" /> : <Sparkles className="size-5" />}
          </div>
          <FavoriteButton id={skill.id} />
        </div>
        <div className="min-w-0">
          <Link
            href={`/skills/${skill.slug}`}
            className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none"
          >
            <h3 className="line-clamp-2 text-lg font-semibold leading-7 tracking-tight transition-colors group-hover:text-primary" dir="auto">
              {skill.name}
            </h3>
          </Link>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground" dir="auto">
            {skill.category}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground" dir="auto">
          {skill.description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/20 pt-4">
        <Badge variant={skill.kind === "automation" ? "secondary" : "outline"}>
          {skill.kind === "automation" ? dictionary.common.automation : dictionary.common.curated}
        </Badge>
        {skill.sourceType === "internal" && (
          <Badge variant="outline" className="gap-1">
            <FileCode2 className="size-3" /> {skill.repositoryPath ? dictionary.common.internal : dictionary.common.listed}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative z-10 ms-auto rounded-full"
          asChild
        >
          <Link href={`/skills/${skill.slug}`} aria-label={dictionary.common.details}>
            <Arrow className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
