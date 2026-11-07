import { blendedPerMTok } from "../data/api-models";
import { plansOf } from "../data/plans";
import type { ApiModel, Family, Plan } from "../data/types";

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

/**
 * Public usage dollars: a vendor-stated monthly dollar allowance (Copilot AI Credits) wins;
 * else official multiplier × base list price; else this plan's list price.
 */
export function usageUsdOf(plan: Plan, basePlan: Plan | null) {
  if (plan.usageUsdPublished != null && plan.usageUsdPublished > 0) return plan.usageUsdPublished;
  const price = plan.priceUsd ?? 0;
  if (price <= 0) return 0;
  const mult = plan.multiplierVsBase;
  const basePrice = basePlan?.priceUsd;
  if (mult && mult > 0 && basePrice != null && basePrice > 0) return mult * basePrice;
  return price;
}

export function inferredQuota(
  plan: Plan,
  model: ApiModel | null,
  inRatio: number,
  basePlan: Plan | null,
) {
  const usageUsd = usageUsdOf(plan, basePlan);
  const creditsUsd = plan.apiCreditsUsd ?? 0;
  const totalUsd = usageUsd + creditsUsd;
  if (!model) {
    return {
      usageUsd,
      creditsUsd,
      totalUsd,
      usageM: 0,
      creditsM: 0,
      totalM: 0,
      blended: 0,
    };
  }
  return {
    usageUsd,
    creditsUsd,
    totalUsd,
    usageM: tokensForBudget(usageUsd, model, inRatio),
    creditsM: tokensForBudget(creditsUsd, model, inRatio),
    totalM: tokensForBudget(totalUsd, model, inRatio),
    blended: blendedPerMTok(model, inRatio),
  };
}

export function worthOfPlan(plan: Plan, model: ApiModel, inRatio: number, basePlan: Plan | null = null) {
  const inferred = inferredQuota(plan, model, inRatio, basePlan);
  const price = plan.priceUsd ?? 0;
  return {
    priceUsd: price,
    creditsUsd: inferred.creditsUsd,
    tokenFromPriceM: tokensForBudget(price, model, inRatio),
    tokenFromCreditsM: inferred.creditsM,
    tokenInferredM: inferred.totalM,
    blended: inferred.blended,
  };
}

export function usd(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** Whole dollars when the amount is whole, cents otherwise. */
export function usdAuto(n: number) {
  return usd(n, Number.isInteger(n) ? 0 : 2);
}

export function mTok(n: number) {
  if (!Number.isFinite(n)) return "-";
  if (n >= 100) return `${n.toFixed(0)}M`;
  if (n >= 10) return `${n.toFixed(1)}M`;
  return `${n.toFixed(2)}M`;
}

/** USD/CNY central parity published by CFETS for this date (via chinanews.com.cn), not a live quote. */
export const CNY_PER_USD = 6.718;
export const CNY_RATE_NOTE = "2026-11-04";

export type Currency = "USD" | "CNY";

export function toUsd(amount: number, currency: Currency) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return currency === "CNY" ? amount / CNY_PER_USD : amount;
}

export function cny(n: number) {
  if (!Number.isFinite(n)) return "-";
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

export function baseOf(plan: Plan) {
  if (!plan.basePlanId) return null;
  return plansOf(plan.family).find((row) => row.id === plan.basePlanId) ?? null;
}

/** Paid plans with a known list price, cheapest first. */
export function pricedPlans(family: Family) {
  return plansOf(family)
    .filter((p) => (p.priceUsd ?? 0) > 0)
    .sort((a, b) => (a.priceUsd ?? 0) - (b.priceUsd ?? 0));
}

const SLACK = 1.02;

/** The dearest plan the budget covers, plus the next one up. */
export function planForBudget(family: Family, budgetUsd: number) {
  const rows = pricedPlans(family);
  const within = rows.filter((p) => (p.priceUsd ?? 0) <= budgetUsd * SLACK);
  const pick = within[within.length - 1] ?? null;
  const next = rows.find((p) => (p.priceUsd ?? 0) > budgetUsd * SLACK) ?? null;
  return { pick, next, rows };
}

/** Plans close to the budget instead of the whole family: two at or under it, one above. */
export function plansNearBudget(family: Family, budgetUsd: number) {
  const rows = pricedPlans(family);
  if (!rows.length) return [];
  const under = rows.filter((p) => (p.priceUsd ?? 0) <= budgetUsd * SLACK);
  const over = rows.filter((p) => (p.priceUsd ?? 0) > budgetUsd * SLACK);
  return [...under.slice(-2), ...over.slice(0, under.length ? 1 : 2)];
}

export function fullTok(m: number) {
  if (!Number.isFinite(m) || m <= 0) return "0";
  const n = m * 1e6;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return mTok(m);
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
}
