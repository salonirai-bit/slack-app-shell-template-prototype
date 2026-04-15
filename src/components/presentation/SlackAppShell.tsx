"use client";

import { useState, useRef, ReactNode, useEffect, useCallback, createContext, useContext } from "react";
import { SLACK_TOKENS } from "@/design/slack-tokens";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AppHeader } from "@/app/(demo)/demo/workspace/[workspaceId]/_components/AppHeader";
import { DemoIconBar } from "@/app/(demo)/demo/workspace/[workspaceId]/_components/DemoIconBar";
import { DemoSidebar } from "@/app/(demo)/demo/workspace/[workspaceId]/_components/DemoSidebar";
import { SlackbotPanel } from "@/components/slackbot/SlackbotPanel";
import {
  DemoLayoutProviders,
  type NavView,
  type DemoContext,
} from "@/app/(demo)/demo/workspace/[workspaceId]/_context/demo-layout-context";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DealRegistrationPromptProvider } from "@/context/DealRegistrationPromptContext";

const T = SLACK_TOKENS;

// -----------------------------------------------------------
// ActiveChatContext — lets sidebar clicks flow into children
// -----------------------------------------------------------
const ActiveChatContext = createContext<{
  activeChatId: string;
  setActiveChatId: (id: string) => void;
}>({
  activeChatId: "",
  setActiveChatId: () => {},
});

export const useActiveChat = () => useContext(ActiveChatContext);

// -----------------------------------------------------------
// Props
// -----------------------------------------------------------
export interface SlackAppShellProps {
  /** The concept's entire content. The shell never inspects it. */
  children: ReactNode;

  /** Current active nav item — controlled by the Concept. */
  activeNavId: NavView;
  onNavChange: (id: NavView) => void;

  /**
   * When true  → renders DemoSidebar + children in the chat column.
   * When false → children fills the full width (e.g. Today, Activity, Sales views).
   */
  showSidebar?: boolean;

  /**
   * Custom slackbot panel content injected by the Concept.
   * Falsy → default <SlackbotPanel />.
   */
  botPayload?: ReactNode;

  /** Controlled open state for the slackbot panel. */
  forceSlackbotOpen?: boolean;
  onSlackbotToggle?: (isOpen: boolean) => void;

  demoContext?: DemoContext;

  /** Currently-selected chat/DM id — surfaced via ActiveChatContext. */
  activeChatId?: string;
  onChatChange?: (id: string) => void;

  showDMBadge?: boolean;

  /** Passed to DemoIconBar so primary-nav clicks can be intercepted by the Concept. */
  onPrimaryNavChange?: (nav: "activity" | "dms") => void;

  /** Props passed to DemoSidebar for DM selection (used by GlobalDMsView) */
  sidebarActiveDmId?: string;
  sidebarOnDmSelect?: (id: string) => void;
  sidebarOverrideDms?: import('@/context/DemoDataContext').DemoDM[];
  sidebarOverrideChannels?: import('@/context/DemoDataContext').DemoChannel[];
  sidebarApps?: Array<{ id: string; name: string; icon: string }>;
  topViewMode?: "admin" | "channel-manager" | "seller";
}

