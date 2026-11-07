import { ArrowRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { usePrefs } from "../context/Prefs";
import { briefs } from "../data/briefs";
import { FAMILY_ORDER } from "../data/plans";
import { famName, loc } from "../lib/localize";
import { buildLanes, verdictOf, type Lane } from "../lib/recommend";
import { verdictText } from "../lib/verdict-text";
import { DEFAULT_IN_RATIO, mTok, usd, usdAuto } from "../lib/worth";

const BUDGETS = [20, 100, 200] as const;
/** These four stay fully visible; everything after them tucks in behind. */
const LEAD = ["claude", "gpt", "gemini", "grok"] as const;
/** How many logos follow the lead before the rest stay fully hidden behind them. */
const TAIL = 18;
const STACK = [...LEAD, ...FAMILY_ORDER.filter((f) => !(LEAD as readonly string[]).includes(f))].slice(0, LEAD.length + TAIL);

/** Stays solid for the first stretch, then fades out, so the end has no pile of ghosts. */
function fade(t: number) {
  return t < 0.45 ? 1 : 1 - 0.92 * ((t - 0.45) / 0.55) ** 1.5;
}

/** Position along the tucked logos: 0 right after the lead, 1 at the very end. */
function tailPos(i: number) {
  return i / Math.max(1, TAIL - 1);
}

/** Share of a tucked logo left showing: nearly whole at first, a sliver at the end. */
function peek(t: number) {
  return 0.14 + 0.5 * (1 - t) ** 2;
}

export function HomePage() {
  const { t, lang } = usePrefs();
  const h = t.home;
  const navigate = useNavigate();
  const [budget, setBudget] = useState("20");
  const budgetUsd = Math.max(0, Number(budget) || 0);
  const lanes = useMemo(
    () => buildLanes("claude", "sonnet-5.5", budgetUsd, DEFAULT_IN_RATIO),
    [budgetUsd],
  );
  const laneName: Record<string, string> = {
    "claude-sub": t.w.laneClaudeSub,
    "gpt-sub": t.w.laneGptSub,
    "claude-api": t.w.laneClaudeApi,
    "gpt-api": t.w.laneGptApi,
  };
  const nameOf = (lane: Lane) => laneName[lane.key] ?? "";
  const verdict = verdictOf(lanes);
  const budgetLabel = usdAuto(budgetUsd);

  // The site's order: read the rules, size the plan, pay, check the setup, verify the model.
  const steps = [
    { to: "/claude", step: h.stepCopy, title: h.columnTitle, body: h.toolColumn },
    { to: "/worth", step: h.stepUse, title: h.worthTitle, body: h.toolWorth },
    { to: "/shop", step: h.stepPay, title: t.shopTitle, body: h.toolShop },
    { to: "/checkcc", step: h.stepEnv, title: t.envTitle, body: h.toolEnv },
    { to: "/fingerprint", step: h.stepFp, title: t.fpTitle, body: h.toolFp },
  ];

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-title">
          <span className="home-stack" aria-label={h.brandsTitle(FAMILY_ORDER.length)}>
            {STACK.map((f, i) => (
              <span
                key={f}
                className={`home-stack-chip ${i < LEAD.length ? "is-lead" : ""}`}
                style={{
                  zIndex: STACK.length - i,
                  ...(i >= LEAD.length
                    ? {
                        ["--v" as string]: peek(tailPos(i - LEAD.length)),
                        ["--o" as string]: fade(tailPos(i - LEAD.length)),
                      }
                    : null),
                }}
                title={famName(f)}
              >
                <BrandMark family={f} size={64} />
              </span>
            ))}
          </span>
          <h1 className="home-title-text">{h.title}</h1>
        </div>
        <p className="home-lede">{h.lede}</p>
        <form
          className="home-go"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/worth?budget=${budgetUsd || 20}`);
          }}
        >
          <label>
            <span>{h.heroInput}</span>
            <em>$</em>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              aria-label={h.heroInput}
            />
          </label>
          <button type="submit" className="cta is-blue">
            {h.heroGo}
            <ArrowRight size={16} weight="bold" />
          </button>
        </form>
        <div className="home-hero-links">
          <Link to="/claude">{h.heroGuide}</Link>
          <Link to="/shop">{h.heroShop}</Link>
        </div>
      </section>

      <ol className="home-flow" aria-label={h.title}>
        {steps.map((step) => (
          <li key={step.to}>
            <Link to={step.to} className="home-step">
              <span className="home-step-word">{step.step}</span>
              <b>{step.title}</b>
              <span className="home-step-body">{step.body}</span>
              <ArrowRight size={18} className="home-step-go" />
            </Link>
          </li>
        ))}
      </ol>

      <section className="home-calc" aria-label={h.calcTitle}>
        <div className="home-calc-head">
          <h2>{h.calcTitle}</h2>
          <div className="home-budget">
            {BUDGETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`home-chip ${budgetUsd === n ? "is-on" : ""}`}
                onClick={() => setBudget(String(n))}
              >
                ${n}
              </button>
            ))}
            <label className="worth-amount">
              <em>$</em>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                aria-label={h.calcTitle}
              />
            </label>
          </div>
        </div>
        {verdict ? (
<p className="home-verdict">{verdictText(t, verdict, budgetLabel, nameOf)}</p>
        ) : null}
        <ol className="home-lanes">
          {lanes.map((lane) => (
            <li key={lane.key}>
              <span className="home-lane-name">
                <BrandMark family={lane.family} size={20} />
                {nameOf(lane)}
              </span>
              <span className="home-lane-plan">
                {lane.kind === "sub"
                  ? lane.plan
                    ? `${loc(lane.plan.name)} ${usd(lane.plan.priceUsd ?? 0, 0)}`
                    : t.w.noPrice
                  : loc(lane.model?.name)}
              </span>
              <b>{lane.tokensM != null ? mTok(lane.tokensM) : "—"}</b>
            </li>
          ))}
        </ol>
        <div className="home-calc-foot">
          <p>{h.calcNote}</p>
          <button
            type="button"
            className="cta is-blue home-cta"
            onClick={() => navigate(`/worth?budget=${budgetUsd || 20}`)}
          >
            {h.calcCta}
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
        <Link to="/worth" className="home-brands">
          <span>{h.brandsTitle(FAMILY_ORDER.length)}</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </section>

      <Link to="/claude/brief" className="col2-brief-link">
        <span>
          <em>
            {h.briefLabel} · {briefs[0].date}
          </em>
          {lang === "en" ? briefs[0].headlineEn : briefs[0].headline}
        </span>
        <ArrowRight size={18} weight="bold" />
      </Link>
    </div>
  );
}
