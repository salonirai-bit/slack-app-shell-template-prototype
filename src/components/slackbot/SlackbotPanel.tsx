"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconStar,
  IconPencil,
  IconX,
  IconPlus,
  IconMoreVertical,
} from "@/components/icons";
import { SlackbotMessagesTab } from "./SlackbotMessagesTab";
import { MessageInput } from "@/components/shared/MessageInput";
import { cn } from "@/lib/utils";
import { SLACK_TOKENS } from "@/design/slack-tokens";
import { assetPath } from "@/lib/asset-path";
import { useDealRegistrationPrompt } from "@/context/DealRegistrationPromptContext";

const T = SLACK_TOKENS;

type TabId = "messages" | "history" | "files";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content?: string;
  blocks?: any[];
  timestamp: Date;
}

interface SlackbotPanelProps {
  onClose?: () => void;
  panelData?: any;
  history?: any[];
  onUpdateHistory?: (history: any[]) => void;
}

export function SlackbotPanel({ onClose, panelData, history = [], onUpdateHistory }: SlackbotPanelProps) {
  // Always default to Messages - generic 3-tab panel
  const [activeTab, setActiveTab] = useState<TabId>("messages");
  const { promptKey: dealRegistrationPromptKey, mdfRequestPromptKey } = useDealRegistrationPrompt();
  const prevAutomationKeysRef = useRef({ deal: 0, mdf: 0 });

  useEffect(() => {
    const prev = prevAutomationKeysRef.current;
    if (
      dealRegistrationPromptKey > prev.deal ||
      mdfRequestPromptKey > prev.mdf
    ) {
      setActiveTab("messages");
    }
    prevAutomationKeysRef.current = {
      deal: dealRegistrationPromptKey,
      mdf: mdfRequestPromptKey,
    };
  }, [dealRegistrationPromptKey, mdfRequestPromptKey]);

  // Ref to store sendMessage function from SlackbotMessagesTab
  const messagesTabSendRef = useRef<((message: string) => void) | null>(null);

  const handleChatSubmit = (message: string) => {
    // If Messages tab is active, call the sendMessage from SlackbotMessagesTab
    if (activeTab === "messages" && messagesTabSendRef.current) {
      messagesTabSendRef.current(message);
    } else {
      // Handle other tabs if needed
      console.log("Chat message:", message);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: T.colors.background,
        borderLeft: `1px solid ${T.colors.border}`,
        fontFamily: T.typography.fontFamily,
      }}
    >
      <div className="border-b shrink-0" style={{ borderColor: T.colors.border }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" className="p-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Favorite">
              <IconStar width={T.iconSizes.slackbotHeader} height={T.iconSizes.slackbotHeader} stroke="currentColor" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/slackbot-logo.svg")} alt="Slackbot" width={20} height={20} />
            <span className="font-semibold" style={{ fontSize: T.typography.body, color: T.colors.text }}>Slackbot</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button type="button" className="p-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Edit">
              <IconPencil width={T.iconSizes.slackbotHeader} height={T.iconSizes.slackbotHeader} stroke="currentColor" />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="More">
              <IconMoreVertical width={T.iconSizes.slackbotHeader} height={T.iconSizes.slackbotHeader} stroke="currentColor" />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Close" onClick={onClose}>
              <IconX width={T.iconSizes.slackbotHeader} height={T.iconSizes.slackbotHeader} stroke="currentColor" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b shrink-0" style={{ borderColor: T.colors.border }}>
        {/* TABS: Generic 3-tab panel - Messages, History, Files */}
        <button
          type="button"
          onClick={() => setActiveTab("messages")}
          className={cn(
            "px-3 py-2.5 font-medium transition-colors",
            activeTab === "messages" ? "border-b-2" : "hover:text-[#1d1c1d]"
          )}
          style={
            activeTab === "messages"
              ? {
                  color: "var(--shell-tab-active)",
                  borderBottomColor: "var(--shell-tab-active)",
                  fontSize: T.typography.small,
                }
              : { color: T.colors.textSecondary, fontSize: T.typography.small }
          }
        >
          Messages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-3 py-2.5 font-medium transition-colors",
            activeTab === "history" ? "border-b-2" : "hover:text-[#1d1c1d]"
          )}
          style={
            activeTab === "history"
              ? {
                  color: "var(--shell-tab-active)",
                  borderBottomColor: "var(--shell-tab-active)",
                  fontSize: T.typography.small,
                }
              : { color: T.colors.textSecondary, fontSize: T.typography.small }
          }
        >
          History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("files")}
          className={cn(
            "px-3 py-2.5 font-medium transition-colors",
            activeTab === "files" ? "border-b-2" : "hover:text-[#1d1c1d]"
          )}
          style={
            activeTab === "files"
              ? {
                  color: "var(--shell-tab-active)",
                  borderBottomColor: "var(--shell-tab-active)",
                  fontSize: T.typography.small,
                }
              : { color: T.colors.textSecondary, fontSize: T.typography.small }
          }
        >
          Files
        </button>
        <button type="button" className="p-2 hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Add">
          <IconPlus width={T.iconSizes.slackbotTab} height={T.iconSizes.slackbotTab} stroke="currentColor" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {activeTab === "messages" && (
          <SlackbotMessagesTab 
            history={history}
            onUpdateHistory={onUpdateHistory}
            onSendMessage={(sendFn) => { messagesTabSendRef.current = sendFn; }}
          />
        )}
        {(activeTab === "history" || activeTab === "files") && (
          <div className="p-4" style={{ fontSize: T.typography.small, color: T.colors.textSecondary }}>Coming soon.</div>
        )}
      </div>

      {/* Universal input style: use shared MessageInput directly */}
      <div className="shrink-0 border-t" style={{ borderColor: T.colors.border }}>
        <MessageInput
          placeholder="Message Slackbot..."
          onSendMessage={handleChatSubmit}
        />
      </div>
    </div>
  );
}
