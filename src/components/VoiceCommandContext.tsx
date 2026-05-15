"use client";

import React, { createContext, useContext, useRef, useCallback } from "react";

interface VoiceContextActions {
  onGenerate?: () => void;
  onSave?: () => void;
  onOpenRevision?: () => void;
}

interface VoiceCommandContextType {
  registerActions: (actions: VoiceContextActions) => void;
  unregisterActions: () => void;
  getActions: () => VoiceContextActions;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | null>(null);

export function VoiceCommandProvider({ children }: { children: React.ReactNode }) {
  const actionsRef = useRef<VoiceContextActions>({});

  const registerActions = useCallback((actions: VoiceContextActions) => {
    actionsRef.current = actions;
  }, []);

  const unregisterActions = useCallback(() => {
    actionsRef.current = {};
  }, []);

  const getActions = useCallback(() => actionsRef.current, []);

  return (
    <VoiceCommandContext.Provider value={{ registerActions, unregisterActions, getActions }}>
      {children}
    </VoiceCommandContext.Provider>
  );
}

export function useVoiceCommandContext() {
  const ctx = useContext(VoiceCommandContext);
  if (!ctx) throw new Error("useVoiceCommandContext must be used inside VoiceCommandProvider");
  return ctx;
}
