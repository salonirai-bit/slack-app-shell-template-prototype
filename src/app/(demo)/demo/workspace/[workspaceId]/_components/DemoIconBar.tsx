"use client";

import { useState, useRef, CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconHome,
  IconMessage,
  IconBell,
  IconFolder,
  IconBookmark,
  IconBot,
  IconMore,
  IconPlus,
} from "@/components/icons";
import { Sun, BarChart3 } from "lucide-react";
import { useDemoData, getAvatarUrl, type DemoDM, type DemoFile, type DemoSavedItem } from "@/context/DemoDataContext";
import { useNav, usePresentationMode, useDemoContext, type NavView } from "../_context/demo-layout-context";
import { cn } from "@/lib/utils";
import { SLACK_TOKENS } from "@/design/slack-tokens";
import { assetPath } from "@/lib/asset-path";

const T = SLACK_TOKENS;

const navItems = [
  { icon: Sun,         label: "Today",      id: "today"      as const, href: "/today" },
  { icon: IconHome,    label: "Home",       id: "home"       as const, href: "/activity" },
  { icon: IconMessage, label: "DMs",        id: "dms"        as const, href: "/dms" },
  { icon: IconBell,    label: "Activity",   id: "activity"   as const, badge: 18, href: "/activity" },
  { icon: IconFolder,  label: "Files",      id: "files"      as const, href: "/files" },
  { icon: IconBookmark,label: "Later",      id: "later"      as const, href: "/later" },
  { icon: IconBot,     label: "Agentforce", id: "agentforce" as const, href: "/agentforce" },
  { icon: IconMore,    label: "More",       id: "more"       as const, href: "/more" },
];

// Nav items that show a flyout overlay on hover
const OVERLAY_IDS = new Set(["today", "dms", "files", "later", "agentforce", "more"]);

// ─── Shared overlay chrome ──────────────────────────────────────────────────

const PANEL: CSSProperties = {
  width: 340,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  border: "1px solid rgba(0,0,0,0.07)",
  overflow: "hidden",
  fontFamily: T.typography.fontFamily,
};

const HEADER: CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 15,
  fontWeight: 700,
  color: "#1D1C1D",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

function Row({
  onClick, children,
}: { onClick?: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "9px 16px",
        borderBottom: "1px solid #f8f8f8",
        cursor: "pointer",
        background: hov ? "#f8f8f8" : "transparent",
        transition: "background 0.1s",
      }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
  );
}

function UnreadsToggle() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#616061", fontWeight: 400 }}>Unreads</span>
      <div style={{ width: 30, height: 16, borderRadius: 8, background: "#ddd", position: "relative" }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#aaa", position: "absolute", top: 2, left: 2 }} />
      </div>
    </div>
  );
}

