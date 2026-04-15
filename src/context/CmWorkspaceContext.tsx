"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/** Channel Manager Slack workspaces — isolated demo state per id. */
export type CmWorkspaceId = "salesforce-partners" | "salesforce-internal";

export const CM_WORKSPACE_OPTIONS: {
  id: CmWorkspaceId;
  label: string;
  subtitle: string;
}[] = [
  {
    id: "salesforce-partners",
    label: "Salesforce Partners",
    subtitle: "Partner programs & co-sell",
  },
  {
    id: "salesforce-internal",
    label: "Salesforce Internal",
    subtitle: "General company workspace",
  },
];

export function getCmWorkspaceLabel(id: CmWorkspaceId): string {
  return CM_WORKSPACE_OPTIONS.find((w) => w.id === id)?.label ?? id;
}

type CmWorkspaceContextValue = {
  activeWorkspaceId: CmWorkspaceId;
  setActiveWorkspaceId: (id: CmWorkspaceId) => void;
};

const CmWorkspaceContext = createContext<CmWorkspaceContextValue | null>(null);

export function CmWorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<CmWorkspaceId>("salesforce-partners");

  return (
    <CmWorkspaceContext.Provider
      value={{ activeWorkspaceId, setActiveWorkspaceId }}
    >
      {children}
    </CmWorkspaceContext.Provider>
  );
}

export function useCmWorkspace(): CmWorkspaceContextValue {
  const ctx = useContext(CmWorkspaceContext);
  if (!ctx) {
    throw new Error("useCmWorkspace must be used within CmWorkspaceProvider");
  }
  return ctx;
}
