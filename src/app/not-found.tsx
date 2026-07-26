import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { Localized } from "@/components/localized";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary"><Compass className="size-7" /></span>
      <p className="mt-6 font-mono text-sm text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight"><Localized ar="هذه الصفحة خارج الخريطة" en="This page is off the map" /></h1>
      <p className="mt-3 max-w-md leading-7 text-muted-foreground"><Localized ar="قد تكون المهارة أُزيلت أو تغيّر رابطها. ابدأ ببحث جديد في اللقطة الحالية." en="The skill may have been removed or renamed. Start a new search in the current snapshot." /></p>
      <Button className="mt-7 gap-2" asChild><Link href="/explore"><Search className="size-4" /><Localized ar="فتح الدليل" en="Open directory" /></Link></Button>
    </div>
  );
}
