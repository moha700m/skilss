import { cn } from "@/lib/utils";

export function Localized({
  ar,
  en,
  className,
}: {
  ar: React.ReactNode;
  en: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(className)}>
      <span className="only-ar">{ar}</span>
      <span className="only-en">{en}</span>
    </span>
  );
}
