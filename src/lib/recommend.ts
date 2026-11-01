import { modelsOf } from "../data/api-models";
import { plans } from "../data/plans";
import { shopOf } from "../data/shop";
import type { Family, Plan } from "../data/types";
import { apiCostUsd, usd } from "./worth";

export type RecommendInput = {
  family: Family;
  tokensM: number;
  inRatio: number;
  modelId: string;
};

export type RankedPlan = {
  plan: Plan;
  apiCost: number;
  cheaperBy: number;
  reason: string;
  score: number;
};

export function recommend(input: RecommendInput) {
  const familyPlans = plans.filter(
    (p) => p.family === input.family && p.priceUsd != null,
  );
  const model =
    modelsOf(input.family).find((m) => m.id === input.modelId) ??
    modelsOf(input.family)[0] ??
    null;
  const apiCost = model ? apiCostUsd(input.tokensM, model, input.inRatio) : 0;

  const ranked: RankedPlan[] = familyPlans
    .map((plan) => {
      const price = plan.priceUsd ?? 0;
      const credits = plan.apiCreditsUsd ?? 0;
      const cheaperBy = apiCost - price;
      const reasons: string[] = [];
      if (plan.models.length) {
        reasons.push(`含 ${plan.models.slice(0, 3).join("、")}`);
      }
      if (credits > 0) {
        reasons.push(`套餐另含 ${usd(credits, 0)} API credits`);
      }
      if (plan.multiplierVsBase && plan.multiplierVsBase > 1) {
        reasons.push(`官方倍率 ${plan.multiplierVsBase}× 相对基础档`);
      }
      if (!plan.exactQuotaPublished) {
        reasons.push("网页聊天精确 token 配额官方未公开");
      }
      if (price === 0) {
        reasons.push("免费档，额度 Limited");
      } else if (apiCost > 0 && cheaperBy > 0) {
        reasons.push(
          `若走 API 约 ${usd(apiCost)}，订阅标价 ${usd(price)}，差 ${usd(cheaperBy)}`,
        );
      } else if (apiCost > 0) {
        reasons.push(
          `当前估算 API 成本 ${usd(apiCost)}，低于订阅标价 ${usd(price)}，API 可能更省`,
        );
      }

      let score = 0;
      if (price === 0) score -= 20;
      if (apiCost <= 0) score += 10 - price / 20;
      else {
        const overshoot = price - apiCost;
        if (overshoot >= 0 && overshoot < apiCost * 0.4) score += 40 - overshoot;
        else if (cheaperBy > 0) score += 30 + Math.min(cheaperBy, 80) / 4;
        else score += 8 - Math.min(-cheaperBy, 80) / 8;
      }
      if (credits >= apiCost && apiCost > 0) score += 25;
      if (plan.includesCodeAgent) score += 4;

      return {
        plan,
        apiCost,
        cheaperBy,
        reason: reasons.join("。"),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  const paid = ranked.filter((r) => (r.plan.priceUsd ?? 0) > 0);
  const pick = paid[0] ?? ranked[0] ?? null;
  const shop = shopOf(input.family);
  const apiWins =
    pick != null &&
    apiCost > 0 &&
    pick.plan.priceUsd != null &&
    apiCost < pick.plan.priceUsd &&
    (pick.plan.apiCreditsUsd ?? 0) < apiCost;

  let headline = "先选模型家族和月用量。";
  if (pick && model) {
    if (apiWins) {
      headline = `按 ${model.name}、每月 ${input.tokensM}M token 估算，走 API 约 ${usd(apiCost)}，低于 ${pick.plan.product} ${pick.plan.name} 的 ${usd(pick.plan.priceUsd ?? 0)}。若只要聊天或 Claude Code，仍可能更想要订阅的固定窗口。`;
    } else {
      headline = `按 ${model.name}、每月 ${input.tokensM}M token 估算，优先看 ${pick.plan.product} ${pick.plan.name}（${pick.plan.priceLabel}）。`;
    }
  }

  return { ranked, pick, apiCost, model, shop, apiWins, headline };
}
