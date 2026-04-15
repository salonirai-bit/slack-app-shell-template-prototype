"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  IconHome,
  IconPencil,
  IconSearch,
  IconLightbulb,
  IconPlus,
} from "@/components/icons";
import type { SlackBlock } from "@/components/block-kit/BlockKitRenderer";
import { DEMO_USER_NAME } from "@/context/DemoDataContext";
import { SLACK_TOKENS } from "@/design/slack-tokens";
import { ChatMessage as GlobalChatMessage } from "@/components/shared/ChatMessage";
import { assetPath } from "@/lib/asset-path";
import { useDealRegistrationPrompt } from "@/context/DealRegistrationPromptContext";
import {
  buildDealRegistrationAskMoreBlocks,
  buildDealRegistrationJourneyBlocks,
  buildDealRegistrationSubmittedBlocks,
  computeDealRegistrationGaps,
  dealRegistrationCompletenessPct,
  fieldsFromSnippets,
} from "@/lib/dealRegistrationJourney";
import {
  buildMdfRecommendationBlocks,
  buildMdfSubmittedBlocks,
  MDF_RECOMMENDATION_SUMMARY,
  MDF_SUBMITTED_SUMMARY,
} from "@/lib/mdfRequestJourney";

const T = SLACK_TOKENS;

const PILL_ACTIONS = [
  { id: "discover", label: "Discover", icon: IconHome, query: "What would it take to close the gap?" },
  { id: "create", label: "Create", icon: IconPencil, query: "Prep me for my TechStart meeting" },
  { id: "find", label: "Find", icon: IconSearch, query: "Tell me about Acme Corp" },
  { id: "brainstorm", label: "Brainstorm", icon: IconLightbulb, query: "What's my risk today?" },
];

