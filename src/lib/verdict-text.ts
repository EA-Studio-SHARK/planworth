import type { Copy } from "../i18n";
import { loc } from "./localize";
import type { Lane, Verdict } from "./recommend";

/** The one-line answer shown above the numbers, on both Home and Compare. */
export function verdictText(t: Copy, v: Verdict, budget: string, nameOf: (lane: Lane) => string) {
  const w = t.w;
  const withPlan = (lane: Lane) => w.laneWithPlan(nameOf(lane), loc(lane.plan?.name) ?? undefined);
  switch (v.kind) {
    case "tie":
      return w.verdictTie(budget, mTokText(v.tokensM));
    case "lead":
      return w.verdictLead(budget, v.lanes.map(withPlan), mTokText(v.tokensM), v.times.toFixed(1), nameOf(v.base));
    case "api":
      return w.verdictApi(budget, nameOf(v.lane), mTokText(v.tokensM), v.times.toFixed(1), withPlan(v.base));
    case "apiOnly":
      return w.verdictApiOnly(budget, nameOf(v.lane), mTokText(v.tokensM));
  }
}

function mTokText(n: number) {
  if (n >= 100) return `${n.toFixed(0)}M`;
  if (n >= 10) return `${n.toFixed(1)}M`;
  return `${n.toFixed(2)}M`;
}
