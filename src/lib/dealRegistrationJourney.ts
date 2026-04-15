/**
 * Demo logic for the Slackbot deal-registration journey:
 * user free text → extracted fields → completeness / gaps → Block Kit summary.
 */

import type { SlackBlock } from "@/components/block-kit/BlockKitRenderer";

export type DealRegistrationFields = {
  account?: string;
  dealName?: string;
  amount?: string;
  stage?: string;
  closeDate?: string;
  partner?: string;
  stakeholders?: string;
  /** Partner / program referral code when provided */
  referralCode?: string;
};

/** Heuristic extraction from one or more user snippets (best-effort, demo). */
export function extractDealFieldsFromText(text: string): Partial<DealRegistrationFields> {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return {};

  const out: Partial<DealRegistrationFields> = {};

  const accountLabel =
    t.match(/\b(?:account|company|customer|for)\s*[:—-]\s*([^.\n]+)/i)?.[1]?.trim() ??
    t.match(/\b(?:at|with)\s+([A-Z][A-Za-z0-9&\s]{2,40}?)(?:\s+(?:for|deal|—|-)\s)/i)?.[1]?.trim();

  if (accountLabel) out.account = accountLabel.replace(/\s+$/g, "");

  const dealMatch = t.match(/\bdeal\s*(?:name)?\s*[:—-]\s*([^.\n]+)/i);
  if (dealMatch) out.dealName = dealMatch[1].trim();

  const mAmt =
    t.match(/\$\s*([\d,]+(?:\.\d+)?)\s*([kKmM])?\b/i) ||
    t.match(/\b([\d,]+(?:\.\d+)?)\s*([kKmM])\b(?!\s*days)/i);
  if (mAmt) {
    const n = mAmt[1];
    const suf = (mAmt[2] || "").toUpperCase();
    out.amount = suf ? `$${n}${suf}` : `$${n}`;
  }

  const stagePatterns: [RegExp, string][] = [
    [/\bclosed[\s-]?won\b/i, "Closed Won"],
    [/\bclosed[\s-]?lost\b/i, "Closed Lost"],
    [/\bnegotiation\b/i, "Negotiation"],
    [/\bproposal\b/i, "Proposal"],
    [/\bqualification\b|\bqualify\b/i, "Qualification"],
    [/\bdiscovery\b/i, "Discovery"],
    [/\bvalidation\b/i, "Validation"],
  ];
  for (const [re, label] of stagePatterns) {
    if (re.test(t)) {
      out.stage = label;
      break;
    }
  }
  const stageExplicit = t.match(/\bstage\s*[:—-]\s*([^.\n]+)/i);
  if (stageExplicit) out.stage = stageExplicit[1].trim();

  const close =
    t.match(/\b(?:close|closing)\s*(?:date)?\s*[:—-]\s*([^.\n]+)/i)?.[1]?.trim() ??
    t.match(/\b(Q[1-4]\s*\'?\d{2,4}|FY\d{2,4})\b/i)?.[1] ??
    t.match(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?\b/i
    )?.[0];
  if (close) out.closeDate = close;

  const partner =
    t.match(/\bpartner\s*[:—-]\s*([^.\n]+)/i)?.[1]?.trim() ??
    t.match(/\b(?:via|from)\s+partner\s+([^.\n]+)/i)?.[1]?.trim();
  if (partner) out.partner = partner;

  const champ =
    t.match(/\b(?:champion|stakeholder|stakeholders|contacts?)\s*[:—-]\s*([^.\n]+)/i)?.[1]?.trim();
  if (champ) out.stakeholders = champ;

  const tTrim = t.trim();
  if (/^(none|no|skip|n\/a)[\s!.]*$/i.test(tTrim) || /^no\s+referral\b/i.test(tTrim)) {
    out.referralCode = "Not applicable";
  } else {
    const refLabeled =
      t.match(
        /\b(?:referral|ref\.?\s*code|promo(?:\s*code)?|program\s*code)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9_-]{2,39})\b/i
      )?.[1]?.trim();
    const refStandalone = t.match(/\b([A-Z]{2,}(?:-[A-Za-z0-9]+){1,4})\b/)?.[1];
    if (refLabeled) out.referralCode = refLabeled;
    else if (refStandalone && /-/.test(refStandalone)) out.referralCode = refStandalone;
  }

  if (!out.dealName && !out.account) {
    const looksLikeName =
      /^[A-Z][A-Za-z0-9 &.'-]{2,50}($|\s+(?:for|—|-|\$|\d))/.test(t) &&
      !/^(more|yes|no|ready|submit|done)\b/i.test(t);
    if (looksLikeName) {
      const head = t.split(/[.!?\n]/)[0]?.trim() ?? t;
      if (head.length <= 80) out.account = head;
    }
  }

  return out;
}

export function mergeDealFieldLayers(
  layers: Partial<DealRegistrationFields>[]
): DealRegistrationFields {
  const m: DealRegistrationFields = {};
  for (const layer of layers) {
    (Object.keys(layer) as (keyof DealRegistrationFields)[]).forEach((k) => {
      const v = layer[k];
      if (v !== undefined && String(v).trim() !== "") m[k] = v;
    });
  }
  return m;
}

export function fieldsFromSnippets(snippets: string[]): DealRegistrationFields {
  const layers = snippets.map((s) => extractDealFieldsFromText(s));
  return mergeDealFieldLayers(layers);
}

const SUGGESTED_FIELDS: { key: keyof DealRegistrationFields; label: string }[] = [
  { key: "account", label: "Account / company name" },
  { key: "dealName", label: "Deal name (if different from account)" },
  { key: "amount", label: "Amount or range" },
  { key: "stage", label: "Stage" },
  { key: "closeDate", label: "Expected close date" },
  { key: "partner", label: "Partner involved" },
  { key: "stakeholders", label: "Champion / stakeholders" },
];

export function computeDealRegistrationGaps(fields: DealRegistrationFields): string[] {
  const gaps: string[] = [];
  const hasAccountOrDeal = !!(fields.account || fields.dealName);
  if (!hasAccountOrDeal) gaps.push("Account or deal name");
  if (!fields.amount) gaps.push("Amount or range");
  if (!fields.stage) gaps.push("Stage");
  if (!fields.closeDate) gaps.push("Expected close date");
  if (!fields.partner) gaps.push("Partner (if applicable)");
  if (!fields.stakeholders) gaps.push("Champion / stakeholders");
  return gaps;
}

export function dealRegistrationCompletenessPct(fields: DealRegistrationFields): number {
  const filled = SUGGESTED_FIELDS.filter((f) => {
    const v = fields[f.key];
    return v !== undefined && String(v).trim() !== "";
  }).length;
  return Math.round((filled / SUGGESTED_FIELDS.length) * 100);
}

const PREVIEW_FIELD_ORDER: { key: keyof DealRegistrationFields; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "dealName", label: "Deal name" },
  { key: "amount", label: "Amount" },
  { key: "stage", label: "Stage" },
  { key: "closeDate", label: "Close date" },
  { key: "partner", label: "Partner" },
  { key: "stakeholders", label: "Champion / stakeholders" },
  { key: "referralCode", label: "Referral code" },
];

