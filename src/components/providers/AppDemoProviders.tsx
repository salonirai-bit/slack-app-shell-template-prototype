"use client";

import { CmWorkspaceProvider } from "@/context/CmWorkspaceContext";
import { DemoDataProvider } from "@/context/DemoDataContext";

/**
 * Wraps channel-manager workspace scope (CmWorkspace) outside demo data so
 * DemoDataProvider can key mutable state per workspace.
 */
export function AppDemoProviders({ children }: { children: React.ReactNode }) {
  return (
    <CmWorkspaceProvider>
      <DemoDataProvider>{children}</DemoDataProvider>
    </CmWorkspaceProvider>
  );
}
