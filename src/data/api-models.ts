import type { ApiModel } from "./types";

/** Official API list prices, USD per 1M tokens. Short-context standard tier. */
export const API_MODELS: ApiModel[] = [
  {
    id: "sonnet-5.5",
    family: "claude",
    name: "Claude Sonnet 5.5",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-01",
  },
  {
    id: "opus-5.5",
    family: "claude",
    name: "Claude Opus 5.5",
    inputPerMTok: 4,
    outputPerMTok: 20,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-01",
  },
  {
    id: "haiku-5.5",
    family: "claude",
    name: "Claude Haiku 5.5",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-01",
    note: "prompts ≤100k tokens；$0.50 / $2.50 when prompts exceed 100k",
  },
  {
    id: "fable-5.1",
    family: "claude",
    name: "Claude Fable 5.1",
    inputPerMTok: 10,
    outputPerMTok: 50,
    officialUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-11-01",
  },
  {
    id: "gpt-6.1-sol",
    family: "gpt",
    name: "GPT-6.1 Sol",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-01",
    note: "short-context standard tier",
  },
  {
    id: "gpt-6-astra",
    family: "gpt",
    name: "GPT-6 Astra",
    inputPerMTok: 10,
    outputPerMTok: 50,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-01",
    note: "short-context standard tier",
  },
  {
    id: "gpt-6-luna",
    family: "gpt",
    name: "GPT-6 Luna",
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-01",
  },
  {
    id: "gpt-6-sol",
    family: "gpt",
    name: "GPT-6 Sol",
    inputPerMTok: 2,
    outputPerMTok: 10,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-01",
  },
  {
    id: "gpt-5.6-sol",
    family: "gpt",
    name: "GPT-5.6 Sol",
    inputPerMTok: 4,
    outputPerMTok: 20,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-01",
  },
  {
    id: "gpt-4.1",
    family: "gpt",
    name: "GPT-4.1",
    inputPerMTok: 2,
    outputPerMTok: 8,
    officialUrl: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-11-01",
  },
];

export const DEFAULT_IN_RATIO = 0.7;

export function blendedPerMTok(model: ApiModel, inRatio = DEFAULT_IN_RATIO) {
  const r = Math.min(1, Math.max(0, inRatio));
  return r * model.inputPerMTok + (1 - r) * model.outputPerMTok;
}

export function modelsOf(family: ApiModel["family"]) {
  return API_MODELS.filter((m) => m.family === family);
}
