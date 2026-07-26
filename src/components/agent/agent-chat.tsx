"use client";

import type { ChatStatus, UIMessage } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  KeyRound,
  Maximize2,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AgentRuntimeBar } from "@/components/agent/agent-runtime-bar";
import { useAgentRuntime } from "@/components/agent/agent-runtime-context";
import { AgentMessageExtras } from "@/components/agent/agent-message";
import type {
  AgentAction,
  AgentMessage as AgentMessageData,
  AgentResponse,
  AgentSkillMatch,
} from "@/components/agent/agent-types";
import {
  createAgentMessageId,
  useAgentHistory,
} from "@/components/agent/use-agent-history";
import {
  AgentChat as AgentElementsChat,
} from "@/components/agent-elements/agent-chat";
import {
  InputBar,
  type InputBarProps,
} from "@/components/agent-elements/input-bar";
import {
  ToolRenderer as DefaultToolRenderer,
  type ToolRendererProps,
} from "@/components/agent-elements/tools/tool-renderer";
import { useLocale } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildAgentGrounding } from "@/lib/agent/grounding";
import {
  fetchAgentResearch,
  isExplicitResearchRequest,
  type AgentResearchResponse,
} from "@/lib/agent/research";
import { cn } from "@/lib/utils";

interface AgentChatProps {
  variant?: "page" | "dock";
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

const ATLAS_RESULT_TOOL = "tool-mcp__user-tools__atlas_result";

const suggestions = {
  ar: [
    "أريد مهارة لتحليل بيانات CSV",
    "ابحث في الإنترنت عن أحدث أدوات وكلاء الذكاء الاصطناعي",
    "رشّح مهارات لتطوير موقع وبرمجة",
    "قارن بين pdf و xlsx",
  ],
  en: [
    "Find a skill for CSV data analysis",
    "Research the latest AI agent tools on the web",
    "Recommend skills for website development",
    "Compare pdf and xlsx",
  ],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseMatches(value: unknown): AgentSkillMatch[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    if (
      typeof entry.id !== "string" ||
      typeof entry.slug !== "string" ||
      typeof entry.name !== "string" ||
      typeof entry.description !== "string" ||
      typeof entry.category !== "string"
    ) {
      return [];
    }

    return [{
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
      description: entry.description,
      category: entry.category,
      sourceUrl: typeof entry.sourceUrl === "string" ? entry.sourceUrl : undefined,
      installCommand:
        typeof entry.installCommand === "string" ? entry.installCommand : undefined,
    }];
  });
}

function parseAgentResponse(value: unknown): AgentResponse {
  if (!isRecord(value) || typeof value.reply !== "string") {
    throw new Error("INVALID_RESPONSE");
  }

  const actions = Array.isArray(value.actions)
    ? value.actions.flatMap((entry) => {
        if (!isRecord(entry) || typeof entry.type !== "string" || typeof entry.label !== "string") {
          return [];
        }
        const allowedTypes = [
          "navigate",
          "open_skill",
          "search",
          "favorite",
          "copy",
          "open_source",
        ] as const;
        if (!allowedTypes.includes(entry.type as (typeof allowedTypes)[number])) return [];
        return [{
          type: entry.type as AgentAction["type"],
          label: entry.label.slice(0, 180),
          href: typeof entry.href === "string" ? entry.href : undefined,
          text: typeof entry.text === "string" ? entry.text : undefined,
          skillId: typeof entry.skillId === "string" ? entry.skillId : undefined,
        }];
      })
    : [];
  const meta = isRecord(value.meta) ? value.meta : {};

  return {
    reply: value.reply,
    locale: value.locale === "en" ? "en" : "ar",
    matches: parseMatches(value.matches),
    actions,
    meta: {
      mode: typeof meta.mode === "string" ? meta.mode : undefined,
      syncedAt: typeof meta.syncedAt === "string" ? meta.syncedAt : undefined,
      totalSkills:
        typeof meta.totalSkills === "number"
          ? meta.totalSkills
          : typeof meta.catalogTotal === "number"
            ? meta.catalogTotal
            : undefined,
    },
  };
}

function saveFavorite(skillId: string) {
  const storageKey = "skillatlas-favorites";
  let favorites: string[] = [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (Array.isArray(parsed)) {
      favorites = parsed.filter((entry): entry is string => typeof entry === "string");
    }
  } catch {
    favorites = [];
  }
  if (!favorites.includes(skillId)) favorites.push(skillId);
  window.localStorage.setItem(storageKey, JSON.stringify(favorites));
  window.dispatchEvent(new Event("skillatlas-favorites-change"));
}