// -----------------------------------------------------------
// SlackAppShell — the Platform
// -----------------------------------------------------------
export function SlackAppShell({
  children,
  activeNavId,
  onNavChange,
  showSidebar = false,
  botPayload,
  forceSlackbotOpen = false,
  onSlackbotToggle,
  demoContext = "OTHER",
  activeChatId,
  onChatChange,
  showDMBadge = false,
  onPrimaryNavChange,
  sidebarActiveDmId,
  sidebarOnDmSelect,
  sidebarOverrideDms,
  sidebarOverrideChannels,
  sidebarApps,
  topViewMode = "channel-manager",
}: SlackAppShellProps) {
  const [isSlackbotOpen, setIsSlackbotOpen] = useState(forceSlackbotOpen);
  const [dealRegistrationPromptKey, setDealRegistrationPromptKey] = useState(0);
  const [dealRegistrationDeliveredKey, setDealRegistrationDeliveredKey] = useState(0);
  const [mdfRequestPromptKey, setMdfRequestPromptKey] = useState(0);
  const [mdfRequestDeliveredKey, setMdfRequestDeliveredKey] = useState(0);

  // Keep open-state in sync with the Concept's forceSlackbotOpen prop
  const prevForceRef = useRef(forceSlackbotOpen);
  useEffect(() => {
    if (forceSlackbotOpen !== prevForceRef.current) {
      prevForceRef.current = forceSlackbotOpen;
      setIsSlackbotOpen(forceSlackbotOpen);
    }
  }, [forceSlackbotOpen]);

  const handleSetSlackbotOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(isSlackbotOpen) : value;
    setIsSlackbotOpen(next);
    onSlackbotToggle?.(next);
  };

  const requestRegisterDealPrompt = useCallback(() => {
    setIsSlackbotOpen(true);
    onSlackbotToggle?.(true);
    setDealRegistrationPromptKey((k) => k + 1);
  }, [onSlackbotToggle]);

  const markDealPromptDelivered = useCallback((key: number) => {
    setDealRegistrationDeliveredKey((prev) => (key > prev ? key : prev));
  }, []);

  const requestMdfRequestPrompt = useCallback(() => {
    setIsSlackbotOpen(true);
    onSlackbotToggle?.(true);
    setMdfRequestPromptKey((k) => k + 1);
  }, [onSlackbotToggle]);

  const markMdfRequestPromptDelivered = useCallback((key: number) => {
    setMdfRequestDeliveredKey((prev) => (key > prev ? key : prev));
  }, []);

  // Resolve bot panel: concept-supplied content or default
  const botPanel = botPayload ?? (
    <SlackbotPanel
      onClose={() => setIsSlackbotOpen(false)}
    />
  );

  return (
    <ActiveChatContext.Provider
      value={{ activeChatId: activeChatId || "", setActiveChatId: onChatChange ?? (() => {}) }}
    >
      <DealRegistrationPromptProvider
        value={{
          promptKey: dealRegistrationPromptKey,
          deliveredPromptKey: dealRegistrationDeliveredKey,
          markDealPromptDelivered,
          requestRegisterDealPrompt,
          mdfRequestPromptKey,
          mdfRequestDeliveredKey,
          markMdfRequestPromptDelivered,
          requestMdfRequestPrompt,
        }}
      >
      <DemoLayoutProviders
        isSlackbotOpen={isSlackbotOpen}
        setIsSlackbotOpen={handleSetSlackbotOpen}
        activeNav={activeNavId}
        setActiveNav={onNavChange}
        demoContext={demoContext}
        isPresentationMode={true}
      >
        <div
          className={cn(
            "slack-shell h-full w-full flex flex-col min-h-0 overflow-hidden relative",
            topViewMode === "seller" && "partner-shell"
          )}
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Lato", sans-serif',
            backgroundColor:
              topViewMode === "seller" ? "#000000" : T.colors.globalBg,
          }}
        >
          {/* ── Top header ── */}
          <div className="slack-app-header relative shrink-0 w-full z-[100]">
            <AppHeader topViewMode={topViewMode} />
          </div>

          {/* ── Body ── */}
          <div
            className="slack-body flex-1 flex min-h-0 min-w-0 overflow-hidden"
            style={{ gap: 2 }}
          >
            {/* Left nav rail — unchanged interactions */}
            <DemoIconBar
              onPrimaryNavChange={onPrimaryNavChange}
              onNavChange={onNavChange}
              showDMBadge={showDMBadge}
              topViewMode={topViewMode}
            />

            {showSidebar ? (
              /* ── Sidebar + chat column layout (DMs / channels) ── */
              isSlackbotOpen ? (
                <ResizablePanelGroup
                  direction="horizontal"
                  autoSaveId="slack-app-shell-layout"
                  className="flex-1 min-w-0"
                >
                  <ResizablePanel
                    minSize={20}
                    defaultSize={55}
                    className="overflow-visible"
                  >
                    <div
                      className="h-full flex overflow-hidden"
                      style={{
                        borderRadius: 24,
                        boxShadow:
                          "-6px 0 24px -4px rgba(0, 0, 0, 0.2), -2px 0 10px -2px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      <DemoSidebar 
                        activeDmId={sidebarActiveDmId}
                        onDmSelect={sidebarOnDmSelect}
                        overrideDms={sidebarOverrideDms}
                        overrideChannels={sidebarOverrideChannels}
                        sidebarApps={sidebarApps}
                        topViewMode={topViewMode}
                      />
                      <div
                        className="flex-1 min-w-0 bg-white overflow-hidden pointer-events-auto"
                        style={{ pointerEvents: "auto" }}
                      >
                        {children}
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle
                    withHandle={false}
                    className="!w-[6px] shrink-0 !bg-transparent border-0 cursor-col-resize focus-visible:ring-0"
                  />

                  <ResizablePanel
                    minSize={22}
                    defaultSize={25}
                    className="overflow-visible"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full overflow-hidden"
                      style={{
                        borderRadius: 24,
                        boxShadow:
                          "-6px 0 24px -4px rgba(0, 0, 0, 0.18), -2px 0 10px -2px rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      {botPanel}
                    </motion.div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <div className="flex-1 min-w-0 overflow-visible">
                  <div
                    className="h-full flex overflow-hidden"
                    style={{
                      borderRadius: 24,
                      boxShadow:
                        "-6px 0 24px -4px rgba(0, 0, 0, 0.2), -2px 0 10px -2px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <DemoSidebar 
                      activeDmId={sidebarActiveDmId}
                      onDmSelect={sidebarOnDmSelect}
                      overrideDms={sidebarOverrideDms}
                      overrideChannels={sidebarOverrideChannels}
                      sidebarApps={sidebarApps}
                      topViewMode={topViewMode}
                    />
                    <div
                      className="flex-1 min-w-0 bg-white overflow-hidden pointer-events-auto"
                      style={{ pointerEvents: "auto" }}
                    >
                      {children}
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* ── Full-width layout (Today / Activity / Sales / Home views) ── */
              isSlackbotOpen ? (
                <ResizablePanelGroup
                  direction="horizontal"
                  autoSaveId="slack-app-shell-layout-fullwidth"
                  className="flex-1 min-w-0 min-h-0 h-full"
                >
                  <ResizablePanel
                    minSize={30}
                    defaultSize={75}
                    className="overflow-visible min-h-0 h-full"
                  >
                    <div className="flex-1 min-w-0 min-h-0 h-full overflow-visible">
                      <div
                        className="h-full min-h-0 overflow-hidden"
                        style={{
                          borderRadius: 24,
                          boxShadow:
                            "-6px 0 24px -4px rgba(0, 0, 0, 0.2), -2px 0 10px -2px rgba(0, 0, 0, 0.15)",
                        }}
                      >
                        {children}
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle
                    withHandle={false}
                    className="!w-[6px] shrink-0 !bg-transparent border-0 cursor-col-resize focus-visible:ring-0"
                  />

                  <ResizablePanel
                    minSize={22}
                    defaultSize={25}
                    className="overflow-visible min-h-0 h-full"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="h-full min-h-0 overflow-hidden"
                      style={{
                        borderRadius: 24,
                        boxShadow:
                          "-6px 0 24px -4px rgba(0, 0, 0, 0.18), -2px 0 10px -2px rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      {botPanel}
                    </motion.div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <div className="flex-1 min-w-0 overflow-visible">
                  <div
                    className="h-full overflow-hidden"
                    style={{
                      borderRadius: 24,
                      boxShadow:
                        "-6px 0 24px -4px rgba(0, 0, 0, 0.2), -2px 0 10px -2px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {children}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </DemoLayoutProviders>
      </DealRegistrationPromptProvider>
    </ActiveChatContext.Provider>
  );
}
