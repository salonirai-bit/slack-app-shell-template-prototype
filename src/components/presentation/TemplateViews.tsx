"use client";

import { useState } from "react";
import { UniversalChatSurface } from "@/components/shared/UniversalChatSurface";
import { ChatMessage } from "@/components/shared/ChatMessage";
import { ChevronRight, Search, Star, MoreVertical, ChevronDown } from "lucide-react";
import { assetPath } from "@/lib/asset-path";
import { useDealRegistrationPrompt } from "@/context/DealRegistrationPromptContext";
import { getAvatarUrl } from "@/context/DemoDataContext";
import {
  CHANNEL_MANAGER_PARTNERS,
  CHANNEL_MANAGER_PARTNER_MESSAGES,
  isChannelManagerPartnerChatId,
} from "@/data/channel-manager-partners";

// ─── Shared Chat Messages ────────────────────────────────────────────────────

type Msg = { name: string; avatar: string; time: string; text: string };

const AVATARS = {
  sarah: "https://randomuser.me/api/portraits/med/women/44.jpg",
  rita: "https://randomuser.me/api/portraits/med/women/75.jpg",
  jordan: "https://randomuser.me/api/portraits/med/men/22.jpg",
  priya: "https://randomuser.me/api/portraits/med/women/68.jpg",
  daniel: "https://randomuser.me/api/portraits/med/men/32.jpg",
  dana: "https://randomuser.me/api/portraits/med/women/28.jpg",
  marcus: "https://randomuser.me/api/portraits/med/men/8.jpg",
  lisa: "https://randomuser.me/api/portraits/med/women/65.jpg",
  mike: "https://randomuser.me/api/portraits/med/men/45.jpg",
  aisha: "https://randomuser.me/api/portraits/med/women/21.jpg",
  /** Current user (“You”) in DM threads — replace public/persona-you.png to update */
  you: assetPath("/persona-you.png"),
  bot: assetPath("/slackbot-logo.svg"),
};

const CHANNEL_MESSAGES: Record<string, Msg[]> = {
  "#general": [
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "9:15 AM", text: "Good morning team! Quick reminder — Q1 pipeline review is at 2pm today. Please have your numbers ready." },
    { name: "Rita Patel", avatar: AVATARS.rita, time: "9:20 AM", text: "Runners Club deal is back on track. The ROI deck worked — CFO is reviewing final terms now." },
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "9:25 AM", text: "Anyone need POC support this week? I have a few slots open if there's anything blocking." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "9:40 AM", text: "Just wrapped the Greentech legal review. All terms cleared — we can move to signature. 🎉" },
    { name: "Daniel Kim", avatar: AVATARS.daniel, time: "10:05 AM", text: "Shared the updated forecast spreadsheet in #q3-pipeline. Numbers look solid." },
  ],
  "#deal-acme": [
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "Yesterday", text: "Priya, can you confirm whether the MSA redlines from Acme legal have been addressed? We need to close this loop before the board meeting." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "Yesterday", text: "Yes — legal cleared all the redlines. I sent the final version to Daniel Kim's team this morning. Waiting on their counter-sign." },
    { name: "Rita Patel", avatar: AVATARS.rita, time: "10:20 AM", text: "Just got off a call with Daniel. He's aligned but wants to loop in procurement for final budget approval. Should have an answer by EOD." },
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "10:45 AM", text: "I can prep the technical architecture overview they requested. Will share it here by 2pm." },
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "11:00 AM", text: "Perfect. Let's aim to get this across the finish line this week. Rita — keep me posted on procurement." },
  ],
  "#deal-greentech": [
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "Yesterday", text: "Greentech SOW is ready for review. Uploaded the final PDF to the channel files." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "Yesterday", text: "Looks good! I flagged a minor clause in section 4.2 — should be an easy fix." },
    { name: "Rita Patel", avatar: AVATARS.rita, time: "9:00 AM", text: "Updated section 4.2 and sent it back. Legal gave the all-clear. We're good to go." },
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "9:30 AM", text: "Great work everyone. Let's get signatures this week. This puts us at 108% quota for Q1. 🚀" },
  ],
  "#sales": [
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "9:00 AM", text: "Q1 pipeline is looking strong. We're at $1.18M against $500K quota. Let's keep pushing." },
    { name: "Marcus Lee", avatar: AVATARS.marcus, time: "9:15 AM", text: "Sporty Nation has been silent for 14 days. I'm drafting a re-engagement email today." },
    { name: "Rita Patel", avatar: AVATARS.rita, time: "9:45 AM", text: "Runners Club closed! $720K locked in. CFO signed this morning." },
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "10:00 AM", text: "Nice work Rita! I'll update the win/loss board." },
  ],
  "#q3-pipeline": [
    { name: "Daniel Kim", avatar: AVATARS.daniel, time: "Yesterday", text: "Updated the forecast spreadsheet with latest numbers. Pipeline is at $1.18M." },
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "Yesterday", text: "Sporty Nation is the biggest risk. 14 days silent, $270K at stake." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "10:30 AM", text: "Acme is moving — procurement loop is the last step. Should close by EOW." },
  ],
  "#deal-acme-q1-strategic": [
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "Monday", text: "Acme Q1 strategic plan: focus on exec sponsorship path via Priya → Daniel Kim." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "Monday", text: "I have a 1:1 with Daniel's EA next week. Will push for a 30-min exec intro." },
    { name: "Rita Patel", avatar: AVATARS.rita, time: "Tuesday", text: "Volume discount request is on the table — 3yr term, 15% off. Need approval from Sarah." },
  ],
  "#deal-runners": [
    { name: "Rita Patel", avatar: AVATARS.rita, time: "Yesterday", text: "CFO approved final terms! Runners Club is officially closed won — $720K." },
    { name: "Dana Torres", avatar: AVATARS.dana, time: "Yesterday", text: "Amazing news! The ROI deck was the tipping point. Well done team." },
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "Today", text: "Implementation kickoff scheduled for next Monday. Sending calendar invites now." },
  ],
  "#deal-sporty": [
    { name: "Marcus Lee", avatar: AVATARS.marcus, time: "Dec 18", text: "Last update from Chris Park — he mentioned internal budget review. Haven't heard back since." },
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "Dec 22", text: "Three follow-ups sent. No response. We need a Plan B — multi-thread above Chris." },
    { name: "Mike Torres", avatar: AVATARS.mike, time: "Today", text: "I found a connection to their VP Digital through LinkedIn. Want me to reach out?" },
  ],
  "#deal-techstart": [
    { name: "Lisa Park", avatar: AVATARS.lisa, time: "Yesterday", text: "TechStart QBR prep is ready. Slides uploaded to channel files." },
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "Today", text: "Reviewed the deck — looks solid. Added a few slides on product roadmap alignment." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "Today", text: "QBR is Friday 2pm. Let's do a dry run Thursday morning." },
  ],
};