function modeLabel(mode: string | undefined, locale: "ar" | "en") {
  const normalized = mode?.toLowerCase() ?? "";
  if (normalized.includes("local") || normalized.includes("browser")) {
    return locale === "ar" ? "عقل محلي" : "Local brain";
  }
  if (normalized.includes("web")) {
    return locale === "ar" ? "محرك + مصادر حية" : "Engine + live sources";
  }
  return locale === "ar" ? "محرك بلا مفتاح" : "Keyless engine";
}

function messageToUIMessage(message: AgentMessageData): UIMessage {
  const parts: unknown[] = [{ type: "text", text: message.content }];
  if (
    message.role === "assistant" &&
    ((message.matches?.length ?? 0) > 0 ||
      (message.sources?.length ?? 0) > 0 ||
      (message.actions?.length ?? 0) > 0)
  ) {
    parts.push({
      type: ATLAS_RESULT_TOOL,
      toolCallId: `atlas-result:${message.id}`,
      state: "output-available",
      input: { source: "atlas-deterministic-core" },
      output: { messageId: message.id },
    });
  }

  return {
    id: message.id,
    role: message.role,
    parts,
    createdAt: message.createdAt,
  } as unknown as UIMessage;
}

function researchUnavailableNote(locale: "ar" | "en") {
  return locale === "ar"
    ? "\n\n> تعذّر الوصول إلى بعض مصادر البحث العامة الآن؛ أبقيت لك نتيجة الفهرس المحلي الموثوقة."
    : "\n\n> Some public research sources were unavailable, so I kept the trusted local-catalog result.";
}

