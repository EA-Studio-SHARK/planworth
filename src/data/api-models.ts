import { MORE_API_MODELS } from "./api-models-more";
import type { ApiModel } from "./types";

/** Official API list prices, USD per 1M tokens. Short-context standard tier. */
const BASE_API_MODELS: ApiModel[] = [
  {
    id: "sonnet-5.5",
    family: "claude",
    name: "Claude Sonnet 5.5",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-04",
    note: "1M 上下文同价；cache read $0.10 / MTok",
  },
  {
    id: "opus-5.5",
    family: "claude",
    name: "Claude Opus 5.5",
    inputPerMTok: 4,
    outputPerMTok: 20,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-04",
    note: "Fast mode $8 / $40；Batch 半价",
  },
  {
    id: "haiku-5.5",
    family: "claude",
    name: "Claude Haiku 5.5",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-04",
    note: "prompts ≤100k；超过 100k 为 $0.50 / $2.50",
  },
  {
    id: "fable-5.1",
    family: "claude",
    name: "Claude Fable 5.1",
    inputPerMTok: 10,
    outputPerMTok: 50,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-04",
    note: "Fable 5 同价",
  },
  {
    id: "gpt-6.1-sol",
    family: "gpt",
    name: "GPT-6.1 Sol",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "short ≤272k；长上下文 $4 / $15",
  },
  {
    id: "gpt-6-astra",
    family: "gpt",
    name: "GPT-6 Astra",
    inputPerMTok: 10,
    outputPerMTok: 50,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "short-context；长上下文 $20 / $75",
  },
  {
    id: "gpt-6-luna",
    family: "gpt",
    name: "GPT-6 Luna",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "长上下文 $0.20 / $0.75",
  },
  {
    id: "gpt-6-sol",
    family: "gpt",
    name: "GPT-6 Sol",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "长上下文 $4 / $15",
  },
  {
    id: "gpt-5.6-sol",
    family: "gpt",
    name: "GPT-5.6 Sol",
    inputPerMTok: 4,
    outputPerMTok: 20,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "促销价，至少到 2026-11-21",
  },
  {
    id: "gpt-4.1",
    family: "gpt",
    name: "GPT-4.1",
    inputPerMTok: 2,
    outputPerMTok: 8,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "仍在牌价表",
  },
  {
    id: "gemini-4-argon",
    family: "gemini",
    name: "Gemini 4 Argon",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://aistudio.google.com/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "现价到 2026-11-30；2026-12-01 起 $4 / $20",
  },
  {
    id: "gemini-3.1-pro",
    family: "gemini",
    name: "Gemini 3.1 Pro",
    inputPerMTok: 2,
    outputPerMTok: 12,
    officialUrl: "https://aistudio.google.com/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "gemini-3.1-pro-preview，prompts ≤200k；超过为 $4 / $18",
  },
  {
    id: "gemini-3.8-flash",
    family: "gemini",
    name: "Gemini 3.8 Flash",
    inputPerMTok: 0.75,
    outputPerMTok: 3.75,
    officialUrl: "https://aistudio.google.com/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "现价到 2026-12-31；2027-01-01 起 $1.50 / $7.50",
  },
  {
    id: "gemini-3.5-flash-lite",
    family: "gemini",
    name: "Gemini 3.5 Flash-Lite",
    inputPerMTok: 0.3,
    outputPerMTok: 2.5,
    officialUrl: "https://aistudio.google.com/docs/pricing",
    verifiedAt: "2026-11-04",
    note: "2026-11-04 复核一致",
  },
];

export const API_MODELS: ApiModel[] = [...BASE_API_MODELS, ...MORE_API_MODELS];

export const DEFAULT_IN_RATIO = 0.7;

export function blendedPerMTok(model: ApiModel, inRatio = DEFAULT_IN_RATIO) {
  const r = Math.min(1, Math.max(0, inRatio));
  return r * model.inputPerMTok + (1 - r) * model.outputPerMTok;
}

export function modelsOf(family: ApiModel["family"]) {
  return API_MODELS.filter((m) => m.family === family);
}

/**
 * Products without their own API that bill by other vendors' $/MTok.
 * Copilot's AI Credits rate table lists these at their API list prices (docs.github.com, 2026-11-04).
 */
const BORROWED_RULERS: Partial<Record<ApiModel["family"], string[]>> = {
  copilot: ["sonnet-5.5", "opus-5.5", "gpt-6.1-sol"],
};

/** Models usable as the conversion ruler for a product: its own API, else a published borrowed list. */
export function rulersOf(family: ApiModel["family"]) {
  const own = modelsOf(family);
  if (own.length) return own;
  return (BORROWED_RULERS[family] ?? []).flatMap((id) => API_MODELS.filter((m) => m.id === id));
}

export function modelById(id: string) {
  return API_MODELS.find((m) => m.id === id) ?? null;
}
