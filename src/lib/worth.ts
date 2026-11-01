import { blendedPerMTok } from "../data/api-models";
import type { ApiModel, Plan } from "../data/types";

export { DEFAULT_IN_RATIO } from "../data/api-models";

export function apiCostUsd(tokensM: number, model: ApiModel, inRatio: number) {
  if (!Number.isFinite(tokensM) || tokensM <= 0) return 0;
  return tokensM * blendedPerMTok(model, inRatio);
}

export function tokensForBudget(usd: number, model: ApiModel, inRatio: number) {
  const unit = blendedPerMTok(model, inRatio);
  if (unit <= 0) return 0;
  return usd / unit;
}

export function worthOfPlan(plan: Plan, model: ApiModel, inRatio: number) {
  const price = plan.priceUsd ?? 0;
  const credits = plan.apiCreditsUsd ?? 0;
  const tokenFromPrice = tokensForBudget(price, model, inRatio);
  const tokenFromCredits = tokensForBudget(credits, model, inRatio);
  return {
    priceUsd: price,
    creditsUsd: credits,
    tokenFromPriceM: tokenFromPrice,
    tokenFromCreditsM: tokenFromCredits,
    blended: blendedPerMTok(model, inRatio),
  };
}

export function usd(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function mTok(n: number) {
  if (!Number.isFinite(n)) return "-";
  if (n >= 100) return `${n.toFixed(0)}M`;
  if (n >= 10) return `${n.toFixed(1)}M`;
  return `${n.toFixed(2)}M`;
}
