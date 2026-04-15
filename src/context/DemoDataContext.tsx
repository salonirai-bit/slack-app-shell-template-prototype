"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { mockDMs, mockChannels, mockActivity } from "@/lib/mock-data";
import { assetPath } from "@/lib/asset-path";
import { useCmWorkspace, type CmWorkspaceId } from "@/context/CmWorkspaceContext";

function deepCloneMessageMap(
  src: Record<string, DemoMessage[]>
): Record<string, DemoMessage[]> {
  try {
    return structuredClone(src);
  } catch {
    return JSON.parse(JSON.stringify(src)) as Record<string, DemoMessage[]>;
  }
}


export interface DemoReaction {
  emoji: string;
  count: number;
  users: string[]; // Array of user names who reacted
}

export interface DemoThreadReply {
  id: string;
  author: string;
  authorImage?: string | null;
  body: string;
  timestamp: string;
}

export interface DemoMessage {
  id: string;
  author: string;
  authorImage?: string | null;
  timestamp: string;
  body?: string | null;
  blocks?: SlackBlock[] | null;
  reactions?: DemoReaction[];
  threadCount?: number;
  threadReplies?: DemoThreadReply[];
  threadLastAuthor?: string;
  threadLastAuthorImage?: string | null;
  threadLastTimestamp?: string;
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{
    type: string;
    text: { type: string; text: string; emoji?: boolean };
    action_id?: string;
    style?: string;
  }>;
}

export interface DemoWorkspace {
  id: string;
  name: string;
}

export interface DemoChannel {
  id: string;
  name: string;
  unread?: boolean;
}

export interface DemoDM {
  id: string;
  name: string;
  isSlackbot?: boolean;
  avatarUrl?: string; // Optional avatar; falls back to UI Avatars from name
  status?: "online" | "away" | "dnd" | "call"; // Status indicator
  unread?: boolean; // For Unreads toggle filter
}

export interface DemoFile {
  id: string;
  name: string;
  channelId: string;
  timestamp: string;
}

export interface DemoSavedItem {
  id: string;
  channelId: string;
  preview: string;
  timestamp: string;
}

export interface DemoActivityPost {
  id: string;
  author: string;
  authorImage?: string;
  channelId: string;
  channelName: string;
  content: string;
  timestamp: string;
  read?: boolean;
  commentCount?: number;
  type?: "post" | "dm";
}

