"use client";

import { Heart } from "lucide-react";
import { useLocale } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const { favorites, toggleFavorite } = useFavorites();
  const { locale } = useLocale();
  const isFavorite = favorites.has(id);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("relative z-10 size-10 shrink-0", className)}
      onClick={() => toggleFavorite(id)}
      aria-label={
        locale === "ar"
          ? isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"
          : isFavorite ? "Remove from favorites" : "Add to favorites"
      }
      aria-pressed={isFavorite}
    >
      <Heart className={cn("size-4", isFavorite && "fill-primary text-primary")} />
    </Button>
  );
}
