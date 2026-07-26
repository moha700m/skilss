"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useLocalBrain } from "@/components/agent/use-local-brain";

type LocalBrainRuntime = ReturnType<typeof useLocalBrain>;

interface AgentRuntimeContextValue extends LocalBrainRuntime {
  webEnabled: boolean;
  setWebEnabled: (enabled: boolean) => void;
  toggleWeb: () => void;
}

const AgentRuntimeContext = createContext<AgentRuntimeContextValue | null>(null);

export function AgentRuntimeProvider({ children }: { children: React.ReactNode }) {
  const localBrain = useLocalBrain();
  const [webEnabled, setWebEnabled] = useState(false);
  const toggleWeb = useCallback(() => setWebEnabled((enabled) => !enabled), []);
  const value = useMemo(
    () => ({ ...localBrain, webEnabled, setWebEnabled, toggleWeb }),
    [localBrain, webEnabled, toggleWeb],
  );

  return (
    <AgentRuntimeContext.Provider value={value}>
      {children}
    </AgentRuntimeContext.Provider>
  );
}

export function useAgentRuntime() {
  const value = useContext(AgentRuntimeContext);
  if (!value) throw new Error("useAgentRuntime must be used inside AgentRuntimeProvider");
  return value;
}
