"use client";

import { useState } from "react";
import Link from "next/link";
import { generateInitialsAvatar } from '@/lib/avatar-utils';
import { useParams, useSearchParams } from "next/navigation";
import {
  IconSearch,
  IconSquare,
  IconLayoutGrid,
  IconFilter,
  IconList,
  IconCopy,
  IconLink,
  IconMoreVertical,
  IconPlus,
  IconFolder,
  IconBookmark,
  IconSettings,
  IconChevronDown,
  IconPencil,
  IconHeadphones,
  IconHome,
  IconBot,
} from "@/components/icons";
import {
  Settings as SettingsIcon,
  Pencil as EditIcon,
  MessageSquare as MessageSquareIcon,
  Headphones as HeadphonesIcon,
  Sparkles as SparklesIcon,
  Send as SendIcon,
  Edit2 as Edit2Icon,
  Users as UsersIcon,
  Star as StarIcon,
  Lock as LockIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDemoData, getAvatarUrl } from "@/context/DemoDataContext";
import { ActivityListItem } from "./ActivityListItem";
import { useNav, usePresentationMode, useDemoContext } from "../_context/demo-layout-context";
import { useActiveChat } from "@/components/presentation/SlackAppShell";
import { cn } from "@/lib/utils";
import { SLACK_TOKENS } from "@/design/slack-tokens";
import { assetPath } from "@/lib/asset-path";

const T = SLACK_TOKENS;

type ViewFilter = "all" | "dms";

const NAV_TITLES: Record<string, string> = {
  home: "Home",
  dms: "Direct Messages",
  activity: "Activity",
  files: "Files",
  later: "Saved",
  agentforce: "Agentforce",
  more: "More",
};

function StatusDot({ status }: { status?: "online" | "away" | "dnd" | "call" }) {
  if (!status) return null;
  if (status === "online")
    return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />;
  if (status === "away")
    return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-400" />;
  if (status === "dnd")
    return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-red-500" />;
  if (status === "call")
    return (
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 flex items-center justify-center rounded bg-gray-600">
        <IconHeadphones width={10} height={10} className="text-white" stroke="currentColor" />
      </span>
    );
  return null;
}

interface DemoSidebarProps {
  activeDmId?: string;
  onDmSelect?: (id: string) => void;
  overrideDms?: import('@/context/DemoDataContext').DemoDM[];
  overrideChannels?: import('@/context/DemoDataContext').DemoChannel[];
  sidebarApps?: Array<{ id: string; name: string; icon: string }>;
  topViewMode?: "admin" | "channel-manager" | "seller";
}

