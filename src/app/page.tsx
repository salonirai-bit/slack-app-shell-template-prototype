"use client";

import { useState, useCallback } from "react";
import { SlackAppShell } from "@/components/presentation/SlackAppShell";
import { GlobalDMsView, GENERIC_GLOBAL_DMS } from "@/components/presentation/GlobalDMsView";
import { SlackTodayView } from "@/components/presentation/SlackTodayView";
import {
  TemplateChatContent,
  TemplateFilesView,
  TemplateAgentforceContent,
  TemplateRevenueCommandCenter,
  TemplateLeadsView,
  TemplatePartnerLeadsView,
  TemplatePartnerContactsView,
  TemplatePartnerOpportunityView,
  TemplatePartnerAccountsView,
  TemplatePartnerMdfView,
  TemplatePartnerCampaignsView,
} from "@/components/presentation/TemplateViews";
import type { NavView } from "@/app/(demo)/demo/workspace/[workspaceId]/_context/demo-layout-context";
import { cn } from "@/lib/utils";

const DEFAULT_CHAT: Record<string, string> = {
  home: "general",
  activity: "deal-acme",
  later: "deal-greentech",
  agentforce: "af-employee",
};

export default function Home() {
  const [activeTopView, setActiveTopView] = useState<"admin" | "channel-manager" | "seller">("admin");
  const [activeNavId, setActiveNavId] = useState<NavView>("today");
  const [activeDmId, setActiveDmId] = useState<string | undefined>(undefined);
  const [activeChatId, setActiveChatId] = useState<string>("");

  const handleNavChange = useCallback((nav: NavView) => {
    setActiveNavId(nav);
    setActiveChatId(DEFAULT_CHAT[nav] ?? "");
  }, []);

  const handleChatChange = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const fullWidthViews: NavView[] = ["today"];
  const showSidebar = !fullWidthViews.includes(activeNavId);

  const effectiveChatId = activeChatId || DEFAULT_CHAT[activeNavId] || "";

  const renderContent = () => {
    switch (activeNavId) {
      case "today":
        return (
          <SlackTodayView
            onNavigateToActivity={() => handleNavChange("activity")}
            topViewMode={activeTopView}
          />
        );
      case "home":
        if (effectiveChatId === "partner-leads") {
          return <TemplateLeadsView />;
        }
        if (effectiveChatId === "partner-contacts") {
          return <TemplatePartnerContactsView />;
        }
        if (effectiveChatId === "partner-marketing") {
          return <TemplatePartnerLeadsView />;
        }
        if (effectiveChatId === "partner-opportunities") {
          return <TemplatePartnerOpportunityView />;
        }
        if (effectiveChatId === "partner-accounts") {
          return <TemplatePartnerAccountsView />;
        }
        if (effectiveChatId === "partner-mdf") {
          return <TemplatePartnerMdfView />;
        }
        if (effectiveChatId === "partner-campaigns") {
          return <TemplatePartnerCampaignsView />;
        }
        return <TemplateChatContent activeChatId={effectiveChatId} channelName="#general" />;
      case "dms":
        return (
          <GlobalDMsView
            activeDmId={activeDmId}
            onDmSelect={setActiveDmId}
            dms={GENERIC_GLOBAL_DMS}
          />
        );
      case "activity":
        return <TemplateChatContent activeChatId={effectiveChatId} channelName="#deal-acme" />;
      case "files":
        return <TemplateFilesView />;
      case "later":
        return <TemplateChatContent activeChatId={effectiveChatId} channelName="#deal-greentech" />;
      case "agentforce":
        return <TemplateChatContent activeChatId={effectiveChatId} />;
      case "more":
        return <TemplateRevenueCommandCenter />;
      case "sales":
        return <TemplateRevenueCommandCenter />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-white h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Blank Slack Canvas</h1>
              <p className="text-sm text-gray-500">Ready for your new concept.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col w-screen h-screen overflow-hidden",
        activeTopView === "seller" && "partner-chrome"
      )}
    >
      <div className="h-12 shrink-0 bg-[#1f1f23] border-b border-white/10 px-4 flex items-center">
        <div className="inline-flex items-center rounded-md bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setActiveTopView("admin")}
            className={cn(
              "px-3 py-1.5 text-[13px] rounded-md transition-colors",
              activeTopView === "admin"
                ? "bg-[var(--shell-cta)] text-white font-semibold"
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setActiveTopView("channel-manager")}
            className={cn(
              "px-3 py-1.5 text-[13px] rounded-md transition-colors",
              activeTopView === "channel-manager"
                ? "bg-[var(--shell-cta)] text-white font-semibold"
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            Channel Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTopView("seller")}
            className={cn(
              "px-3 py-1.5 text-[13px] rounded-md transition-colors",
              activeTopView === "seller"
                ? "bg-[var(--shell-cta)] text-white font-semibold"
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            Partner View
          </button>
        </div>
      </div>

      {activeTopView === "admin" ? (
        <div className="flex-1 min-h-0 bg-[#0f1115] p-3">
          <iframe
            title="Salesforce Go Admin View"
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/salesforce-go/admin-clean.html`}
            className="w-full h-full rounded-xl border border-white/10 bg-white"
          />
        </div>
      ) : (
        <SlackAppShell
          activeNavId={activeNavId}
          onNavChange={handleNavChange}
          showSidebar={showSidebar}
        topViewMode={activeTopView}
          activeChatId={activeChatId}
          onChatChange={handleChatChange}
          sidebarActiveDmId={activeNavId === "dms" ? activeDmId : undefined}
          sidebarOnDmSelect={activeNavId === "dms" ? setActiveDmId : undefined}
          sidebarOverrideDms={activeNavId === "dms" ? GENERIC_GLOBAL_DMS : undefined}
        >
          {renderContent()}
        </SlackAppShell>
      )}
    </div>
  );
}
