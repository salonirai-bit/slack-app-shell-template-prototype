"use client";

import React from "react";
import { useSlackbot } from "../_context/demo-layout-context";
import { IconSearch } from "@/components/icons";
import { assetPath } from "@/lib/asset-path";
import { cn } from "@/lib/utils";

export function AppHeader({
  topViewMode = "channel-manager",
}: {
  topViewMode?: "admin" | "channel-manager" | "seller";
} = {}) {
  const { isOpen, toggle } = useSlackbot();
  return (
    <header
      className={cn(
        "h-12 shrink-0 flex items-center w-full relative z-[100] text-white",
        topViewMode === "seller" ? "bg-[#0a0a0a]" : "bg-[#4A154B]"
      )}
      style={{ marginTop: 0 }}
    >
      {/* Spacer: align with list pillar (72px icon bar) - arrows start after */}
      <div className="w-[72px] shrink-0" aria-hidden />

      {/* Left: Nav arrows (after list pillar) */}
      <div className="flex items-center gap-1 pl-2 pr-4 shrink-0" style={{ marginLeft: '270px' }}>
        <button className="p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors" title="Back">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 text-white/80 transition-colors" title="Forward">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Center: Search bar + Slackbot icon grouped together */}
      <div className="flex-1 flex items-center justify-center min-w-0 max-w-[776px] mx-4" style={{ marginLeft: '-8px' }}>
        {/* Search bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 min-w-0">
          <IconSearch width={18} height={18} className="text-white/70 shrink-0" stroke="currentColor" />
          <input
            type="text"
            placeholder="Search Salesforce"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-white placeholder:text-white/60 text-sm"
          />
        </div>
        {/* Slackbot Toggle - grouped with search bar, on the right */}
        <button
          type="button"
          onClick={toggle}
          className={`p-2 rounded hover:bg-white/10 transition-colors shrink-0 cursor-pointer ${isOpen ? "bg-white/15" : ""}`}
          title={isOpen ? "Close Slackbot" : "Open Slackbot"}
          style={{ marginLeft: '16px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/slackbot-logo.svg")} alt="Slackbot" width={33} height={33} />
        </button>
      </div>

      {/* Right: Call + Bell + Help + Give Feedback (right-aligned) */}
      <div className="flex items-center gap-1 pl-4 pr-4 shrink-0 ml-auto">
        {/* Call */}
        <button className="p-2 rounded hover:bg-white/10 text-white/90 transition-colors" title="Calls">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>

        {/* Bell */}
        <button className="p-2 rounded hover:bg-white/10 text-white/90 transition-colors relative" title="Notifications">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Help */}
        <button className="p-2 rounded hover:bg-white/10 text-white/90 transition-colors" title="Help">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* Give Feedback */}
        <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90 text-sm transition-colors">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Give Feedback</span>
        </button>
      </div>
    </header>
  );
}
