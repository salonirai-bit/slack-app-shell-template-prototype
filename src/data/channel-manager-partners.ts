/**
 * Channel Manager tab only — partner orgs + DM-style threads (channel manager ↔ partner).
 * Not used in Partner View (`seller`).
 */

export type ChannelManagerPartner = {
  id: string;
  name: string;
  avatarUrl: string;
  preview: string;
  timestamp: string;
};

export type ChannelManagerPartnerTurn = {
  role: "partner" | "you";
  time: string;
  text: string;
};

export const CHANNEL_MANAGER_PARTNER_IDS = new Set<string>();

function p(row: ChannelManagerPartner, turns: ChannelManagerPartnerTurn[]) {
  CHANNEL_MANAGER_PARTNER_IDS.add(row.id);
  return { row, turns };
}

const _defs = [
  p(
    {
      id: "cm-partner-vertex",
      name: "Vertex Alliance",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/12.jpg",
      preview: "MDF request looks good — submitted the receipt bundle this morning.",
      timestamp: "10:42 AM",
    },
    [
      { role: "partner", time: "Yesterday", text: "Quick heads-up: we're planning a co-sell webinar for Acme in March. Can you sanity-check the joint value story?" },
      { role: "you", time: "Yesterday", text: "Yes — send the one-pager and I'll align it with our AE narrative before you loop in marketing." },
      { role: "partner", time: "10:42 AM", text: "MDF request looks good — submitted the receipt bundle this morning." },
      { role: "you", time: "10:55 AM", text: "Got it. I'll route it for approval today and ping you if finance needs anything else." },
    ]
  ),
  p(
    {
      id: "cm-partner-northstar",
      name: "Northstar Digital",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/33.jpg",
      preview: "Sporty Nation deal — partner reg is in draft. Want your eyes before I send.",
      timestamp: "9:18 AM",
    },
    [
      { role: "partner", time: "Monday", text: "Welcome back — happy to be live on PRM in Slack. What's the best way to flag stuck deal regs?" },
      { role: "you", time: "Monday", text: "Drop the opp link here and @ me — I'll either unblock or route to the right COE." },
      { role: "partner", time: "9:18 AM", text: "Sporty Nation deal — partner reg is in draft. Want your eyes before I send." },
      { role: "you", time: "9:22 AM", text: "Send it. Main thing is attach the SOW excerpt and partner role — I'll reply inline." },
    ]
  ),
  p(
    {
      id: "cm-partner-bluepeak",
      name: "BluePeak Tech",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/54.jpg",
      preview: "TechStart QBR prep — can we get a SE for 30m Thursday?",
      timestamp: "Yesterday",
    },
    [
      { role: "partner", time: "Yesterday", text: "TechStart QBR prep — can we get a SE for 30m Thursday?" },
      { role: "you", time: "Yesterday", text: "Thursday 2–2:30 PT works on our side. I'll confirm Jordan and send the invite." },
      { role: "partner", time: "Yesterday", text: "Perfect. I'll add their CIO + procurement so we're not re-threading email." },
    ]
  ),
  p(
    {
      id: "cm-partner-summit",
      name: "Summit Partners Group",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/48.jpg",
      preview: "Thanks for the enablement deck — team loved the objection handlers.",
      timestamp: "Tue",
    },
    [
      { role: "you", time: "Tue", text: "Pushed the updated PRM playbook to the shared folder — new section on MDF evidence." },
      { role: "partner", time: "Tue", text: "Thanks for the enablement deck — team loved the objection handlers." },
      { role: "partner", time: "Tue", text: "We'll roll it into next week's partner call if that's OK." },
      { role: "you", time: "Tue", text: "Absolutely — I can join for 10m at the top if you want live Q&A." },
    ]
  ),
  p(
    {
      id: "cm-partner-catalyst",
      name: "Catalyst SI",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/36.jpg",
      preview: "Greentech renewal — need signature path by Friday. Who owns counter-sign?",
      timestamp: "8:05 AM",
    },
    [
      { role: "partner", time: "8:05 AM", text: "Greentech renewal — need signature path by Friday. Who owns counter-sign?" },
      { role: "you", time: "8:12 AM", text: "Priya's team — I'll intro you in-thread and stay on for blockers." },
      { role: "partner", time: "8:20 AM", text: "Copy. Also: can we get a reference slide for the ROI bridge you used in the last QBR?" },
      { role: "you", time: "8:24 AM", text: "Yes — pulling from the archived deck now. Will Slack you the PDF link." },
    ]
  ),
  p(
    {
      id: "cm-partner-meridian",
      name: "Meridian Solutions",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/62.jpg",
      preview: "Pipeline hygiene Q: should partner-sourced opps use the new tag set?",
      timestamp: "Mon",
    },
    [
      { role: "partner", time: "Mon", text: "Pipeline hygiene Q: should partner-sourced opps use the new tag set?" },
      { role: "you", time: "Mon", text: "Use Partner Source + segment tags — I sent the cheat sheet in #partner-ops last week." },
      { role: "partner", time: "Mon", text: "Found it. We'll re-label open opps by EOD tomorrow." },
    ]
  ),
  p(
    {
      id: "cm-partner-horizon",
      name: "Horizon VAR",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/71.jpg",
      preview: "Runners Club follow-up: champion wants a tighter success plan.",
      timestamp: "4:30 PM",
    },
    [
      { role: "partner", time: "Wed", text: "Runners Club follow-up: champion wants a tighter success plan." },
      { role: "you", time: "Wed", text: "Let's anchor on adoption milestones + exec sponsor touchpoints — I'll drop a template." },
      { role: "partner", time: "4:30 PM", text: "Filled in Week 0–4. Can you review before I send to Dana?" },
      { role: "you", time: "4:38 PM", text: "Looks solid — add one line on support handoff and you're good to ship." },
    ]
  ),
  p(
    {
      id: "cm-partner-apex",
      name: "Apex Integration Co",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/19.jpg",
      preview: "POC environment request for Flextech — submitted via portal.",
      timestamp: "Today",
    },
    [
      { role: "partner", time: "Today", text: "POC environment request for Flextech — submitted via portal." },
      { role: "you", time: "Today", text: "Queued with Cloud Ops — expect provisioning notes by tomorrow AM." },
      { role: "partner", time: "Today", text: "Thanks. AE is asking if we can parallel-track security questionnaire." },
      { role: "you", time: "Today", text: "Yes — loop me on the thread and I'll tag Trust & Compliance." },
    ]
  ),
  p(
    {
      id: "cm-partner-sterling",
      name: "Sterling Tech Partners",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/29.jpg",
      preview: "Campaign co-fund: can we increase MDF cap for Q2 webinar series?",
      timestamp: "Yesterday",
    },
    [
      { role: "partner", time: "Yesterday", text: "Campaign co-fund: can we increase MDF cap for Q2 webinar series?" },
      { role: "you", time: "Yesterday", text: "Possible — send projected attendance, target accounts, and expected pipeline influence." },
      { role: "partner", time: "Yesterday", text: "Will do. Rough cut: 400 registrants, 12 target accounts, $800K in open opps touched." },
      { role: "you", time: "Yesterday", text: "Strong story. I'll take it to the PMM council and reply with a decision by Friday." },
    ]
  ),
  p(
    {
      id: "cm-partner-novalink",
      name: "NovaLink Consulting",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/55.jpg",
      preview: "Orbit Commerce B2B store — demo recording is in the partner folder.",
      timestamp: "11:20 AM",
    },
    [
      { role: "you", time: "11:05 AM", text: "For Orbit, can you prep a 3-slide exec summary before Friday's call?" },
      { role: "partner", time: "11:20 AM", text: "Orbit Commerce B2B store — demo recording is in the partner folder." },
      { role: "partner", time: "11:21 AM", text: "Exec summary draft is in the same folder — comments welcome." },
      { role: "you", time: "11:28 AM", text: "Reviewing now — will leave suggestions in the doc this afternoon." },
    ]
  ),
  p(
    {
      id: "cm-partner-pulse",
      name: "Pulse Digital",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/67.jpg",
      preview: "Lead from event: Cardinal Distributing — wants pricing by Monday.",
      timestamp: "9:50 AM",
    },
    [
      { role: "partner", time: "9:50 AM", text: "Lead from event: Cardinal Distributing — wants pricing by Monday." },
      { role: "you", time: "9:55 AM", text: "Got it — I'll align with the rep owner and we can joint-message them with one narrative." },
      { role: "partner", time: "10:02 AM", text: "Standing by for the intro note — happy to own discovery if you want." },
    ]
  ),
  p(
    {
      id: "cm-partner-foundry",
      name: "Foundry Partners",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/41.jpg",
      preview: "Agentforce workshop — need customer references for slide 7.",
      timestamp: "Wed",
    },
    [
      { role: "partner", time: "Wed", text: "Agentforce workshop — need customer references for slide 7." },
      { role: "you", time: "Wed", text: "I'll pull two anonymized wins + one named reference with approval. Give me 24h." },
      { role: "partner", time: "Wed", text: "Perfect. Also flagging: legal asked for standard NDA language for labs." },
      { role: "you", time: "Wed", text: "Use the partner NDA pack in the trust portal — v3.2 is current." },
    ]
  ),
  p(
    {
      id: "cm-partner-clearwater",
      name: "Clearwater Systems",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/83.jpg",
      preview: "Implementation kickoff deck — minor tweaks from customer PM.",
      timestamp: "2:15 PM",
    },
    [
      { role: "partner", time: "2:15 PM", text: "Implementation kickoff deck — minor tweaks from customer PM." },
      { role: "you", time: "2:22 PM", text: "Send the marked PDF — I'll reconcile with CS template and version it." },
      { role: "partner", time: "2:30 PM", text: "Uploaded to thread. Mostly timeline + RACI." },
    ]
  ),
  p(
    {
      id: "cm-partner-beacon",
      name: "Beacon Cloud Group",
      avatarUrl: "https://randomuser.me/api/portraits/med/women/73.jpg",
      preview: "QBR dry run moved to Thu 3pm — still work for you?",
      timestamp: "Today",
    },
    [
      { role: "partner", time: "Today", text: "QBR dry run moved to Thu 3pm — still work for you?" },
      { role: "you", time: "Today", text: "Yes — I'll move the hold. Send the customer attendee list when you have it." },
      { role: "partner", time: "Today", text: "List is in the calendar invite. Added their CFO as optional." },
    ]
  ),
  p(
    {
      id: "cm-partner-arcadia",
      name: "Arcadia Advisors",
      avatarUrl: "https://randomuser.me/api/portraits/med/men/91.jpg",
      preview: "Partner scorecard: we're green on all but one training module.",
      timestamp: "Mon",
    },
    [
      { role: "partner", time: "Mon", text: "Partner scorecard: we're green on all but one training module." },
      { role: "you", time: "Mon", text: "Which module? I can unlock the accelerated path if your SEs are blocked." },
      { role: "partner", time: "Mon", text: "Data Cloud lab — two folks out on PTO. Targeting completion by next Friday." },
      { role: "you", time: "Mon", text: "Works — I'll note the exception in the quarterly review so you're not penalized." },
    ]
  ),
];

export const CHANNEL_MANAGER_PARTNERS: ChannelManagerPartner[] = _defs.map((d) => d.row);

export const CHANNEL_MANAGER_PARTNER_MESSAGES: Record<string, ChannelManagerPartnerTurn[]> =
  Object.fromEntries(_defs.map((d) => [d.row.id, d.turns]));

export function isChannelManagerPartnerChatId(id: string): boolean {
  return CHANNEL_MANAGER_PARTNER_IDS.has(id);
}
