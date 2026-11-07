import { modelsOf, rulersOf } from "../data/api-models";
import { plansOf } from "../data/plans";
import { shopOf } from "../data/shop";
import type { ApiModel, Family, Plan, ShopItem } from "../data/types";
import { apiCostUsd, baseOf, inferredQuota, planForBudget, pricedPlans, tokensForBudget } from "./worth";

/** Ruler models used when the lane's family is not the one the user picked. */
export const DEFAULT_RULER: Partial<Record<Family, string>> = {
  claude: "sonnet-5.5",
  gpt: "gpt-6.1-sol",
  gemini: "gemini-4-argon",
};

export function rulerFor(family: Family, picked: Family, pickedModelId: string) {
  const candidates = rulersOf(family);
  if (family === picked) {
    const m = candidates.find((c) => c.id === pickedModelId);
    if (m) return m;
  }
  const id = DEFAULT_RULER[family];
  return candidates.find((c) => c.id === id) ?? candidates[0] ?? null;
}

export type LaneKey = "claude-sub" | "gpt-sub" | "claude-api" | "gpt-api" | "family-sub" | "family-api";

export type Lane = {
  key: LaneKey;
  family: Family;
  kind: "sub" | "api";
  plan: Plan | null;
  nextPlan: Plan | null;
  model: ApiModel | null;
  /** True when the ruler belongs to another vendor (Copilot credits billed at Claude / GPT prices). */
  borrowedRuler: boolean;
  spendUsd: number;
  leftoverUsd: number;
  tokensM: number | null;
  usageM: number;
  creditsM: number;
  status: "ok" | "over" | "noPrice";
  shop: ShopItem[];
};

function subLane(
  key: LaneKey,
  family: Family,
  budgetUsd: number,
  inRatio: number,
  picked: Family,
  pickedModelId: string,
): Lane {
  const { pick, next, rows } = planForBudget(family, budgetUsd);
  const plan = pick ?? next;
  const model = rulerFor(family, picked, pickedModelId);
  const borrowedRuler = model != null && model.family !== family;
  const status: Lane["status"] = !rows.length ? "noPrice" : pick ? "ok" : "over";
  const worth = plan ? inferredQuota(plan, model, inRatio, baseOf(plan)) : null;
  return {
    key,
    family,
    kind: "sub",
    plan,
    nextPlan: pick ? next : null,
    model,
    borrowedRuler,
    spendUsd: plan?.priceUsd ?? 0,
    leftoverUsd: pick ? Math.max(0, budgetUsd - (pick.priceUsd ?? 0)) : 0,
    tokensM: model && worth ? worth.totalM : null,
    usageM: worth?.usageM ?? 0,
    creditsM: worth?.creditsM ?? 0,
    status,
    shop: plan ? shopOf(family) : [],
  };
}

function apiLane(
  key: LaneKey,
  family: Family,
  budgetUsd: number,
  inRatio: number,
  picked: Family,
  pickedModelId: string,
): Lane {
  const model = rulerFor(family, picked, pickedModelId);
  const tokens = model ? tokensForBudget(budgetUsd, model, inRatio) : null;
  return {
    key,
    family,
    kind: "api",
    plan: null,
    nextPlan: null,
    model,
    borrowedRuler: false,
    spendUsd: budgetUsd,
    leftoverUsd: 0,
    tokensM: tokens,
    usageM: tokens ?? 0,
    creditsM: 0,
    status: model ? "ok" : "noPrice",
    shop: [],
  };
}

/** Same budget, every place the money could go. */
export function buildLanes(family: Family, modelId: string, budgetUsd: number, inRatio: number) {
  const lanes: Lane[] = [
    subLane("claude-sub", "claude", budgetUsd, inRatio, family, modelId),
    subLane("gpt-sub", "gpt", budgetUsd, inRatio, family, modelId),
    apiLane("claude-api", "claude", budgetUsd, inRatio, family, modelId),
    apiLane("gpt-api", "gpt", budgetUsd, inRatio, family, modelId),
  ];
  if (family !== "claude" && family !== "gpt") {
    // Pay-as-you-go platforms list no plans at all, so there is no plan lane to show.
    if (plansOf(family).length) lanes.push(subLane("family-sub", family, budgetUsd, inRatio, family, modelId));
    if (modelsOf(family).length) lanes.push(apiLane("family-api", family, budgetUsd, inRatio, family, modelId));
  }
  return lanes;
}

export type Reason =
  | { code: "leftover"; usd: number }
  | { code: "overBudget"; usd: number }
  | { code: "vsApi"; times: number; apiM: number }
  | { code: "credits"; usd: number }
  | { code: "multiplier"; x: number; base: string }
  | { code: "published"; usd: number }
  | { code: "codeAgent" }
  | { code: "unpublished" }
  | { code: "covers"; need: number; price: number }
  | { code: "short"; need: number; have: number }
  | { code: "apiCheaper"; need: number; price: number; plan: string }
  | { code: "current"; plan: string; diff: number }
  | { code: "unit"; unit: string }
  | { code: "unverified" };

export type Pick = {
  kind: "plan" | "api" | "none";
  plan: Plan | null;
  model: ApiModel | null;
  tokensM: number | null;
  priceUsd: number;
  reasons: Reason[];
  over: boolean;
};

export type PickInput = {
  family: Family;
  modelId: string;
  budgetUsd: number;
  inRatio: number;
  /** Monthly usage in millions of tokens, when the user gave one. */
  monthlyM: number | null;
  currentPlanId: string | null;
};