function StatusDot({ status }: { status?: DemoDM["status"] }) {
  if (!status) return null;
  const bg: Record<string, string> = { online: "#2eb886", away: "#aaa", dnd: "#e01e5a", call: "#555" };
  return (
    <span
      style={{
        position: "absolute",
        bottom: -1,
        right: -1,
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: bg[status] ?? "#aaa",
        border: "2px solid #fff",
      }}
    />
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const bg: Record<string, string> = {
    pdf: "#e74c3c", docx: "#2980b9", doc: "#2980b9",
    pptx: "#e67e22", ppt: "#e67e22", xlsx: "#27ae60", xls: "#27ae60",
  };
  return (
    <div
      style={{
        width: 36, height: 36, borderRadius: 8,
        background: bg[ext] ?? "#17a5bd",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 0 }}>
        {ext.toUpperCase().slice(0, 4) || "FILE"}
      </span>
    </div>
  );
}

// ─── Overlay: Today ─────────────────────────────────────────────────────────

const AGENDA_ITEMS = [
  { label: "SCG Product Inspections (Day 2)", time: "9:30pm", badge: "In 2h" },
  { label: "Be The Beat: Heart Health Prevention…",     time: "9:30pm", badge: null },
];

function TodayOverlay({ onNav }: { onNav: () => void }) {
  const [tab, setTab] = useState<"Today" | "Agenda" | "Replies" | "Highlights">("Today");
  return (
    <div style={{ ...PANEL, width: 370 }}>
      {/* Tabs */}
      <div style={{ display: "flex", padding: "0 14px", borderBottom: "1px solid #f0f0f0", background: "#fff" }}>
        {(["Today", "Agenda", "Replies", "Highlights"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); onNav(); }}
            style={{
              padding: "12px 10px",
              fontSize: 13,
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#1D1C1D" : "#616061",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #1D1C1D" : "2px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* NOW event */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#f0fdf4", borderLeft: "3px solid #2eb886" }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1D1C1D" }}>Family time</div>
        <span style={{ padding: "2px 8px", background: "#2eb886", color: "#fff", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>NOW</span>
      </div>

      {/* Upcoming */}
      {AGENDA_ITEMS.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px",
            borderLeft: "3px solid #ECB22E",
            borderBottom: "1px solid #f8f8f8",
          }}
        >
          <div style={{ flex: 1, fontSize: 13, color: "#1D1C1D" }}>{item.label}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {item.badge && (
              <span style={{ padding: "2px 6px", background: "#fffbe6", color: "#856404", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                {item.badge}
              </span>
            )}
            <span style={{ fontSize: 12, color: "#616061" }}>{item.time}</span>
            <span>📅</span>
          </div>
        </div>
      ))}

      {/* Tomorrow */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", color: "#616061", cursor: "pointer" }}>
        <span style={{ fontSize: 11 }}>▶</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Tomorrow</span>
        <span style={{ fontSize: 12, color: "#aaa", marginLeft: 4 }}>10 meetings</span>
      </div>
    </div>
  );
}

// ─── Overlay: DMs ───────────────────────────────────────────────────────────

function DMsOverlay({
  dms, getChannelPreview, onSelect,
}: {
  dms: DemoDM[];
  getChannelPreview: (id: string) => { preview: string; timestamp: string };
  onSelect: () => void;
}) {
  return (
    <div style={{ ...PANEL, width: 360 }}>
      <div style={HEADER}>
        <span>Direct messages</span>
        <UnreadsToggle />
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {dms.map((dm) => {
          const { preview, timestamp } = getChannelPreview(dm.id);
          const avatar = assetPath(dm.avatarUrl ?? getAvatarUrl(dm.name));
          return (
            <Row key={dm.id} onClick={onSelect}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt={dm.name} width={32} height={32} style={{ borderRadius: 4, display: "block" }} />
                <StatusDot status={dm.status} />
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1C1D" }}>{dm.name}</span>
                  <span style={{ fontSize: 11, color: "#888", flexShrink: 0, marginLeft: 8 }}>{timestamp}</span>
                </div>
                <p style={{ fontSize: 12, color: "#616061", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", marginTop: 2, marginBottom: 0 }}>
                  {preview.slice(0, 58)}{preview.length > 58 ? "…" : ""}
                </p>
              </div>
            </Row>
          );
        })}
      </div>
    </div>
  );
}

// ─── Overlay: Files ─────────────────────────────────────────────────────────

function FilesOverlay({ files }: { files: DemoFile[] }) {
  return (
    <div style={PANEL}>
      <div style={HEADER}>
        <span>Files</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#616061", fontWeight: 400 }}>Starred</span>
          <div style={{ width: 30, height: 16, borderRadius: 8, background: "#ddd", position: "relative" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#aaa", position: "absolute", top: 2, left: 2 }} />
          </div>
        </div>
      </div>
      {files.map((f) => (
        <Row key={f.id}>
          <FileIcon name={f.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1C1D", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", margin: 0 }}>
              {f.name}
            </p>
            <p style={{ fontSize: 12, color: "#888", marginTop: 2, marginBottom: 0 }}>Updated {f.timestamp}</p>
          </div>
        </Row>
      ))}
    </div>
  );
}

// ─── Overlay: Later ─────────────────────────────────────────────────────────

function LaterOverlay({ savedItems }: { savedItems: DemoSavedItem[] }) {
  return (
    <div style={PANEL}>
      <div style={HEADER}>
        <span>Later</span>
        <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}>{savedItems.length} in progress</span>
      </div>
      {savedItems.map((item) => (
        <Row key={item.id}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 3, marginTop: 0 }}>#{item.channelId}</p>
            <p style={{ fontSize: 13, color: "#1D1C1D", lineHeight: 1.4, margin: 0 }}>{item.preview}</p>
            <p style={{ fontSize: 11, color: "#aaa", marginTop: 4, marginBottom: 0 }}>{item.timestamp}</p>
          </div>
        </Row>
      ))}
    </div>
  );
}

// ─── Overlay: Agentforce ────────────────────────────────────────────────────

const AGENTS = [
  { id: "new",      label: "New Conversation",         sub: "Start a conversation with an agent",          emoji: "+",  emojiColor: "#7C3AED", bg: "#ede9fe" },
  { id: "all",      label: "All agents",                sub: "Your available agents",                       emoji: "🤖", emojiColor: "#444",    bg: "#f0f0f0" },
  { id: "employee", label: "Employee Agent",            sub: "Employee Agent is an AI Agent that helps you…", emoji: "🤖", emojiColor: "#fff",    bg: "#0ea5e9" },
  { id: "support",  label: "Agentforce Support Agent",  sub: "Help users answer all the questions related to…",emoji: "🤖", emojiColor: "#fff",    bg: "#2563eb" },
  { id: "data",     label: "Data Agent",                sub: "Hello! I help users discover and answer questi…",emoji: "🤖", emojiColor: "#fff",    bg: "#7c3aed" },
];

function AgentforceOverlay() {
  return (
    <div style={PANEL}>
      <div style={HEADER}><span>Agentforce</span></div>
      {AGENTS.map((a) => (
        <Row key={a.id}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: a.id === "new" ? 22 : 18, flexShrink: 0, color: a.emojiColor, fontWeight: 700 }}>
            {a.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1C1D", margin: 0 }}>{a.label}</p>
            <p style={{ fontSize: 12, color: "#888", marginTop: 2, marginBottom: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{a.sub}</p>
          </div>
        </Row>
      ))}
    </div>
  );
}

// ─── Overlay: More ──────────────────────────────────────────────────────────

function MoreOverlay() {
  const [t1, setT1] = useState(false);
  const [t2, setT2] = useState(false);
  return (
    <div style={{ ...PANEL, width: 300 }}>
      <div style={HEADER}><span>More</span></div>
      {/* Tools */}
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer", background: t1 ? "#f8f8f8" : "#fff", transition: "background 0.1s" }}
        onMouseEnter={() => setT1(true)}
        onMouseLeave={() => setT1(false)}
      >
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--shell-overlay-icon-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          🔧
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1C1D", margin: 0 }}>Tools</p>
          <p style={{ fontSize: 12, color: "#888", marginTop: 2, marginBottom: 0, lineHeight: 1.4 }}>Create and find workflows and apps</p>
        </div>
      </div>
      <div style={{ height: 1, background: "#f0f0f0", margin: "0 16px" }} />
      {/* Customize nav */}
      <div
        style={{ padding: "14px 16px", cursor: "pointer", background: t2 ? "#f8f8f8" : "#fff", transition: "background 0.1s" }}
        onMouseEnter={() => setT2(true)}
        onMouseLeave={() => setT2(false)}
      >
        <span style={{ fontSize: 14, color: "var(--shell-mrkdwn-link)", fontWeight: 500 }}>Customize navigation bar</span>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface DemoIconBarProps {
  onPrimaryNavChange?: (nav: "activity" | "dms") => void;
  /** Fires for every nav item click — the Shell uses this to update its internal nav state. */
  onNavChange?: (nav: NavView) => void;
  showDMBadge?: boolean;
}

export function DemoIconBar({ onPrimaryNavChange, onNavChange, showDMBadge = false }: DemoIconBarProps = {}) {
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || "demo-1";
  const base = `/demo/workspace/${workspaceId}`;
  const { activeNav, setActiveNav } = useNav();
  const { isPresentationMode } = usePresentationMode();
  const { demoContext } = useDemoContext();

  const { dms, files, savedItems, getChannelPreview } = useDemoData();

  // Global icon bar: Always filter out Slackbot DM (Seller Edge is Arc 1 specific)
  const filteredDms = dms.filter((dm) => !dm.isSlackbot);

  // Flyout overlay state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [overlayPos, setOverlayPos] = useState<{ top: number; left: number } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelLeave() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }
  function scheduleLeave() {
    cancelLeave();
    leaveTimer.current = setTimeout(() => {
      setHoveredId(null);
      setOverlayPos(null);
    }, 90);
  }
    function handleIconEnter(id: string, e: React.MouseEvent<HTMLDivElement>) {
    cancelLeave();
    if (!OVERLAY_IDS.has(id)) { setHoveredId(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setHoveredId(id);
    setOverlayPos({ top: r.top, left: r.right + 6 });
  }

  const showOverlay = !!hoveredId && !!overlayPos;

  return (
    <>
      <aside
        className="w-[72px] flex-shrink-0 flex flex-col items-center py-4 gap-0 bg-black"
      >
        {/* Logo */}
        <div className="mb-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/Salesforce.png")}
            alt="Salesforce"
            className="w-8 h-8 object-contain"
          />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const href = base + item.href;
          const isActive = activeNav === item.id;
          const isHovered = hoveredId === item.id;
          const showBadge = item.id === "dms" ? showDMBadge : item.badge !== undefined;
          const badgeVal  = item.id === "dms" && showDMBadge ? 1 : item.badge;

          return (
            <div
              key={item.id}
              className="relative w-full flex flex-col items-center py-2 cursor-pointer group"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                handleIconEnter(item.id, e);
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                scheduleLeave();
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {/* Active Indicator Line (Left Edge of Rail) */}
              {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full"></div>
              )}
              
              <Link
                href={href}
                onClick={(e) => {
                  setActiveNav(item.id);
                  // Fire onNavChange for ALL nav items so the Shell + Concept can react
                  onNavChange?.(item.id);
                  if (onPrimaryNavChange && (item.id === "activity" || item.id === "dms")) {
                    onPrimaryNavChange(item.id);
                  }
                  if (isPresentationMode) e.preventDefault();
                  // Close overlay on click
                  setHoveredId(null);
                }}
                className="relative w-full flex flex-col items-center"
                style={{ backgroundColor: 'transparent' }}
                title={item.label}
              >
                {/* Isolated Icon Container (Gets the background & scale) */}
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 relative",
                  isActive
                    ? "bg-white/20 text-white group-hover:scale-110"
                    : "text-white/70 group-hover:bg-white/10 group-hover:text-white"
                )}>
                  <Icon
                    width={T.iconSizes.navIcon}
                    height={T.iconSizes.navIcon}
                    stroke="currentColor"
                  />
                  {showBadge && badgeVal && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white z-10"
                      style={{ backgroundColor: T.colors.notificationRed }}
                    >
                      {badgeVal}
                    </span>
                  )}
                </div>
                
                {/* Text Label (No background, just text color change) */}
                <span 
                  className={cn(
                    "text-[10px] font-medium mt-1 transition-colors",
                    isActive ? "text-white" : "text-white/70 group-hover:text-white"
                  )}
                  style={{ backgroundColor: 'transparent' }}
                >
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}

        <div className="flex-1" />

        {/* Add button */}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors"
          title="Add"
        >
          <IconPlus width={T.iconSizes.navIconPlus} height={T.iconSizes.navIconPlus} stroke="currentColor" />
        </button>

        {/* Profile avatar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/profile-persona.png")}
          alt="Profile"
          className="w-8 h-8 mt-2 object-cover border border-white/20 shrink-0"
          style={{ borderRadius: `${T.radius.avatar}px` }}
          title="Profile"
        />
      </aside>

      {/* ── Flyout overlay panel (fixed, escapes overflow:hidden parent) ── */}
      {showOverlay && (
        <div
          style={{
            position: "fixed",
            top: overlayPos!.top,
            left: overlayPos!.left,
            zIndex: 9999,
            maxHeight: "85vh",
            overflowY: "auto",
            // hide scrollbar
            scrollbarWidth: "none",
          }}
          onMouseEnter={cancelLeave}
          onMouseLeave={scheduleLeave}
        >
          {hoveredId === "today" && (
            <TodayOverlay onNav={() => { setActiveNav("today"); setHoveredId(null); }} />
          )}
          {hoveredId === "dms" && (
            <DMsOverlay
              dms={filteredDms}
              getChannelPreview={getChannelPreview}
              onSelect={() => { setActiveNav("dms"); setHoveredId(null); }}
            />
          )}
          {hoveredId === "files"      && <FilesOverlay files={files} />}
          {hoveredId === "later"      && <LaterOverlay savedItems={savedItems} />}
          {hoveredId === "agentforce" && <AgentforceOverlay />}
          {hoveredId === "more"       && <MoreOverlay />}
        </div>
      )}
    </>
  );
}
