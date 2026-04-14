"use client";

import { createContext, useContext } from "react";

// Demo context for strict narrative isolation
export type DemoContext = 'N1A1' | 'N1A2' | 'N2A1' | 'N2A2' | 'OTHER';
const DemoContextContext = createContext<{
  demoContext: DemoContext;
  setDemoContext: (v: DemoContext) => void;
}>({
  demoContext: 'N2A1',
  setDemoContext: () => {},
});

export const useDemoContext = () => useContext(DemoContextContext);

// Slackbot panel visibility
const SlackbotContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}>({
  isOpen: true,
  toggle: () => {},
  open: () => {},
  close: () => {},
});

export const useSlackbot = () => useContext(SlackbotContext);

// Nav context for left icon bar
export type NavView = "home" | "dms" | "activity" | "files" | "later" | "agentforce" | "more" | "today" | "sales";
const NavContext = createContext<{
  activeNav: NavView;
  setActiveNav: (v: NavView) => void;
}>({
  activeNav: "activity",
  setActiveNav: () => {},
});

export const useNav = () => useContext(NavContext);

// Presentation mode context - disables navigation
const PresentationModeContext = createContext<{
  isPresentationMode: boolean;
}>({
  isPresentationMode: false,
});

export const usePresentationMode = () => useContext(PresentationModeContext);

export function DemoLayoutProviders({
  children,
  isSlackbotOpen,
  setIsSlackbotOpen,
  activeNav,
  setActiveNav,
  isPresentationMode = false,
  demoContext = 'N2A1',
  setDemoContext,
}: {
  children: React.ReactNode;
  isSlackbotOpen: boolean;
  setIsSlackbotOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  activeNav: NavView;
  setActiveNav: (v: NavView) => void;
  isPresentationMode?: boolean;
  demoContext?: DemoContext;
  setDemoContext?: (v: DemoContext) => void;
}) {
  return (
    <PresentationModeContext.Provider value={{ isPresentationMode }}>
      <DemoContextContext.Provider value={{ 
        demoContext, 
        setDemoContext: setDemoContext || (() => {}) 
      }}>
        <NavContext.Provider value={{ activeNav, setActiveNav }}>
          <SlackbotContext.Provider
            value={{
              isOpen: isSlackbotOpen,
              toggle: () => setIsSlackbotOpen((prev) => !prev),
              open: () => setIsSlackbotOpen(true),
              close: () => setIsSlackbotOpen(false),
            }}
          >
            {children}
          </SlackbotContext.Provider>
        </NavContext.Provider>
      </DemoContextContext.Provider>
    </PresentationModeContext.Provider>
  );
}
