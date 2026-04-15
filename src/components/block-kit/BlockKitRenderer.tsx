"use client";

import React, { memo } from "react";
import Image from "next/image";
import { SLACK_TOKENS } from "@/design/slack-tokens";
import { IconLayoutGrid, IconInfo, IconBell, IconClock } from "@/components/icons";
import { getMessageAvatarUrl } from "@/context/DemoDataContext";

// Universal ToolIcon component with native Slack-style tooltip (shared with Arc1AgentforcePanel)
interface ToolIconProps {
  name: string;
  size?: "sm" | "md";
}

const ToolIcon = memo(function ToolIcon({ name, size = "md" }: ToolIconProps) {
  // Strict mapping: tool names to exact PNG filenames (handling spaces with encodeURI)
  const toolMap: Record<string, string> = {
    "Salesforce": "/Salesforce.png",
    "Gmail": "/Gmail.png",
    "Highspot": "/Highspot.png",
    "Gong": "/gong.png", // Lowercase filename
    "Google Calendar": "/Google Calendar.png", // Exact string with space
    "Google Drive": "/Google Drive.png", // Exact string with space
    "Clari": "/Clari.png",
    "Salesloft": "/salesloft.png", // Lowercase filename
    "Slack": "/Slack.png",
  };

  const iconPath = toolMap[name] || null;
  // Use encodeURI to handle spaces in filenames (e.g., "Google Calendar.png")
  const encodedPath = iconPath ? encodeURI(iconPath) : null;
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  const pixelSize = size === "sm" ? 16 : 24;

  return (
    <div className="group relative cursor-pointer inline-flex items-center justify-center">
      {encodedPath ? (
        <Image
          src={encodedPath}
          alt={name}
          width={pixelSize}
          height={pixelSize}
          className={`${sizeClasses} shrink-0 object-contain`}
          style={{ verticalAlign: 'middle' }}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gray-300 shrink-0 flex items-center justify-center`}
          title={name}
          aria-label={name}
        />
      )}
      {/* Tooltip with bottom nubbin */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none z-[100]">
        <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap relative">
          {name}
          {/* Bottom nubbin (triangle) */}
          <div className="absolute top-full left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
});

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: Array<{
    type: string;
    text: { type: string; text: string; emoji?: boolean };
    action_id?: string;
    style?: string;
    value?: string;
  }>;
  accessory?: {
    type: string;
    text: { type: string; text: string };
    action_id?: string;
    style?: string;
  };
}

function renderMrkdwn(text: string) {
  // Handle mentions <@Name>, links <url|text>, bold *text*, code `text`, italic _text_
  // Also handle tool links specially: <https://salesforce.com|Salesforce> · Synced
  const toolNames = ["Salesforce", "Gmail", "Highspot", "Gong", "Google Calendar", "Google Drive", "Clari", "Salesloft", "Slack"];
  
  // First, replace tool links with placeholders
  let processedText = text;
  const toolReplacements: Array<{ placeholder: string; toolName: string }> = [];
  let replacementIndex = 0;
  
  // Match tool links: <https://...|ToolName> followed by optional text
  const toolLinkPattern = /<https?:\/\/[^|>]+\|(Salesforce|Gmail|Highspot|Gong|Google Calendar|Google Drive|Clari|Salesloft)>/g;
  processedText = processedText.replace(toolLinkPattern, (match, toolName) => {
    const placeholder = `__TOOL_${replacementIndex}__`;
    toolReplacements.push({ placeholder, toolName });
    replacementIndex++;
    return placeholder;
  });
  
  const parts = processedText.split(/(<@[^>]+>|<https?:\/\/[^|>]+\|[^>]+>|<https?:\/\/[^>\s]+>|\*[^*]+\*|`[^`]+`|_[^_]+_|__TOOL_\d+__)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    
    // Check if this is a tool icon placeholder
    const toolMatch = part.match(/__TOOL_(\d+)__/);
    if (toolMatch) {
      const replacement = toolReplacements[parseInt(toolMatch[1])];
      return (
        <span key={i} className="inline-flex items-center justify-center gap-1" style={{ verticalAlign: 'middle' }}>
          <ToolIcon name={replacement.toolName} size="sm" />
        </span>
      );
    }
    
    // Mentions: <@Rita Patel> - show with avatar
    if (part.startsWith("<@") && part.endsWith(">")) {
      const name = part.slice(2, -1);
      const avatarUrl = getMessageAvatarUrl(name);
      return (
        <span key={i} className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--shell-mrkdwn-link)" }}>
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt=""
              width={16}
              height={16}
              className="rounded-full"
              unoptimized={avatarUrl.startsWith("/")}
            />
          )}
          @{name}
        </span>
      );
    }
    
    // Links: <https://example.com|text> or <https://example.com>
    if (part.startsWith("<http") && part.endsWith(">")) {
      const linkMatch = part.match(/<([^|>]+)(?:\|([^>]+))?>/);
      if (linkMatch) {
        const url = linkMatch[1];
        const linkText = linkMatch[2] || url;
        
        // Check if link text is a tool name (for deal room timeline)
        const toolNames = ["Salesforce", "Gmail", "Highspot", "Gong", "Google Calendar", "Google Drive", "Clari", "Salesloft", "Slack"];
        const isToolLink = toolNames.some(tool => linkText === tool);
        
        if (isToolLink) {
          // Extract remaining text after the link (e.g., " · Synced 12:34 PM")
          // The part contains the full link, so we need to get text after it
          // Since we're processing parts, we'll handle this in the parent context
          return (
            <span key={i} className="inline-flex items-center gap-1">
              <ToolIcon name={linkText} size="sm" />
            </span>
          );
        }
        
        return (
          <a key={i} href={url} className="underline" style={{ color: "var(--shell-mrkdwn-link)" }} target="_blank" rel="noopener noreferrer">
            {linkText}
          </a>
        );
      }
    }
    
    // Bold: *text*
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    
    // Code: `text`
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-gray-100 px-1 rounded text-sm">{part.slice(1, -1)}</code>;
    }
    
    // Italic: _text_
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    
    return <span key={i}>{part}</span>;
  }).filter(Boolean);
}