function filledPreviewLines(fields: DealRegistrationFields): string[] {
  const lines: string[] = [];
  for (const { key, label } of PREVIEW_FIELD_ORDER) {
    const v = fields[key];
    if (v !== undefined && String(v).trim() !== "") {
      lines.push(`• *${label}:* ${v}`);
    }
  }
  return lines;
}

export function buildDealRegistrationJourneyBlocks(
  snippets: string[],
  fields: DealRegistrationFields,
  gaps: string[]
): SlackBlock[] {
  const previewLines = filledPreviewLines(fields);
  const hasStructuredPreview = previewLines.length > 0;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Deal registration — preview", emoji: true },
    },
  ];

  if (hasStructuredPreview) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "_Only showing details you’ve added — nothing empty is listed._\n\n" +
          "*Captured:*\n" +
          previewLines.join("\n"),
      },
    });
  } else if (snippets.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Here’s what you shared:*\n" +
          snippets.map((s, i) => `${i + 1}. ${s}`).join("\n") +
          "\n\n_Send another message with structured hints (e.g. `amount: $50k`, `stage: proposal`) if you want fields parsed._",
      },
    });
  }

  if (!fields.referralCode?.trim()) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Referral code*\n" +
          "Do you have a *referral code* (partner or program) to include? Send the code in your next message, or reply *none* / *skip* if it doesn’t apply.",
      },
    });
  }

  if (gaps.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Optional — still helpful for your channel manager:*\n" +
          gaps.map((g) => `• ${g}`).join("\n"),
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "—\n*Next step:* Reply *more* to add details or paste another message. Reply *ready* or *submit* when you want this sent to your channel manager.",
    },
  });

  return blocks;
}

export function buildDealRegistrationAskMoreBlocks(): SlackBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Got it — keep going.*\n\nAdd anything still missing (amount, stage, dates, partner, people, *referral code*) or mention *uploading files* in the thread.\n\nWhen you’re done, say *ready* or *submit* and I’ll package the registration.",
      },
    },
  ];
}

export function buildDealRegistrationSubmittedBlocks(): SlackBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Registration sent*\n\nYour channel manager has the draft in Slack. They’ll follow up if something’s missing.\n\n_Journey complete — you can start a new registration anytime from Register deal._",
      },
    },
  ];
}
