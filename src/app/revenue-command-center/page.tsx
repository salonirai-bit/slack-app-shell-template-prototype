"use client";

import { useCallback, useState } from "react";
import { SlackAppShell } from "@/components/presentation/SlackAppShell";
import { TemplateRevenueCommandCenter } from "@/components/presentation/TemplateViews";
import type { NavView } from "@/app/(demo)/demo/workspace/[workspaceId]/_context/demo-layout-context";

export default function RevenueCommandCenterPage() {
  const [activeNavId, setActiveNavId] = useState<NavView>("more");

  const handleNavChange = useCallback((nav: NavView) => {
    setActiveNavId(nav);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <SlackAppShell
        activeNavId={activeNavId}
        onNavChange={handleNavChange}
        showSidebar={false}
      >
        <TemplateRevenueCommandCenter />
      </SlackAppShell>
    </div>
  );
}