const DEMO_WORKSPACE: DemoWorkspace = { id: "demo-1", name: "Vibeface" };
const DEMO_CHANNELS: DemoChannel[] = [
  { id: "general", name: "general", unread: true },
  { id: "sales", name: "sales", unread: true },
  { id: "q3-pipeline", name: "q3-pipeline", unread: true },
  { id: "deal-acme", name: "deal-acme", unread: true },
  { id: "deal-acme-q1-strategic", name: "deal-acme-q1-strategic", unread: true },
  { id: "deal-runners", name: "deal-runners" },
  { id: "deal-greentech", name: "deal-greentech" },
  { id: "deal-sporty", name: "deal-sporty" },
  { id: "deal-techstart", name: "deal-techstart" },
];
// Avatar helper: fallback to initials for channels; DMs use explicit avatarUrl (real photos)
export function getAvatarUrl(name: string, size = 64): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=611f69&color=fff&size=${size}`;
}

// Author name -> avatar URL for chat messages (human photos + Slackbot logo)
const MESSAGE_AVATAR_MAP: Record<string, string> = {
  "Rita Patel": "https://randomuser.me/api/portraits/med/women/75.jpg",
  Slackbot: "/slackbot-logo.svg",
  "Sarah Chen": "https://randomuser.me/api/portraits/med/women/44.jpg",
  "Priya Shah": "https://randomuser.me/api/portraits/med/women/32.jpg",
  "Jordan Hayes": "https://randomuser.me/api/portraits/med/men/22.jpg",
  "Dana Torres": "https://randomuser.me/api/portraits/med/women/28.jpg",
  "Marcus Lee": "https://randomuser.me/api/portraits/med/men/8.jpg",
  "Lisa Park": "https://randomuser.me/api/portraits/med/women/65.jpg",
  "Daniel Kim": "https://randomuser.me/api/portraits/med/men/33.jpg",
  "Mike Torres": "https://randomuser.me/api/portraits/med/men/45.jpg",
  "Jen Walsh": "https://randomuser.me/api/portraits/med/women/52.jpg",
  "Srinivas Tallapragada": "https://randomuser.me/api/portraits/med/men/33.jpg",
  "Jack Lakkapragada": "https://randomuser.me/api/portraits/med/men/45.jpg",
  "Mike Lenz": "https://randomuser.me/api/portraits/med/men/46.jpg",
  "Aisha Raman": "https://randomuser.me/api/portraits/med/women/21.jpg",
  "Noah Kim": "https://randomuser.me/api/portraits/med/men/47.jpg",
  "Caleb Stone": "https://randomuser.me/api/portraits/med/men/46.jpg",
};

export function getMessageAvatarUrl(author: string): string | null {
  return MESSAGE_AVATAR_MAP[author] ?? null;
}

// Real human photos from RandomUser.me (portraits 0-99 for men/women)
// All DMs must have meaningful preview data - see DM_PREVIEWS above
const DEMO_DMS: DemoDM[] = [
  { id: "slackbot", name: "Slackbot", isSlackbot: true, unread: true },
  { id: "aisha-raman", name: "Aisha Raman", status: "online", avatarUrl: "https://randomuser.me/api/portraits/med/women/21.jpg", unread: true },
  { id: "noah-kim", name: "Noah Kim", status: "away", avatarUrl: "https://randomuser.me/api/portraits/med/men/47.jpg" },
  { id: "caleb-stone", name: "Caleb Stone", status: "online", avatarUrl: "https://randomuser.me/api/portraits/med/men/46.jpg", unread: true },
  { id: "sarah-chen", name: "Sarah Chen", status: "online", avatarUrl: "https://randomuser.me/api/portraits/med/women/44.jpg", unread: true },
  { id: "priya-shah", name: "Priya Shah", status: "away", avatarUrl: "https://randomuser.me/api/portraits/med/women/32.jpg" },
  { id: "jordan-hayes", name: "Jordan Hayes", status: "online", avatarUrl: "https://randomuser.me/api/portraits/med/men/22.jpg", unread: true },
  { id: "dana-torres", name: "Dana Torres", status: "dnd", avatarUrl: "https://randomuser.me/api/portraits/med/women/28.jpg" },
  { id: "marcus-lee", name: "Marcus Lee", status: "call", avatarUrl: "https://randomuser.me/api/portraits/med/men/8.jpg", unread: true },
  { id: "lisa-park", name: "Lisa Park", status: "online", avatarUrl: "https://randomuser.me/api/portraits/med/women/65.jpg" },
  // Additional contacts from fictional universe
  { id: "daniel-kim", name: "Daniel Kim", status: "online", avatarUrl: "https://randomuser.me/api/portraits/med/men/33.jpg" },
  { id: "mike-torres", name: "Mike Torres", status: "away", avatarUrl: "https://randomuser.me/api/portraits/med/men/45.jpg" },
];

const DEMO_FILES: DemoFile[] = [
  { id: "f1", name: "Q3 Pipeline Deck.pdf", channelId: "q3-pipeline", timestamp: "Yesterday" },
  { id: "f2", name: "Greentech SOW Draft.docx", channelId: "deal-greentech", timestamp: "Yesterday" },
  { id: "f3", name: "TechStart QBR Slides.pptx", channelId: "deal-techstart", timestamp: "Today" },
  { id: "f4", name: "Runners Club Value Justification.pdf", channelId: "deal-runners", timestamp: "Today" },
  { id: "f5", name: "Acme Org Chart & Champions.docx", channelId: "deal-acme", timestamp: "Today" },
];

const DEMO_SAVED: DemoSavedItem[] = [
  { id: "s1", channelId: "general", preview: "Champion departed: Acme Corp — Marcus left...", timestamp: "10:36 AM" },
  { id: "s2", channelId: "sales", preview: "Meeting prep ready for TechStart QBR at 2:00 PM", timestamp: "9:16 AM" },
  { id: "s3", channelId: "slackbot", preview: "Proactive insights for today — $410K on track", timestamp: "Today" },
];

// Use mock activity data (realistic SaaS sales floor activity)
const DEMO_ACTIVITY_POSTS: DemoActivityPost[] = mockActivity;

export const DEMO_USER_NAME = "Rita";

// Fictional preview data for channels and DMs - ensures all cards have meaningful content with Q4 engagement context
const CHANNEL_PREVIEWS: Record<string, { preview: string; timestamp: string }> = {
  "general": { 
    preview: "Champion departed: Acme Corp — Marcus left last week. New contacts: Priya Shah (champion) and Daniel Kim (VP Procurement). $200K deal at risk.", 
    timestamp: "10:36 AM" 
  },
  "sales": { 
    preview: "Q4 wrap-up: Greentech closed at $60K. SmartFit replied to follow-up — positive tone. Vibeface prepping demo deck for Q1.", 
    timestamp: "9:45 AM" 
  },
  "q3-pipeline": { 
    preview: "Plan status: *$430K on track* after Greentech SO closed. Q4 velocity analysis shows 52% win rate (up from 48% Q3).", 
    timestamp: "Yesterday" 
  },
  "deal-acme": { 
    preview: "Q4 engagement: Sent intro to Priya via Sarah after Marcus departure. Daniel Kim (VP Procurement) — can we pull the contract forward to Q1?", 
    timestamp: "Today" 
  },
  "deal-runners": { 
    preview: "Q4 follow-up: 30-min call with Jordan set for 4 PM. Budget objection flagged — Vibeface prepping value justification deck.", 
    timestamp: "10:15 AM" 
  },
  "deal-greentech": { 
    preview: "Q4 closed won: Following up with Priya on renewal SOW. She's been responsive. $60K deal closed in December — celebrating win.", 
    timestamp: "Today" 
  },
  "deal-sporty": { 
    preview: "Q4 at risk: Reaching out to Mike Torres. Dana's team might be in flux after Q4 reorg. Champion silent since mid-December.", 
    timestamp: "Today" 
  },
  "deal-techstart": { 
    preview: "Q4 prep: Reviewed the QBR brief. Ready for the call at 2 PM. Pipeline shows $42K opportunity — needs acceleration.", 
    timestamp: "9:30 AM" 
  },
};

const DM_PREVIEWS: Record<string, { preview: string; timestamp: string }> = {
  "slackbot": { 
    preview: "Q4 performance summary: $471K attained (94% of $500K quota). Win rate 52% ↑ from Q3. Proactive insights for Q1 — $410K on track.", 
    timestamp: "Today" 
  },
  "aisha-raman": {
    preview: "Hey — welcome to PRM on Slack! I'm Aisha, your channel manager. Glad to have you in the workspace. How's it going so far?",
    timestamp: "Today"
  },
  "noah-kim": {
    preview: "Can jump on a quick sync this afternoon if you want to pressure-test the value justification narrative.",
    timestamp: "Today"
  },
  "caleb-stone": {
    preview: "Updated the pipeline snapshot with latest numbers. Sporty and Acme are now flagged as top risks for this week.",
    timestamp: "Today"
  },
  "sarah-chen": { 
    preview: "Q4 wrap-up: Done. Priya should have the intro email. Good luck with Acme — that's a big one for Q1.", 
    timestamp: "Yesterday" 
  },
  "priya-shah": { 
    preview: "Q4 engagement: Thanks Priya! Let me know if legal has any questions on the SOW. Excited to work together in Q1.", 
    timestamp: "10:20 AM" 
  },
  "jordan-hayes": { 
    preview: "Q4 follow-up: 4 PM works perfectly. Send the deck when you have it. Budget discussion is top priority for our call.", 
    timestamp: "Today" 
  },
  "dana-torres": { 
    preview: "Q4 check-in: Following up on Runners Club deal. Let me know if there's a good time to discuss the budget objection.", 
    timestamp: "3 days ago" 
  },
  "marcus-lee": { 
    preview: "Q4 farewell: Thanks Marcus! Appreciate your help on Acme before you left. Best of luck in your new role.", 
    timestamp: "1 week ago" 
  },
  "lisa-park": { 
    preview: "Q4 prep: Sounds good. He's detail-oriented but responsive. TechStart QBR should go well — we're prepared.", 
    timestamp: "Today" 
  },
  "daniel-kim": { 
    preview: "Q4 intro: Sent intro to Priya via Sarah. Daniel Kim — can we pull the contract forward? Q1 pipeline needs this.", 
    timestamp: "Today" 
  },
  "mike-torres": { 
    preview: "Q4 at-risk: Reaching out to Mike Torres. Dana's team might be in flux after the Q4 reorg. Champion has been silent.", 
    timestamp: "Today" 
  },
};

function getLastMessagePreview(messages: DemoMessage[]): string {
  if (!messages?.length) return "";
  const last = messages[messages.length - 1];
  const maxLen = 120; // ~2 lines at typical card width
  if (last.body) return last.body.slice(0, maxLen) + (last.body.length > maxLen ? "..." : "");
  if (last.blocks?.[0]?.text?.text) return last.blocks[0].text.text.slice(0, maxLen) + "...";
  return "";
}

interface DemoDataContextValue {
  workspace: DemoWorkspace;
  channels: DemoChannel[];
  dms: DemoDM[];
  files: DemoFile[];
  savedItems: DemoSavedItem[];
  activityPosts: DemoActivityPost[];
  messages: Record<string, DemoMessage[]>;
  demoData: Record<string, unknown> | null;
  blockKitMessages: Record<string, unknown> | null;
  getChannelPreview: (channelId: string) => { preview: string; timestamp: string };
  readChannelIds: Set<string>;
  markChannelAsRead: (channelId: string) => void;
  isChannelRead: (channelId: string) => boolean;
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspaceId } = useCmWorkspace();

  /** Isolated per CM workspace — same seed data, diverges after edits (e.g. mark read). */
  const [messagesByWorkspace, setMessagesByWorkspace] = useState<Record<
    CmWorkspaceId,
    Record<string, DemoMessage[]>
  > | null>(null);
  const [readByWorkspace, setReadByWorkspace] = useState<
    Record<CmWorkspaceId, Set<string>>
  >(() => ({
    "salesforce-partners": new Set(),
    "salesforce-internal": new Set(),
  }));

  const [demoData, setDemoData] = useState<Record<string, unknown> | null>(null);
  const [blockKitMessages, setBlockKitMessages] = useState<Record<string, unknown> | null>(null);

  const messages = useMemo(
    () => messagesByWorkspace?.[activeWorkspaceId] ?? {},
    [messagesByWorkspace, activeWorkspaceId]
  );

  const readChannelIds = useMemo(
    () => readByWorkspace[activeWorkspaceId],
    [readByWorkspace, activeWorkspaceId]
  );

  const markChannelAsRead = useCallback(
    (channelId: string) => {
      setReadByWorkspace((prev) => {
        const cur = prev[activeWorkspaceId];
        if (cur.has(channelId)) return prev;
        const nextSet = new Set(cur);
        nextSet.add(channelId);
        return { ...prev, [activeWorkspaceId]: nextSet };
      });
    },
    [activeWorkspaceId]
  );

  const isChannelRead = useCallback(
    (channelId: string) => readByWorkspace[activeWorkspaceId].has(channelId),
    [readByWorkspace, activeWorkspaceId]
  );

  useEffect(() => {
    fetch(assetPath("/demo-data.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load demo-data.json: ${r.status}`);
        return r.json();
      })
      .then(setDemoData)
      .catch((err) => {
        console.error("Failed to load demo-data.json:", err);
        // Set empty object to prevent infinite loading state
        setDemoData({});
      });
  }, []);

  useEffect(() => {
    fetch(assetPath("/block-kit-messages.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load block-kit-messages.json: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        try {
          setBlockKitMessages(data);
          const channelMessages = (data?.channel_messages as Record<string, DemoMessage[]>) || {};
          
          // Merge mock data with existing data (mock data takes precedence for DMs and channels)
          // This ensures realistic data while preserving Arc1Layout/Slackbot functionality
          // Note: We preserve slackbot and other Arc1Layout-specific channels from block-kit-messages.json
          const mergedMessages: Record<string, DemoMessage[]> = {
            ...channelMessages, // Load existing messages first (includes slackbot, general, etc.)
            ...mockDMs, // Override with realistic DM conversations
            ...mockChannels, // Override with realistic channel conversations
          };
          
          // Populate authorImage for all messages using MESSAGE_AVATAR_MAP
          // Preserve all message properties including reactions and threads
          const enrichedMessages: Record<string, DemoMessage[]> = {};
          Object.keys(mergedMessages).forEach((channelId) => {
            enrichedMessages[channelId] = mergedMessages[channelId].map((msg) => {
              try {
                return {
                  ...msg,
                  authorImage: msg.authorImage || getMessageAvatarUrl(msg.author || "") || null,
                  // Preserve reactions and thread data
                  reactions: msg.reactions || undefined,
                  threadCount: msg.threadCount || undefined,
                  threadLastAuthor: msg.threadLastAuthor || undefined,
                  threadLastAuthorImage: msg.threadLastAuthorImage || undefined,
                  threadLastTimestamp: msg.threadLastTimestamp || undefined,
                };
              } catch (err) {
                console.error(`Error enriching message ${msg.id}:`, err);
                return { ...msg, authorImage: null };
              }
            });
          });
          setMessagesByWorkspace({
            "salesforce-partners": deepCloneMessageMap(enrichedMessages),
            "salesforce-internal": deepCloneMessageMap(enrichedMessages),
          });
        } catch (err) {
          console.error("Error processing messages:", err);
          // Fallback to unenriched messages if enrichment fails
          const channelMessages = (data?.channel_messages as Record<string, DemoMessage[]>) || {};
          setMessagesByWorkspace({
            "salesforce-partners": deepCloneMessageMap(channelMessages),
            "salesforce-internal": deepCloneMessageMap(channelMessages),
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load block-kit-messages.json:", err);
        // Set empty object to prevent infinite loading state
        setMessagesByWorkspace({
          "salesforce-partners": {},
          "salesforce-internal": {},
        });
        setBlockKitMessages({});
      });
  }, []);

  const getChannelPreview = (channelId: string) => {
    const msgs = messages[channelId] || [];
    const last = msgs[msgs.length - 1];
    const realPreview = getLastMessagePreview(msgs);
    
    // If we have real messages with content, use them
    if (msgs.length > 0 && realPreview) {
      return {
        preview: realPreview,
        timestamp: last?.timestamp ?? "",
      };
    }
    
    // Fallback to fictional data - ensure every card has meaningful content
    // Check if it's a channel or DM
    const channelMatch = DEMO_CHANNELS.find(c => c.id === channelId);
    const dmMatch = DEMO_DMS.find(d => d.id === channelId);
    
    if (channelMatch && CHANNEL_PREVIEWS[channelId]) {
      return CHANNEL_PREVIEWS[channelId];
    }
    
    if (dmMatch && DM_PREVIEWS[channelId]) {
      return DM_PREVIEWS[channelId];
    }
    
    // Final fallback - ensure we always return meaningful content
    // Match channel name pattern to provide contextual preview
    if (channelId.startsWith("deal-")) {
      const dealName = channelId.replace("deal-", "");
      return {
        preview: `Active deal discussion for ${dealName}. Reviewing next steps...`,
        timestamp: "Today",
      };
    }
    
    return {
      preview: "Recent activity and updates",
      timestamp: "Today",
    };
  };

  const value: DemoDataContextValue = {
    workspace: DEMO_WORKSPACE,
    channels: DEMO_CHANNELS,
    dms: DEMO_DMS,
    files: DEMO_FILES,
    savedItems: DEMO_SAVED,
    activityPosts: DEMO_ACTIVITY_POSTS,
    messages,
    demoData,
    blockKitMessages,
    getChannelPreview,
    readChannelIds,
    markChannelAsRead,
    isChannelRead,
  };

  return (
    <DemoDataContext.Provider value={value}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}

const EMPTY_MESSAGES: DemoMessage[] = [];

export function useDemoMessages(channelId: string): DemoMessage[] {
  const { messages } = useDemoData();
  return messages[channelId] || EMPTY_MESSAGES;
}