const RESPONSE_BLOCKS: Record<string, SlackBlock[]> = {
  "acme": [
    { type: "header", text: { type: "plain_text", text: "Acme Corp — Enterprise Platform", emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Amount:*\n$200,000" },
        { type: "mrkdwn", text: "*Stage:*\nNegotiation" },
        { type: "mrkdwn", text: "*Champion:*\nMarcus Lee (departed)" },
        { type: "mrkdwn", text: "*Commission at risk:*\n~$14,000" },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Marcus Lee left Acme in the last 48 hours. I've identified *Priya Shah* (via Sarah Chen) and *Daniel Kim* (VP Procurement, attended your Q1 webinar) as potential new champions. Intro draft ready for review.",
      },
    },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "Review draft", emoji: true }, action_id: "review", style: "primary" },
        { type: "button", text: { type: "plain_text", text: "Dismiss", emoji: true }, action_id: "dismiss" },
      ],
    },
  ],
  "runners club": [
    { type: "header", text: { type: "plain_text", text: "Runners Club — Summer Collection", emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Amount:*\n$720,000" },
        { type: "mrkdwn", text: "*Stage:*\nClosed Won → reopened" },
        { type: "mrkdwn", text: "*Champion:*\nLisa Park" },
        { type: "mrkdwn", text: "*Signal:*\nCFO Jordan Hayes asked about ROI" },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "CFO joined last call unexpectedly. Value justification deck drafted — addresses Jordan's specific ROI questions. Review and send?",
      },
    },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "Review draft", emoji: true }, action_id: "review", style: "primary" },
        { type: "button", text: { type: "plain_text", text: "Dismiss", emoji: true }, action_id: "dismiss" },
      ],
    },
  ],
  "close the gap": [
    { type: "header", text: { type: "plain_text", text: "Closing the gap", emoji: true } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Your gap is about *$90K*. To close it in 48 days you'd need:\n• ~$135K more in qualified pipeline\n• ~5 meetings/week\n\nFocus on: (1) Runners Club value justification, (2) Sporty Nation alternate stakeholder, (3) Acme recovery outreach.",
      },
    },
  ],
  "risk today": [
    { type: "header", text: { type: "plain_text", text: "Your risk today", emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Deal at risk*\nAcme Corp ($200K) — champion departed" },
        { type: "mrkdwn", text: "*Meeting prep*\nTechStart QBR at 2 PM" },
        { type: "mrkdwn", text: "*Overdue*\n3 follow-ups" },
      ],
    },
  ],
  "techstart": [
    { type: "header", text: { type: "plain_text", text: "TechStart QBR — 2:00 PM today", emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Champion:*\nSarah Chen (active)" },
        { type: "mrkdwn", text: "*Deal:*\n$95K, Proposal, Commit" },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Talking points: QBR recap, expansion options, timeline to close. I've drafted a brief — want me to surface it?",
      },
    },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "View brief", emoji: true }, action_id: "view_brief", style: "primary" },
      ],
    },
  ],
  "follow-up": [
    { type: "header", text: { type: "plain_text", text: "Overdue follow-ups", emoji: true } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "You have *3 overdue follow-ups*; oldest 9 days. Meridian Health (James Rivera) and Greentech (Priya Shah) are good candidates — both have had 7–8 days since last touch.",
      },
    },
    {
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "Draft batch", emoji: true }, action_id: "draft", style: "primary" },
        { type: "button", text: { type: "plain_text", text: "Later", emoji: true }, action_id: "later" },
      ],
    },
  ],
  "greentech": [
    { type: "header", text: { type: "plain_text", text: "Greentech — SaaS Expansion", emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Amount:*\n$60,000" },
        { type: "mrkdwn", text: "*Stage:*\nProposal" },
        { type: "mrkdwn", text: "*Champion:*\nPriya Shah (active)" },
        { type: "mrkdwn", text: "*Confidence:*\n78%" },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Priya said 'just send me the SOW and I'll get it signed this week' on last call. SOW draft ready for review.",
      },
    },
  ],
  "sporty nation": [
    { type: "header", text: { type: "plain_text", text: "Sporty Nation — Back to School Promo", emoji: true } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Amount:*\n$270,000" },
        { type: "mrkdwn", text: "*Stage:*\nClosed Lost" },
        { type: "mrkdwn", text: "*Champion:*\nDana Torres (silent 14 days)" },
        { type: "mrkdwn", text: "*Signal:*\nProposal viewed 14x, no reply" },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Company doing layoffs — procurement likely frozen. I've identified 2 alternate stakeholders. Intro approach drafted.",
      },
    },
  ],
};

function getResponseBlocks(query: string): SlackBlock[] {
  const lower = query.toLowerCase();
  for (const [key, blocks] of Object.entries(RESPONSE_BLOCKS)) {
    if (lower.includes(key)) return blocks;
  }
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "I can help with: deal summaries, gap analysis, meeting prep, and follow-up drafts. Try one of the suggested actions.",
      },
    },
  ];
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content?: string;
  blocks?: SlackBlock[];
  timestamp: Date;
}

const USER_AVATAR = "https://randomuser.me/api/portraits/med/women/90.jpg";
const SLACKBOT_AVATAR = assetPath("/slackbot-logo.svg");

/** Plain fallback when history is serialized; main UI uses `DEAL_REGISTRATION_PROMPT_BLOCKS`. */
const DEAL_REGISTRATION_PROMPT_SUMMARY =
  "Register a deal: share what you know in a message, or attach documents for the registration.";

const DEAL_REGISTRATION_PROMPT_BLOCKS: SlackBlock[] = [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "*Let's register this deal*\n\n" +
        "• *Tell me in your own words* — account, deal name, amount, stage, close date, partner, stakeholders, risks, next steps… whatever you have.\n" +
        "• *Or upload files* — SOWs, briefs, notes, spreadsheets; anything that should live on the registration.\n\n" +
        "_I'll organize it into a clean summary you can review and submit._",
    },
  },
];

const DEAL_REGISTERED_SUMMARY =
  "Deal registration submitted to your channel manager.";

