"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLocale } from "@/components/providers";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const { dictionary } = useLocale();

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={copyText}>
      {copied ? <Check className="size-4 text-chart-2" /> : <Copy className="size-4" />}
      {copied ? dictionary.common.copied : dictionary.common.copy}
    </Button>
  );
}