export function AgentChat({
  variant = "page",
  className,
  autoFocus = false,
  onNavigate,
}: AgentChatProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const runtime = useAgentRuntime();
  const { messages, appendMessage, clearHistory } = useAgentHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);
  const localStreamRef = useRef("");
  const compact = variant === "dock";
  const visibleMessages = compact ? messages.slice(-20) : messages;
  const latestMeta = useMemo(
    () => [...messages].reverse().find((message) => message.meta)?.meta,
    [messages],
  );

  useEffect(() => {
    localStreamRef.current = runtime.state.streamedText;
  }, [runtime.state.streamedText]);

  const stopCurrentRequest = useCallback(() => {
    abortRef.current?.abort();
    runtime.cancel();
    setIsLoading(false);
  }, [runtime]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const executeAction = useCallback(async (action: AgentAction, actionKey: string) => {
    const success = locale === "ar" ? "تم" : "Done";
    const unavailable = locale === "ar" ? "غير متاح" : "Unavailable";

    try {
      if (action.type === "favorite") {
        if (!action.skillId) throw new Error("MISSING_TARGET");
        saveFavorite(action.skillId);
        setActionFeedback((current) => ({
          ...current,
          [actionKey]: locale === "ar" ? "حُفظت" : "Saved",
        }));
        return;
      }
      if (action.type === "copy") {
        if (!action.text) throw new Error("MISSING_TARGET");
        await navigator.clipboard.writeText(action.text);
        setActionFeedback((current) => ({
          ...current,
          [actionKey]: locale === "ar" ? "نُسخ" : "Copied",
        }));
        return;
      }
      if (action.type === "open_source") {
        if (!action.href) throw new Error("MISSING_TARGET");
        const url = new URL(action.href, window.location.origin);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("UNSAFE_TARGET");
        const openedWindow = window.open(url.href, "_blank", "noopener,noreferrer");
        if (openedWindow) openedWindow.opener = null;
        setActionFeedback((current) => ({ ...current, [actionKey]: success }));
        return;
      }
      if (!action.href) throw new Error("MISSING_TARGET");
      const target = new URL(action.href, window.location.origin);
      if (target.origin !== window.location.origin) throw new Error("UNSAFE_TARGET");
      setActionFeedback((current) => ({ ...current, [actionKey]: success }));
      router.push(`${target.pathname}${target.search}${target.hash}`);
      onNavigate?.();
    } catch {
      setActionFeedback((current) => ({ ...current, [actionKey]: unavailable }));
    }
  }, [locale, onNavigate, router]);

  async function requestReply(prompt: string, addUserMessage: boolean) {
    const normalizedPrompt = prompt.trim().slice(0, 1_200);
    if (!normalizedPrompt || isLoading) return;

    const userMessage: AgentMessageData = {
      id: createAgentMessageId(),
      role: "user",
      content: normalizedPrompt,
      createdAt: new Date().toISOString(),
    };
    const requestMessages = addUserMessage ? [...messages, userMessage] : messages;
    if (addUserMessage) appendMessage(userMessage);
    setError(null);
    setFailedPrompt(null);
    setIsLoading(true);
    localStreamRef.current = "";

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    const shouldResearch =
      runtime.webEnabled || isExplicitResearchRequest(normalizedPrompt);

    try {
      const coreRequest = fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages.slice(-12).map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      const researchRequest: Promise<AgentResearchResponse | null> = shouldResearch
        ? fetchAgentResearch(normalizedPrompt, controller.signal).catch(() => null)
        : Promise.resolve(null);
      const [response, research] = await Promise.all([coreRequest, researchRequest]);

      if (!response.ok) {
        throw new Error(response.status === 429 ? "RATE_LIMIT" : "REQUEST_FAILED");
      }

      const payload = parseAgentResponse(await response.json());
      let reply = payload.reply;
      let localModel: string | undefined;

      if (runtime.state.phase === "ready") {
        const result = await runtime.generate(buildAgentGrounding({
          query: normalizedPrompt,
          locale,
          conversation: requestMessages,
          core: payload,
          research,
          currentPage: {
            title: document.title,
            path: `${window.location.pathname}${window.location.search}`,
          },
        }));
        if (result?.text.trim()) {
          reply = result.text.trim();
          localModel = result.modelId;
        }
      }

      if (shouldResearch && (!research || research.sources.length === 0)) {
        reply += researchUnavailableNote(locale);
      }

      appendMessage({
        id: createAgentMessageId(),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
        matches: payload.matches,
        sources: research?.sources,
        actions: payload.actions,
        meta: {
          ...payload.meta,
          mode: localModel ? "local-webgpu" : research ? "keyless-web" : payload.meta.mode,
          researchedAt: research?.fetchedAt,
          localModel,
        },
      });
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        const partial = localStreamRef.current.trim();
        appendMessage({
          id: createAgentMessageId(),
          role: "assistant",
          content: partial || (locale === "ar" ? "أوقفتُ الطلب قبل اكتماله." : "The request was stopped before completion."),
          createdAt: new Date().toISOString(),
          meta: { mode: partial ? "local-webgpu" : "keyless" },
        });
        return;
      }
      const code = caughtError instanceof Error ? caughtError.message : "REQUEST_FAILED";
      setError(
        locale === "ar"
          ? code === "RATE_LIMIT"
            ? "أرسلت طلبات كثيرة بسرعة. انتظر قليلًا ثم حاول مجددًا."
            : "تعذّر الوصول إلى محرك أطلس الآن. لم تفقد رسالتك ويمكنك إعادة المحاولة."
          : code === "RATE_LIMIT"
            ? "Too many requests at once. Wait a moment and try again."
            : "Atlas could not reach its engine. Your message is safe; you can retry.",
      );
      setFailedPrompt(normalizedPrompt);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  }

  function resetConversation() {
    stopCurrentRequest();
    clearHistory();
    setError(null);
    setFailedPrompt(null);
    setActionFeedback({});
  }

  const messageByToolCall = useMemo(() => {
    return new Map<string, AgentMessageData>(
      visibleMessages.map((message) => [`atlas-result:${message.id}`, message] as const),
    );
  }, [visibleMessages]);

  const AtlasToolRenderer = useCallback((props: ToolRendererProps) => {
    if (props.part.type === ATLAS_RESULT_TOOL && props.part.toolCallId) {
      const message = messageByToolCall.get(props.part.toolCallId);
      if (!message) return null;
      return (
        <AgentMessageExtras
          message={message}
          locale={locale}
          compact={compact}
          actionFeedback={actionFeedback}
          onAction={(action, actionKey) => void executeAction(action, actionKey)}
        />
      );
    }
    return <DefaultToolRenderer {...props} />;
  }, [actionFeedback, compact, executeAction, locale, messageByToolCall]);

  const LocalizedInputBar = useCallback((props: InputBarProps) => (
    <InputBar
      {...props}
      autoFocus={autoFocus}
      sendLabel={locale === "ar" ? "إرسال الرسالة" : "Send message"}
      stopLabel={locale === "ar" ? "إيقاف التوليد" : "Stop generating"}
      placeholder={
        locale === "ar"
          ? "اطلب بحثًا، مقارنة، خطة أو إجراء…"
          : "Ask for a search, comparison, plan, or action…"
      }
      infoBar={{
        title: "Atlas Zero",
        description:
          locale === "ar"
            ? "بلا مفتاح؛ الويب لا يعمل إلا بطلبك أو عند تفعيله."
            : "Keyless; web runs only when requested or enabled.",
      }}
    />
  ), [autoFocus, locale]);

  const uiMessages = useMemo(() => {
    const mapped = visibleMessages.map(messageToUIMessage);
    if (
      isLoading &&
      runtime.state.phase === "generating" &&
      runtime.state.streamedText.trim()
    ) {
      mapped.push(messageToUIMessage({
        id: "atlas-local-stream",
        role: "assistant",
        content: runtime.state.streamedText,
        createdAt: new Date().toISOString(),
      }));
    }
    return mapped;
  }, [isLoading, runtime.state.phase, runtime.state.streamedText, visibleMessages]);

  const status: ChatStatus = isLoading
    ? runtime.state.phase === "generating" ? "streaming" : "submitted"
    : error ? "error" : "ready";
  const agentStyle = {
    "--an-max-width": compact ? "420px" : "680px",
    "--an-background": "transparent",
    "--an-background-secondary": "var(--muted)",
    "--an-background-tertiary": "var(--card)",
    "--an-foreground": "var(--foreground)",
    "--an-foreground-muted": "var(--muted-foreground)",
    "--an-border-color": "var(--border)",
    "--an-primary-color": "var(--primary)",
    "--an-user-message-bg": "var(--muted)",
    "--an-user-message-text": "var(--foreground)",
    "--an-input-background": "var(--card)",
    "--an-input-border-color": "var(--border)",
    "--an-input-color": "var(--foreground)",
    "--an-input-placeholder-color": "var(--muted-foreground)",
    "--an-send-button-bg": "var(--primary)",
    "--an-send-button-color": "var(--primary-foreground)",
    "--an-tool-background": "var(--card)",
    "--an-tool-border-color": "var(--border)",
    "--an-tool-color": "var(--foreground)",
    "--an-tool-color-muted": "var(--muted-foreground)",
  } as CSSProperties;
  const inputSuggestions = suggestions[locale].map((suggestion, index) => ({
    id: `${locale}-${index}`,
    label: suggestion,
    value: suggestion,
  }));
  const slots = {
    InputBar: LocalizedInputBar,
    ToolRenderer: AtlasToolRenderer,
  };

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background",
        compact
          ? "h-full"
          : "h-[min(760px,calc(100dvh-7rem))] min-h-[560px] rounded-xl border shadow-lg shadow-black/5",
        className,
      )}
      aria-label={locale === "ar" ? "محادثة وكيل أطلس" : "Atlas agent chat"}
    >
      <header className={cn("shrink-0 border-b bg-card/65 p-4", compact && "pe-14")}>
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Bot className="size-5" />
            <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-card bg-chart-2" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">
              {locale === "ar" ? "وكيل أطلس" : "Atlas Agent"}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {locale === "ar"
                ? "يفهم المكتبة، يبحث بموافقتك، وينفّذ داخل الموقع"
                : "Understands the library, researches with consent, and acts in-site"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {compact ? (
              <Button variant="ghost" size="icon-sm" className="size-9" asChild>
                <Link href="/agent" onClick={onNavigate} aria-label={locale === "ar" ? "فتح الصفحة الكاملة" : "Open full page"}>
                  <Maximize2 className="size-4" />
                </Link>
              </Button>
            ) : null}
            {messages.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-9 text-muted-foreground hover:text-destructive"
                onClick={resetConversation}
                aria-label={locale === "ar" ? "مسح المحادثة" : "Clear conversation"}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-[680px] flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <KeyRound className="size-3" />
            {modeLabel(latestMeta?.mode, locale)}
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <Wifi className="size-3 text-chart-2" />
            {locale === "ar" ? "فهرس متجدد" : "Live catalog"}
          </Badge>
          {latestMeta?.totalSkills ? (
            <span className="font-mono text-[0.68rem] text-muted-foreground">
              {latestMeta.totalSkills.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")} {locale === "ar" ? "مهارة" : "skills"}
            </span>
          ) : null}
        </div>
        <div className="mx-auto mt-3 w-full max-w-[680px]">
          <AgentRuntimeBar
            locale={locale}
            localBrain={runtime.state}
            webEnabled={runtime.webEnabled}
            compact={compact}
            onEnableLocal={() => void runtime.enable()}
            onDisableLocal={runtime.state.phase === "generating" ? () => { runtime.cancel(); } : runtime.disable}
            onToggleWeb={runtime.toggleWeb}
          />
        </div>
        {error ? (
          <div className="mx-auto mt-3 flex w-full max-w-[680px] items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-xs leading-5 text-destructive" role="alert">
            <WifiOff className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            {failedPrompt ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void requestReply(failedPrompt, false)}
              >
                <RefreshCw className="size-3" />
                {locale === "ar" ? "إعادة" : "Retry"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1" dir={locale === "ar" ? "rtl" : "ltr"}>
        <AgentElementsChat
          messages={uiMessages}
          onSend={({ content }) => void requestReply(content, true)}
          status={status}
          onStop={stopCurrentRequest}
          slots={slots}
          suggestions={inputSuggestions}
          emptyStatePosition="center"
          emptySuggestionsPlacement="input"
          showCopyToolbar
          className="h-full"
          style={agentStyle}
        />
      </div>

      <div className="sr-only" aria-live="polite">
        {Object.values(actionFeedback).at(-1) ?? ""}
      </div>
    </section>
  );
}
