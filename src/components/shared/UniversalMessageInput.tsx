"use client";

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Plus, Smile, AtSign, Video, Mic, SquarePen, Send, ChevronDown } from 'lucide-react';

interface UniversalMessageInputProps {
  placeholder?: string;
  onSendMessage: (text: string) => void;
}

export const UniversalMessageInput = ({ placeholder = "Message...", onSendMessage }: UniversalMessageInputProps) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSendMessage(text.trim());
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  return (
    <div className="p-4 pt-0 bg-white flex-shrink-0">
      <div className="border border-gray-400 focus-within:border-gray-600 focus-within:shadow-sm rounded-xl bg-white transition-colors flex flex-col min-h-[85px]">
        {/* Text Area */}
        <textarea 
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder} 
          className="w-full text-[15px] p-3 pb-0 outline-none resize-none bg-transparent flex-1 text-gray-900 placeholder-gray-500" 
          rows={1}
          style={{ minHeight: '22px', maxHeight: '200px' }}
        />
        
        {/* Toolbar */}
        <div className="flex justify-between items-center p-1.5 bg-gray-50/50 rounded-b-xl mt-1">
          <div className="flex items-center gap-0.5 text-gray-500">
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600">
              <Plus className="w-4 h-4"/>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-[15px] font-normal text-gray-500">Aa</button>
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600">
              <Smile className="w-4 h-4"/>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded font-medium text-[15px] text-gray-600">@</button>
            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600">
              <Video className="w-4 h-4"/>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600">
              <Mic className="w-4 h-4"/>
            </button>
            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
            <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600">
              <SquarePen className="w-4 h-4"/>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => { if(text.trim()) { onSendMessage(text.trim()); setText(''); } }}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${text.trim() ? "bg-[var(--shell-cta)] hover:bg-[var(--shell-cta-hover)] text-white" : "text-gray-400 hover:bg-gray-200"}`}
            >
              <Send className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-gray-300"></div>
            <button type="button" className="w-6 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-500">
              <ChevronDown className="w-3 h-3"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
