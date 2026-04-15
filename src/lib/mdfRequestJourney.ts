/**
 * Demo MDF request recommendation surfaced in Slackbot from PRM “New MDF Request”.
 */

import type { SlackBlock } from "@/components/block-kit/BlockKitRenderer";

export const MDF_RECOMMENDATION_SUMMARY =
  "Recommended MDF request: Q1 Field Marketing Series ($6,500) — review and submit.";

export function buildMdfRecommendationBlocks(): SlackBlock[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "Recommended MDF request", emoji: true },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "Based on your *Apex Solutions* balance (*$14,500* available), pending *Q3 Cybersecurity Webinar* ($5K), and open co-sell pipeline, this request is sized to stay within policy and support the next quarter’s field motion.",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Campaign type:*\nField marketing / demand gen" },
        { type: "mrkdwn", text: "*Campaign name:*\nQ1 Security Roadshow — Apex + Salesforce" },
        { type: "mrkdwn", text: "*Partner:*\nApex Solutions" },
        { type: "mrkdwn", text: "*Amount requested:*\n$6,500" },
        { type: "mrkdwn", text: "*Planned window:*\nFeb 10 – Mar 15" },
        { type: "mrkdwn", text: "*Objective:*\n3-city executive dinner series + nurture track tied to webinar follow-ups" },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Why this amount*\n• Leaves headroom after your pending $5K request.\n• Matches typical co-funded roadshow tier for your partner tier.\n• Complements the webinar narrative without double-funding the same CTA.",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "—\n*Your move:* If this looks right, reply *submit* (or *send* / *yes*). To change amount, dates, or scope, describe the edit in one message and I’ll refresh the draft.",
      },
    },
  ];
}

export const MDF_SUBMITTED_SUMMARY = "MDF request submitted for marketing ops review.";

export function buildMdfSubmittedBlocks(): SlackBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*MDF request sent*\n\nMarketing ops has your *Q1 Security Roadshow — Apex + Salesforce* package ($6,500). You’ll get status updates here and in PRM.\n\n_Need another request? Use *New MDF Request* again anytime._",
      },
    },
  ];
}