export function DemoSidebar({ activeDmId: propActiveDmId, onDmSelect, overrideDms, overrideChannels, sidebarApps, topViewMode = "channel-manager" }: DemoSidebarProps = {}) {
  const params = useParams();
  const channelId = (params.channelId as string) || undefined;
  const { activeNav } = useNav();
  const { isPresentationMode } = usePresentationMode();
  const { demoContext } = useDemoContext();
  const { workspace, channels, dms, files, savedItems, getChannelPreview, isChannelRead } = useDemoData();
  const searchParams = useSearchParams();
  
  // Use overrideDms if provided (for GlobalDMsView), otherwise use filtered DMs from context
  const filteredDms = overrideDms || dms.filter((dm) => !dm.isSlackbot);
  
  // Use overrideChannels if provided, otherwise use channels from context
  const filteredChannels = overrideChannels || channels;
  
  // For activity page, check query param for selected channel
  const activityChannelId = activeNav === "activity" ? searchParams.get("channel") : null;
  
  // Calculate effective channel ID - prioritize URL params, then activity query, then first item
  const effectiveChannelId = channelId || activityChannelId;
  
  // Try to get activeChatId from context (for local state navigation)
  const chatContext = useActiveChat();
  let activeChatId: string | undefined = chatContext.activeChatId;
  const setActiveChatId: ((id: string) => void) = chatContext.setActiveChatId;
  
  // Use prop activeDmId if provided (for GlobalDMsView), otherwise use context
  // Treat empty string as "not provided" to allow auto-selection to work
  // When overrideDms is provided, default to first DM if no prop is set (for GlobalDMsView auto-selection)
  const hasPropSelection = propActiveDmId !== undefined && propActiveDmId !== '';
  const defaultDmId = overrideDms && overrideDms.length > 0 ? overrideDms[0].id : undefined;
  const effectiveActiveDmId = hasPropSelection ? propActiveDmId : (defaultDmId || activeChatId);
  
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [search, setSearch] = useState("");
  const [unreadsOnly, setUnreadsOnly] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  const [isPartnerCloudOpen, setIsPartnerCloudOpen] = useState(true);

  const showAllDmsTabs = activeNav === "home" || activeNav === "activity" || activeNav === "more";
  const showSearchAndFilters = activeNav !== "later";
  const isDmView = activeNav === "dms" || activeNav === "agentforce";
  const useDarkTheme = isDmView;

  const channelAndDmItems = (
    filter === "dms"
      ? filteredDms.map((dm) => ({ ...dm, type: "dm" as const }))
      : [...filteredChannels.map((ch) => ({ ...ch, type: "channel" as const })), ...filteredDms.map((dm) => ({ ...dm, type: "dm" as const }))]
  ).filter((item) => {
    if (!search) return true;
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

  const dmsOnly = filteredDms.filter((dm) => {
    if (unreadsOnly && !dm.unread) return false;
    if (!search) return true;
    return dm.name.toLowerCase().includes(search.toLowerCase());
  });

  const agentforceItems: typeof filteredDms = [
    { id: "af-employee", name: "Employee Agent", status: "online" as const, avatarUrl: "/slackbot-logo.svg", isSlackbot: true },
    { id: "af-support", name: "Agentforce Support Agent", status: "online" as const, avatarUrl: "/slackbot-logo.svg", isSlackbot: true },
    { id: "af-data", name: "Data Agent", status: "online" as const, avatarUrl: "/slackbot-logo.svg", isSlackbot: true },
  ];

  const filteredFiles = files.filter((f) => {
    if (!search) return true;
    return f.name.toLowerCase().includes(search.toLowerCase());
  });

  // Filter out Arc 1 specific saved items (slackbot) from global sidebar
  const filteredSaved = savedItems.filter((s) => {
    // Remove slackbot saved items (Arc 1 specific)
    if (s.channelId === "slackbot") return false;
    if (!search) return true;
    return s.preview.toLowerCase().includes(search.toLowerCase());
  });

  const title = NAV_TITLES[activeNav] ?? "Activity";
  const showBetaBadge = activeNav === "activity" || activeNav === "home";
  const showChannelAndDmItems = activeNav === "home" || activeNav === "activity" || activeNav === "more";

  // Home view: Render Slack workspace sidebar
  if (activeNav === "home") {
    const activeDMId = activeChatId || effectiveChannelId;
    
    // Find DMs by name
    const shwetaDM = dms.find(d => d.name.toLowerCase().includes("aisha")) || dms.find(d => d.name.toLowerCase().includes("raman")) || dms.find(d => d.name.toLowerCase().includes("shweta")) || dms[0];
    const jonnieDM = dms.find(d => d.name.toLowerCase().includes("noah")) || dms.find(d => d.name.toLowerCase().includes("kim")) || dms.find(d => d.name.toLowerCase().includes("jonnie")) || dms.find(d => d.name.toLowerCase().includes("lee"));
    const miekDM = dms.find(d => d.name.toLowerCase().includes("caleb")) || dms.find(d => d.name.toLowerCase().includes("stone")) || dms.find(d => d.name.toLowerCase().includes("miek")) || dms.find(d => d.name.toLowerCase().includes("lenz"));
    const prantikDM = dms.find(d => d.name.toLowerCase().includes("prantik")) || dms.find(d => d.name.toLowerCase().includes("banerjee"));
    
    // Determine active states - Shweta is default active if nothing selected
    const isShwetaActive = activeDMId === shwetaDM?.id || (!activeDMId && shwetaDM);
    const isJonnieActive = activeDMId === jonnieDM?.id;
    const isMiekActive = activeDMId === miekDM?.id;
    const isPrantikActive = activeDMId === prantikDM?.id;
    const isPartnerLeadsActive = activeChatId === "partner-leads";
    const isPartnerOpportunitiesActive = activeChatId === "partner-opportunities";
    const isPartnerMarketingActive = activeChatId === "partner-marketing";
    const isPartnerAccountsActive = activeChatId === "partner-accounts";
    const isPartnerContactsActive = activeChatId === "partner-contacts";
    const isPartnerMdfActive = activeChatId === "partner-mdf";
    const isPartnerCampaignsActive = activeChatId === "partner-campaigns";
    const isPartnerView = topViewMode === "seller";
    
    return (
      <aside className="w-[340px] h-full bg-[#350d36] text-[#D1C2D0] flex flex-col flex-shrink-0 border-r border-white/10 font-sans">
        {/* Workspace Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors flex-shrink-0">
          <div className="font-bold text-white text-[15px] flex items-center gap-1">
            Salesforce <span className="text-xs ml-1">⌄</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </button>
            <button className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center bg-white/10">
              <EditIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable Channel Tree */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar relative">
          {/* Top Links */}
          <div className="space-y-0.5 mb-5">
            <button className="w-full flex items-center px-4 py-1 hover:bg-white/5 text-[15px]">
              <MessageSquareIcon className="w-4 h-4 mr-3 opacity-70" /> Threads
            </button>
            <button className="w-full flex items-center px-4 py-1 hover:bg-white/5 text-[15px]">
              <HeadphonesIcon className="w-4 h-4 mr-3 opacity-70" /> Huddles
            </button>
            <button className="w-full flex items-center px-4 py-1 hover:bg-white/5 text-[15px]">
              <SparklesIcon className="w-4 h-4 mr-3 opacity-70" /> Recap
            </button>
            <button className="w-full flex items-center justify-between px-4 py-1 hover:bg-white/5 text-[15px]">
              <div className="flex items-center"><SendIcon className="w-4 h-4 mr-3 opacity-70" /> Drafts & sent</div>
              <span className="text-xs flex items-center gap-1"><Edit2Icon className="w-3 h-3"/> 12</span>
            </button>
            <button className="w-full flex items-center px-4 py-1 hover:bg-white/5 text-[15px]">
              <UsersIcon className="w-4 h-4 mr-3 opacity-70" /> Directories
            </button>
          </div>

          {/* Section: Starred */}
          <div className="mb-4">
            <div className="px-4 py-1 flex items-center text-[13px] font-medium hover:text-white cursor-pointer group">
              <span className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs">⌄</span>
              <StarIcon className="w-3.5 h-3.5 mr-2" /> Starred
            </div>
            <button className="w-full flex items-center px-4 py-1 pl-9 hover:bg-white/5 text-[15px] text-[#D1C2D0]">
              <img src={assetPath("/Salesforce.png")} alt="channel" className="w-3.5 h-3.5 mr-2 object-contain opacity-70 grayscale" /> proj-ai-council
            </button>
          </div>

          {/* Section: Direct Messages */}
          <div className="mb-4">
            <div className="px-4 py-1 flex items-center text-[13px] font-medium hover:text-white cursor-pointer group">
              <span className="w-4 h-4 mr-1 flex items-center justify-center text-xs">⌄</span>
              Direct messages
            </div>
            {/* Active DM - Shweta */}
            {shwetaDM && (
              <button 
                onClick={() => {
                  if (setActiveChatId) {
                    setActiveChatId(shwetaDM.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center px-4 py-1 pl-8 text-[15px] font-medium rounded-r-full mr-4",
                  isShwetaActive ? "bg-white text-black" : "hover:bg-white/5 text-[#D1C2D0]"
                )}
              >
                <div className="relative mr-2">
                  <img 
                    src={assetPath(shwetaDM.avatarUrl || getAvatarUrl("Aisha Raman", 20) || "/aisha-avatar.png")} 
                    className="w-5 h-5 rounded" 
                    alt="Aisha Raman" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getAvatarUrl("Aisha Raman", 20);
                    }}
                  />
                </div>
                Aisha Raman <span className="ml-2">🗓️</span>
              </button>
            )}
            {/* Jonnie */}
            {jonnieDM && (
              <button 
                onClick={() => {
                  if (setActiveChatId) {
                    setActiveChatId(jonnieDM.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-1 pl-8 text-[15px] group",
                  isJonnieActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                )}
              >
                <div className="flex items-center">
                  <img 
                    src={assetPath(jonnieDM.avatarUrl || getAvatarUrl("Noah Kim", 20) || "/noah-avatar.png")} 
                    className="w-5 h-5 rounded mr-2" 
                    alt="Noah Kim"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getAvatarUrl("Noah Kim", 20);
                    }}
                  /> 
                  Noah Kim
                </div>
                <Edit2Icon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </button>
            )}
            {/* Miek */}
            {miekDM && (
              <button 
                onClick={() => {
                  if (setActiveChatId) {
                    setActiveChatId(miekDM.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-1 pl-8 text-[15px] group",
                  isMiekActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                )}
              >
                <div className="flex items-center">
                  <img 
                    src={assetPath(miekDM.avatarUrl || getAvatarUrl("Caleb Stone", 20) || "/caleb-avatar.png")} 
                    className="w-5 h-5 rounded mr-2" 
                    alt="Caleb Stone"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getAvatarUrl("Caleb Stone", 20);
                    }}
                  /> 
                  Caleb Stone <span className="ml-2">🗓️</span>
                </div>
                <Edit2Icon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </button>
            )}
            {/* Prantik */}
            {prantikDM && (
              <button 
                onClick={() => {
                  if (setActiveChatId) {
                    setActiveChatId(prantikDM.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-1 pl-8 text-[15px] group",
                  isPrantikActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                )}
              >
                <div className="flex items-center">
                  <div className="relative mr-2">
                    <img 
                      src={assetPath(prantikDM.avatarUrl || getAvatarUrl("Prantik Banerjee", 20) || "/prantik-avatar.png")} 
                      className="w-5 h-5 rounded" 
                      alt="Prantik"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getAvatarUrl("Prantik Banerjee", 20);
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-[#350d36]"></div>
                  </div>
                  Prantik Banerjee <span className="ml-1 opacity-70 text-sm">you</span> <span className="ml-1">🤒</span>
                </div>
                <Edit2Icon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </button>
            )}
          </div>

          {/* Section: Partner Cloud */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setIsPartnerCloudOpen((open) => !open)}
              className="w-full px-4 py-1 flex items-center text-[13px] font-medium hover:text-white cursor-pointer group"
            >
              <span className="w-4 h-4 mr-1 flex items-center justify-center text-xs">
                {isPartnerCloudOpen ? "⌄" : "›"}
              </span>
              Partner Cloud
            </button>
            {isPartnerCloudOpen && (
              <>
                {isPartnerView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-marketing")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerMarketingActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Leads
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-contacts")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerContactsActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Contacts
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-opportunities")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerOpportunitiesActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Opoortunity
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-accounts")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerAccountsActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Accounts
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-mdf")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerMdfActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      MDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-campaigns")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerCampaignsActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Campaigns
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-leads")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerLeadsActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Approvals
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-opportunities")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerOpportunitiesActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Opportunities
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId("partner-marketing")}
                      className={cn(
                        "w-full flex items-center px-4 py-1 pl-9 text-[15px]",
                        isPartnerMarketingActive ? "bg-white text-black font-medium rounded-r-full mr-4" : "hover:bg-white/5 text-[#D1C2D0]"
                      )}
                    >
                      Leads
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Section: S-M-S */}
          <div className="mb-4">
            <div className="px-4 py-1 flex items-center text-[13px] font-medium hover:text-white cursor-pointer group">
              <span className="w-4 h-4 mr-1 flex items-center justify-center text-xs">⌄</span>
              <span className="w-3.5 h-3.5 mr-2 rounded-full border-2 border-dashed border-blue-400"></span> S-M-S
            </div>
            <button className="w-full flex items-center px-4 py-1 pl-9 hover:bg-white/5 text-[15px] text-white font-bold">
              <LockIcon className="w-3 h-3 mr-2 opacity-70" /> proj-hush-contact-insights-ai-...
            </button>
            <button className="w-full flex items-center px-4 py-1 pl-9 hover:bg-white/5 text-[15px] text-[#D1C2D0]">
              <LockIcon className="w-3 h-3 mr-2 opacity-70" /> proj-marketing-sales-all
            </button>
            <button className="w-full flex items-center px-4 py-1 pl-9 hover:bg-white/5 text-[15px] text-[#D1C2D0]">
              <LockIcon className="w-3 h-3 mr-2 opacity-70" /> proj-salescloud-all-agents-wor...
            </button>
          </div>

          {/* Section: Agentforce */}
          <div className="mb-4">
            <div className="px-4 py-1 flex items-center text-[13px] font-medium hover:text-white cursor-pointer group">
              <span className="w-4 h-4 mr-1 flex items-center justify-center text-xs">⌄</span>
              <span className="w-3 h-3 mr-2 rounded bg-blue-500"></span> Agentforce
            </div>
            <button className="w-full flex items-center px-4 py-1 pl-9 hover:bg-white/5 text-[15px] text-[#D1C2D0]">
              <img src={assetPath("/Salesforce.png")} alt="channel" className="w-3.5 h-3.5 mr-2 object-contain opacity-70 grayscale" /> ai-club
            </button>
            <button className="w-full flex items-center px-4 py-1 pl-9 hover:bg-white/5 text-[15px] text-[#D1C2D0]">
              <img src={assetPath("/Salesforce.png")} alt="channel" className="w-3.5 h-3.5 mr-2 object-contain opacity-70 grayscale" /> ux-agentic-experiences
            </button>
          </div>

          {/* Floating Unread Pill */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
            <button className="bg-[#e4b5f8] text-[#350d36] text-[13px] font-bold px-4 py-1.5 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 hover:bg-[#d6a5eb]">
              ↓ Unread mentions
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Files view: Slack-style dark sidebar with file nav + recently viewed + starred
  if (activeNav === "files") {
    const recentFiles = [
      "Sales Cloud UX Pattern Gr...",
      "2nd Brain Program overvi...",
      "2nd brain — Goal & Weekl...",
      "Frame and Resolution Gui...",
      "Revenue Cloud Sales Offsi...",
      "Sales UX — January 2026 ...",
      "FY26 H2 Corporate Mess...",
      "Claude Code Getting Star...",
      "Sales UX Onsite RSVPs — ...",
      "AI Council Approvals: C36...",
    ];
    const starredFiles = [
      "AI Coding Tools: How to S...",
      "Exp. Org Guidelines for Pr...",
      "Agentic Convo: Campaign...",
      "Pattern Workbook Playbo...",
      "Project Brief: C360 Unife...",
      "Suite First Patterns Playbo...",
      "Project Brief",
      "Design Prototyping in Cur...",
      "T&P and Marketing Gen A...",
      { name: "Sales UX Documentation", bold: true },
      "Maestro 2.0 — Multi-Agent...",
      "Guided Experiences at Sal...",
      "[Archived]Sales Cloud: Co...",
      "Sales Cloud — Meeting Pre...",
      "UX Newsletter | March 20...",
      "Welcome to the Apps & In...",
      "Agentforce In-App Branding",
    ];

    return (
      <aside className="w-[340px] h-full bg-[#350d36] text-[#D1C2D0] flex flex-col flex-shrink-0 border-r border-white/10 font-sans">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <span className="font-bold text-white text-[15px]">Files</span>
          <button className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center">
            <IconPlus width={16} height={16} className="text-white" stroke="currentColor" />
          </button>
        </div>

        {/* Scrollable nav + file lists */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {/* Nav items */}
          <div className="space-y-0.5 mb-5 px-2">
            <button className="w-full flex items-center px-3 py-1.5 rounded-md bg-[#5c2c5d] text-white text-[14px] font-bold">
              All files
            </button>
            <button className="w-full flex items-center px-3 py-1.5 rounded-md hover:bg-white/5 text-[14px] text-[#D1C2D0]">
              Canvases
            </button>
            <button className="w-full flex items-center px-3 py-1.5 rounded-md hover:bg-white/5 text-[14px] text-[#D1C2D0]">
              Lists
            </button>
            <button className="w-full flex items-center px-3 py-1.5 rounded-md hover:bg-white/5 text-[14px] text-[#D1C2D0]">
              Assigned to you
            </button>
          </div>

          {/* Recently viewed */}
          <div className="mb-4">
            <div className="px-4 py-1 text-[11px] font-medium text-white/50 uppercase tracking-wider">
              Recently viewed
            </div>
            {recentFiles.map((f, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-4 py-1 hover:bg-white/5 text-[13px] text-[#D1C2D0] truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">{f}</span>
              </button>
            ))}
          </div>

          {/* Starred */}
          <div className="mb-4">
            <div className="px-4 py-1 text-[11px] font-medium text-white/50 uppercase tracking-wider">
              Starred
            </div>
            {starredFiles.map((f, i) => {
              const name = typeof f === "string" ? f : f.name;
              const isBold = typeof f === "object" && f.bold;
              return (
                <button
                  key={i}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-1 hover:bg-white/5 text-[13px] truncate",
                    isBold ? "text-white font-bold" : "text-[#D1C2D0]"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="truncate">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

  return (
    // Activity view swaps list content only — never changes outer shell
    <aside
      className="w-[340px] flex-shrink-0 flex flex-col h-full border-r"
      style={{
        background: useDarkTheme ? T.colors.dmSidebarBg : "#ffffff",
        borderColor: useDarkTheme ? "transparent" : T.colors.border,
        ...(useDarkTheme && {
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.06)",
        }),
      }}
    >
      {/* PERMANENT SIDEBAR HEADER - Never disappears, always visible */}
      {isDmView ? (
        <>
          {/* DM/Agentforce Header */}
          <div className="px-4 py-4 flex items-center justify-between gap-3 shrink-0">
            <button type="button" className="flex items-center gap-1.5 hover:opacity-90 shrink-0">
              <span className="font-bold text-white whitespace-nowrap" style={{ fontSize: T.typography.header }}>
                {activeNav === "agentforce" ? "Agentforce" : "Direct messages"}
              </span>
              <IconChevronDown width={14} height={14} className="text-white shrink-0" stroke="currentColor" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-normal">Unreads</span>
              <button
                type="button"
                role="switch"
                aria-checked={unreadsOnly}
                onClick={() => setUnreadsOnly((v) => !v)}
                className="w-9 h-5 rounded-full transition-colors relative"
                style={{ backgroundColor: T.colors.dmToggleTrack }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    left: unreadsOnly ? "18px" : "4px",
                    backgroundColor: unreadsOnly ? T.colors.dmToggleThumbOn : T.colors.dmToggleThumb,
                  }}
                />
              </button>
              <button type="button" className="p-1.5 rounded hover:bg-white/10 text-white" title="New message">
                <IconPencil width={16} height={16} stroke="currentColor" />
              </button>
            </div>
          </div>
          {/* DM Search Bar */}
          <div className="px-4 pb-4 shrink-0">
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 focus-within:border-white focus-within:shadow-[0_0_0_1px_#fff,0_0_0_2px_#a189b2,0_0_12px_rgba(161,137,178,0.35)]"
              style={{
                backgroundColor: T.colors.dmSearchBg,
                border: `1px solid ${T.colors.dmSearchGlow}`,
              }}
            >
              <IconSearch width={14} height={14} style={{ color: T.colors.dmSearchPlaceholder }} stroke="currentColor" />
              <input
                type="text"
                placeholder={activeNav === "agentforce" ? "Find an agent" : "Find a DM"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-0 bg-transparent focus:outline-none placeholder:text-[#c1acD1]"
                style={{ color: "#fff", fontSize: T.typography.small }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Non-DM Header - Title row (Home, Activity, etc.) */}
          <div className="px-3 py-3 border-b flex items-center justify-between gap-2 shrink-0" style={{ borderColor: T.colors.border }}>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ fontSize: T.typography.header, color: T.colors.text }}>{title}</span>
              {showBetaBadge && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded" style={{ backgroundColor: T.colors.betaBadgeBg, color: T.colors.betaBadgeText }}>Beta</span>
              )}
            </div>
            <button type="button" className="p-2 rounded-md hover:bg-[#e8e8e8] ml-auto flex items-center justify-center" style={{ color: "#555" }} title="Settings">
              <IconSettings width={18} height={18} stroke="currentColor" />
            </button>
          </div>

          {/* All/DMs Tabs - Only for Home, Activity, More views */}
          {showAllDmsTabs && (
            <div className="flex items-center gap-1 px-2 py-2 border-b shrink-0" style={{ borderColor: T.colors.border }}>
              <button
                type="button"
                className={cn(
                  "relative px-3 py-1.5 font-medium rounded flex items-center gap-1.5",
                  filter === "all" ? "" : "hover:bg-[#f8f8f8]"
                )}
                style={filter === "all" ? { color: T.colors.text, fontSize: T.typography.small } : { color: T.colors.textSecondary, fontSize: T.typography.small }}
                onClick={() => setFilter("all")}
              >
                All
                <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: T.colors.avatarBg }}>{channelAndDmItems.length}</span>
                {filter === "all" && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: T.colors.avatarBg }} />}
              </button>
              <button
                type="button"
                className={cn(
                  "relative px-3 py-1.5 font-medium rounded",
                  filter === "dms" ? "" : "hover:bg-[#f8f8f8]"
                )}
                style={filter === "dms" ? { color: T.colors.text, fontSize: T.typography.small } : { color: T.colors.textSecondary, fontSize: T.typography.small }}
                onClick={() => setFilter("dms")}
              >
                DMs
                {filter === "dms" && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: T.colors.avatarBg }} />}
              </button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-[#f8f8f8]"
                style={{ color: T.colors.textSecondary }}
                title="Add"
              >
                <IconPlus width={T.iconSizes.channelHeader} height={T.iconSizes.channelHeader} stroke="currentColor" />
              </button>
            </div>
          )}

          {/* Search and Filters Bar - Only for non-Files/Later views */}
          {showSearchAndFilters && (
            <div className="flex items-center gap-1 px-2 py-1.5 border-b shrink-0" style={{ borderColor: T.colors.border }}>
              <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Select">
                <IconSquare width={14} height={14} stroke="currentColor" strokeWidth={2} />
                <span className="w-px h-4" style={{ backgroundColor: T.colors.border }} />
                <IconChevronDown width={12} height={12} stroke="currentColor" />
              </button>
              <button type="button" className="p-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Capture">
                <IconLayoutGrid width={14} height={14} stroke="currentColor" />
              </button>
              <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-[#f8f8f8]" style={{ color: T.colors.textSecondary }} title="Filter">
                <IconFilter width={14} height={14} stroke="currentColor" />
                <span className="w-px h-4" style={{ backgroundColor: T.colors.border }} />
                <IconChevronDown width={12} height={12} stroke="currentColor" />
              </button>
              <div className="flex-1" />
              <div className="flex rounded overflow-hidden border" style={{ borderColor: T.colors.border }}>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn("p-1.5", viewMode === "list" ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]")}
                  style={{ color: T.colors.textSecondary }}
                  title="List view"
                >
                  <IconList width={14} height={14} stroke="currentColor" strokeWidth={viewMode === "list" ? 2.5 : 2} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  className={cn("p-1.5 border-l", viewMode === "compact" ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]")}
                  style={{ borderColor: T.colors.border, color: T.colors.textSecondary }}
                  title="Compact view"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Later Search Bar */}
          {activeNav === "later" && (
            <div className="px-2 py-1.5 border-b shrink-0" style={{ borderColor: T.colors.border }}>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: T.colors.backgroundAlt }}>
                <IconSearch width={14} height={14} className="shrink-0" style={{ color: T.colors.textSecondary }} stroke="currentColor" />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent focus:outline-none"
                  style={{ color: T.colors.text, fontSize: T.typography.small }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className={cn("flex-1 overflow-y-auto min-h-0 flex flex-col", activeNav === "dms" ? "p-0" : "p-3 gap-2")}>
        {activeNav === "later" && filteredSaved.map((saved) => {
          const isActive = activeChatId === saved.channelId || channelId === saved.channelId;
          const className = cn(
            "flex items-start gap-3 px-3 py-2.5 rounded-lg group w-full transition-colors cursor-pointer",
            isActive ? "" : "hover:bg-[#f0e6f0]"
          );
          const style = {
            ...(isActive ? { backgroundColor: "#ebe0eb", boxShadow: "inset 0 0 0 1px rgba(97,31,105,0.25)" } : {}),
            borderBottom: "1px solid rgba(97,31,105,0.12)",
          };
          
          if (isPresentationMode && setActiveChatId) {
            // In presentation mode, use local state navigation ONLY - no URL updates
            return (
              <div
                key={saved.id}
                className={className}
                style={style}
                onClick={() => {
                  setActiveChatId(saved.channelId);
                  // DO NOT update URL in presentation mode - causes 404 errors
                }}
              >
                <IconBookmark width={16} height={16} className="shrink-0 mt-0.5" style={{ color: T.colors.textSecondary }} stroke="currentColor" />
                <div className="flex-1 min-w-0">
                  <p className="min-w-0 line-clamp-2 break-words" style={{ fontSize: T.typography.small, color: T.colors.text }}>{saved.preview}</p>
                </div>
                <span className="shrink-0" style={{ fontSize: T.typography.smaller, color: T.colors.textSecondary }}>{saved.timestamp}</span>
              </div>
            );
          }
          
          return (
            <Link
              key={saved.id}
              href={`/demo/workspace/${workspace.id}/channel/${saved.channelId}`}
              className={className}
              style={style}
            >
              <IconBookmark width={16} height={16} className="shrink-0 mt-0.5" style={{ color: T.colors.textSecondary }} stroke="currentColor" />
              <div className="flex-1 min-w-0">
                <p className="min-w-0 line-clamp-2 break-words" style={{ fontSize: T.typography.small, color: T.colors.text }}>{saved.preview}</p>
              </div>
              <span className="shrink-0" style={{ fontSize: T.typography.smaller, color: T.colors.textSecondary }}>{saved.timestamp}</span>
            </Link>
          );
        })}
        {activeNav === "dms" && dmsOnly.map((item, index) => {
          // Check if this is the active item: use prop activeDmId if provided (and not empty), otherwise use context/URL logic
          // When overrideDms is provided, use effectiveActiveDmId (which defaults to first DM)
          const hasPropSelection = propActiveDmId !== undefined && propActiveDmId !== '';
          const isActive = (hasPropSelection || overrideDms) 
            ? effectiveActiveDmId === item.id 
            : (activeChatId === item.id || effectiveChannelId === item.id || (!effectiveChannelId && !activeChatId && index === 0));
          
          const { preview, timestamp } = getChannelPreview(item.id);
          const avatarSrc = assetPath(item.isSlackbot ? "/slackbot-logo.svg" : (item.avatarUrl || getAvatarUrl(item.name, 64)));
          
          // Check if next item is also unselected (to show divider only between unselected cards)
          const nextItem = dmsOnly[index + 1];
          const nextIsActive = nextItem && ((hasPropSelection || overrideDms)
            ? effectiveActiveDmId === nextItem.id 
            : (activeChatId === nextItem.id || effectiveChannelId === nextItem.id));
          const showDivider = !isActive && !nextIsActive && nextItem; // Only show divider between unselected cards
          
          // Handler: use onDmSelect if provided (GlobalDMsView), otherwise use context
          const handleClick = () => {
            if (onDmSelect) {
              onDmSelect(item.id);
            } else if (isPresentationMode) {
              setActiveChatId(item.id);
            }
          };
          
          // Dense modern Slack-style DM button: flush edges, two-line layout, #5c2c5d active state
          const buttonClassName = cn(
            "w-full flex items-start px-4 py-2 cursor-pointer select-none caret-transparent outline-none focus:outline-none transition-colors group text-left",
            isActive 
              ? "bg-[#5c2c5d] text-white" 
              : "text-[#D1C2D0] hover:bg-white/5"
          );
          const buttonStyle = showDivider ? { borderBottom: "1px solid rgba(255,255,255,0.06)" } : {};
          
          // Text colors: white for selected, light gray for unselected
          const nameColor = isActive ? "#FFFFFF" : "#D1C2D0";
          const previewColor = isActive ? "rgba(255,255,255,0.8)" : "rgba(209,194,208,0.7)";
          const timestampColor = isActive ? "rgba(255,255,255,0.6)" : "rgba(209,194,208,0.6)";
          
          if (isPresentationMode && (!!setActiveChatId || !!onDmSelect)) {
            // In presentation mode, use button element (no URL navigation)
            return (
              <button
                key={item.id}
                type="button"
                className={buttonClassName}
                style={buttonStyle}
                onClick={handleClick}
              >
                <div className="relative mr-3 flex-shrink-0 mt-0.5">
                  <img 
                    src={avatarSrc} 
                    alt="" 
                    className={`w-6 h-6 rounded ${item.isSlackbot ? "object-contain" : "object-cover"}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!item.isSlackbot && !target.src.startsWith('data:')) {
                        target.src = generateInitialsAvatar(item.name, 24);
                      } else if (item.isSlackbot) {
                        target.src = assetPath("/slackbot-logo.svg");
                      }
                    }}
                  />
                  <StatusDot status={item.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className={cn("truncate text-[15px]", isActive ? "font-bold text-white" : "font-medium text-[#D1C2D0]")}>
                      {item.name}
                    </span>
                    {timestamp && (
                      <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: timestampColor }}>{timestamp}</span>
                    )}
                  </div>
                  {preview && (
                    <div className="truncate text-[13px] mt-0.5 leading-tight" style={{ color: previewColor }}>
                      {preview}
                    </div>
                  )}
                </div>
              </button>
            );
          }
          
          // For non-presentation mode, render as Link (legacy behavior)
          return (
            <Link
              key={item.id}
              href={`/demo/workspace/${workspace.id}/channel/${item.id}`}
              className={buttonClassName}
              style={buttonStyle}
            >
              <div className="relative mr-3 flex-shrink-0 mt-0.5">
                <img 
                  src={avatarSrc} 
                  alt="" 
                  className={`w-6 h-6 rounded ${item.isSlackbot ? "object-contain" : "object-cover"}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!item.isSlackbot && !target.src.startsWith('data:')) {
                      target.src = generateInitialsAvatar(item.name, 24);
                    } else if (item.isSlackbot) {
                      target.src = assetPath("/slackbot-logo.svg");
                    }
                  }}
                />
                <StatusDot status={item.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={cn("truncate text-[15px]", isActive ? "font-bold text-white" : "font-medium text-[#D1C2D0]")}>
                    {item.name}
                  </span>
                  {timestamp && (
                    <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: timestampColor }}>{timestamp}</span>
                  )}
                </div>
                {preview && (
                  <div className="truncate text-[13px] mt-0.5 leading-tight" style={{ color: previewColor }}>
                    {preview}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
        {activeNav === "agentforce" && (
          <div className="px-2 mb-2 space-y-0.5">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors text-[14px]">
              <IconPlus width={16} height={16} stroke="currentColor" className="opacity-70" />
              <span className="font-medium">New conversation</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/15 text-white text-[14px]">
              <IconBot width={16} height={16} stroke="currentColor" className="opacity-70" />
              <span className="font-bold">All agents</span>
            </button>
            <div className="px-3 pt-3 pb-1">
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Recent agents</span>
            </div>
          </div>
        )}
        {activeNav === "agentforce" && agentforceItems.map((item) => {
          const isActive = activeChatId === item.id || channelId === item.id;
          const { preview, timestamp } = getChannelPreview(item.id);
          const avatarSrc = assetPath(item.isSlackbot ? "/slackbot-logo.svg" : (item.avatarUrl || getAvatarUrl(item.name, 64)));
          const className = cn(
            "flex items-start gap-3 px-3 py-2.5 rounded-lg group w-full transition-colors cursor-pointer",
            isActive ? "" : "hover:bg-[#52215A]"
          );
          const style = {
            ...(isActive ? { backgroundColor: T.colors.dmSidebarSelect } : openDropdownId === item.id ? { backgroundColor: "#52215A" } : {}),
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          };
          
          if (isPresentationMode && setActiveChatId) {
            // In presentation mode, use local state navigation ONLY - no URL updates
            return (
              <div
                key={item.id}
                className={className}
                style={style}
                onClick={() => {
                  setActiveChatId(item.id);
                  // DO NOT update URL in presentation mode - causes 404 errors
                }}
              >
                <div className="relative shrink-0 mt-0.5">
                  <img 
                  src={avatarSrc} 
                  alt="" 
                  className={`w-8 h-8 rounded-md ${item.isSlackbot ? "object-contain" : "object-cover"}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                  }}
                />
                  <StatusDot status={item.status} />
                </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate font-medium text-white" style={{ fontSize: T.typography.body }}>{item.name}</span>
                </div>
                  {preview && (
                    <p className="mt-0.5 min-w-0 line-clamp-2 break-words" style={{ color: T.colors.dmMutedText }}>{preview}</p>
                  )}
                </div>
                <div className="shrink-0 mt-0.5 w-[72px] flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
                  <div className={cn("items-center gap-1 px-2 py-1 rounded-lg bg-white shadow-sm", (openDropdownId === item.id ? "flex" : "hidden group-hover:flex"))}>
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-0.5 rounded hover:bg-gray-100" title="Save for later">
                      <IconBookmark width={14} height={14} style={{ color: "#1d1c1d" }} stroke="currentColor" />
                    </button>
                    <DropdownMenu modal={false} open={openDropdownId === item.id} onOpenChange={(open) => setOpenDropdownId(open ? item.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-0.5 rounded hover:bg-gray-100" title="More options">
                          <IconMoreVertical width={14} height={14} style={{ color: "#1d1c1d" }} stroke="currentColor" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="right" className="w-56 bg-white rounded-lg shadow-lg border border-gray-200" sideOffset={4}>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                          <IconSquare width={14} height={14} stroke="currentColor" />
                          Mark as unread
                          <DropdownMenuShortcut>U</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                          <IconBookmark width={14} height={14} stroke="currentColor" />
                          Save for later
                          <DropdownMenuShortcut>A</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer text-sm text-[#1d1c1d]">
                            Remind me about this
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-44 bg-white rounded-lg shadow-lg border border-gray-200">
                            <DropdownMenuItem className="cursor-pointer text-sm">In 20 minutes</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">In 1 hour</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">In 3 hours</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">Tomorrow</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">Next week</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">Custom...</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer text-sm text-[#1d1c1d]">
                            Copy
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-44 bg-white rounded-lg shadow-lg border border-gray-200">
                            <DropdownMenuItem className="cursor-pointer text-sm">Copy name</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">Copy link</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm">Copy huddle link</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                          <IconHome width={14} height={14} stroke="currentColor" />
                          Open in home
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                          <IconLayoutGrid width={14} height={14} stroke="currentColor" />
                          Open in split view
                          <DropdownMenuShortcut>⌘ Opt Click</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                          <IconLink width={14} height={14} stroke="currentColor" />
                          Open in new window
                          <DropdownMenuShortcut>⌘ Click</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {timestamp && (
                    <span className={cn("text-right", openDropdownId === item.id ? "hidden" : "group-hover:hidden")} style={{ fontSize: T.typography.smaller, color: T.colors.dmMutedText }}>{timestamp}</span>
                  )}
                </div>
              </div>
            );
          }
          
          return (
            <Link
              key={item.id}
              href={`/demo/workspace/${workspace.id}/channel/${item.id}`}
              className={className}
              style={style}
            >
              <div className="relative shrink-0 mt-0.5">
                <img 
                  src={avatarSrc} 
                  alt="" 
                  className={`w-8 h-8 rounded-md ${item.isSlackbot ? "object-contain" : "object-cover"}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!item.isSlackbot && !target.src.startsWith('data:')) {
                      target.src = generateInitialsAvatar(item.name, 32);
                    } else if (item.isSlackbot) {
                      target.src = assetPath("/slackbot-logo.svg");
                    }
                  }}
                />
                <StatusDot status={item.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate font-medium text-white" style={{ fontSize: T.typography.body }}>{item.name}</span>
                </div>
                {preview && (
                  <p className="mt-0.5 min-w-0 line-clamp-2 break-words" style={{ color: T.colors.dmMutedText }}>{preview}</p>
                )}
              </div>
              <div className="shrink-0 mt-0.5 w-[72px] flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
                <div className={cn("items-center gap-1 px-2 py-1 rounded-lg bg-white shadow-sm", (openDropdownId === item.id ? "flex" : "hidden group-hover:flex"))}>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-0.5 rounded hover:bg-gray-100" title="Save for later">
                    <IconBookmark width={14} height={14} style={{ color: "#1d1c1d" }} stroke="currentColor" />
                  </button>
                  <DropdownMenu modal={false} open={openDropdownId === item.id} onOpenChange={(open) => setOpenDropdownId(open ? item.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-0.5 rounded hover:bg-gray-100" title="More options">
                        <IconMoreVertical width={14} height={14} style={{ color: "#1d1c1d" }} stroke="currentColor" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="w-56 bg-white rounded-lg shadow-lg border border-gray-200" sideOffset={4}>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                        <IconSquare width={14} height={14} stroke="currentColor" />
                        Mark as unread
                        <DropdownMenuShortcut>U</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                        <IconBookmark width={14} height={14} stroke="currentColor" />
                        Save for later
                        <DropdownMenuShortcut>A</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer text-sm text-[#1d1c1d]">
                          Remind me about this
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-44 bg-white rounded-lg shadow-lg border border-gray-200">
                          <DropdownMenuItem className="cursor-pointer text-sm">In 20 minutes</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">In 1 hour</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">In 3 hours</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">Tomorrow</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">Next week</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">Custom...</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer text-sm text-[#1d1c1d]">
                          Copy
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-44 bg-white rounded-lg shadow-lg border border-gray-200">
                          <DropdownMenuItem className="cursor-pointer text-sm">Copy name</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">Copy link</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm">Copy huddle link</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                        <IconHome width={14} height={14} stroke="currentColor" />
                        Open in home
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                        <IconLayoutGrid width={14} height={14} stroke="currentColor" />
                        Open in split view
                        <DropdownMenuShortcut>⌘ Opt Click</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-sm text-[#1d1c1d]">
                        <IconLink width={14} height={14} stroke="currentColor" />
                        Open in new window
                        <DropdownMenuShortcut>⌘ Click</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {timestamp && (
                  <span className={cn("text-right", openDropdownId === item.id ? "hidden" : "group-hover:hidden")} style={{ fontSize: T.typography.smaller, color: T.colors.dmMutedText }}>{timestamp}</span>
                )}
              </div>
            </Link>
          );
        })}
        {showChannelAndDmItems && channelAndDmItems.map((item) => {
          // Use activeChatId from context if available, otherwise fall back to effectiveChannelId
          const itemIsActive = activeChatId === item.id || effectiveChannelId === item.id;
          return (
            <ActivityListItem
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                type: item.type,
                avatarUrl: "avatarUrl" in item ? item.avatarUrl : undefined,
                status: "status" in item ? item.status : undefined,
                unread: ("unread" in item ? item.unread : false) && !isChannelRead(item.id),
              }}
              isActive={itemIsActive}
              workspaceId={workspace.id}
            />
          );
        })}
      </div>
    </aside>
  );
}
