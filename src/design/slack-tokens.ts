/**
 * Slack design tokens - from Figma design system (node 803:59733).
 * Source: Figma MCP get_variable_defs.
 */

export const SLACK_TOKENS = {
  colors: {
    // From Figma: 🌞Light/Primary, Content
    text: "#1D1C1D",
    textSecondary: "#616061", // Max Contrast Gray
    textTertiary: "#7c7a7f", // Core Content Tertiary
    textHighlight: "#454447", // Core Content Secondary

    // Global fill - darkest purple for header, left nav, root (Slack aubergine base)
    globalBg: "#4A154B",
    // DM sidebar - deep purple (reference #350D35)
    dmSidebarBg: "#350D35",
    dmSidebarBgSolid: "#350D35", // Fallback
    // From Figma: Window BG Primary - purple left sidebar (legacy)
    iconBar: "#611f69", // Purple (Figma Window BG Primary)
    sidebar: "#611f69", // Same - purple
    sidebarDark: "#39063a", // Window BG Secondary
    sidebarHover: "rgba(255, 255, 255, 0.08)", // Hover: #5a2b5e / rgba
    sidebarActive: "#69356A", // Selected state (muted purple)
    sidebarHoverBg: "#5a2b5e", // Hover background
    themeImportant: "#4a154b", // Content Important
    themeBase: "#eabdfb", // Base Important
    themeSurface: "#F9EDFF", // Inverse Primary

    // From Figma: Core
    background: "#FFFFFF",
    backgroundAlt: "#f8f8f8", // Base Secondary
    activitySidebar: "#F9EDFF", // Figma Theme Surface Inverse Primary
    dmSidebar: "#4D1A4E", // DM list base (slightly lighter than global for differentiation)
    dmSidebarSelect: "#5a2b5e", // Selected item in DM list
    dmSidebarHover: "#52215A", // Hover in DM list
    dmSearchBg: "#623e78", // Search body (from reference)
    dmSearchGlow: "#a189b2", // Outer soft glow border
    dmSearchBorder: "#FFFFFF", // Inner crisp white border
    dmSearchPlaceholder: "#c1acD1", // Icon and placeholder (light desaturated purple)
    dmToggleTrack: "#4A234A", // Unreads toggle track (off state)
    dmToggleThumb: "#D3D3D3", // Unreads toggle thumb (off state)
    dmToggleThumbOn: "#FFFFFF", // Thumb when on
    dmMutedText: "#B0B0B0", // Timestamp, message preview in DM list
    border: "#e8e8e8",
    borderSecondary: "#5e5d6073",
    borderTertiary: "#5E5D60",

    // From Figma: Links & Buttons
    link: "#1264a3", // Content Highlight 1
    primaryButton: "#20a271", // Inverse Highlight 2 (Figma green)
    primaryButtonHover: "#1a8a5f",

    // Notifications
    notificationRed: "#e01e5a",

    // Badges & Avatars
    betaBadgeBg: "#e8f4fc",
    betaBadgeText: "#1264a3",
    avatarBg: "#611f69",
    avatarBgVariants: ["#611f69", "#e01e5a", "#36c5f0", "#2eb886", "#ecb22e"],
  },

  /**
   * Partner View — DM / Agentforce left list (dark gray, replaces purple dmSidebar* in that tab only).
   */
  partnerDmChrome: {
    sidebarBg: "#252628",
    sidebarSelect: "#3d4046",
    rowHover: "#32353b",
    rowOpen: "#35383e",
    searchBg: "#2f3136",
    searchBorder: "#4b4e55",
    searchPlaceholder: "#9da3ad",
    toggleTrack: "#1a1b1e",
    toggleThumbOff: "#8b909a",
    toggleThumbOn: "#ffffff",
    mutedText: "#a3a8b0",
  },

  /** Channel Manager tab — aubergine chrome (#4A154B); light surfaces stay lavender, not gray/black */
  channelManager: {
    shell: "#4A154B",
    rail: "#4A154B",
    sidebarScroll: "#350D35",
    lightSurface: "#F9EDFF",
    lightHover: "#EDD8F0",
    lightPressed: "#E5D0EB",
    lightBorder: "#DCC9E4",
    textMutedOnLight: "#5c4866",
    toggleThumbOff: "#EDE4F5",
    overlayScrim: "rgba(74, 21, 75, 0.42)",
    partnerRail: "#0a0a0a",
  },

  typography: {
    fontFamily: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    // From Figma: Body - Regular
    body: "15px",
    bodyLineHeight: "22px",
    bodyWeight: 400,

    // From Figma: Caption
    caption: "13px",
    captionLineHeight: "18px",

    // From Figma: Micro
    micro: "12px",
    microLineHeight: "18px",

    // Sizes
    header: "18px",
    title: "22px",
    medium: "14px",
    small: "13px",
    smaller: "12px",

    // Weights
    weightRegular: 400,
    weightMedium: 500,
    weightBold: 700,
    weightBlack: 900,
  },

  shadows: {
    // From Figma: Level 1 - Button Shadow
    button: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
    // From Figma: Level 2 - Menu Shadow
    menu: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
    // From Figma: Level 3 - Modal Shadow
    modal: "0 18px 48px 0 rgba(0, 0, 0, 0.1)",
    // Subtle deep shadow for left panel (casts onto content)
    panelDeep: "4px 0 24px -4px rgba(0, 0, 0, 0.15), 2px 0 8px -2px rgba(0, 0, 0, 0.1)",
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 8,
    base: 10,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 24,
  },

  radius: {
    subtle: 3,
    small: 4,
    medium: 6,
    large: 8,
    pill: 9999,
    avatar: 4,
    button: 4,
    input: 8,
    panel: 24, // Main panel rounding (left nav+sidebar, slackbot)
  },

  iconSizes: {
    logo: 32,
    navIcon: 20,
    navIconPlus: 18,
    channelAvatar: 32,
    sidebarAction: 12,
    channelHeader: 16,
    messageAvatar: 36,
    inputToolbar: 14,
    inputActions: 16,
    slackbotLogo: 24,
    slackbotHeader: 16,
    slackbotTab: 14,
    actionButton: 16,
    mascot: 120,
  },

  dimensions: {
    iconBarWidth: 72,
    sidebarWidth: 340,
    channelHeaderHeight: 49,
    slackbotPanelMinWidth: 300,
    slackbotPanelMaxWidth: 480,
    notificationBadge: 18,
    avatarProfile: 32,
    avatarChannel: 32,
    avatarMessage: 36,
  },
} as const;

export type SlackTokens = typeof SLACK_TOKENS;
