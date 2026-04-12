"use client";

import { useState, FormEvent, useRef, KeyboardEvent } from "react";
import { Plus, Smile, AtSign, Video, Mic, SquarePen, Send, ChevronDown } from "lucide-react";
import { SLACK_TOKENS } from "@/design/slack-tokens";

const T = SLACK_TOKENS;

interface MessageInputProps {
  placeholder?: string;
  onSubmit?: (message: string) => void;
  onSendMessage?: (message: string) => void; // Alias for onSubmit for consistency
  value?: string;
  onChange?: (value: string) => void;
}

export function MessageInput({ 
  placeholder = "Message #general", 
  onSubmit,
  onSendMessage,
  value: controlledValue,
  onChange: controlledOnChange
}: MessageInputProps) {
  const [internalInput, setInternalInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const input = controlledValue !== undefined ? controlledValue : internalInput;
  const setInput = controlledOnChange || setInternalInput;
  
  // Support both onSubmit and onSendMessage (alias)
  const handleSend = onSendMessage || onSubmit;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSend?.(input.trim());
      if (controlledValue === undefined) {
        // Only clear if using internal state
        setInput("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSend?.(input.trim());
        if (controlledValue === undefined) {
          setInput("");
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        }
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    // Dispatch hide-dock event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("hide-dock"));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    // Dispatch show-dock event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("show-dock"));
    }
  };

  return (
    <div className="p-4 pt-0 bg-white flex-shrink-0">
      <form onSubmit={handleSubmit} className="w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <div
          className="border border-gray-400 focus-within:border-gray-600 focus-within:shadow-sm rounded-xl bg-white transition-colors flex flex-col min-h-[85px]"
          onClick={(e) => {
            e.stopPropagation();
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }}
        >
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              const newValue = e.target.value;
              setInput(newValue);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={(e) => {
              e.stopPropagation();
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.focus();
              }
            }}
            placeholder={placeholder}
            rows={1}
            tabIndex={0}
            autoFocus={false}
            className="w-full text-[15px] p-3 pb-0 outline-none resize-none bg-transparent flex-1 text-gray-900 placeholder-gray-500"
            style={{
              minHeight: "22px",
              maxHeight: "200px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              handleKeyDown(e);
            }}
          />

          {/* Bottom Toolbar */}
          <div className="flex justify-between items-center p-1.5 bg-gray-50/50 rounded-b-xl mt-1">
            <div className="flex items-center gap-0.5 text-gray-500">
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600" title="Add">
                <Plus className="w-4 h-4"/>
              </button>
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-[15px] font-normal text-gray-500" title="Format">Aa</button>
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600" title="Emoji">
                <Smile className="w-4 h-4"/>
              </button>
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded font-medium text-[15px] text-gray-600" title="Mention">@</button>
              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600" title="Video">
                <Video className="w-4 h-4"/>
              </button>
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600" title="Mic">
                <Mic className="w-4 h-4"/>
              </button>
              <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
              <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600" title="Slash commands">
                <SquarePen className="w-4 h-4"/>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSend?.(input.trim());
                    if (controlledValue === undefined) {
                      setInput("");
                      if (textareaRef.current) {
                        textareaRef.current.style.height = "auto";
                      }
                    }
                  }
                }}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${input.trim() ? "bg-[var(--shell-cta)] hover:bg-[var(--shell-cta-hover)] text-white" : "text-gray-400 hover:bg-gray-200"}`}
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-gray-300"></div>
              <button type="button" className="w-6 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-500" title="More">
                <ChevronDown className="w-3 h-3"/>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
