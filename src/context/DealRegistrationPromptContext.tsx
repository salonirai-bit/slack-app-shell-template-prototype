"use client";

import { createContext, useContext, type ReactNode } from "react";

export type DealRegistrationPromptContextValue = {
  /** Increments each time the user requests “Register a new deal” while opening Slackbot. */
  promptKey: number;
  /** Last `promptKey` for which the Messages tab already appended the deal-registration bot line (shell state, survives panel unmount). */
  deliveredPromptKey: number;
  /** Called after appending the bot message so reopening the panel does not duplicate it. */
  markDealPromptDelivered: (key: number) => void;
  /** Opens the Slackbot panel and bumps `promptKey` so Messages can append the bot prompt. */
  requestRegisterDealPrompt: () => void;

  /** PRM “New MDF Request” — opens Slackbot with a recommended MDF draft. */
  mdfRequestPromptKey: number;
  mdfRequestDeliveredKey: number;
  markMdfRequestPromptDelivered: (key: number) => void;
  requestMdfRequestPrompt: () => void;
};

const DealRegistrationPromptContext = createContext<DealRegistrationPromptContextValue>({
  promptKey: 0,
  deliveredPromptKey: 0,
  markDealPromptDelivered: () => {},
  requestRegisterDealPrompt: () => {},
  mdfRequestPromptKey: 0,
  mdfRequestDeliveredKey: 0,
  markMdfRequestPromptDelivered: () => {},
  requestMdfRequestPrompt: () => {},
});

export function DealRegistrationPromptProvider({
  value,
  children,
}: {
  value: DealRegistrationPromptContextValue;
  children: ReactNode;
}) {
  return (
    <DealRegistrationPromptContext.Provider value={value}>
      {children}
    </DealRegistrationPromptContext.Provider>
  );
}

export function useDealRegistrationPrompt() {
  return useContext(DealRegistrationPromptContext);
}