const DM_MESSAGES: Record<string, Msg[]> = {
  "sarah-chen": [
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "9:00 AM", text: "Hey — can we sync on the Acme timeline? I want to make sure we're aligned before the board meeting." },
    { name: "You", avatar: AVATARS.you, time: "9:05 AM", text: "Sure! I just spoke with Daniel. Procurement is the last step. Should have an answer by EOD." },
    { name: "Sarah Chen", avatar: AVATARS.sarah, time: "9:10 AM", text: "Perfect. Also — keep me posted on Sporty Nation. I want to discuss it in our 1:1." },
  ],
  "priya-shah": [
    { name: "Priya Shah", avatar: AVATARS.priya, time: "Yesterday", text: "MSA redlines are done. Sent final version to Daniel's team. Should hear back tomorrow." },
    { name: "You", avatar: AVATARS.you, time: "Yesterday", text: "Great work! I'll follow up with procurement on our end." },
    { name: "Priya Shah", avatar: AVATARS.priya, time: "10:00 AM", text: "Daniel's EA confirmed the exec intro for next week. Things are moving!" },
  ],
  "jordan-hayes": [
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "10:30 AM", text: "Tech architecture doc for Acme is ready. Want to review before I share in the channel?" },
    { name: "You", avatar: AVATARS.you, time: "10:35 AM", text: "Yes please, send it over. I'll review in the next hour." },
    { name: "Jordan Hayes", avatar: AVATARS.jordan, time: "10:40 AM", text: "Sent! Also, I have POC slots open this week if any deals need hands-on support." },
  ],
  "dana-torres": [
    { name: "Dana Torres", avatar: AVATARS.dana, time: "Yesterday", text: "Runners Club implementation team is ready. Can we schedule the kickoff for Monday?" },
    { name: "You", avatar: AVATARS.you, time: "Yesterday", text: "Monday works! I'll set up the calendar invite. Great job closing this one." },
    { name: "Dana Torres", avatar: AVATARS.dana, time: "Today", text: "Thanks! Also sending over the onboarding checklist for your review." },
  ],
  "marcus-lee": [
    { name: "Marcus Lee", avatar: AVATARS.marcus, time: "11:00 AM", text: "Still no response from Chris Park at Sporty Nation. Should I try the breakup email approach?" },
    { name: "You", avatar: AVATARS.you, time: "11:05 AM", text: "Let's try multi-threading first. Mike found a LinkedIn connection to their VP Digital." },
    { name: "Marcus Lee", avatar: AVATARS.marcus, time: "11:10 AM", text: "Good idea. I'll coordinate with Mike and draft the outreach today." },
  ],
  "lisa-park": [
    { name: "Lisa Park", avatar: AVATARS.lisa, time: "Yesterday", text: "TechStart QBR slides are uploaded. Can you check the executive summary section?" },
    { name: "You", avatar: AVATARS.you, time: "Yesterday", text: "Looks good! Added a few notes on the competitive landscape slide." },
    { name: "Lisa Park", avatar: AVATARS.lisa, time: "Today", text: "Perfect. Dry run is Thursday 10am — I'll send the invite." },
  ],
  "daniel-kim": [
    { name: "Daniel Kim", avatar: AVATARS.daniel, time: "10:00 AM", text: "Procurement is reviewing the Acme contract. Should have final sign-off by end of week." },
    { name: "You", avatar: AVATARS.you, time: "10:05 AM", text: "Thanks Daniel. Is there anything they need from our side to speed this up?" },
    { name: "Daniel Kim", avatar: AVATARS.daniel, time: "10:15 AM", text: "Just the volume discount terms in writing. I'll send the template." },
  ],
  "mike-torres": [
    { name: "Mike Torres", avatar: AVATARS.mike, time: "Today", text: "Found a warm intro to Sporty Nation's VP Digital through a mutual connection." },
    { name: "You", avatar: AVATARS.you, time: "Today", text: "That's huge! Can you set up a casual intro call this week?" },
    { name: "Mike Torres", avatar: AVATARS.mike, time: "Today", text: "On it. I'll reach out today and loop you in once it's confirmed." },
  ],
  "aisha-raman": [
    {
      name: "Aisha Raman",
      avatar: AVATARS.aisha,
      time: "9:12 AM",
      text: "Hey — welcome to PRM on Slack! I'm Aisha, your channel manager. Glad to have you in the workspace. How's it going so far?",
    },
    {
      name: "You",
      avatar: AVATARS.you,
      time: "9:18 AM",
      text: "Hi Aisha — thanks for the welcome. Still finding my way around PRM in Slack but it's coming together. Appreciate you reaching out.",
    },
    {
      name: "Aisha Raman",
      avatar: AVATARS.aisha,
      time: "9:20 AM",
      text: "Anytime. If anything feels unclear or you want a quick tour of leads, MDF, or campaigns, just ping me here.",
    },
  ],
};

const AGENT_MESSAGES: Record<string, Msg[]> = {
  "af-employee": [
    { name: "Employee Agent", avatar: AVATARS.bot, time: "Just now", text: "Hi! I'm the Employee Agent. I can help you find information about company policies, benefits, and perform routine tasks. What can I help you with today?" },
  ],
  "af-support": [
    { name: "Agentforce Support Agent", avatar: AVATARS.bot, time: "Just now", text: "Welcome! I'm the Agentforce Support Agent. I can answer questions about Agentforce features, setup, and best practices. How can I assist you?" },
  ],
  "af-data": [
    { name: "Data Agent", avatar: AVATARS.bot, time: "Just now", text: "Hello! I help users discover and answer questions about data artifacts. Ask me about dashboards, reports, or data models." },
  ],
};

export function resolveChat(itemId: string): {
  title: string;
  messages: Msg[];
  headerAvatarUrl?: string;
  headerAvatarAlt?: string;
} {
  if (CHANNEL_MESSAGES[`#${itemId}`]) {
    return { title: `#${itemId}`, messages: CHANNEL_MESSAGES[`#${itemId}`] };
  }
  if (DM_MESSAGES[itemId]) {
    const name = itemId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const messages = DM_MESSAGES[itemId];
    const headerAvatarUrl = messages[0]?.avatar;
    return { title: name, messages, headerAvatarUrl, headerAvatarAlt: name };
  }
  if (AGENT_MESSAGES[itemId]) {
    const title =
      itemId.replace("af-", "").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") +
      " Agent";
    const messages = AGENT_MESSAGES[itemId];
    return {
      title,
      messages,
      headerAvatarUrl: messages[0]?.avatar,
      headerAvatarAlt: title,
    };
  }
  if (isChannelManagerPartnerChatId(itemId)) {
    const partner = CHANNEL_MANAGER_PARTNERS.find((x) => x.id === itemId);
    const turns = CHANNEL_MANAGER_PARTNER_MESSAGES[itemId];
    if (partner && turns?.length) {
      const messages: Msg[] = turns.map((t) => ({
        name: t.role === "you" ? "You" : partner.name,
        avatar: t.role === "you" ? AVATARS.you : partner.avatarUrl,
        time: t.time,
        text: t.text,
      }));
      return {
        title: partner.name,
        messages,
        headerAvatarUrl: partner.avatarUrl,
        headerAvatarAlt: partner.name,
      };
    }
  }
  return { title: `#${itemId}`, messages: CHANNEL_MESSAGES["#general"]! };
}

// ─── Reusable Chat Content (sidebar + chat + message input) ──────────────────

interface TemplateChatContentProps {
  channelName?: string;
  activeChatId?: string;
}

export function TemplateChatContent({ channelName, activeChatId }: TemplateChatContentProps) {
  const resolved = activeChatId ? resolveChat(activeChatId) : null;
  const title = resolved?.title ?? channelName ?? "#general";
  const messages = resolved?.messages ?? CHANNEL_MESSAGES[channelName ?? "#general"] ?? CHANNEL_MESSAGES["#general"]!;
  const headerAvatarUrl = resolved?.headerAvatarUrl;
  const headerAvatarAlt = resolved?.headerAvatarAlt ?? (typeof title === "string" ? title : "");
  const isCmPartnerThread =
    !!activeChatId && isChannelManagerPartnerChatId(activeChatId);

  return (
    <UniversalChatSurface
      title={title}
      icon={
        headerAvatarUrl ? (
          <img
            src={headerAvatarUrl}
            className="w-5 h-5 rounded"
            alt={headerAvatarAlt}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getAvatarUrl(headerAvatarAlt, 40);
            }}
          />
        ) : undefined
      }
      memberCount={isCmPartnerThread ? undefined : 12}
      placeholder={`Message ${title}`}
      onSendMessage={(text) => console.log("Send:", text)}
    >
      {messages.map((msg, i) => (
        <ChatMessage
          key={`${title}-${i}`}
          message={{
            id: `msg-${i}`,
            name: msg.name,
            avatar: msg.avatar,
            time: msg.time,
            text: msg.text,
          }}
        />
      ))}
    </UniversalChatSurface>
  );
}

// ─── Sales View (full-width) ────────────────────────────────────────────────

