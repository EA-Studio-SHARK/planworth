export type Family =
  | "claude"
  | "gpt"
  | "gemini"
  | "cursor"
  | "copilot"
  | "perplexity"
  | "midjourney"
  | "runway"
  | "elevenlabs";

export const FAMILY_LABEL: Record<Family, string> = {
  claude: "Claude",
  gpt: "ChatGPT / Codex",
  gemini: "Gemini",
  cursor: "Cursor",
  copilot: "GitHub Copilot",
  perplexity: "Perplexity",
  midjourney: "Midjourney",
  runway: "Runway",
  elevenlabs: "ElevenLabs",
};

export type Plan = {
  id: string;
  family: Family;
  product: string;
  name: string;
  priceUsd: number | null;
  priceLabel: string;
  billing: string;
  models: string[];
  quotaOfficial: string;
  exactQuotaPublished: boolean;
  apiCreditsUsd: number | null;
  multiplierVsBase: number | null;
  basePlanId: string | null;
  apiBilledSeparately: boolean;
  includesCodeAgent: boolean;
  officialUrl: string;
  verifiedAt: string;
  sourceNote: string;
};

export type ApiModel = {
  id: string;
  family: Family;
  name: string;
  inputPerMTok: number;
  outputPerMTok: number;
  officialUrl: string;
  verifiedAt: string;
  note?: string;
};

export type ShopItem = {
  id: string;
  family: Family;
  name: string;
  priceCny: number;
  stock: number;
  url: string;
  promo: true;
  officialEquivalent: string;
  skipReason?: string;
};

export type Article = {
  id: string;
  title: string;
  date: string;
  summary: string;
  body: ArticleBlock[];
};

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "note"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "links"; items: { label: string; href: string }[] };