type DealRegFlow =
  | { kind: "idle" }
  | {
      kind: "active";
      snippets: string[];
      /** True after we’ve shown the running summary and asked “more or ready?” */
      awaitingDecision: boolean;
    };

type MdfRequestFlow = { kind: "idle" } | { kind: "awaiting_submit" };

function wantsToSubmit(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length > 160) return false;
  if (/^yes[\s!.]*$/i.test(t)) return true;
  return (
    /^(yes,?\s*)?(i'?m\s+)?(ready|submit|that'?s all|that is all|done|no more|nothing else|go ahead|send it|finalize|register(\s+it)?|looks good|all set|that works)[\s!.]*$/i.test(
      t
    ) || /^(i'?m\s+)?ready(\s+to\s+(submit|register))?[\s!.]*$/i.test(t)
  );
}

function wantsMoreOnly(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length > 100) return false;
  return /^(more|add more|not yet|keep going|more details|another detail|i have more)[\s!.?]*$/i.test(t);
}

function dealRegDraftSummary(snippets: string[], completeness: number): string {
  return `Deal registration draft (${completeness}% parsed) · ${snippets.length} note${snippets.length === 1 ? "" : "s"}`;
}

interface SlackbotMessagesTabProps {
  history?: ChatMessage[];
  onUpdateHistory?: (history: ChatMessage[]) => void;
  onSendMessage?: (sendFn: (message: string) => void) => void;
}