const PIPELINE_DEALS = [
  { name: "Acme Corp", amount: "$89K", stage: "Negotiation", health: "bg-orange-500", close: "Feb 28" },
  { name: "Greentech Solutions", amount: "$60K", stage: "Proposal", health: "bg-emerald-500", close: "Mar 15" },
  { name: "NovaCorp", amount: "$45K", stage: "Legal Review", health: "bg-amber-500", close: "Jan 31" },
  { name: "Runners Inc", amount: "$720K", stage: "Closed Won", health: "bg-emerald-500", close: "Today" },
  { name: "Sporty Nation", amount: "$270K", stage: "Discovery", health: "bg-red-500", close: "Mar 31" },
];

export function TemplateSalesView() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: "1px solid #E8E8E8" }}>
        <div className="flex items-center gap-3">
          <h2 className="text-[17px] font-bold text-gray-900">Sales</h2>
          <span className="text-[13px] text-gray-400">Q1 Pipeline</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[900px] mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Pipeline", value: "$1.18M", sub: "5 active deals" },
              { label: "Quota", value: "$500K", sub: "Q1 Target" },
              { label: "Win Rate", value: "52%", sub: "↑ from 48% Q3" },
            ].map((card) => (
              <div key={card.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">{card.label}</span>
                <div className="text-[28px] font-bold text-gray-900 mt-1">{card.value}</div>
                <span className="text-[12px] text-gray-400">{card.sub}</span>
              </div>
            ))}
          </div>
          <h3 className="text-[15px] font-bold text-gray-900 mb-4">Active Deals</h3>
          <div className="space-y-2">
            {PIPELINE_DEALS.map((deal) => (
              <div key={deal.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${deal.health}`} />
                  <div>
                    <span className="text-[14px] font-bold text-gray-900">{deal.name}</span>
                    <span className="text-[12px] text-gray-500 ml-2">{deal.stage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-[14px] font-bold text-gray-900">{deal.amount}</span>
                  <span className="text-[12px] text-gray-400 w-16">{deal.close}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Files View (full-width, matching Slack "All files") ─────────────────────

const TEMPLATE_CARDS = [
  { title: "Employee Onboarding", desc: "Welcome new people.", color: "bg-blue-50", accent: "border-blue-200" },
  { title: "Project tracker", desc: "Manage and monitor tasks as a team", color: "bg-orange-50", accent: "border-orange-200" },
  { title: "Monthly Newsletter", desc: "Broadcast your announcements.", color: "bg-yellow-50", accent: "border-yellow-200" },
  { title: "Feedback tracker", desc: "A streamlined approach to feedback.", color: "bg-purple-50", accent: "border-purple-200" },
];

const FILE_LIST = [
  { name: "Today Feature Overview", author: "Maya Holikatti", date: "Last viewed on February 26th", read: "1 min read", starred: false },
  { name: "Sales Cloud UX Pattern Group V2MOM", author: "Chris Fox", date: "Last viewed on February 26th", read: "3 min read", starred: false },
  { name: "Welcome to #broadcast-the-daily", author: "Slackbot", date: "Last viewed on February 20th", read: "4 min read", starred: false },
  { name: "AI Coding Tools: How to Stretch Your Budget", author: "Nicolas Arkhipenko", date: "Last viewed on February 16th", read: "18 min read", starred: false },
  { name: "Exp. Org Guidelines for Prototyping", author: "Cliff Seal", date: "Last viewed on February 11th", read: "5 min read", starred: true },
  { name: "2nd Brain Program overview", author: "Shir Zalzberg", date: "Last viewed on February 11th", read: "5 min read", starred: false },
  { name: "2nd brain — Goal & Weekly Tracker", author: "Shir Zalzberg", date: "Last viewed on February 11th", read: "1 min read", starred: false },
  { name: "UI Explorations Exec Review", author: "Mike Lenz", date: "Last viewed on February 6th", read: "", starred: false },
  { name: "Frame and Resolution Guidelines", author: "Justin Carter", date: "Last viewed on February 4th", read: "1 min read", starred: false },
];

export function TemplateFilesView() {
  const [activeTab, setActiveTab] = useState("all");
  const [showTemplates, setShowTemplates] = useState(true);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[900px] mx-auto px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[22px] font-bold text-gray-900">All files</h1>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--shell-cta)] text-white text-[13px] font-bold rounded-lg hover:bg-[var(--shell-cta-hover)] transition-colors">
              + New
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:shadow-[0_0_0_1px_#1d9bd1]">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="Search files" className="flex-1 bg-transparent outline-none text-[14px] text-gray-900 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Templates section */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 text-[14px] font-bold text-gray-900 mb-3 hover:text-gray-700"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? "" : "-rotate-90"}`} />
            Templates
          </button>
          {showTemplates && (
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              {TEMPLATE_CARDS.map((t) => (
                <div key={t.title} className={`min-w-[200px] max-w-[200px] ${t.color} border ${t.accent} rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow shrink-0`}>
                  <div className="h-[80px] mb-3 rounded-lg bg-white/60 border border-white/80" />
                  <p className="text-[13px] font-bold text-gray-900">{t.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "All" },
                { id: "created", label: "Created by you" },
                { id: "shared", label: "Shared with you" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#1d9bd1] text-white border-[#1d9bd1]"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                5 Types <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Recently viewed <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* File list */}
          <div className="divide-y divide-gray-100">
            {FILE_LIST.map((file) => (
              <div key={file.name} className="flex items-center py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors group">
                <div className="w-5 h-5 rounded-full bg-purple-100 shrink-0 mr-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-[12px] text-gray-500">{file.author} · {file.date}{file.read ? ` · ${file.read}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {file.starred ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <Star className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agentforce Content (sidebar + agent grid, matching Slack Agentforce) ────

const AGENT_CARDS = [
  { name: "Agentforce Support Agent", org: "Salesforce EPIC360", desc: "Help users answer all the questions related to Agentforce", color: "bg-blue-600", prompts: ["What is Agentforce and how does it work?", "Can you help me understand the features ..."] },
  { name: "Badgeforce Agent", org: "SFDC Corporate Security", desc: "I'm your AI Badgeforce Agent! I'm here to help with your access control questions.", color: "bg-cyan-600", prompts: [] },
  { name: "Central Performance Productio...", org: "Salesforce EPIC360", desc: "Central Performance Production AEA is managed by Central Performance Production Team.", color: "bg-teal-600", prompts: [] },
  { name: "CKO Agent", org: "Salesforce", desc: "FY27 Company Kickoff has wrapped, but you can still share feedback through the surveys.", color: "bg-indigo-600", prompts: [] },
  { name: "Data Agent", org: "OrgEmp", desc: "Hello! I help users discover and answer questions about data artifacts created and maintained by the Data and Analytics team.", color: "bg-purple-600", prompts: ["What prompts does Data Agent support?", "What are the usage statistics for the ACT ..."] },
  { name: "Data Modeling Agent", org: "Salesforce EPIC360", desc: "Helps you discover entities across Salesforce data models (Core or Data Cloud objects).", color: "bg-violet-600", prompts: [] },
  { name: "Employee Agent", org: "OrgEmp", desc: "Employee Agent is an AI Agent that helps you find information and perform routine tasks.", color: "bg-sky-500", prompts: [] },
  { name: "EPIC Analytics Agent", org: "Salesforce EPIC360", desc: "Help people see and understand data with conversational analytics.", color: "bg-blue-500", prompts: [] },
  { name: "EPIC OrgFarm Agent", org: "Salesforce EPIC360", desc: "Everything you need about and around #OrgFarm", color: "bg-slate-600", prompts: [] },
];

export function TemplateAgentforceContent() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #E8E8E8" }}>
        <h1 className="text-[20px] font-bold text-gray-900">All agents</h1>
        <button className="px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          Give feedback
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          {/* Hero */}
          <div className="text-center mb-8">
            <h2 className="text-[24px] font-bold text-gray-900 mb-2">
              Assemble your <span className="text-purple-600">Agentforce</span> team
            </h2>
            <p className="text-[14px] text-gray-500 max-w-[500px] mx-auto leading-relaxed">
              You're already one impressive human. Together with AI agents, you'll be a force to be
              reckoned with. Browse agents that take the grunt work out of your day, and the guesswork
              out of decisions.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl focus-within:border-purple-400 focus-within:shadow-[0_0_0_1px_#a78bfa]">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="Search agents" className="flex-1 bg-transparent outline-none text-[14px] text-gray-900 placeholder:text-gray-400" />
            </div>
          </div>

          {/* Browse header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">Browse AI agents</h3>
            <button className="flex items-center gap-1 text-[13px] text-gray-600 hover:text-gray-900">
              All Salesforce Orgs <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENT_CARDS.map((agent) => (
              <div key={agent.name} className="border border-gray-200 rounded-xl p-4 hover:shadow-md cursor-pointer transition-all hover:border-gray-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${agent.color} flex items-center justify-center shrink-0`}>
                    <img src={assetPath("/slackbot-logo.svg")} alt="" className="w-5 h-5 opacity-90" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{agent.name}</p>
                    <p className="text-[11px] text-gray-500">{agent.org}</p>
                  </div>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-3 line-clamp-2">{agent.desc}</p>
                {agent.prompts.length > 0 && (
                  <div className="space-y-1.5">
                    {agent.prompts.map((prompt) => (
                      <div key={prompt} className="text-[12px] text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5 truncate cursor-pointer hover:bg-purple-100 transition-colors">
                        {prompt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Command Center (full-width) ──────────────────────────────────────

const COMMAND_METRICS = [
  { label: "Q1 Commit", value: "$1.18M", trend: "+12% vs last week" },
  { label: "At Risk", value: "$312K", trend: "2 deals need exec support" },
  { label: "Next 7 Days", value: "8 meetings", trend: "3 with procurement" },
];

const COMMAND_PRIORITIES = [
  {
    title: "Acme Corp procurement follow-up",
    owner: "Rita Patel",
    channel: "#deal-acme",
    time: "Today · 2:30 PM",
    status: "Needs response",
    statusStyle: "bg-amber-100 text-amber-700",
  },
  {
    title: "Sporty Nation re-engagement plan",
    owner: "Marcus Lee",
    channel: "#deal-sporty",
    time: "Today · 4:00 PM",
    status: "At risk",
    statusStyle: "bg-rose-100 text-rose-700",
  },
  {
    title: "TechStart QBR dry run checklist",
    owner: "Lisa Park",
    channel: "#deal-techstart",
    time: "Tomorrow · 10:00 AM",
    status: "On track",
    statusStyle: "bg-emerald-100 text-emerald-700",
  },
];

const COMMAND_RECENT_UPDATES = [
  {
    title: "Priya Shah shared final legal redlines for Acme.",
    meta: "#deal-acme · 18 min ago",
  },
  {
    title: "Jordan Hayes posted implementation scope for Greentech.",
    meta: "#deal-greentech · 32 min ago",
  },
  {
    title: "Dana Torres confirmed kickoff timeline with Runners Club.",
    meta: "#deal-runners · 1 hr ago",
  },
];

type LeadRecord = {
  id: string;
  name: string;
  email: string;
  account: string;
  rating: "Warm" | "Hot" | "Cool";
  state: string;
  status: "New" | "Working" | "Qualified" | "Contacted";
  owner: string;
  stage: "New" | "Contacted" | "Qualified" | "Nurture";
  source: "Web" | "Event" | "Partner" | "Outbound";
  score: number;
  value: string;
  updated: string;
};

const LEAD_ROWS: LeadRecord[] = [
  { id: "L-1023", name: "William Ravenwood", email: "wravenwood@example.com", account: "Flextech, Inc.", rating: "Warm", state: "IL", status: "New", owner: "Aisha Raman", stage: "Qualified", source: "Partner", score: 92, value: "$180K", updated: "2h ago" },
  { id: "L-1018", name: "Trevor Atz", email: "tatz@example.com", account: "Big Blue Consulting", rating: "Warm", state: "CA", status: "New", owner: "Noah Kim", stage: "Contacted", source: "Web", score: 76, value: "$60K", updated: "Today" },
  { id: "L-1014", name: "Tisha Goetz", email: "tgoetz@example.com", account: "S & S Canopies", rating: "Warm", state: "IN", status: "Working", owner: "Caleb Stone", stage: "Nurture", source: "Event", score: 64, value: "$55K", updated: "Yesterday" },
  { id: "L-1009", name: "Tenisha Mabery", email: "tmabery@example.com", account: "J R Gillis Assoc", rating: "Hot", state: "CA", status: "Working", owner: "Prantik Banerjee", stage: "New", source: "Outbound", score: 48, value: "$42K", updated: "1d ago" },
  { id: "L-1001", name: "Rosa Abelin", email: "roabelin@example.com", account: "Universe Design", rating: "Warm", state: "TX", status: "Qualified", owner: "Aisha Raman", stage: "Qualified", source: "Partner", score: 88, value: "$95K", updated: "3h ago" },
  { id: "L-0997", name: "Ron Abelin", email: "rabelin@example.com", account: "DataTek Applications", rating: "Hot", state: "CA", status: "New", owner: "Noah Kim", stage: "Contacted", source: "Web", score: 79, value: "$51K", updated: "Today" },
  { id: "L-0991", name: "Riley Shultz", email: "rshultz@example.com", account: "Interstate Brands", rating: "Warm", state: "MA", status: "Qualified", owner: "Caleb Stone", stage: "Qualified", source: "Partner", score: 85, value: "$74K", updated: "5h ago" },
  { id: "L-0987", name: "Rick Stein", email: "rstein@example.com", account: "Solstice, Inc.", rating: "Cool", state: "WA", status: "New", owner: "Aisha Raman", stage: "New", source: "Event", score: 58, value: "$33K", updated: "6h ago" },
  { id: "L-0982", name: "Monte Scharff", email: "mscharff@example.com", account: "Cardinal Distributing", rating: "Hot", state: "MA", status: "Working", owner: "Noah Kim", stage: "Contacted", source: "Web", score: 81, value: "$69K", updated: "Today" },
  { id: "L-0976", name: "Mellissa Harwood", email: "mharwood@example.com", account: "Williams Plumbing", rating: "Warm", state: "TX", status: "Working", owner: "Caleb Stone", stage: "Nurture", source: "Outbound", score: 71, value: "$48K", updated: "Yesterday" },
  { id: "L-0971", name: "Maye Head", email: "mhead@example.com", account: "Ram Tool & Supply", rating: "Warm", state: "FL", status: "Working", owner: "Prantik Banerjee", stage: "Contacted", source: "Partner", score: 74, value: "$52K", updated: "1d ago" },
  { id: "L-0968", name: "Mary Conners", email: "mconners@example.com", account: "Storage Solutions, Inc.", rating: "Warm", state: "CA", status: "Contacted", owner: "Aisha Raman", stage: "Contacted", source: "Web", score: 67, value: "$41K", updated: "Today" },
  { id: "L-0961", name: "Linda Collins", email: "lcollins@example.com", account: "Collingwood Enterprises", rating: "Warm", state: "MN", status: "New", owner: "Noah Kim", stage: "New", source: "Event", score: 62, value: "$37K", updated: "2d ago" },
  { id: "L-0956", name: "Lee Ortis", email: "lortis@example.com", account: "Daily Interlake", rating: "Cool", state: "CO", status: "Working", owner: "Caleb Stone", stage: "Nurture", source: "Outbound", score: 55, value: "$29K", updated: "2d ago" },
  { id: "L-0950", name: "Ava Kirchner", email: "akirchner@example.com", account: "Northline Logistics", rating: "Hot", state: "NY", status: "Qualified", owner: "Prantik Banerjee", stage: "Qualified", source: "Partner", score: 90, value: "$120K", updated: "4h ago" },
  { id: "L-0942", name: "Nolan Briggs", email: "nbriggs@example.com", account: "Peak Retail Group", rating: "Warm", state: "AZ", status: "Working", owner: "Aisha Raman", stage: "Contacted", source: "Web", score: 73, value: "$57K", updated: "Yesterday" },
  { id: "L-0937", name: "Elena Moss", email: "emoss@example.com", account: "Vertex BioLabs", rating: "Hot", state: "NC", status: "Qualified", owner: "Noah Kim", stage: "Qualified", source: "Partner", score: 87, value: "$98K", updated: "5h ago" },
  { id: "L-0931", name: "Harper Sloan", email: "hsloan@example.com", account: "Summit Health Works", rating: "Warm", state: "UT", status: "Contacted", owner: "Caleb Stone", stage: "Contacted", source: "Event", score: 69, value: "$44K", updated: "Today" },
  { id: "L-0926", name: "Gavin Doyle", email: "gdoyle@example.com", account: "Blue Harbor Labs", rating: "Cool", state: "OR", status: "New", owner: "Prantik Banerjee", stage: "New", source: "Outbound", score: 53, value: "$31K", updated: "3d ago" },
  { id: "L-0920", name: "Sonia Rivas", email: "srivas@example.com", account: "Orbit Commerce", rating: "Warm", state: "NV", status: "Working", owner: "Aisha Raman", stage: "Nurture", source: "Web", score: 72, value: "$46K", updated: "1d ago" },
  { id: "L-0914", name: "Derek Holland", email: "dholland@example.com", account: "Crestline Partners", rating: "Hot", state: "PA", status: "Qualified", owner: "Noah Kim", stage: "Qualified", source: "Partner", score: 91, value: "$132K", updated: "2h ago" },
  { id: "L-0908", name: "Priyanka Nair", email: "pnair@example.com", account: "Sable Security", rating: "Warm", state: "VA", status: "Contacted", owner: "Caleb Stone", stage: "Contacted", source: "Event", score: 68, value: "$43K", updated: "Today" },
  { id: "L-0902", name: "Owen Park", email: "opark@example.com", account: "Helio Manufacturing", rating: "Cool", state: "MI", status: "Working", owner: "Prantik Banerjee", stage: "Nurture", source: "Outbound", score: 57, value: "$35K", updated: "2d ago" },
];

function statusPillClass(status: LeadRecord["status"]) {
  if (status === "New") return "bg-[var(--shell-badge-tonal-bg)] text-[var(--shell-badge-tonal-text)]";
  if (status === "Working") return "bg-[#f3e8ff] text-[#7e22ce]";
  if (status === "Qualified") return "bg-[#fff3e0] text-[#b45309]";
  return "bg-[#f3f4f6] text-[#4b5563]";
}

function ratingPillClass(rating: LeadRecord["rating"]) {
  if (rating === "Hot") return "bg-[#e8edff] text-[#3348a3]";
  if (rating === "Warm") return "bg-[#f7e8ff] text-[#8a2ca0]";
  return "bg-[#ececec] text-[#525252]";
}

type OpportunityStage =
  | "Discovery"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Perception Analysis"
  | "Closed Won";

type OpportunityRecord = {
  id: string;
  name: string;
  account: string;
  amount: string;
  stage: OpportunityStage;
  closeDate: string;
  owner: string;
  probability: string;
  type: string;
  partner: string;
};

const OPPORTUNITY_ROWS: OpportunityRecord[] = [
  { id: "O-8841", name: "Acme Q3 Platform Expansion", account: "Acme Corp", amount: "$180,000", stage: "Negotiation", closeDate: "Apr 28, 2026", owner: "Aisha Raman", probability: "65%", type: "New Business", partner: "CloudWave Systems" },
  { id: "O-8832", name: "Greentech Renewal + Upsell", account: "Greentech", amount: "$62,500", stage: "Proposal", closeDate: "May 12, 2026", owner: "Noah Kim", probability: "50%", type: "Renewal", partner: "Vertex Alliance" },
  { id: "O-8824", name: "Sporty Nation Net New", account: "Sporty Nation", amount: "$42,000", stage: "Qualification", closeDate: "Jun 3, 2026", owner: "Caleb Stone", probability: "35%", type: "New Business", partner: "Northstar Digital" },
  { id: "O-8819", name: "Runners Club Implementation", account: "Runners Club", amount: "$720,000", stage: "Closed Won", closeDate: "Mar 1, 2026", owner: "Rita Patel", probability: "100%", type: "New Business", partner: "CloudWave Systems" },
  { id: "O-8811", name: "TechStart QBR Upsell", account: "TechStart", amount: "$95,000", stage: "Discovery", closeDate: "Jul 15, 2026", owner: "Aisha Raman", probability: "25%", type: "Upsell", partner: "BluePeak Tech" },
  { id: "O-8805", name: "Flextech Service Cloud", account: "Flextech, Inc.", amount: "$118,000", stage: "Qualification", closeDate: "May 22, 2026", owner: "Noah Kim", probability: "40%", type: "New Business", partner: "Vertex Alliance" },
  { id: "O-8798", name: "Northline Logistics Pilot", account: "Northline Logistics", amount: "$54,000", stage: "Proposal", closeDate: "Apr 18, 2026", owner: "Prantik Banerjee", probability: "55%", type: "Pilot", partner: "Northstar Digital" },
  { id: "O-8791", name: "Vertex BioLabs Compliance", account: "Vertex BioLabs", amount: "$210,000", stage: "Negotiation", closeDate: "Jun 30, 2026", owner: "Aisha Raman", probability: "70%", type: "New Business", partner: "CloudWave Systems" },
  { id: "O-8784", name: "Summit Health ELA", account: "Summit Health Works", amount: "$340,000", stage: "Perception Analysis", closeDate: "Aug 8, 2026", owner: "Caleb Stone", probability: "30%", type: "Enterprise", partner: "BluePeak Tech" },
  { id: "O-8776", name: "Orbit Commerce B2B Store", account: "Orbit Commerce", amount: "$76,000", stage: "Discovery", closeDate: "Sep 1, 2026", owner: "Noah Kim", probability: "20%", type: "New Business", partner: "Vertex Alliance" },
  { id: "O-8769", name: "Crestline Partners Co-sell", account: "Crestline Partners", amount: "$132,000", stage: "Proposal", closeDate: "May 5, 2026", owner: "Aisha Raman", probability: "45%", type: "Partner", partner: "CloudWave Systems" },
  { id: "O-8762", name: "Sable Security Add-on", account: "Sable Security", amount: "$28,500", stage: "Qualification", closeDate: "Apr 30, 2026", owner: "Caleb Stone", probability: "38%", type: "Add-on", partner: "Northstar Digital" },
  { id: "O-8755", name: "Helio Manufacturing IoT", account: "Helio Manufacturing", amount: "$189,000", stage: "Negotiation", closeDate: "Jul 22, 2026", owner: "Prantik Banerjee", probability: "60%", type: "New Business", partner: "BluePeak Tech" },
  { id: "O-8748", name: "Peak Retail POS Refresh", account: "Peak Retail Group", amount: "$51,200", stage: "Discovery", closeDate: "Oct 10, 2026", owner: "Noah Kim", probability: "22%", type: "Refresh", partner: "Vertex Alliance" },
  { id: "O-8741", name: "Blue Harbor R&D Sandbox", account: "Blue Harbor Labs", amount: "$12,000", stage: "Qualification", closeDate: "Apr 12, 2026", owner: "Aisha Raman", probability: "33%", type: "Sandbox", partner: "CloudWave Systems" },
  { id: "O-8734", name: "Cardinal Distributing Rollout", account: "Cardinal Distributing", amount: "$267,000", stage: "Proposal", closeDate: "Jun 18, 2026", owner: "Caleb Stone", probability: "48%", type: "Rollout", partner: "Northstar Digital" },
  { id: "O-8727", name: "Williams Plumbing Field Service", account: "Williams Plumbing", amount: "$44,800", stage: "Negotiation", closeDate: "May 30, 2026", owner: "Noah Kim", probability: "62%", type: "New Business", partner: "Vertex Alliance" },
  { id: "O-8720", name: "DataTek Applications Upgrade", account: "DataTek Applications", amount: "$88,000", stage: "Closed Won", closeDate: "Feb 14, 2026", owner: "Aisha Raman", probability: "100%", type: "Upgrade", partner: "CloudWave Systems" },
];

function stagePillClassForOpp(stage: OpportunityStage) {
  if (stage === "Closed Won") return "bg-emerald-100 text-emerald-800";
  if (stage === "Negotiation") return "bg-orange-100 text-orange-800";
  if (stage === "Proposal") return "bg-amber-100 text-amber-900";
  if (stage === "Qualification") return "bg-[var(--shell-badge-tonal-bg)] text-[var(--shell-badge-tonal-text)]";
  if (stage === "Discovery") return "bg-[#f3f4f6] text-[#4b5563]";
  return "bg-purple-100 text-purple-800";
}

export function TemplatePartnerLeadsView() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [logCallComments, setLogCallComments] = useState("");
  const selectedLead = LEAD_ROWS.find((row) => row.id === selectedLeadId) ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#1f2937]" />
            <h1 className="text-[22px] font-bold text-[#1f2937]">My Open Leads</h1>
            <span className="text-[12px] font-semibold text-[var(--shell-badge-tonal-text)] bg-[var(--shell-badge-tonal-bg)] rounded-md px-2 py-0.5">
              Leads
            </span>
          </div>
          <button type="button" className="text-[13px] text-gray-500 hover:text-gray-700">
            Share
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-100 shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <button type="button" className="h-8 px-3 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            Edit view
          </button>
          <div className="h-8 w-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <button type="button" className="h-8 px-3 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            Sort: 1
          </button>
          <button type="button" className="h-8 px-3 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            Rating is any of
          </button>
        </div>
        <button
          type="button"
          className="h-8 shrink-0 px-3 rounded-md text-[13px] font-semibold bg-[var(--shell-cta)] text-white border border-[var(--shell-cta)] hover:bg-[var(--shell-cta-hover)] hover:border-[var(--shell-cta-hover)] shadow-sm"
        >
          Add a lead
        </button>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className={`${selectedLead ? "w-[62%]" : "w-full"} min-w-0 overflow-auto border-r border-gray-200`}>
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#fafafa] border-b border-gray-200">
              <tr className="text-[12px] text-gray-500">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">State/Province</th>
                <th className="px-4 py-3 font-semibold">Lead Status</th>
              </tr>
            </thead>
            <tbody>
              {LEAD_ROWS.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${selectedLeadId === row.id ? "bg-[#eaf6fb]" : ""}`}
                >
                  <td className="px-6 py-3 text-[14px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(row.id)}
                      className="text-[#1f4f75] hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-[#1f6f95]">{row.email}</td>
                  <td className="px-4 py-3 text-[14px] text-gray-700">{row.account}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ${ratingPillClass(row.rating)}`}>
                      {row.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-700">{row.state}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ${statusPillClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedLead && (
          <div className="w-[38%] min-w-[340px] max-w-[460px] h-full overflow-auto bg-white">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[12px] text-gray-500">Lead</p>
                <h2 className="text-[28px] font-bold text-gray-900 leading-tight">{selectedLead.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="text-[18px] text-gray-400 hover:text-gray-700"
                aria-label="Close details panel"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-6 text-[13px]">
                <button type="button" className="font-semibold text-[#6a2a7b] border-b-2 border-[#6a2a7b] pb-1">
                  Details
                </button>
                <button type="button" className="text-gray-500 hover:text-gray-700 pb-1">
                  Conversations
                </button>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-semibold text-gray-900">Quick actions</h3>
                  <button type="button" className="text-[12px] text-[#1f6f95] hover:underline">
                    See all actions
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLogCallModalOpen(true)}
                    className="h-12 rounded-xl border border-gray-200 bg-[#f8fafc] text-[13px] font-semibold text-gray-800 hover:bg-[#f1f5f9]"
                  >
                    Log a Call
                  </button>
                  <button type="button" className="h-12 rounded-xl border border-gray-200 bg-[#f8fafc] text-[13px] font-semibold text-gray-800 hover:bg-[#f1f5f9]">
                    Email
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-[#fafafa] border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-800">Record details</h3>
                  <button type="button" className="text-[12px] text-[#1f6f95] hover:underline">
                    Open in Salesforce
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Lead ID</span>
                    <span className="text-gray-900 font-medium">{selectedLead.id}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">First Name</span>
                    <span className="text-gray-900">{selectedLead.name.split(" ")[0]}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Last Name</span>
                    <span className="text-gray-900">{selectedLead.name.split(" ").slice(1).join(" ")}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Lead Owner</span>
                    <span className="text-gray-900">{selectedLead.owner}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Company</span>
                    <span className="text-gray-900">{selectedLead.account}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Email</span>
                    <span className="text-[#1f6f95]">{selectedLead.email}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">State</span>
                    <span className="text-gray-900">{selectedLead.state}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Lead Status</span>
                    <span className="text-gray-900">{selectedLead.status}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Rating</span>
                    <span className="text-gray-900">{selectedLead.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLogCallModalOpen && selectedLead && (
        <div className="absolute inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] max-h-[70vh] bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-[#3558d4] text-white flex items-center justify-center text-[12px]">
                  📇
                </div>
                <h2 className="text-[24px] leading-none font-semibold text-[#1f2328]">Log a Call</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLogCallModalOpen(false)}
                className="text-[20px] leading-none text-gray-400 hover:text-gray-700"
                aria-label="Close log a call modal"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3.5 overflow-auto max-h-[calc(70vh-116px)]">
              <p className="text-[14px] italic text-gray-600 mb-4">
                <span className="text-[#c81e5b]">*</span> Indicates a required field
              </p>

              <div className="mb-4">
                <label className="block text-[18px] font-semibold text-[#1f2328] mb-2">Subject</label>
                <button
                  type="button"
                  className="w-full h-[42px] px-3 rounded-lg border border-gray-300 text-[15px] text-left text-gray-700 flex items-center justify-between"
                >
                  Call
                  <span className="text-[14px] text-gray-500">⌄</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-[20px] font-semibold text-[#1f2328] mb-4">Details</h3>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-[90px_1fr] items-center gap-2.5">
                    <span className="text-[14px] text-[#1f2328]">Comments</span>
                    <textarea
                      value={logCallComments}
                      onChange={(e) => setLogCallComments(e.target.value)}
                      placeholder="Add text"
                      rows={2}
                      className="w-full resize-none rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3558d4]/30 focus:border-[#3558d4]"
                    />
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-center gap-2.5">
                    <span className="text-[14px] text-[#1f2328]">Name</span>
                    <div className="inline-flex w-fit items-center rounded-md bg-[#e9f6ff] px-2.5 py-1 text-[13px] font-semibold text-[#1f2328]">
                      {selectedLead.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-start gap-2.5">
                    <span className="text-[14px] text-[#1f2328] mt-0.5">Related To</span>
                    <p className="text-[13px] leading-snug text-gray-500">
                      You can&apos;t add related records when the person you select in the Name field is a lead.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end bg-[#fafafa]">
              <button
                type="button"
                className="h-9 px-5 rounded-lg bg-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TemplateLeadsView() {
  type ApprovalTab = "mdf" | "deal-registration" | "partner-application";
  const [activeTab, setActiveTab] = useState<ApprovalTab>("mdf");

  const mdfApprovals = [
    { partner: "CloudWave Systems", requestId: "MDF-4421", campaign: "Q2 Demand Gen", amount: "$12,500", submitted: "2h ago", owner: "Aisha Raman" },
    { partner: "Vertex Alliance", requestId: "MDF-4418", campaign: "ABM Webinar Series", amount: "$8,900", submitted: "Today", owner: "Noah Kim" },
    { partner: "BluePeak Tech", requestId: "MDF-4402", campaign: "Regional Event Sponsorship", amount: "$15,000", submitted: "Yesterday", owner: "Caleb Stone" },
  ];

  const dealApprovals = [
    { partner: "CloudWave Systems", dealId: "DR-9031", account: "Acme Corp", value: "$180K", stage: "Qualification", submitted: "1h ago" },
    { partner: "Vertex Alliance", dealId: "DR-9022", account: "Greentech", value: "$60K", stage: "Discovery", submitted: "Today" },
    { partner: "Northstar Digital", dealId: "DR-8997", account: "Sporty Nation", value: "$42K", stage: "Proposal", submitted: "Yesterday" },
  ];

  const partnerApprovals = [
    { company: "Summit Data Labs", appId: "PA-218", region: "North America", tier: "Gold", submittedBy: "Mira Patel", submitted: "3h ago" },
    { company: "Catalyst Edge", appId: "PA-216", region: "EMEA", tier: "Silver", submittedBy: "Jon Park", submitted: "Today" },
    { company: "Apex RevOps", appId: "PA-209", region: "APAC", tier: "Gold", submittedBy: "Lena Xu", submitted: "Yesterday" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-200">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Review and action channel manager approvals in one place.</p>
        </div>
      </div>

      <div className="px-6 pt-0 pb-0 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-6">
          {[
            { id: "mdf", label: "MDF approvals" },
            { id: "deal-registration", label: "Deal registration approval" },
            { id: "partner-application", label: "Partner application approval" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ApprovalTab)}
              className={`relative py-3 text-[14px] transition-colors ${
                activeTab === tab.id
                  ? "text-[#1f2328] font-semibold"
                  : "text-[#8a8f98] hover:text-[#4b5563] font-normal"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#0f8b74] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === "mdf" && (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr className="text-[12px] text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-semibold">Partner</th>
                <th className="px-4 py-3 font-semibold">Request ID</th>
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mdfApprovals.map((row) => (
                <tr key={row.requestId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 text-[13px] font-semibold text-gray-900">{row.partner}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.requestId}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.campaign}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{row.amount}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">{row.submitted}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.owner}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] border border-gray-300 text-gray-700 hover:bg-gray-100">View details</button>
                      <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] font-semibold bg-[var(--shell-cta)] text-white hover:bg-[var(--shell-cta-hover)]">Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "deal-registration" && (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr className="text-[12px] text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-semibold">Partner</th>
                <th className="px-4 py-3 font-semibold">Deal ID</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dealApprovals.map((row) => (
                <tr key={row.dealId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 text-[13px] font-semibold text-gray-900">{row.partner}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.dealId}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.account}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{row.value}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.stage}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">{row.submitted}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] border border-gray-300 text-gray-700 hover:bg-gray-100">View details</button>
                      <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] font-semibold bg-[var(--shell-cta)] text-white hover:bg-[var(--shell-cta-hover)]">Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "partner-application" && (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr className="text-[12px] text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Application ID</th>
                <th className="px-4 py-3 font-semibold">Region</th>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Submitted by</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partnerApprovals.map((row) => (
                <tr key={row.appId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 text-[13px] font-semibold text-gray-900">{row.company}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.appId}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.region}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.tier}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{row.submittedBy}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">{row.submitted}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] border border-gray-300 text-gray-700 hover:bg-gray-100">View details</button>
                      <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] font-semibold bg-[var(--shell-cta)] text-white hover:bg-[var(--shell-cta-hover)]">Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PartnerPageShell({
  title,
  subtitle,
  meta,
  headers,
  rows,
}: {
  title: string;
  subtitle: string;
  meta: Array<{ label: string; value: string }>;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-200">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">{title}</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-100 shrink-0">
        <div className="grid grid-cols-3 gap-3">
          {meta.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="text-[15px] font-semibold text-gray-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr className="text-[12px] text-gray-500 uppercase tracking-wide">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${title}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                {row.map((cell, cidx) => (
                  <td key={`${idx}-${cidx}`} className="px-4 py-3 text-[13px] text-gray-700">{cell}</td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] border border-gray-300 text-gray-700 hover:bg-gray-100">View details</button>
                    <button type="button" className="px-2.5 py-1.5 rounded-md text-[12px] font-semibold bg-[var(--shell-cta)] text-white hover:bg-[var(--shell-cta-hover)]">Approve</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TemplatePartnerContactsView() {
  return (
    <PartnerPageShell
      title="Contacts"
      subtitle="Manage partner contacts awaiting approval and profile updates."
      meta={[
        { label: "Pending", value: "14" },
        { label: "Needs verification", value: "5" },
        { label: "SLA", value: "24h" },
      ]}
      headers={["Contact", "Partner", "Role", "Email", "Status"]}
      rows={[
        ["Mira Patel", "CloudWave Systems", "Partner Manager", "mira@cloudwave.io", "Pending"],
        ["Jon Park", "Vertex Alliance", "Sales Lead", "jon@vertexalliance.com", "Pending"],
        ["Rhea Thomas", "Northstar Digital", "Campaign Lead", "rhea@northstar.digital", "Review"],
      ]}
    />
  );
}

export function TemplatePartnerOpportunityView() {
  const { requestRegisterDealPrompt } = useDealRegistrationPrompt();
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [logCallComments, setLogCallComments] = useState("");
  const selectedOpp = OPPORTUNITY_ROWS.find((row) => row.id === selectedOppId) ?? null;

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#1f2937]" />
            <h1 className="text-[22px] font-bold text-[#1f2937]">My Open Opportunities</h1>
            <span className="text-[12px] font-semibold text-[var(--shell-badge-tonal-text)] bg-[var(--shell-badge-tonal-bg)] rounded-md px-2 py-0.5">
              Opportunities
            </span>
          </div>
          <button type="button" className="text-[13px] text-gray-500 hover:text-gray-700">
            Share
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-100 shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <button type="button" className="h-8 px-3 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            Edit view
          </button>
          <div className="h-8 w-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <button type="button" className="h-8 px-3 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            Sort: Close date
          </button>
          <button type="button" className="h-8 px-3 rounded-md border border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            Stage is any of
          </button>
        </div>
        <button
          type="button"
          onClick={() => requestRegisterDealPrompt()}
          className="h-8 shrink-0 px-3 rounded-md text-[13px] font-semibold bg-[var(--shell-cta)] text-white border border-[var(--shell-cta)] hover:bg-[var(--shell-cta-hover)] hover:border-[var(--shell-cta-hover)] shadow-sm"
        >
          Register a new deal
        </button>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className={`${selectedOpp ? "w-[62%]" : "w-full"} min-w-0 overflow-auto border-r border-gray-200`}>
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#fafafa] border-b border-gray-200">
              <tr className="text-[12px] text-gray-500">
                <th className="px-6 py-3 font-semibold">Opportunity Name</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Close Date</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody>
              {OPPORTUNITY_ROWS.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${selectedOppId === row.id ? "bg-[#eaf6fb]" : ""}`}
                >
                  <td className="px-6 py-3 text-[14px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSelectedOppId(row.id)}
                      className="text-[#1f4f75] hover:underline text-left"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-700">{row.account}</td>
                  <td className="px-4 py-3 text-[14px] font-medium text-gray-900">{row.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ${stagePillClassForOpp(row.stage)}`}>
                      {row.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-700">{row.closeDate}</td>
                  <td className="px-4 py-3 text-[14px] text-gray-700">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOpp && (
          <div className="w-[38%] min-w-[340px] max-w-[460px] h-full overflow-auto bg-white">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[12px] text-gray-500">Opportunity</p>
                <h2 className="text-[22px] font-bold text-gray-900 leading-tight">{selectedOpp.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOppId(null)}
                className="text-[18px] text-gray-400 hover:text-gray-700 shrink-0"
                aria-label="Close details panel"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-6 text-[13px]">
                <button type="button" className="font-semibold text-[#6a2a7b] border-b-2 border-[#6a2a7b] pb-1">
                  Details
                </button>
                <button type="button" className="text-gray-500 hover:text-gray-700 pb-1">
                  Conversations
                </button>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-semibold text-gray-900">Quick actions</h3>
                  <button type="button" className="text-[12px] text-[#1f6f95] hover:underline">
                    See all actions
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLogCallModalOpen(true)}
                    className="h-12 rounded-xl border border-gray-200 bg-[#f8fafc] text-[13px] font-semibold text-gray-800 hover:bg-[#f1f5f9]"
                  >
                    Log a Call
                  </button>
                  <button type="button" className="h-12 rounded-xl border border-gray-200 bg-[#f8fafc] text-[13px] font-semibold text-gray-800 hover:bg-[#f1f5f9]">
                    Email
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-[#fafafa] border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-800">Record details</h3>
                  <button type="button" className="text-[12px] text-[#1f6f95] hover:underline">
                    Open in Salesforce
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Opp ID</span>
                    <span className="text-gray-900 font-medium">{selectedOpp.id}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Account</span>
                    <span className="text-gray-900">{selectedOpp.account}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Amount</span>
                    <span className="text-gray-900 font-medium">{selectedOpp.amount}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Stage</span>
                    <span className="text-gray-900">{selectedOpp.stage}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Probability</span>
                    <span className="text-gray-900">{selectedOpp.probability}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Close date</span>
                    <span className="text-gray-900">{selectedOpp.closeDate}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Owner</span>
                    <span className="text-gray-900">{selectedOpp.owner}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Type</span>
                    <span className="text-gray-900">{selectedOpp.type}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-[13px]">
                    <span className="text-gray-500">Partner</span>
                    <span className="text-gray-900">{selectedOpp.partner}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLogCallModalOpen && selectedOpp && (
        <div className="absolute inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] max-h-[70vh] bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-[#3558d4] text-white flex items-center justify-center text-[12px]">
                  📇
                </div>
                <h2 className="text-[24px] leading-none font-semibold text-[#1f2328]">Log a Call</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLogCallModalOpen(false)}
                className="text-[20px] leading-none text-gray-400 hover:text-gray-700"
                aria-label="Close log a call modal"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3.5 overflow-auto max-h-[calc(70vh-116px)]">
              <p className="text-[14px] italic text-gray-600 mb-4">
                <span className="text-[#c81e5b]">*</span> Indicates a required field
              </p>

              <div className="mb-4">
                <label className="block text-[18px] font-semibold text-[#1f2328] mb-2">Subject</label>
                <button
                  type="button"
                  className="w-full h-[42px] px-3 rounded-lg border border-gray-300 text-[15px] text-left text-gray-700 flex items-center justify-between"
                >
                  Call
                  <span className="text-[14px] text-gray-500">⌄</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-[20px] font-semibold text-[#1f2328] mb-4">Details</h3>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-[90px_1fr] items-center gap-2.5">
                    <span className="text-[14px] text-[#1f2328]">Comments</span>
                    <textarea
                      value={logCallComments}
                      onChange={(e) => setLogCallComments(e.target.value)}
                      placeholder="Add text"
                      rows={2}
                      className="w-full resize-none rounded-md border border-gray-300 px-2.5 py-1.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3558d4]/30 focus:border-[#3558d4]"
                    />
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-center gap-2.5">
                    <span className="text-[14px] text-[#1f2328]">Related</span>
                    <div className="inline-flex w-fit items-center rounded-md bg-[#e9f6ff] px-2.5 py-1 text-[13px] font-semibold text-[#1f2328]">
                      {selectedOpp.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-[90px_1fr] items-start gap-2.5">
                    <span className="text-[14px] text-[#1f2328] mt-0.5">Related To</span>
                    <p className="text-[13px] leading-snug text-gray-500">
                      This call will be logged on the opportunity and visible to collaborators on the account timeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end bg-[#fafafa]">
              <button
                type="button"
                className="h-9 px-5 rounded-lg bg-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TemplatePartnerAccountsView() {
  return (
    <PartnerPageShell
      title="Accounts"
      subtitle="Validate account mappings and ownership before go-live."
      meta={[
        { label: "Accounts pending", value: "21" },
        { label: "Duplicates", value: "3" },
        { label: "Auto-match", value: "82%" },
      ]}
      headers={["Account", "Partner", "Region", "Segment", "Owner"]}
      rows={[
        ["Acme Corp", "CloudWave Systems", "NAMER", "Enterprise", "Aisha Raman"],
        ["Greentech", "Vertex Alliance", "EMEA", "Mid-Market", "Noah Kim"],
        ["TechStart", "BluePeak Tech", "APAC", "Enterprise", "Caleb Stone"],
      ]}
    />
  );
}

export function TemplatePartnerMdfView() {
  return (
    <PartnerPageShell
      title="MDF"
      subtitle="Approve market development fund requests and campaign budgets."
      meta={[
        { label: "Requests", value: "7" },
        { label: "Budget impact", value: "$86K" },
        { label: "Over limit", value: "1" },
      ]}
      headers={["Request ID", "Partner", "Campaign", "Amount", "Submitted"]}
      rows={[
        ["MDF-4421", "CloudWave Systems", "Q2 Demand Gen", "$12,500", "2h ago"],
        ["MDF-4418", "Vertex Alliance", "ABM Webinar Series", "$8,900", "Today"],
        ["MDF-4402", "BluePeak Tech", "Regional Event Sponsorship", "$15,000", "Yesterday"],
      ]}
    />
  );
}

export function TemplatePartnerCampaignsView() {
  return (
    <PartnerPageShell
      title="Campaigns"
      subtitle="Review partner campaign plans and activation requests."
      meta={[
        { label: "Campaigns", value: "11" },
        { label: "Ready to launch", value: "4" },
        { label: "Needs edits", value: "3" },
      ]}
      headers={["Campaign", "Partner", "Type", "Start date", "Status"]}
      rows={[
        ["Pipeline Accelerator", "CloudWave Systems", "Digital", "Apr 10", "Pending"],
        ["Executive Roundtable", "Vertex Alliance", "Event", "Apr 18", "Review"],
        ["Co-sell Launch", "Northstar Digital", "Email + Webinar", "Apr 24", "Pending"],
      ]}
    />
  );
}

export function TemplateRevenueCommandCenter() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #E8E8E8" }}>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Revenue command center</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Plan today, unblock risks, and move deals faster.</p>
        </div>
        <button className="px-3 py-1.5 text-[13px] font-semibold rounded-lg bg-[var(--shell-cta)] text-white hover:bg-[var(--shell-cta-hover)] transition-colors">
          Start standup
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[980px] mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMMAND_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">{metric.label}</p>
                <p className="text-[28px] font-bold text-gray-900 mt-1">{metric.value}</p>
                <p className="text-[12px] text-gray-500 mt-1">{metric.trend}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-gray-900">Priority actions</h2>
                <button className="text-[12px] text-gray-500 hover:text-gray-700">View all</button>
              </div>
              <div className="space-y-2">
                {COMMAND_PRIORITIES.map((item) => (
                  <div key={item.title} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug">{item.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${item.statusStyle}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1">
                      {item.owner} · {item.channel} · {item.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <h2 className="text-[15px] font-bold text-gray-900 mb-3">Recent channel updates</h2>
              <div className="space-y-2">
                {COMMAND_RECENT_UPDATES.map((update) => (
                  <div key={update.title} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-[13px] text-gray-800 leading-snug">{update.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{update.meta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── More View (content pane — sidebar shows channel+DM list) ───────────────

export function TemplateMoreView() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: "1px solid #E8E8E8" }}>
        <h2 className="text-[15px] font-bold text-gray-900">More</h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-5 py-5 space-y-3">
          {[
            { icon: "🔧", title: "Tools", desc: "Create and find workflows and apps" },
            { icon: "📊", title: "Analytics", desc: "View workspace analytics and reports" },
            { icon: "👥", title: "People & User Groups", desc: "Browse team members and groups" },
            { icon: "🔔", title: "Notifications", desc: "Manage notification preferences" },
            { icon: "⚙️", title: "Preferences", desc: "Customize your Slack experience" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900">{item.title}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
