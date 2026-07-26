"use client";

import {
  BrainCircuit,
  Check,
  CloudDownload,
  Globe2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import type { LocalBrainState } from "@/components/agent/use-local-brain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentRuntimeBarProps {
  locale: "ar" | "en";
  localBrain: LocalBrainState;
  webEnabled: boolean;
  compact?: boolean;
  onEnableLocal: () => void;
  onDisableLocal: () => void;
  onToggleWeb: () => void;
}

function localLabel(state: LocalBrainState, locale: "ar" | "en") {
  if (state.phase === "checking") return locale === "ar" ? "فحص الجهاز" : "Checking device";
  if (state.phase === "unsupported") return locale === "ar" ? "WebGPU غير متاح" : "WebGPU unavailable";
  if (state.phase === "loading") {
    const suffix = state.progress === null ? "" : ` ${Math.round(state.progress)}%`;
    return `${locale === "ar" ? "تحميل العقل المحلي" : "Loading local brain"}${suffix}`;
  }
  if (state.phase === "generating") return locale === "ar" ? "العقل المحلي يفكّر" : "Local brain thinking";
  if (state.phase === "ready") return locale === "ar" ? "العقل المحلي جاهز" : "Local brain ready";
  if (state.phase === "error") return locale === "ar" ? "تعذّر التحميل — أعد المحاولة" : "Load failed — retry";
  return locale === "ar" ? "فعّل العقل المحلي (~570MB)" : "Enable local brain (~570MB)";
}

export function AgentRuntimeBar({
  locale,
  localBrain,
  webEnabled,
  compact = false,
  onEnableLocal,
  onDisableLocal,
  onToggleWeb,
}: AgentRuntimeBarProps) {
  const localReady = localBrain.phase === "ready" || localBrain.phase === "generating";
  const localChecking = localBrain.phase === "checking";
  const localLoading = localBrain.phase === "loading";
  const localUnsupported = localBrain.phase === "unsupported";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
      <Button
        type="button"
        variant={localReady ? "secondary" : "outline"}
        size={compact ? "xs" : "sm"}
        className={cn("gap-1.5", localReady && "border-primary/25 bg-primary/10 text-primary")}
        onClick={localReady || localLoading ? onDisableLocal : onEnableLocal}
        disabled={localChecking || localUnsupported}
        title={
          locale === "ar"
            ? "تنزيل عام لمرة واحدة ثم استدلال خاص داخل المتصفح. لا يبدأ إلا بهذه النقرة."
            : "One public download, then private in-browser inference. It starts only after this click."
        }
      >
        {localChecking || localLoading ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : localReady ? (
          <BrainCircuit className="size-3.5" />
        ) : (
          <CloudDownload className="size-3.5" />
        )}
        <span className={cn(compact && "max-w-32 truncate")}>{localLabel(localBrain, locale)}</span>
        {localReady ? <Check className="size-3" /> : null}
      </Button>

      <Button
        type="button"
        variant={webEnabled ? "secondary" : "outline"}
        size={compact ? "xs" : "sm"}
        className={cn("gap-1.5", webEnabled && "border-chart-2/25 bg-chart-2/10")}
        onClick={onToggleWeb}
        aria-pressed={webEnabled}
        title={
          locale === "ar"
            ? "يرسل طلبك إلى GitHub وnpm وWikipedia العامة فقط عند التفعيل."
            : "When enabled, sends the query only to public GitHub, npm, and Wikipedia endpoints."
        }
      >
        <Globe2 className="size-3.5" />
        {locale === "ar" ? "بحث الويب" : "Web research"}
        {webEnabled ? <Check className="size-3" /> : null}
      </Button>

      {!compact ? (
        <Badge variant="outline" className="gap-1.5 text-[0.68rem] font-normal text-muted-foreground">
          <ShieldCheck className="size-3 text-chart-2" />
          {locale === "ar" ? "الأفعال تبقى تحت موافقتك" : "Actions stay under your approval"}
        </Badge>
      ) : null}
    </div>
  );
}
