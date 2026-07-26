"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { ThemeProvider } from "next-themes";
import { AgentRuntimeProvider } from "@/components/agent/agent-runtime-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { copy, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface LocaleContextValue {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const localeEvent = "skillatlas-locale-change";

function subscribeLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(localeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(localeEvent, onStoreChange);
  };
}

function getLocaleSnapshot(): Locale {
  const saved = window.localStorage.getItem("skillatlas-locale");
  return saved === "en" ? "en" : "ar";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    getLocaleSnapshot,
    (): Locale => "ar",
  );

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem("skillatlas-locale", nextLocale);
    window.dispatchEvent(new Event(localeEvent));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dictionary: copy[locale],
      setLocale,
      toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
    }),
    [locale, setLocale],
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LocaleContext.Provider value={value}>
        <AgentRuntimeProvider>
          <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        </AgentRuntimeProvider>
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside Providers");
  return value;
}
