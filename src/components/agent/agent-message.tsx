"use client";

import Link from "next/link";
import {
  ArrowUpLeft,
  ArrowUpRight,
  Bot,
  Check,
  Clipboard,
  Compass,
  ExternalLink,
  Heart,
  Search,
} from "lucide-react";
import {
  Message as AIMessage,
  MessageContent as AIMessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { AgentSources } from "@/components/agent/agent-sources";
import type {
  AgentAction,
  AgentMessage as AgentMessageData,
} from "@/components/agent/agent-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentMessageProps {
  message: AgentMessageData;
  locale: "ar" | "en";
  compact?: boolean;
  actionFeedback?: Record<string, string>;
  onAction: (action: AgentAction, actionKey: string) => void;
}

interface AgentMessageExtrasProps {
  message: AgentMessageData;
  locale: "ar" | "en";
  compact?: boolean;
  actionFeedback?: Record<string, string>;
  onAction: (action: AgentAction, actionKey: string) => void;
}

function actionIcon(type: AgentAction["type"]) {
  if (type === "favorite") return <Heart className="size-3.5" />;
  if (type === "copy") return <Clipboard className="size-3.5" />;
  if (type === "open_source") return <ExternalLink className="size-3.5" />;
  if (type === "search") return <Search className="size-3.5" />;
  return <Compass className="size-3.5" />;
}

export function AgentMessageExtras({
  message,
  locale,
  compact = false,
  actionFeedback = {},
  onAction,
}: AgentMessageExtrasProps) {
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;
  const visibleMatches = compact ? message.matches?.slice(0, 3) : message.matches;

  return (
    <>
      {visibleMatches && visibleMatches.length > 0 ? (
        <div
          className="mt-3 grid gap-2"
          aria-label={locale === "ar" ? "المهارات المقترحة" : "Suggested skills"}
        >
          {visibleMatches.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${encodeURIComponent(skill.slug)}`}
              className="group flex min-h-16 items-center gap-3 rounded-xl border bg-background/80 p-3 outline-none transition-colors hover:border-primary/40 hover:bg-accent/35 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Compass className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" dir="auto">
                  {skill.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground" dir="auto">
                  {skill.category}
                </span>
              </span>
              <Arrow className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
            </Link>
          ))}
          {compact && (message.matches?.length ?? 0) > 3 ? (
            <Badge variant="secondary" className="justify-self-start">
              {locale === "ar"
                ? `+${(message.matches?.length ?? 0) - 3} نتائج أخرى`
                : `+${(message.matches?.length ?? 0) - 3} more results`}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {message.sources && message.sources.length > 0 ? (
        <AgentSources sources={message.sources} locale={locale} compact={compact} />
      ) : null}

      {message.actions && message.actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.actions.map((action, index) => {
            const actionKey = `${message.id}:${index}`;
            const feedback = actionFeedback[actionKey];

            return (
              <Button
                key={actionKey}
                type="button"
                variant="outline"
                size="sm"
                className="min-h-8 max-w-full gap-1.5 bg-background"
                onClick={() => onAction(action, actionKey)}
                aria-label={action.label}
              >
                {feedback ? <Check className="size-3.5 text-chart-2" /> : actionIcon(action.type)}
                <span className="truncate">{feedback ?? action.label}</span>
              </Button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

export function AgentMessage({
  message,
  locale,
  compact = false,
  actionFeedback = {},
  onAction,
}: AgentMessageProps) {
  const isUser = message.role === "user";
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(message.createdAt));

  return (
    <article
      className="w-full"
      aria-label={
        locale === "ar"
          ? isUser
            ? "رسالتك"
            : "رد وكيل أطلس"
          : isUser
            ? "Your message"
            : "Atlas agent response"
      }
    >
      <AIMessage
        from={message.role}
        className={cn(
          "max-w-full",
          isUser ? "ml-auto mr-0 w-fit items-end" : "w-full items-start",
        )}
      >
        {!isUser ? (
          <div className="mb-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="flex size-6 items-center justify-center rounded-lg border bg-card text-primary" aria-hidden="true">
              <Bot className="size-3.5" />
            </span>
            Atlas Zero
          </div>
        ) : null}

        <AIMessageContent
          className={cn(
            isUser
              ? "max-w-[82%] rounded-2xl rounded-ee-sm bg-muted px-3.5 py-2.5 text-foreground shadow-none group-[.is-user]:bg-muted group-[.is-user]:px-3.5 group-[.is-user]:py-2.5"
              : "w-full bg-transparent p-0 text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-6" dir="auto">
              {message.content}
            </p>
          ) : (
            <MessageResponse className="text-sm leading-7" dir="auto">
              {message.content}
            </MessageResponse>
          )}
          <time
            dateTime={message.createdAt}
            className={cn(
              "mt-2 block font-mono text-[0.65rem]",
              "text-muted-foreground",
            )}
          >
            {time}
          </time>
        </AIMessageContent>

        {!isUser ? (
          <AgentMessageExtras
            message={message}
            locale={locale}
            compact={compact}
            actionFeedback={actionFeedback}
            onAction={onAction}
          />
        ) : null}
      </AIMessage>
    </article>
  );
}