export function SlackbotMessagesTab({ history = [], onUpdateHistory, onSendMessage }: SlackbotMessagesTabProps) {
  const {
    promptKey: dealRegistrationPromptKey,
    deliveredPromptKey: dealRegistrationDeliveredKey,
    markDealPromptDelivered,
    mdfRequestPromptKey,
    mdfRequestDeliveredKey,
    markMdfRequestPromptDelivered,
  } = useDealRegistrationPrompt();
  const [messages, setMessages] = useState<ChatMessage[]>(history);
  const [isTyping, setIsTyping] = useState(false);
  const prevHistoryRef = useRef<string>(JSON.stringify(history));
  const historyLengthRef = useRef<number>(history.length);
  /** Prevents duplicate appends when Strict Mode runs the effect twice before `deliveredPromptKey` updates. */
  const lastAppendedDealRegistrationKeyRef = useRef(0);
  const lastAppendedMdfRequestKeyRef = useRef(0);
  const dealRegFlowRef = useRef<DealRegFlow>({ kind: "idle" });
  const mdfFlowRef = useRef<MdfRequestFlow>({ kind: "idle" });
  const botReplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local messages with history prop when it changes externally (only if actually different)
  useEffect(() => {
    // Compare by stringifying to avoid infinite loops from reference changes
    const currentHistoryStr = JSON.stringify(history);
    const prevHistoryStr = prevHistoryRef.current;
    const currentLength = history.length;
    const prevLength = historyLengthRef.current;
    
    // Only update if history actually changed (deep comparison) OR length changed
    if (currentHistoryStr !== prevHistoryStr || currentLength !== prevLength) {
      prevHistoryRef.current = currentHistoryStr;
      historyLengthRef.current = currentLength;
      // Only update if messages are actually different to prevent loops
      // Use a ref to get current messages value without including it in deps
      setMessages(prevMessages => {
        const currentMessagesStr = JSON.stringify(prevMessages);
        if (currentHistoryStr !== currentMessagesStr) {
          return history.length > 0 ? history : [];
        }
        return prevMessages; // No change needed
      });
    }
  }, [history]); // Only depend on history - messages comparison done inside via setState updater

  useEffect(() => {
    return () => {
      if (botReplyTimeoutRef.current) {
        clearTimeout(botReplyTimeoutRef.current);
        botReplyTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (dealRegistrationPromptKey <= 0) return;
    if (dealRegistrationPromptKey <= dealRegistrationDeliveredKey) return;
    if (lastAppendedDealRegistrationKeyRef.current === dealRegistrationPromptKey) return;
    lastAppendedDealRegistrationKeyRef.current = dealRegistrationPromptKey;

    mdfFlowRef.current = { kind: "idle" };

    const botMsg: ChatMessage = {
      id: `deal-reg-${dealRegistrationPromptKey}-${Date.now()}`,
      role: "bot",
      content: DEAL_REGISTRATION_PROMPT_SUMMARY,
      blocks: DEAL_REGISTRATION_PROMPT_BLOCKS,
      timestamp: new Date(),
    };
    setMessages((prev) => {
      const next = [...prev, botMsg];
      onUpdateHistory?.(next);
      return next;
    });
    dealRegFlowRef.current = {
      kind: "active",
      snippets: [],
      awaitingDecision: false,
    };
    markDealPromptDelivered(dealRegistrationPromptKey);
  }, [
    dealRegistrationPromptKey,
    dealRegistrationDeliveredKey,
    markDealPromptDelivered,
    onUpdateHistory,
  ]);

  useEffect(() => {
    if (mdfRequestPromptKey <= 0) return;
    if (mdfRequestPromptKey <= mdfRequestDeliveredKey) return;
    if (lastAppendedMdfRequestKeyRef.current === mdfRequestPromptKey) return;
    lastAppendedMdfRequestKeyRef.current = mdfRequestPromptKey;

    dealRegFlowRef.current = { kind: "idle" };

    const botMsg: ChatMessage = {
      id: `mdf-req-${mdfRequestPromptKey}-${Date.now()}`,
      role: "bot",
      content: MDF_RECOMMENDATION_SUMMARY,
      blocks: buildMdfRecommendationBlocks(),
      timestamp: new Date(),
    };
    setMessages((prev) => {
      const next = [...prev, botMsg];
      onUpdateHistory?.(next);
      return next;
    });
    mdfFlowRef.current = { kind: "awaiting_submit" };
    markMdfRequestPromptDelivered(mdfRequestPromptKey);
  }, [
    mdfRequestPromptKey,
    mdfRequestDeliveredKey,
    markMdfRequestPromptDelivered,
    onUpdateHistory,
  ]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (botReplyTimeoutRef.current) {
      clearTimeout(botReplyTimeoutRef.current);
      botReplyTimeoutRef.current = null;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMsg];
      onUpdateHistory?.(newMessages);
      return newMessages;
    });

    setIsTyping(true);

    let botPayload: { content?: string; blocks?: SlackBlock[] };

    if (mdfFlowRef.current.kind === "awaiting_submit") {
      if (wantsToSubmit(trimmed)) {
        mdfFlowRef.current = { kind: "idle" };
        botPayload = {
          content: MDF_SUBMITTED_SUMMARY,
          blocks: buildMdfSubmittedBlocks(),
        };
      } else {
        const safeNote = trimmed.replace(/\*/g, "∗");
        botPayload = {
          content: "Note added to MDF draft — reply submit when ready.",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  `_*Your note:* ${safeNote}_\n\n` +
                  "Reply *submit*, *send*, or *yes* when you want the recommended *Q1 Security Roadshow* ($6,500) raised to marketing ops.",
              },
            },
          ],
        };
      }
    } else {
    const flow = dealRegFlowRef.current;

    if (flow.kind === "active") {
      const f = flow;
      if (f.awaitingDecision) {
        if (wantsToSubmit(trimmed)) {
          dealRegFlowRef.current = { kind: "idle" };
          botPayload = {
            content: DEAL_REGISTERED_SUMMARY,
            blocks: buildDealRegistrationSubmittedBlocks(),
          };
        } else if (wantsMoreOnly(trimmed)) {
          dealRegFlowRef.current = { ...f, awaitingDecision: false };
          botPayload = {
            content: "Add more deal details or say when you're ready to submit.",
            blocks: buildDealRegistrationAskMoreBlocks(),
          };
        } else {
          const snippets = [...f.snippets, trimmed];
          const fields = fieldsFromSnippets(snippets);
          const gaps = computeDealRegistrationGaps(fields);
          const completeness = dealRegistrationCompletenessPct(fields);
          dealRegFlowRef.current = { ...f, snippets, awaitingDecision: true };
          botPayload = {
            content: dealRegDraftSummary(snippets, completeness),
            blocks: buildDealRegistrationJourneyBlocks(snippets, fields, gaps),
          };
        }
      } else if (f.snippets.length === 0 && wantsToSubmit(trimmed)) {
        botPayload = {
          content: "Need at least a few deal details before you can submit.",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "*Share a few details first*\n\nI don’t have anything to register yet. Send a short message with what you know (company, amount, stage, close date, partner, people) *or* mention files you’re attaching.\n\nThen I’ll build your draft for review.",
              },
            },
          ],
        };
      } else {
        const snippets = [...f.snippets, trimmed];
        const fields = fieldsFromSnippets(snippets);
        const gaps = computeDealRegistrationGaps(fields);
        const completeness = dealRegistrationCompletenessPct(fields);
        dealRegFlowRef.current = { ...f, snippets, awaitingDecision: true };
        botPayload = {
          content: dealRegDraftSummary(snippets, completeness),
          blocks: buildDealRegistrationJourneyBlocks(snippets, fields, gaps),
        };
      }
    } else {
      botPayload = { blocks: getResponseBlocks(trimmed) };
    }
    }

    botReplyTimeoutRef.current = setTimeout(() => {
      botReplyTimeoutRef.current = null;
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: "bot",
        timestamp: new Date(),
        ...botPayload,
      };
      setMessages((prevMsgs) => {
        const finalMessages = [...prevMsgs, botMsg];
        onUpdateHistory?.(finalMessages);
        return finalMessages;
      });
      setIsTyping(false);
    }, 600);
  }, [onUpdateHistory]);

  // Expose sendMessage to parent via callback (use ref to avoid infinite loops)
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    if (onSendMessage) {
      // Pass sendMessage function to parent via ref to avoid recreating on every render
      onSendMessage((message: string) => sendMessageRef.current(message));
    }
  }, [onSendMessage]); // Only depend on onSendMessage, not sendMessage itself

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 flex flex-col custom-scrollbar min-h-0">
        <div className="mt-auto flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 px-2 text-center w-full">
            <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] mb-4 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath("/slackbot-logo.svg")} alt="Slackbot" width={120} height={120} className="max-w-full max-h-full" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1d1c1d] mb-2 w-full">
              Good morning, {DEMO_USER_NAME}!
            </h2>
            <p className="text-sm sm:text-[15px] text-[#616061] mb-5 w-full">
              The day loads, one unread message at a time.
            </p>
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {PILL_ACTIONS.map(({ id, label, icon: Icon, query }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => sendMessage(query)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-[13px] sm:text-[14px] font-medium hover:bg-[#f8f8f8] transition-colors whitespace-nowrap flex-1 min-w-[140px] max-w-[160px]"
                  style={{
                    backgroundColor: T.colors.background,
                    borderColor: T.colors.border,
                    color: T.colors.text,
                  }}
                >
                  <Icon width={14} height={14} style={{ color: T.colors.textSecondary }} stroke="currentColor" className="shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <GlobalChatMessage
              key={m.id}
              message={{
                id: m.id,
                name: isUser ? "You" : "Slackbot",
                avatar: isUser ? USER_AVATAR : SLACKBOT_AVATAR,
                time: isUser ? "Just now" : "Just now",
                text: m.blocks ? undefined : m.content || "Shared a structured update",
                blocks: m.blocks,
              }}
            />
          );
        })}
        {isTyping && (
          <GlobalChatMessage
            message={{
              id: "typing",
              name: "Slackbot",
              avatar: SLACKBOT_AVATAR,
              time: "Now",
              text: "Slackbot is typing...",
            }}
          />
        )}
        </div>
      </div>
      {/* REMOVED: Duplicate MessageInput - using SSOT input from SlackbotPanel instead */}
    </div>
  );
}
