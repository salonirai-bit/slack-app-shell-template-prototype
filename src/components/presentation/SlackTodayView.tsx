"use client";

import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, ChevronRight, CheckCircle2, RefreshCw } from "lucide-react";
import { RITA_DATA, HEALTH_COLORS } from "@/lib/ritaData";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { motion, AnimatePresence } from "framer-motion";
import { assetPath } from "@/lib/asset-path";

// ── Panel state — tracks both the panel type and the specific deal it was triggered from ──
type ActivePanel =
  | { type: "prep"; dealId: string; meetingTime: string }
  | { type: "risks" }
  | { type: "register-deals" }
  | { type: "setup" }
  | { type: "quotes" }
  | { type: "action-items" }
  | null;

function Avatar({ initials, color = "#E8D5F5" }: { initials: string; color?: string }) {
  return (
    <div
      className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-gray-700 flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

const AVATAR_COLORS: Record<string, string> = {
  PS: "#DBEAFE",
  SC: "#D1FAE5",
  DT: "#FEF3C7",
  MT: "#FCE7F3",
  JH: "#EDE9FE",
};

// ── Generates a deal-specific prep brief from RITA_DATA ───────────────────────
function buildPrepContent(dealId: string, meetingTime: string) {
  const deal = RITA_DATA.deals.find(d => d.id === dealId);
  if (!deal) return null;

  const healthLabel = HEALTH_COLORS[deal.health].label;

  const configs: Record<string, {
    heading: string;
    userMsg: string;
    botMsg: string;
    fields: { label: string; value: string }[];
    risk?: string;
    rec: string;
    actions: string[];
  }> = {
    "deal-acme": {
      heading: `Meeting Brief · Acme Corp · ${meetingTime}`,
      userMsg: `Prep me for the Acme Corp call at ${meetingTime}.`,
      botMsg: "Pulled the latest from Salesforce. Here's what you need to know:",
      fields: [
        { label: "Amount",        value: "$89,000 · Negotiation · Feb 28" },
        { label: "Champion",      value: "Priya Shah (VP Engineering)" },
        { label: "Last touch",    value: "Dec 28 · Email — proposal follow-up" },
        { label: "Open ask",      value: "Volume discount on 3yr term" },
        { label: "Sentiment",     value: "78% — Cooling" },
      ],
      risk: "⚠️ Daniel Kim (CTO) calendar cleared through January. Champion path is at risk.",
      rec: "Lead with Priya. Ask her directly: 'Can you be the internal champion for the exec path?' Propose Jan 8 intro via Sarah.",
      actions: ["Draft talking points", "Update next step in CRM", "Schedule exec intro"],
    },
    "deal-greentech": {
      heading: `Meeting Brief · Greentech · ${meetingTime}`,
      userMsg: `What should I discuss at lunch with Diane Park at ${meetingTime}?`,
      botMsg: "Greentech is your cleanest deal. Here's the context for the lunch:",
      fields: [
        { label: "Amount",        value: "$60,000 · Proposal · Mar 15" },
        { label: "Champion",      value: "Diane Park (CIO) — also Decision Maker" },
        { label: "Last touch",    value: "Dec 30 · Lunch — relationship building" },
        { label: "Next step",     value: "SOW review scheduled Jan 8" },
        { label: "Sentiment",     value: "82% — On Track" },
      ],
      rec: "Keep it relationship-focused. Confirm the Jan 8 SOW timeline. Ask if Tom Reeves (VP Ops) needs any additional materials before then.",
      actions: ["View SOW draft", "Draft recap email for after lunch", "Ping Priya Shah (SE) for prep"],
    },
    "deal-novacorp": {
      heading: `Legal Brief · NovaCorp · ${meetingTime}`,
      userMsg: `Prep me for the NovaCorp legal sync at ${meetingTime}.`,
      botMsg: "NovaCorp is 3 days overdue on redlines. Here's the situation:",
      fields: [
        { label: "Amount",        value: "$45,000 · Legal Review · Jan 31" },
        { label: "Champion",      value: "Marcus Lee (Head of Procurement)" },
        { label: "Legal contact", value: "Sandra Nguyen (General Counsel)" },
        { label: "Issue",         value: "Clause 7.2 — non-standard indemnification" },
        { label: "Last touch",    value: "Dec 22 · Contract sent" },
      ],
      risk: "⚠️ Close date Jan 31 is 29 days away. No legal response in 10 days. Escalation risk.",
      rec: "Come with pre-approved alternative language for clause 7.2. Ask Marcus for a 'by end of this week' commitment from Sandra.",
      actions: ["View MSA clause 7.2", "Draft escalation email to Marcus", "Update close date risk in CRM"],
    },
    "deal-sporty": {
      heading: `Risk Review · Sporty Nation · ${meetingTime}`,
      userMsg: `What should I do about Sporty Nation at the 5:00 PM review?`,
      botMsg: "Sporty Nation is your highest risk active deal. Here's the full picture:",
      fields: [
        { label: "Amount",       value: "$270,000 · Discovery · Mar 31" },
        { label: "Contact",      value: "Chris Park (VP Digital) — gone dark" },
        { label: "Last touch",   value: "Dec 18 — 14 days of silence" },
        { label: "Outreach",     value: "3 unanswered attempts" },
        { label: "Competitors",  value: "SAP, Oracle" },
      ],
      risk: "🔴 No champion. No response. $270K at risk. SAP and Oracle are likely still in play.",
      rec: "Decision needed today: (1) Multi-thread — find someone above Chris Park. (2) 'Breakup email' to force a response. (3) Move to Q2 pipeline and protect your Q1 forecast.",
      actions: ["Draft re-engagement email", "Research exec contacts at Sporty Nation", "Flag for Sarah Chen review"],
    },
  };

  return configs[dealId] ?? null;
}

// ── Panel script types ────────────────────────────────────────────────────────
export interface PanelScript {
  userPrompt: string;
  botIntro: string;
  toolIcon: string;
  toolName: string;
  finalResponse: React.ReactNode;
  hideToolExecution?: boolean;
  interactiveActions?: string[];
  actionResponses?: Record<string, string>;
  setupCards?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  setupFooterNote?: string;
}

export interface PanelData {
  title: string;
  script: PanelScript;
}

// ── Builds the generative script for each panel type ─────────────────────────
function buildScript(panel: NonNullable<ActivePanel>): PanelData {
  if (panel.type === "risks") {
    const riskDeals = RITA_DATA.deals.filter(
      d => d.health === "at-risk" || d.health === "cooling" || d.health === "needs-nurture"
    );
    return {
      title: "Slackbot",
      script: {
        userPrompt: "Show me the biggest pipeline risks for Q1.",
        botIntro: "Analyzed your 14 active deals against Salesforce and Clari signals:",
        toolIcon: "🔍",
        toolName: "Searched Salesforce for at-risk deals after Jan 2, 2025",
        finalResponse: (
          <div className="space-y-2">
            {riskDeals.map(deal => (
              <div key={deal.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: HEALTH_COLORS[deal.health].dot }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-gray-800">{deal.name} · ${(deal.amount / 1000).toFixed(0)}K · {deal.stage}</div>
                  <div className="text-[11px] text-gray-500">{deal.nextStep}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap mt-2">
              {["Create action plan", "Update CRM", "Brief Sarah Chen"].map(a => (
                <button key={a} className="px-3 py-1.5 text-[12px] font-semibold bg-white border border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 shadow-sm transition-all">{a}</button>
              ))}
            </div>
          </div>
        ),
      },
    };
  }

  if (panel.type === "setup") {
    const setupCards = [
      {
        icon: "🏢",
        title: "Set up Slack Workspace for Partners",
        description: "A central digital hub designed to make partner workflows faster.",
      },
      {
        icon: "🗒️",
        title: "Define your Deal Rules",
        description: "Set how deal conflicts are resolved and configure your B2B referral program",
      },
      {
        icon: "🏆",
        title: "Setup your loyalty tiers",
        description: "Define partner tiers (Gold, Silver, Bronze) and the criteria to qualify for each",
      },
      {
        icon: "🤖",
        title: "Customise your Agentforce",
        description: "Add topics specific to your channel, review what skills your agent supports, and sign off",
      },
      {
        icon: "📚",
        title: "Create your first training track",
        description: "Build an onboarding learning path for newly invited partners.",
      },
    ];

    return {
      title: "Slackbot",
      script: {
        userPrompt: "Help me complete setup so I can start inviting Partners in Slack.",
        botIntro: "I can help you set up the features. Below are the features where I require your input in order to continue and complete the setup automatically",
        toolIcon: "⚙️",
        toolName: "Checked Partner Community and Slack integration prerequisites",
        hideToolExecution: true,
        finalResponse: null,
        setupCards,
        setupFooterNote: "Complete these steps to unlock partner invites and launch collaboration channels.",
      },
    };
  }

  if (panel.type === "register-deals") {
    return {
      title: "Slackbot",
      script: {
        userPrompt: "Help me register the 4 deals from meetings I was part of this week.",
        botIntro: "Found 4 meetings with deal signals. I drafted registrations so you can review and submit quickly:",
        toolIcon: "🔍",
        toolName: "Scanned your meeting notes and matched opportunities",
        interactiveActions: ["Review all registrations", "Submit 4 deals", "Edit fields"],
        actionResponses: {
          "Review all registrations": "Opened all 4 registrations in review mode. I highlighted missing fields for Acme and Northstar.",
          "Submit 4 deals": "Submitted all 4 registrations successfully. I notified channel managers for final approval.",
          "Edit fields": "Enabled inline edit mode. You can now update value, stage, owner, and expected close date before submit.",
        },
        finalResponse: (
          <div className="space-y-2">
            {[
              "Acme Corp · Discovery call · $180K · Stage: Qualification",
              "Greentech · Solution workshop · $60K · Stage: Discovery",
              "Northstar Retail · Stakeholder sync · $95K · Stage: Proposal",
              "Sporty Nation · Renewal planning · $42K · Stage: Validation",
            ].map((item) => (
              <div key={item} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-800">
                {item}
              </div>
            ))}
          </div>
        ),
      },
    };
  }

  if (panel.type === "quotes") {
    return {
      title: "Slackbot",
      script: {
        userPrompt: "Show me the 2 pending quotes I need to approve.",
        botIntro: "Found 2 quotes needing your approval:",
        toolIcon: "🔍",
        toolName: "Searched Salesforce quotes after Jan 2, 2025",
        finalResponse: (
          <div className="space-y-2">
            {RITA_DATA.deals.flatMap(d => d.quotes.map(q => ({ ...q, dealName: d.name }))).map((q, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold text-gray-800">{q.id} · {q.dealName}</span>
                  <span className="text-[12px] font-bold text-gray-900">${(("amount" in q) ? (q as { amount: number }).amount / 1000 : 0).toFixed(0)}K</span>
                </div>
                <div className="text-[11px] text-gray-500">{q.status} · {q.date} · {q.products.split(",")[0]}</div>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap mt-2">
              {["Approve Greentech quote", "Approve NovaCorp quote", "View in Salesforce"].map(a => (
                <button key={a} className="px-3 py-1.5 text-[12px] font-semibold bg-white border border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 shadow-sm transition-all">{a}</button>
              ))}
            </div>
          </div>
        ),
      },
    };
  }

  if (panel.type === "action-items") {
    return {
      title: "Slackbot",
      script: {
        userPrompt: "Can you look through my activity threads from the last 7 days and find the following:\n1. Find Action items from me that I haven't completed yet\n2. Find threads I need to follow up because I haven't heard a response yet\nMake sure to look at threaded responses and reactions on the original message to see what the latest activity is",
        botIntro: "I'll help you review your recent activity threads from the last 7 days to find incomplete action items and threads needing follow-up!",
        toolIcon: "💬",
        toolName: "Read your thread replies",
        finalResponse: (
          <div className="space-y-3 mt-1 text-[13px] text-gray-800">
            <p className="text-gray-600">Here are a few things that need your attention:</p>
            <div className="rounded-xl p-3 bg-gray-50" style={{ border: "1px solid #E5E7EB" }}>
              <div className="font-bold text-blue-600 mb-1 text-[12px]">#deal-sporty</div>
              <p className="leading-snug">You asked Sarah Chen for a POC update on Tuesday. She hasn{"'"}t replied yet.{" "}
                <span className="text-blue-500 cursor-pointer hover:underline">[Jump to message]</span>
              </p>
            </div>
            <div className="rounded-xl p-3 bg-gray-50" style={{ border: "1px solid #E5E7EB" }}>
              <div className="font-bold text-blue-600 mb-1 text-[12px]">#deal-novacorp</div>
              <p className="leading-snug">Priya requested confirmation on standard MSA terms. You reacted with 👀 but haven{"'"}t provided the confirmation document.{" "}
                <span className="text-blue-500 cursor-pointer hover:underline">[Jump to message]</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap mt-1">
              {["Draft follow-up to Sarah", "Send MSA confirmation", "View all threads"].map(a => (
                <button key={a} className="px-3 py-1.5 text-[12px] font-semibold bg-white border border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 shadow-sm transition-all">{a}</button>
              ))}
            </div>
          </div>
        ),
      },
    };
  }

  // prep
  const prep = buildPrepContent(panel.dealId, panel.meetingTime);
  const deal = RITA_DATA.deals.find(d => d.id === panel.dealId);
  return {
    title: prep?.heading ?? "Slackbot",
    script: {
      userPrompt: `Help me prep for my meeting: ${deal?.name ?? ""} on Jan 2, 2025 at ${panel.meetingTime}, with participants: @${deal?.champion ?? "Team"}. Look up recent discussions for context.`,
      botIntro: `Perfect! I found your recent conversation. Here's your prep for the ${panel.meetingTime} meeting today:`,
      toolIcon: "🔍",
      toolName: `Searched messages with @${deal?.champion ?? "Team"} after Dec 26, 2024`,
      finalResponse: prep ? (
        <div className="space-y-3">
          <div className="text-[12px] font-bold text-gray-800">Meeting Context</div>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            {prep.fields.map((f, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 border-b border-gray-100 last:border-0 bg-white">
                <span className="text-[11px] text-gray-400 w-20 flex-shrink-0 pt-0.5">{f.label}</span>
                <span className="text-[12px] text-gray-800 font-medium leading-snug">{f.value}</span>
              </div>
            ))}
          </div>
          {prep.risk && (
            <div className="rounded-xl px-3 py-2.5 text-[12px] text-orange-800 leading-snug" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              {prep.risk}
            </div>
          )}
          <div className="rounded-xl px-3 py-2.5 text-[12px] text-gray-700 leading-snug" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <span className="font-semibold text-green-700">Recommendation: </span>
            {prep.rec}{" "}
            <span className="text-blue-500 cursor-pointer hover:underline">[1]</span>
          </div>
          <div className="flex gap-2 flex-wrap mt-1">
            {prep.actions.map(a => (
              <button key={a} className="px-3 py-1.5 text-[12px] font-semibold bg-white border border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 shadow-sm transition-all">{a}</button>
            ))}
          </div>
        </div>
      ) : null,
    },
  };
}

// ── Universally reusable Slackbot panel shell ─────────────────────────────────
interface SlackbotPanelProps {
  panelData: PanelData;
  onClose: () => void;
}

export function SlackbotPanel({ panelData, onClose }: SlackbotPanelProps) {
  const [activeTab, setActiveTab] = useState<"Messages" | "History" | "Files">("Messages");
  const [generationStep, setGenerationStep] = useState(0);
  const [inputText, setInputText] = useState("");
  const [completedSetupCards, setCompletedSetupCards] = useState<Record<string, boolean>>({});
  const [activeSetupDetail, setActiveSetupDetail] = useState<string | null>(null);
  const [actionReplies, setActionReplies] = useState<Array<{ action: string; response: string }>>([]);
  const [notifyNewDeal, setNotifyNewDeal] = useState(true);
  const [notifyConflict, setNotifyConflict] = useState(true);
  const [notifyStaleDeal, setNotifyStaleDeal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const setupDetailRef = useRef<HTMLDivElement>(null);

  const { script } = panelData;

  // Auto-scroll to bottom whenever a new step renders
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generationStep]);

  // Staggered 4-step generative sequence — restarts when panelData changes
  useEffect(() => {
    setGenerationStep(1);
    const t1 = setTimeout(() => setGenerationStep(2), 600);
    const t2 = setTimeout(() => setGenerationStep(3), 1800);
    const t3 = setTimeout(() => setGenerationStep(4), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [panelData]);

  useEffect(() => {
    setCompletedSetupCards({});
    setActiveSetupDetail(null);
    setActionReplies([]);
  }, [panelData]);

  useEffect(() => {
    if (activeSetupDetail !== "Define your Deal Rules") return;
    setupDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSetupDetail]);

  return (
    <div className="w-full flex flex-col h-full bg-white" style={{ borderLeft: "1px solid #E8E8E8" }}>

      {/* ── 1. Header & Tabs ─────────────────────────────────────────────────── */}
      <div className="pt-3 px-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Favourite">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 1.5l1.75 3.5 3.9.57-2.82 2.75.67 3.88L8 10.4l-3.5 1.84.67-3.88L2.35 5.57l3.9-.57L8 1.5z" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/slackbot-logo.svg")} alt="Slackbot" className="w-5 h-5" />
            <span className="font-bold text-[15px] text-gray-900">{panelData.title}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Edit">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Search">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="4" /><path d="M9.5 9.5l3 3" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="More">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
              </svg>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors ml-1" title="Close">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-5 text-[13px] font-medium text-gray-500" style={{ borderBottom: "1px solid #E8E8E8" }}>
          {(["Messages", "History", "Files"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 outline-none transition-colors ${activeTab === tab ? "text-[#611f69] border-b-2 border-[#611f69]" : "hover:text-gray-800"}`}
            >
              {tab}
            </button>
          ))}
          <button className="pb-2 hover:text-gray-800 outline-none ml-auto">+</button>
        </div>
      </div>

      {/* ── 2. Scrollable chat area — messages anchor to bottom via mt-auto ───── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-5 flex flex-col">
        <div className="mt-auto flex flex-col gap-5">

          {/* Step 1: user message */}
          {generationStep >= 1 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-[11px] font-bold text-purple-700 flex-shrink-0">RC</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900">
                  Rita Chen <span className="text-gray-400 font-normal text-[11px] ml-1">Just now</span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed mt-0.5">{script.userPrompt}</p>
              </div>
            </div>
          )}

          {/* Thread divider */}
          {generationStep >= 2 && (
            <div className="flex items-center gap-2 -my-1">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-[11px] text-gray-400">1 reply</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>
          )}

          {/* Steps 2-4: bot response */}
          {generationStep >= 2 && (
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath("/slackbot-logo.svg")} alt="Slackbot" className="w-8 h-8 rounded flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="text-[13px] font-bold text-gray-900">
                  Slackbot <span className="text-gray-400 font-normal text-[11px] ml-1">Just now</span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed">{script.botIntro}</p>

                {/* Step 2: thinking dots */}
                {generationStep === 2 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] italic text-gray-400">Thinking</span>
                    <span className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  </div>
                )}

                {/* Step 3+: tool execution pill */}
                {generationStep >= 3 && !script.hideToolExecution && (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px]" style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}>
                    <div className="flex items-center gap-2 text-gray-600 min-w-0">
                      <span className="flex-shrink-0">{script.toolIcon}</span>
                      <span className="truncate">{script.toolName}</span>
                    </div>
                    {generationStep === 3 ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-[#611f69] animate-spin flex-shrink-0 ml-2" />
                    ) : (
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">3 results ⌄</span>
                    )}
                  </div>
                )}

                {/* Step 4: final response payload */}
                {generationStep === 4 && (
                  <>
                    {script.setupCards ? (
                      <div className="space-y-3">
                        {script.setupCards.map((card) => {
                          const isCompleted = !!completedSetupCards[card.title];
                          return (
                            <button
                              key={card.title}
                              type="button"
                              onClick={() => {
                                setCompletedSetupCards((prev) => ({
                                  ...prev,
                                  [card.title]: true,
                                }));
                                if (card.title === "Define your Deal Rules") {
                                  setActiveSetupDetail(card.title);
                                }
                              }}
                              className="w-full text-left rounded-2xl border border-gray-300 bg-white px-4 py-3 hover:bg-gray-50 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-[20px] leading-none mt-0.5">{card.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{card.title}</h4>
                                    {isCompleted ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                      </span>
                                    ) : (
                                      <span className="text-[22px] text-gray-500 leading-none">→</span>
                                    )}
                                  </div>
                                  <p className="text-[13px] text-gray-600 mt-1 leading-snug">{card.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        {activeSetupDetail === "Define your Deal Rules" && (
                          <div ref={setupDetailRef} className="rounded-2xl border border-gray-200 bg-[#f7f7f8] p-4">
                            <h4 className="text-[15px] font-bold text-gray-900 mb-3">Define Deal Rules</h4>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-[12px] text-gray-700 mb-1.5">
                                  When two partners register the same deal <span className="text-pink-600">*</span>
                                </label>
                                <div className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-700">
                                  Award to partner who registered first
                                </div>
                              </div>

                              <div>
                                <label className="block text-[12px] text-gray-700 mb-1.5">
                                  Duplicate detection window <span className="text-pink-600">*</span>
                                </label>
                                <div className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-700">
                                  30 days
                                </div>
                              </div>

                              <div>
                                <label className="block text-[12px] text-gray-700 mb-1.5">Notify me when</label>
                                <div className="rounded-xl border border-gray-300 bg-white p-3 space-y-2">
                                  <label className="flex items-start gap-2 text-[13px] text-gray-800">
                                    <input type="checkbox" checked={notifyNewDeal} onChange={() => setNotifyNewDeal((v) => !v)} className="mt-0.5 w-4 h-4 accent-[#1f7bb6]" />
                                    <span>A new deal is registered by any partner</span>
                                  </label>
                                  <label className="flex items-start gap-2 text-[13px] text-gray-800">
                                    <input type="checkbox" checked={notifyConflict} onChange={() => setNotifyConflict((v) => !v)} className="mt-0.5 w-4 h-4 accent-[#1f7bb6]" />
                                    <span>A conflict is detected and needs my review</span>
                                  </label>
                                  <label className="flex items-start gap-2 text-[13px] text-gray-800">
                                    <input type="checkbox" checked={notifyStaleDeal} onChange={() => setNotifyStaleDeal((v) => !v)} className="mt-0.5 w-4 h-4 accent-[#1f7bb6]" />
                                    <span>No updates in 30 days on a registered deal</span>
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <button type="button" className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
                                Clear changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveSetupDetail(null)}
                                className="flex-1 rounded-xl border border-[#007a5a] bg-[#007a5a] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#00684c]"
                              >
                                Save and Continue
                              </button>
                            </div>
                          </div>
                        )}
                        {script.setupFooterNote && (
                          <div className="text-[11px] text-gray-400 px-1">{script.setupFooterNote}</div>
                        )}
                      </div>
                    ) : (
                      script.finalResponse
                    )}

                    {!!script.interactiveActions && script.interactiveActions.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {script.interactiveActions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              const response = script.actionResponses?.[action] ?? "Done. I applied that action.";
                              setActionReplies((prev) => {
                                if (prev.some((item) => item.action === action)) return prev;
                                return [...prev, { action, response }];
                              });
                            }}
                            className="px-3 py-1.5 text-[12px] font-semibold bg-white border border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 shadow-sm transition-all"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}

                    {actionReplies.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {actionReplies.map((reply) => (
                          <div key={reply.action} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{reply.action}</p>
                            <p className="text-[12px] text-gray-800">{reply.response}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button className="text-gray-300 hover:text-gray-500 transition-colors text-[14px]" title="Copy">📋</button>
                      <button className="text-gray-300 hover:text-green-500 transition-colors text-[14px]" title="Helpful">👍</button>
                      <button className="text-gray-300 hover:text-red-400 transition-colors text-[14px]" title="Not helpful">👎</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Invisible scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── 3. Rich-text input footer ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid #E8E8E8" }}>
        <div className="rounded-xl overflow-hidden bg-white transition-shadow focus-within:shadow-sm" style={{ border: "1px solid rgba(94,93,96,0.45)" }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Reply..."
            rows={1}
            className="w-full text-[13px] px-3 pt-3 pb-2 outline-none resize-none bg-transparent text-gray-800 placeholder-gray-400"
            style={{ fontFamily: "inherit" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setInputText(""); } }}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5 text-gray-500">
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Attach">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
              </button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded transition-colors text-[13px] font-bold leading-none" title="Format">Aa</button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Emoji">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5.5 9.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" />
                  <circle cx="6" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                  <circle cx="10" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                </svg>
              </button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded transition-colors text-[13px] font-medium leading-none" title="Mention">@</button>
            </div>
            <button type="button" onClick={() => setInputText("")} className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600" title="Send">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" /></svg>
            </button>
          </div>
        </div>
        <div className="text-[11px] text-gray-400 mt-1.5 ml-1">
          <span className="font-semibold text-gray-500">Slackbot</span>{" "}
          {generationStep > 0 && generationStep < 4 ? "is typing…" : "is ready"}
        </div>
      </div>
    </div>
  );
}

// ── Meeting type icons ────────────────────────────────────────────────────────
function MeetIcon({ className }: { className?: string }) {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    // Fallback: Simple video/meet icon SVG
    return (
      <svg className={`flex-shrink-0 ${className ?? ""}`} viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="#5F6368" strokeWidth="1.5" fill="none" />
        <path d="M8 2v4M16 2v4" stroke="#5F6368" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 10h20" stroke="#5F6368" strokeWidth="1.5" />
        <circle cx="12" cy="14" r="2" fill="#5F6368" />
        <path d="M8 14l2-2 2 2 2-2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  
  // Use URL-encoded path to handle spaces in filename
  const imageSrc = assetPath("/Google Meet.png").replace(/ /g, "%20");
  
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt="Google Meet"
      className={`flex-shrink-0 ${className ?? ""}`}
      style={{ width: 24, height: 24, objectFit: "contain" }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (!target.src.startsWith('data:')) {
          setImageError(true);
        }
      }}
    />
  );
}

function CalIcon({ className }: { className?: string }) {
  return (
    <svg className={`flex-shrink-0 ${className ?? ""}`} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="11" rx="1.5" stroke="#B07A3A" strokeWidth="1.2" />
      <path d="M1 6.5h14" stroke="#B07A3A" strokeWidth="1.2" />
      <path d="M5 1.5v3M11 1.5v3" stroke="#B07A3A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Focus Prompt Pill ─────────────────────────────────────────────────────────
function FocusPill({ onClick, icon, iconBg, label, restGradient, colors }: {
  onClick: () => void;
  icon: string;
  iconBg: string;
  label: string;
  restGradient: string;
  colors: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative p-[1.5px] rounded-2xl w-full cursor-pointer overflow-hidden"
      style={{ boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.12)" : "none" }}
    >
      {/* Resting border — static gradient, visible at rest */}
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{ background: restGradient, opacity: hovered ? 0 : 0.5 }}
      />
      {/* Spinning conic-gradient square — fixed size ensures full coverage on wide pills */}
      <div
        className="absolute transition-opacity duration-300"
        style={{
          top: "50%",
          left: "50%",
          width: "800px",
          height: "800px",
          transform: "translate(-50%, -50%)",
          background: `conic-gradient(${colors})`,
          animation: hovered ? "spin-border 3s linear infinite" : "none",
          opacity: hovered ? 1 : 0,
        }}
      />
      <div className="relative flex items-center justify-between p-4 bg-white rounded-[calc(1rem-1.5px)] h-full overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 text-xl`}>{icon}</div>
          <span className="text-sm font-medium text-gray-800 leading-snug break-words min-w-0">{label}</span>
        </div>
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all whitespace-nowrap flex-shrink-0 ml-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/slackbot-logo.svg")} alt="" className="w-4 h-4" />
            Ask
          </button>
        )}
      </div>
    </div>
  );
}

// ── Per-meeting card ──────────────────────────────────────────────────────────
interface AgendaItemProps {
  title: string;
  subtitle?: string;
  dotColor?: string;
  time: string;
  badgeText?: string;
  badgeColor?: string;
  barColor: string;
  isNow?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  isMeeting?: boolean;
  onPrep: () => void;
}

function AgendaItem({
  title, subtitle, dotColor, time, badgeText, badgeColor,
  barColor, isNow = false, icon: Icon, isMeeting = false, onPrep,
}: AgendaItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex items-center p-3.5 border rounded-2xl shadow-sm transition-all cursor-pointer ${
        isNow
          ? "bg-[#eefcf4] border-[#d1f4e0]"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
      }`}
      onClick={onPrep}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className={`w-1 h-5 rounded-full mt-0.5 flex-shrink-0 ${barColor}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-900 truncate">{title}</span>
            {badgeText && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${badgeColor}`}>
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 font-medium">
              {dotColor && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />}
              <span className="truncate">{subtitle}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center w-[80px] justify-end flex-shrink-0 pl-2">
        {!hovered ? (
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="text-[12px] tabular-nums text-gray-500">{time}</span>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onPrep(); }}
            className="px-3 py-1 text-[11px] font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all whitespace-nowrap"
          >
            {isMeeting ? "Prep" : "Ask"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface SlackTodayViewProps {
  onNavigateToActivity?: () => void;
  topViewMode?: "admin" | "channel-manager" | "seller";
}

export function SlackTodayView({ onNavigateToActivity, topViewMode = "admin" }: SlackTodayViewProps = {}) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showTomorrow, setShowTomorrow] = useState(false);

  // Agenda menu
  const [isAgendaMenuOpen, setIsAgendaMenuOpen] = useState(false);
  const agendaMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic greeting
  const SLACK_GREETINGS = [
    { text: "You got this", emoji: "💫" },
    { text: "It's a good day for getting it done", emoji: "🦖" },
    { text: "You're doing great", emoji: "❤️" },
    { text: "Ready to dive in?", emoji: "🤿" },
    { text: "Let's win the day", emoji: "🚀" },
    { text: "Time to move some deals", emoji: "💼" },
    { text: "Another day, another deal", emoji: "🤝" },
    { text: "Your pipeline is waiting", emoji: "📈" },
  ];
  const [greeting, setGreeting] = useState(SLACK_GREETINGS[0]);
  useEffect(() => {
    setGreeting(SLACK_GREETINGS[Math.floor(Math.random() * SLACK_GREETINGS.length)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Top Highlights card state
  const [isHighlightsMenuOpen, setIsHighlightsMenuOpen] = useState(false);
  const highlightsMenuRef = useRef<HTMLDivElement>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [highlightsAtTop, setHighlightsAtTop] = useState(false);
  const [highlightsMoved, setHighlightsMoved] = useState(false);

  // Replies Needed card state
  const [isRepliesMenuOpen, setIsRepliesMenuOpen] = useState(false);
  const repliesMenuRef = useRef<HTMLDivElement>(null);
  const [showReplies, setShowReplies] = useState(true);
  const [repliesAtBottom, setRepliesAtBottom] = useState(false);
  const [repliesMoved, setRepliesMoved] = useState(false);
  const [repliesStatus, setRepliesStatus] = useState<"loaded" | "empty">("loaded");

  // Close menus when clicking outside
  useEffect(() => {
    if (!isAgendaMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (agendaMenuRef.current && !agendaMenuRef.current.contains(e.target as Node)) {
        setIsAgendaMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isAgendaMenuOpen]);

  useEffect(() => {
    if (!isHighlightsMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (highlightsMenuRef.current && !highlightsMenuRef.current.contains(e.target as Node)) {
        setIsHighlightsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isHighlightsMenuOpen]);

  useEffect(() => {
    if (!isRepliesMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (repliesMenuRef.current && !repliesMenuRef.current.contains(e.target as Node)) {
        setIsRepliesMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isRepliesMenuOpen]);

  // Helpers to toggle panels — close if same one is re-clicked
  const openRisks = () => setActivePanel(p => p?.type === "risks" ? null : { type: "risks" });
  const openRegisterDeals = () => setActivePanel(p => p?.type === "register-deals" ? null : { type: "register-deals" });
  const openSetup = () => setActivePanel(p => p?.type === "setup" ? null : { type: "setup" });
  const openQuotes = () => setActivePanel(p => p?.type === "quotes" ? null : { type: "quotes" });
  const openPrep = (dealId: string, meetingTime: string) =>
    setActivePanel(p => (p?.type === "prep" && (p as {type:"prep";dealId:string}).dealId === dealId) ? null : { type: "prep", dealId, meetingTime });
  const { today } = RITA_DATA;
  const isAdminView = topViewMode === "admin";
  const isPartnerView = topViewMode === "seller";

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full overflow-hidden"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Lato, sans-serif' }}
    >
      {/* ── Main left area ── */}
      <ResizablePanel id="today-main" order={1} minSize={30} className="overflow-hidden">
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f4e8f1 100%)" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-8 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-gray-900">Today</span>
            <span className="text-sm text-gray-400">{today.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-[12px] border border-gray-300 rounded-lg text-gray-600 hover:bg-white/70 transition-colors">
              Give Feedback
            </button>
            <button className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-white/70 transition-colors text-[13px]">
              ⚙️
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 @container">
          <div className="max-w-[1124px] mx-auto px-5 py-6 w-full">

            {/* Hero */}
            <div className="text-center mb-8">
              <h1 className="text-[28px] font-bold text-gray-900 mb-2">
                {greeting.text}{" "}
                <span className="inline-block hover:scale-110 transition-transform cursor-default">{greeting.emoji}</span>
              </h1>
              <p className="text-[14px] text-gray-500">Slackbot found areas for you to focus on today:</p>
            </div>

            {/* Focus Prompts — spinning conic-gradient border on hover */}
            <div className="grid grid-cols-3 gap-4 mb-12 w-full" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <FocusPill
                onClick={isAdminView ? openRisks : isPartnerView ? openRegisterDeals : openSetup}
                icon="🔍"
                iconBg="bg-orange-50"
                label={
                  isAdminView
                    ? "Review workspace risk flags"
                    : isPartnerView
                      ? "Register 4 deals from the meetings you were part of this week"
                      : "Complete the setup to start inviting Partners"
                }
                restGradient="linear-gradient(135deg,#f9a8d4,#c084fc,#fb923c)"
                colors="#f472b6, #c084fc, #fb923c, #f9a8d4, #f472b6"
              />
              <FocusPill
                onClick={() => openPrep("deal-acme", "11:30am")}
                icon={isAdminView ? "🛡️" : "🤝"}
                iconBg="bg-emerald-50"
                label={isAdminView ? "Prep weekly admin governance sync" : "Prep for Acme Corp sync"}
                restGradient="linear-gradient(135deg,#34d399,#2dd4bf,#60a5fa)"
                colors="#34d399, #2dd4bf, #60a5fa, #a5f3fc, #34d399"
              />
              <FocusPill
                onClick={openQuotes}
                icon={isAdminView ? "✅" : "✍️"}
                iconBg="bg-blue-50"
                label={isAdminView ? "Approve 4 pending access requests" : "Approve 2 pending quotes"}
                restGradient="linear-gradient(135deg,#60a5fa,#818cf8,#a78bfa)"
                colors="#60a5fa, #818cf8, #a78bfa, #c4b5fd, #60a5fa"
              />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 @[680px]:grid-cols-[1fr_minmax(240px,340px)] gap-6 items-start">

              {/* ── Left column ── */}
              <div className="flex flex-col gap-5">

                {/* Replies needed — in left column only when not moved to right column */}
                {showReplies && !repliesMoved && (
                <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${repliesAtBottom ? "order-last" : ""}`}>
                  <div className="flex items-center justify-between mb-4 relative" ref={repliesMenuRef}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[18px] flex-shrink-0">💬</span>
                      <h2 className="text-[15px] font-bold text-gray-900">Replies needed</h2>
                      {repliesStatus === "loaded" && (
                        <span className="text-[13px] font-normal text-gray-400">· {today.repliesNeeded.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {repliesStatus === "loaded" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRepliesStatus("empty"); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-green-600"
                          title="Mark all as done"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {repliesStatus === "empty" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRepliesStatus("loaded"); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-green-500 hover:text-gray-400"
                          title="Restore replies"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsRepliesMenuOpen(v => !v); }}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dropdown */}
                    {isRepliesMenuOpen && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-xl z-50 overflow-hidden text-[14px]" style={{ border: "1px solid #E5E7EB" }}>
                        {/* Section location group */}
                        <div>
                          <div className="px-4 pt-3 pb-1 text-[12px] font-medium text-gray-400 uppercase tracking-wide">
                            Section location
                          </div>
                          <button
                            onClick={() => { setRepliesAtBottom(v => !v); setIsRepliesMenuOpen(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors"
                          >
                            {repliesAtBottom ? "Move section up" : "Move section down"}
                          </button>
                          <button
                            onClick={() => { setRepliesMoved(true); setIsRepliesMenuOpen(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors"
                          >
                            Move to second column
                          </button>
                        </div>
                        {/* Hide */}
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <button
                            onClick={() => { setShowReplies(false); setIsRepliesMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors"
                          >
                            Hide section
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Loaded state */}
                  {repliesStatus === "loaded" && (
                    <div className="space-y-3">
                      {today.repliesNeeded.map((item) => (
                        <div
                          key={item.from}
                          className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <p className="text-[13px] font-semibold text-gray-800 mb-2 leading-snug line-clamp-2">
                            {item.preview}
                          </p>
                          <div className="flex items-center gap-2">
                            <Avatar initials={item.initials} color={AVATAR_COLORS[item.initials] ?? "#E8D5F5"} />
                            <span className="text-[12px] font-semibold text-gray-700">{item.from}</span>
                            <span className="text-[11px] text-gray-400">{item.channel}</span>
                            <span className="text-[11px] text-gray-400 ml-auto">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty / accomplished state */}
                  {repliesStatus === "empty" && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">No replies needed right now 🌱</h3>
                      <p className="text-[13px] text-gray-500 mb-5">Slackbot might find a few other things for you to do:</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePanel({ type: "action-items" }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-[13px] font-bold text-gray-800 hover:bg-gray-50 shadow-sm transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetPath("/slackbot-logo.svg")} alt="Slackbot" className="w-4 h-4" />
                        Find action items for this week
                      </button>
                    </div>
                  )}
                </div>
                )}

                {/* Top highlights — in left column only when not moved to right column */}
                {showHighlights && !highlightsMoved && (
                <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${highlightsAtTop ? "order-first" : ""}`}>
                  <div className="flex items-center justify-between mb-4 relative" ref={highlightsMenuRef}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[18px] flex-shrink-0">🔦</span>
                      <h2 className="text-[15px] font-bold text-gray-900 truncate">Top highlights</h2>
                      <span className="text-[13px] text-gray-400 whitespace-nowrap hidden sm:block">Summaries of priority unreads</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors" title="Refresh">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      {/* More menu */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsHighlightsMenuOpen(v => !v); }}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dropdown */}
                    {isHighlightsMenuOpen && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-xl z-50 overflow-hidden text-[14px]" style={{ border: "1px solid #E5E7EB" }}>
                        {/* Manage sources */}
                        <button
                          onClick={() => setIsHighlightsMenuOpen(false)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors"
                        >
                          Manage highlight sources
                        </button>

                        {/* Section location group */}
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <div className="px-4 pt-3 pb-1 text-[12px] font-medium text-gray-400 uppercase tracking-wide">
                            Section location
                          </div>
                          <button
                            onClick={() => { setHighlightsAtTop(v => !v); setIsHighlightsMenuOpen(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors"
                          >
                            {highlightsAtTop ? "Move section down" : "Move section up"}
                          </button>
                          <button
                            onClick={() => { setHighlightsMoved(true); setIsHighlightsMenuOpen(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors"
                          >
                            Move to second column
                          </button>
                        </div>

                        {/* Hide */}
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <button
                            onClick={() => { setShowHighlights(false); setIsHighlightsMenuOpen(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors"
                          >
                            Hide section
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {today.highlights.map((h, i) => {
                      const sentimentStyles = {
                        positive: { dot: "#22C55E", label: "" },
                        warning:  { dot: "#F97316", label: "⚠️ " },
                        critical: { dot: "#EF4444", label: "🚨 " },
                      };
                      const s = sentimentStyles[h.sentiment];
                      return (
                        <div key={i} className="py-4 hover:bg-gray-50 -mx-1 px-1 rounded-lg cursor-pointer transition-colors">
                          <div className="flex items-start gap-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: s.dot }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-gray-800 leading-snug">
                                <span className="font-bold">Agentforce </span>
                                {s.label}{h.summary}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[11px] text-gray-400">{h.channel}</span>
                                <span className="text-[11px] text-gray-300">·</span>
                                <span className="text-[11px] text-gray-400">{h.time}</span>
                                {h.reactions.map((r) => (
                                  <span
                                    key={r.emoji}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] text-gray-600 bg-gray-50"
                                    style={{ border: "1px solid #E5E7EB" }}
                                  >
                                    {r.emoji} {r.count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* View Activity CTA */}
                  {onNavigateToActivity && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigateToActivity(); }}
                        className="w-full text-center text-[13px] font-semibold text-[#611f69] hover:text-purple-800 hover:bg-purple-50 py-1.5 rounded-lg transition-colors"
                      >
                        View Activity →
                      </button>
                    </div>
                  )}
                </div>
                )}

              </div>

              {/* ── Right column: Agenda + optionally Highlights when moved ── */}
              <div className="space-y-5 sticky top-4">

              {/* Highlights in second column when moved */}
              {showHighlights && highlightsMoved && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4 relative" ref={highlightsMenuRef}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[18px] flex-shrink-0">🔦</span>
                      <h2 className="text-[15px] font-bold text-gray-900">Top highlights</h2>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors" title="Refresh">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setIsHighlightsMenuOpen(v => !v); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    {isHighlightsMenuOpen && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-xl z-50 overflow-hidden text-[14px]" style={{ border: "1px solid #E5E7EB" }}>
                        <button onClick={() => setIsHighlightsMenuOpen(false)} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors">Manage highlight sources</button>
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <div className="px-4 pt-3 pb-1 text-[12px] font-medium text-gray-400 uppercase tracking-wide">Section location</div>
                          <button onClick={() => { setHighlightsAtTop(v => !v); setIsHighlightsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors">{highlightsAtTop ? "Move section down" : "Move section up"}</button>
                          <button onClick={() => { setHighlightsMoved(false); setIsHighlightsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors">Move to first column</button>
                        </div>
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <button onClick={() => { setShowHighlights(false); setIsHighlightsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors">Hide section</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {today.highlights.slice(0, 2).map((h, i) => {
                      const sentimentStyles = { positive: { dot: "#22C55E", label: "" }, warning: { dot: "#F97316", label: "⚠️ " }, critical: { dot: "#EF4444", label: "🚨 " } };
                      const s = sentimentStyles[h.sentiment];
                      return (
                        <div key={i} className="py-3 hover:bg-gray-50 -mx-1 px-1 rounded-lg cursor-pointer transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.dot }} />
                            <p className="text-[13px] text-gray-800 leading-snug"><span className="font-bold">Agentforce </span>{s.label}{h.summary}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* View Activity CTA */}
                  {onNavigateToActivity && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigateToActivity(); }}
                        className="w-full text-center text-[13px] font-semibold text-[#611f69] hover:text-purple-800 hover:bg-purple-50 py-1.5 rounded-lg transition-colors"
                      >
                        View Activity →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Replies Needed in second column when moved */}
              {showReplies && repliesMoved && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4 relative" ref={repliesMenuRef}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[18px] flex-shrink-0">💬</span>
                      <h2 className="text-[15px] font-bold text-gray-900">Replies needed</h2>
                      <span className="text-[13px] font-normal text-gray-400">· {today.repliesNeeded.length}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsRepliesMenuOpen(v => !v); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex-shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {isRepliesMenuOpen && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-xl z-50 overflow-hidden text-[14px]" style={{ border: "1px solid #E5E7EB" }}>
                        <div>
                          <div className="px-4 pt-3 pb-1 text-[12px] font-medium text-gray-400 uppercase tracking-wide">Section location</div>
                          <button onClick={() => { setRepliesAtBottom(v => !v); setIsRepliesMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors">{repliesAtBottom ? "Move section up" : "Move section down"}</button>
                          <button onClick={() => { setRepliesMoved(false); setIsRepliesMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 transition-colors">Move to first column</button>
                        </div>
                        <div style={{ borderTop: "1px solid #F3F4F6" }}>
                          <button onClick={() => { setShowReplies(false); setIsRepliesMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors">Hide section</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {today.repliesNeeded.slice(0, 2).map((item) => (
                      <div key={item.from} className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                        <p className="text-[12px] font-semibold text-gray-800 mb-1.5 leading-snug line-clamp-2">{item.preview}</p>
                        <div className="flex items-center gap-1.5">
                          <Avatar initials={item.initials} color={AVATAR_COLORS[item.initials] ?? "#E8D5F5"} />
                          <span className="text-[11px] font-semibold text-gray-700">{item.from}</span>
                          <span className="text-[11px] text-gray-400 ml-auto">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 relative" ref={agendaMenuRef}>
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">📅</span>
                    <h2 className="text-[15px] font-bold text-gray-900">Agenda</h2>
                    <span className="text-gray-400 font-medium text-[13px]">· 6</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsAgendaMenuOpen(v => !v); }}
                    className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Dropdown menu */}
                  {isAgendaMenuOpen && (
                    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-9 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden text-sm">
                      <button
                        onClick={() => setIsAgendaMenuOpen(false)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors"
                        style={{ borderBottom: "1px solid #F3F4F6" }}
                      >
                        Show past events
                      </button>
                      <div
                        onClick={() => setIsAgendaMenuOpen(false)}
                        className="px-4 py-3 cursor-pointer hover:bg-[#115ea3] hover:text-white text-gray-800 transition-colors group"
                        style={{ borderBottom: "1px solid #F3F4F6" }}
                      >
                        <span className="text-gray-400 group-hover:text-blue-200 text-[11px] block mb-0.5">Section location</span>
                        Move to first column
                      </div>
                      <button
                        onClick={() => setIsAgendaMenuOpen(false)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 transition-colors"
                      >
                        Hide section
                      </button>
                    </div>
                  )}
                </div>

                {/* Today's meetings */}
                <div className="space-y-2">
                  <AgendaItem
                    title="Weekly Team Sync"
                    subtitle="Q1 kickoff — your plan auto-shared"
                    time="10:00am"
                    badgeText="In 1h"
                    badgeColor="bg-blue-50 text-blue-600"
                    barColor="bg-blue-500"
                    icon={MeetIcon}
                    isMeeting
                    onPrep={() => {}}
                  />
                  <AgendaItem
                    title="Discovery Call — Acme Corp"
                    subtitle="Champion: Priya Shah"
                    dotColor="bg-orange-500"
                    time="11:30am"
                    barColor="bg-purple-500"
                    icon={MeetIcon}
                    isMeeting
                    onPrep={() => openPrep("deal-acme", "11:30am")}
                  />
                  <AgendaItem
                    title="Lunch — Diane Park (CIO)"
                    subtitle="Relationship meeting · $60K · Stage 3"
                    dotColor="bg-emerald-500"
                    time="1:00pm"
                    barColor="bg-emerald-500"
                    icon={CalIcon}
                    onPrep={() => openPrep("deal-greentech", "1:00pm")}
                  />
                  <AgendaItem
                    title="NovaCorp Legal Sync"
                    subtitle="Clause 7.2 review · overdue 3 days"
                    dotColor="bg-amber-500"
                    time="2:30pm"
                    barColor="bg-amber-500"
                    icon={CalIcon}
                    onPrep={() => openPrep("deal-novacorp", "2:30pm")}
                  />
                  <AgendaItem
                    title="1:1 with Sarah Chen"
                    subtitle="Agenda auto-generated: Q1 plan..."
                    time="4:00pm"
                    barColor="bg-indigo-500"
                    icon={MeetIcon}
                    isMeeting
                    onPrep={() => {}}
                  />
                  <AgendaItem
                    title="Sporty Nation Internal Review"
                    subtitle="14 days silent · $270K at risk"
                    dotColor="bg-red-500"
                    time="5:00pm"
                    barColor="bg-pink-500"
                    icon={CalIcon}
                    onPrep={() => openPrep("deal-sporty", "5:00pm")}
                  />
                </div>

                {/* Tomorrow accordion */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowTomorrow(!showTomorrow)}
                    className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 hover:text-black transition-colors w-full"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showTomorrow ? "rotate-90" : ""}`}
                    />
                    Tomorrow
                    <span className="font-normal text-gray-400 ml-0.5">10 meetings</span>
                  </button>
                  {showTomorrow && (
                    <div className="mt-3 space-y-2 opacity-60 pointer-events-none">
                      <AgendaItem title="Pipeline Review" subtitle="Q1 week 1 forecast" time="9:00am" barColor="bg-blue-500" icon={MeetIcon} isMeeting onPrep={() => {}} />
                      <AgendaItem title="Greentech SOW Review" subtitle="SOW v2 with Diane" dotColor="bg-emerald-500" time="2:00pm" barColor="bg-emerald-500" icon={CalIcon} onPrep={() => {}} />
                      <AgendaItem title="Acme Corp Follow-up" subtitle="Exec path with Priya" dotColor="bg-orange-500" time="4:30pm" barColor="bg-purple-500" icon={MeetIcon} isMeeting onPrep={() => {}} />
                    </div>
                  )}
                </div>
              </div>{/* end Agenda card */}

              </div>{/* end right column wrapper (space-y-5) */}

            </div>

            {/* Restore pills — shown when a section is hidden */}
            {(!showHighlights || !showReplies) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {!showReplies && (
                  <button
                    onClick={() => setShowReplies(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <span>💬</span> Show Replies needed
                  </button>
                )}
                {!showHighlights && (
                  <button
                    onClick={() => setShowHighlights(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <span>🔦</span> Show Top highlights
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      </ResizablePanel>

      {/* ── Slackbot side panel ── */}
      <AnimatePresence>
        {activePanel && (
          <>
            <ResizableHandle
              withHandle={false}
              className="!w-[6px] shrink-0 !bg-transparent border-0 cursor-col-resize focus-visible:ring-0 data-[resize-handle-active]:bg-gray-200/60"
            />
            <ResizablePanel id="today-slackbot" order={2} minSize={22} defaultSize={35} className="overflow-visible">
              <motion.div
                key="slackbot-panel"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="h-full overflow-hidden"
              >
                <SlackbotPanel
                  panelData={buildScript(activePanel)}
                  onClose={() => setActivePanel(null)}
                />
              </motion.div>
            </ResizablePanel>
          </>
        )}
      </AnimatePresence>
    </ResizablePanelGroup>
  );
}