const T = SLACK_TOKENS;

function renderTextObject(obj: { type: string; text: string }) {
  if (obj.type === "mrkdwn") {
    return (
      <span
        className="text-[15px]"
        style={{ color: T.colors.text, lineHeight: T.typography.bodyLineHeight }}
      >
        {renderMrkdwn(obj.text)}
      </span>
    );
  }
  return (
    <span
      className="text-[15px]"
      style={{ color: T.colors.text, lineHeight: T.typography.bodyLineHeight }}
    >
      {obj.text}
    </span>
  );
}

function Block({ block, onAction }: { block: SlackBlock; onAction?: (actionId: string) => void }) {
  switch (block.type) {
    case "header": {
      const text = block.text?.text ?? "";
      return (
        <div
          className="text-[15px] font-bold mb-2 mt-3 first:mt-0"
          style={{ color: T.colors.text }}
        >
          {text}
        </div>
      );
    }
    case "section": {
      const content: React.ReactNode[] = [];
      if (block.fields) {
        content.push(
          <div key="fields" className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
            {block.fields.map((f, i) => (
              <div
                key={i}
                className="text-[15px]"
                style={{ color: T.colors.text, lineHeight: T.typography.bodyLineHeight }}
              >
                {f.type === "mrkdwn" ? renderMrkdwn(f.text) : f.text}
              </div>
            ))}
          </div>
        );
      }
      if (block.text) {
        const text = block.text.type === "mrkdwn" ? renderMrkdwn(block.text.text) : block.text.text;
        // Check if this is the warning message (contains ⚠️)
        const isWarning = typeof block.text.text === 'string' && block.text.text.includes('⚠️');
        content.push(
          <div
            key="text"
            className={`text-[15px] mb-2 whitespace-pre-line ${isWarning ? 'bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg' : ''}`}
            style={{ 
              color: isWarning ? '#92400e' : T.colors.text, 
              lineHeight: T.typography.bodyLineHeight 
            }}
          >
            {text}
          </div>
        );
      }
      return <div className="mb-2">{content}</div>;
    }
    case "divider":
      return <hr className="my-3 border-t" style={{ borderColor: T.colors.border }} />;
    case "actions": {
      if (!block.elements) return null;
      
      // Icon mapping for buttons
      const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
        plan_q1: IconLayoutGrid,
        reflect_q4: IconInfo,
        review_risk: IconBell,
        today_plate: IconClock,
      };
      
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {block.elements.map((el, i) => {
            if (el.type !== "button") return null;
            const label = el.text?.text ?? "";
            // Remove emoji from label if present
            const cleanLabel = label.replace(/^[\uD83C-\uDBFF\uDC00-\uDFFF]+\s*/g, '').trim();
            const IconComponent = el.action_id ? iconMap[el.action_id] : null;
            
            const isPrimary = el.style === "primary";
            return (
              <button
                key={i}
                type="button"
                onClick={() => el.action_id && onAction?.(el.action_id)}
                className={`px-4 py-2 text-sm font-medium border transition-colors flex items-center gap-2 ${
                  isPrimary
                    ? "bg-[var(--shell-block-primary-bg)] border-[var(--shell-block-primary-bg)] text-white hover:bg-[var(--shell-block-primary-hover)] hover:border-[var(--shell-block-primary-hover)]"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
                style={{
                  borderRadius: `${T.radius.button}px`,
                  color: isPrimary ? '#ffffff' : T.colors.text,
                }}
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
                {cleanLabel}
              </button>
            );
          })}
        </div>
      );
    }
    case "context": {
      if (!block.elements) return null;
      return (
        <div
          className="flex flex-col gap-1 mb-3 text-[12px]"
          style={{ color: T.colors.textSecondary }}
        >
          {block.elements.map((el, i) => (
            <span key={i}>{el.type === "mrkdwn" ? renderMrkdwn(typeof el.text === 'string' ? el.text : el.text?.text ?? '') : el.text?.text ?? ""}</span>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

interface BlockKitRendererProps {
  blocks: SlackBlock[];
  onAction?: (actionId: string) => void;
  className?: string;
}

export function BlockKitRenderer({ blocks, onAction, className = "" }: BlockKitRendererProps) {
  if (!blocks?.length) return null;
  return (
    <div className={`block-kit-renderer ${className}`}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} onAction={onAction} />
      ))}
    </div>
  );
}
