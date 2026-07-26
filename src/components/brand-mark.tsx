import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block size-8 shrink-0", className)}
    >
      <span className="absolute start-1 top-1 size-3 rounded-[4px] bg-primary" />
      <span className="absolute end-1 top-1 size-3 rounded-[4px] bg-chart-2" />
      <span className="absolute bottom-1 start-1 size-3 rounded-[4px] bg-chart-3" />
      <span className="absolute bottom-1 end-1 size-3 rounded-[4px] bg-foreground" />
    </span>
  );
}