export function pickPlan(input: PickInput): Pick {
  const { family, budgetUsd, inRatio, monthlyM } = input;
  const rows = pricedPlans(family);
  const model = rulerFor(family, family, input.modelId);
  // Only a product's own API can be the cheaper alternative; a borrowed ruler is just a unit.
  const ruler = model && model.family === family ? model : null;
  const worthOf = (plan: Plan) => inferredQuota(plan, model, inRatio, baseOf(plan));

  if (!rows.length) {
    return { kind: "none", plan: null, model, tokensM: null, priceUsd: 0, reasons: [], over: false };
  }

  const need = monthlyM != null && monthlyM > 0 && model ? apiCostUsd(monthlyM, model, inRatio) : null;
  let plan: Plan | null = null;
  const reasons: Reason[] = [];

  if (need != null) {
    // Cheapest plan whose inferred usage dollars cover the month; the API wins when it is clearly cheaper.
    const covering = rows.find((p) => worthOf(p).totalUsd >= need) ?? null;
    const target = covering ?? rows[rows.length - 1];
    if (ruler && need < (target.priceUsd ?? 0) * 0.8) {
      const apiReasons: Reason[] = [{ code: "apiCheaper", need, price: target.priceUsd ?? 0, plan: target.name }];
      if (need > budgetUsd * 1.02) apiReasons.push({ code: "overBudget", usd: need - budgetUsd });
      else if (budgetUsd - need >= 1) apiReasons.push({ code: "leftover", usd: budgetUsd - need });
      return {
        kind: "api",
        plan: null,
        model: ruler,
        tokensM: monthlyM,
        priceUsd: need,
        reasons: apiReasons,
        over: need > budgetUsd * 1.02,
      };
    }
    plan = covering ?? rows[rows.length - 1];
    if (covering) reasons.push({ code: "covers", need, price: covering.priceUsd ?? 0 });
    else reasons.push({ code: "short", need, have: worthOf(plan).totalUsd });
  } else {
    plan = planForBudget(family, budgetUsd).pick ?? rows[0];
  }

  const price = plan.priceUsd ?? 0;
  const over = price > budgetUsd * 1.02;
  const worth = worthOf(plan);
  if (over) reasons.push({ code: "overBudget", usd: price - budgetUsd });
  else if (budgetUsd - price >= 1) reasons.push({ code: "leftover", usd: budgetUsd - price });
  if (model && price > 0) {
    const apiM = tokensForBudget(price, model, inRatio);
    if (apiM > 0 && worth.totalM > apiM * 1.05) reasons.push({ code: "vsApi", times: worth.totalM / apiM, apiM });
  }
  if (plan.usageUsdPublished) reasons.push({ code: "published", usd: plan.usageUsdPublished });
  if (plan.multiplierVsBase && plan.multiplierVsBase > 1) {
    reasons.push({ code: "multiplier", x: plan.multiplierVsBase, base: baseOf(plan)?.name ?? "" });
  }
  if (plan.apiCreditsUsd) reasons.push({ code: "credits", usd: plan.apiCreditsUsd });
  if (plan.includesCodeAgent) reasons.push({ code: "codeAgent" });
  if (plan.unitLabel) reasons.push({ code: "unit", unit: plan.unitLabel });
  if (!plan.exactQuotaPublished && model) reasons.push({ code: "unpublished" });
  if (plan.confidence === "index" || model?.confidence === "index") reasons.push({ code: "unverified" });

  const current = input.currentPlanId ? rows.find((p) => p.id === input.currentPlanId) : null;
  if (current && current.id !== plan.id) {
    reasons.push({ code: "current", plan: current.name, diff: price - (current.priceUsd ?? 0) });
  }

  return {
    kind: "plan",
    plan,
    model,
    tokensM: model ? worth.totalM : null,
    priceUsd: price,
    reasons,
    over,
  };
}

export type Verdict =
  | { kind: "tie"; tokensM: number }
  | { kind: "lead"; lanes: Lane[]; tokensM: number; times: number; base: Lane }
  | { kind: "api"; lane: Lane; tokensM: number; times: number; base: Lane }
  | { kind: "apiOnly"; lane: Lane; tokensM: number };

function best(lanes: Lane[]) {
  return lanes.reduce<Lane | null>((a, b) => (!a || (b.tokensM ?? 0) > (a.tokensM ?? 0) ? b : a), null);
}

/** One-line answer: does the money go furthest on a plan or on the plain API? */
export function verdictOf(lanes: Lane[]): Verdict | null {
  const priced = lanes.filter((l) => l.tokensM != null && l.tokensM > 0 && l.status === "ok");
  const sub = best(priced.filter((l) => l.kind === "sub"));
  const api = best(priced.filter((l) => l.kind === "api"));
  if (!api) return null;
  const apiM = api.tokensM ?? 0;
  // The budget does not reach any plan, so the API is the only option.
  if (!sub) return { kind: "apiOnly", lane: api, tokensM: apiM };
  const subM = sub.tokensM ?? 0;
  if (subM > apiM * 1.05) {
    const leaders = priced.filter((l) => l.kind === "sub" && (l.tokensM ?? 0) >= subM * 0.98);
    return { kind: "lead", lanes: leaders, tokensM: subM, times: subM / apiM, base: api };
  }
  if (apiM > subM * 1.05) return { kind: "api", lane: api, tokensM: apiM, times: apiM / subM, base: sub };
  return { kind: "tie", tokensM: Math.max(subM, apiM) };
}
