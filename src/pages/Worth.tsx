import { ArrowDown, ArrowUpRight, Check, FileArrowUp, X } from "@phosphor-icons/react";
import { useMemo, useRef, useState, type DragEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { BrandSelect, type BrandOption } from "../components/BrandSelect";
import { usePrefs } from "../context/Prefs";
import { blendedPerMTok, modelById, rulersOf } from "../data/api-models";
import { FAMILY_GROUPS, FAMILY_ORDER, FAMILY_SOURCES, planById, plansOf } from "../data/plans";
import { formatCny, shopOf } from "../data/shop";
import { type Family, type Plan, type ShopItem } from "../data/types";
import { type Copy } from "../i18n";
import { famName, loc } from "../lib/localize";
import { verdictText } from "../lib/verdict-text";
import { buildLanes, pickPlan, verdictOf, type Lane, type Reason } from "../lib/recommend";
import {
  apiCostUsd,
  baseOf,
  CNY_PER_USD,
  CNY_RATE_NOTE,
  cny,
  DEFAULT_IN_RATIO,
  inferredQuota,
  mTok,
  plansNearBudget,
  pricedPlans,
  toUsd,
  usd,
  usdAuto,
  type Currency,
} from "../lib/worth";
import {
  hasFindings,
  isFailure,
  parseImportText,
  readImportFile,
  type ImportFailure,
  type ImportResult,
} from "../lib/worth-import";

const BUDGETS = [20, 100, 200] as const;
const MIX_MIN = 40;
const MIX_MAX = 90;
const TOKENS_PER_REQUEST_K = 4;
const PRESET_M = { light: 3, medium: 20, heavy: 100 } as const;

type UsageMode = "none" | keyof typeof PRESET_M | "tokens" | "requests";
type FieldKey = "family" | "plan" | "model" | "spend" | "mix" | "tokens" | "requests" | "dates";

/** "¥199 / 月" out of "¥199 / 月（连续包月，年付 ¥1,908）", in the plan's own currency. */
function shortPrice(plan: Plan) {
  return loc(plan.priceLabel.split(/[（(]/)[0].trim());
}

/** Products whose only listed plan is free (no paid tier to buy). */
function freeOnly(family: Family) {
  const rows = plansOf(family);
  return rows.some((p) => p.priceUsd === 0) && !rows.some((p) => (p.priceUsd ?? 0) > 0);
}

/** "Claude Max", but "Google AI Pro" rather than "Gemini Google AI Pro". */
function planTitle(plan: Plan) {
  return /google/i.test(plan.name) ? loc(plan.name) : `${famName(plan.family)} ${loc(plan.name)}`;
}

function shopFor(items: ShopItem[], plan: Plan | null) {
  if (!plan || !items.length) return null;
  return items.find((s) => s.officialEquivalent.includes(plan.name)) ?? null;
}

function spanDays(r: ImportResult) {
  if (!r.dateFrom || !r.dateTo) return 0;
  const ms = Date.parse(r.dateTo) - Date.parse(r.dateFrom);
  return Number.isFinite(ms) ? Math.round(ms / 86400000) + 1 : 0;
}

/** Bills spanning more than a month get scaled down to a monthly figure. */
function monthScale(r: ImportResult) {
  const days = spanDays(r);
  return days > 35 ? 30 / days : 1;
}

function mixOf(r: ImportResult) {
  const i = r.inputTokens ?? 0;
  const o = r.outputTokens ?? 0;
  if (i + o <= 0) return null;
  const pct = Math.round(((i / (i + o)) * 100) / 5) * 5;
  return Math.min(MIX_MAX, Math.max(MIX_MIN, pct));
}

function failureText(t: Copy, f: ImportFailure) {
  switch (f.error) {
    case "zip":
      return t.w.errZip;
    case "image":
      return t.w.errImage;
    case "encrypted":
      return t.w.errEncrypted;
    case "empty":
      return t.w.errEmpty;
    default:
      return t.w.errUnreadable;
  }
}

const AGENT_NAME: Partial<Record<Family, string>> = {
  claude: "Claude Code",
  gpt: "Codex",
  cursor: "Cursor Agent",
  copilot: "Copilot coding agent",
  gemini: "Antigravity",
};

function reasonText(t: Copy, r: Reason, family: Family) {
  const R = t.w.r;
  switch (r.code) {
    case "leftover":
      return R.leftover(usd(r.usd, 0));
    case "overBudget":
      return R.overBudget(usd(r.usd, 0));
    case "vsApi":
      return R.vsApi(r.times.toFixed(1), mTok(r.apiM));
    case "credits":
      return R.credits(usd(r.usd, 0));
    case "multiplier":
      return R.multiplier(r.x, r.base);
    case "published":
      return R.published(usd(r.usd, 0));
    case "codeAgent":
      return R.codeAgent(AGENT_NAME[family] ?? "");
    case "unpublished":
      return R.unpublished;
    case "covers":
      return R.covers(usd(r.need), usd(r.price, 0));
    case "short":
      return R.short(usd(r.need), usd(r.have, 0));
    case "apiCheaper":
      return R.apiCheaper(usd(r.need), usd(r.price, 0), loc(r.plan));
    case "current":
      return R.current(loc(r.plan), usd(Math.abs(r.diff), 0), r.diff > 0);
    case "unit":
      return R.unit(loc(r.unit));
    case "unverified":
      return t.w.unverifiedShort;
  }
}

export function WorthPage() {
  const { t } = usePrefs();
  const w = t.w;
  const [params] = useSearchParams();
  const initialFamily = FAMILY_ORDER.find((f) => f === params.get("family")) ?? "claude";
  const initialBudget = Number(params.get("budget"));
  const [family, setFamily] = useState<Family>(initialFamily);
  const [modelId, setModelId] = useState(() =>
    initialFamily === "claude" ? "sonnet-5.5" : (rulersOf(initialFamily)[0]?.id ?? ""),
  );
  const [inPct, setInPct] = useState(Math.round(DEFAULT_IN_RATIO * 100));
  const [budget, setBudget] = useState(initialBudget > 0 ? String(initialBudget) : "20");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [usageMode, setUsageMode] = useState<UsageMode>("none");
  const [usageValue, setUsageValue] = useState("");
  const [shown, setShown] = useState(false);

  const [paste, setPaste] = useState("");
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [found, setFound] = useState<ImportResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [skip, setSkip] = useState<Set<FieldKey>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const familyModels = rulersOf(family);
  const borrowedRulers = familyModels.some((m) => m.family !== family);
  const hasModel = familyModels.length > 0;
  const model = familyModels.find((m) => m.id === modelId) ?? familyModels[0] ?? null;
  const inRatio = inPct / 100;
  const mixFill = ((inPct - MIX_MIN) / (MIX_MAX - MIX_MIN)) * 100;
  const budgetNum = Math.max(0, Number(budget) || 0);
  const budgetUsd = toUsd(budgetNum, currency);
  const budgetLabel = currency === "CNY" ? w.cnyWithUsd(cny(budgetNum), usdAuto(budgetUsd)) : usdAuto(budgetUsd);
  const familyPlans = plansOf(family).filter((p) => (p.priceUsd ?? 0) > 0);

  const monthlyM = useMemo(() => {
    if (usageMode === "none") return null;
    if (usageMode === "tokens") return Number(usageValue) > 0 ? Number(usageValue) : null;
    if (usageMode === "requests") {
      const n = Number(usageValue);
      return n > 0 ? (n * TOKENS_PER_REQUEST_K) / 1000 : null;
    }
    return PRESET_M[usageMode];
  }, [usageMode, usageValue]);

  const lanes = useMemo(
    () => buildLanes(family, model?.id ?? "", budgetUsd, inRatio),
    [family, model, budgetUsd, inRatio],
  );
  const pick = useMemo(
    () =>
      pickPlan({ family, modelId: model?.id ?? "", budgetUsd, inRatio, monthlyM, currentPlanId }),
    [family, model, budgetUsd, inRatio, monthlyM, currentPlanId],
  );
  const near = useMemo(() => plansNearBudget(family, budgetUsd), [family, budgetUsd]);
  const productOptions = useMemo<BrandOption[]>(
    () =>
      FAMILY_GROUPS.flatMap((group) =>
        group.families.map((id) => {
          const cheapest = pricedPlans(id)[0];
          const price = cheapest?.priceUsd ?? 0;
          return {
            id,
            label: famName(id),
            group: w.groups[group.id],
            icon: <BrandMark family={id} size={22} />,
            detail: cheapest
              ? w.from(usd(price, price % 1 ? 2 : 0))
              : freeOnly(id)
                ? w.free
                : w.pricePending,
          };
        }),
      ),
    [w],
  );
  const modelOptions = useMemo<BrandOption[]>(() => {
    const prices = familyModels.map((m) => blendedPerMTok(m, inRatio));
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    return familyModels.map((m, i) => ({
      id: m.id,
      label: loc(m.name),
      icon: <BrandMark family={m.family} size={22} />,
      detail: `${usd(m.inputPerMTok)} ${t.mixIn} · ${usd(m.outputPerMTok)} ${t.mixOut}${m.confidence === "index" ? ` · ${w.unverified}` : ""}`,
      aside: budgetUsd > 0 ? w.budgetBuys(usd(budgetUsd, 0), mTok(budgetUsd / prices[i])) : undefined,
      tag: familyModels.length > 1 ? (prices[i] === lo ? w.cheapest : prices[i] === hi ? w.priciest : undefined) : undefined,
    }));
  }, [familyModels, inRatio, budgetUsd, t, w]);
  const maxLane = Math.max(0.001, ...lanes.map((l) => l.tokensM ?? 0));
  const verdict = verdictOf(lanes);

  function pickFamily(next: Family) {
    setFamily(next);
    setModelId(rulersOf(next)[0]?.id ?? "");
    setCurrentPlanId(null);
  }

  function setBudgetPreset(n: number) {
    setCurrency("USD");
    setBudget(String(n));
  }

  function switchCurrency(next: Currency) {
    if (next === currency) return;
    const converted = next === "CNY" ? budgetNum * CNY_PER_USD : budgetNum / CNY_PER_USD;
    setBudget(String(Math.round(converted)));
    setCurrency(next);
  }

  function receive(outcome: Awaited<ReturnType<typeof readImportFile>>) {
    setSkip(new Set());
    if (isFailure(outcome)) {
      setFound(null);
      setFailure(failureText(t, outcome));
      return;
    }
    if (!hasFindings(outcome)) {
      setFound(null);
      setFailure(w.foundNone);
      return;
    }
    setFailure(null);
    setFound(outcome);
  }

  async function readFile(file: File) {
    setReading(true);
    try {
      receive(await readImportFile(file));
    } finally {
      setReading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void readFile(file);
  }

  function toggle(key: FieldKey) {
    const next = new Set(skip);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSkip(next);
  }

  function applyFound() {
    if (!found) return;
    const keep = (k: FieldKey) => !skip.has(k);
    const scale = monthScale(found);
    const fam = keep("family") ? found.family : undefined;
    if (fam && fam !== family) pickFamily(fam);
    const famNow = fam ?? family;
    const m = found.modelId ? modelById(found.modelId) : null;
    if (keep("model") && m && m.family === famNow) setModelId(m.id);
    const plan = found.planId ? planById(found.planId) : null;
    if (keep("plan") && plan && plan.family === famNow) setCurrentPlanId(plan.id);
    if (keep("spend")) {
      if (found.spendUsd) {
        setCurrency("USD");
        setBudget(String(Math.round(found.spendUsd * scale * 100) / 100));
      } else if (found.spendCny) {
        setCurrency("CNY");
        setBudget(String(Math.round(found.spendCny * scale)));
      }
    }
    const mix = mixOf(found);
    if (keep("mix") && mix != null) setInPct(mix);
    if (keep("tokens") && found.totalTokens) {
      setUsageMode("tokens");
      setUsageValue(String(Math.round((found.totalTokens * scale) / 1e4) / 100));
    } else if (keep("requests") && found.requests) {
      setUsageMode("requests");
      setUsageValue(String(Math.round(found.requests * scale)));
    }
    setFound(null);
    setPaste("");
  }

  function run() {
    setShown(true);
    window.requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  const laneLabel = (lane: Lane) => {
    const name = famName(lane.family);
    switch (lane.key) {
      case "claude-sub":
        return w.laneClaudeSub;
      case "gpt-sub":
        return w.laneGptSub;
      case "claude-api":
        return w.laneClaudeApi;
      case "gpt-api":
        return w.laneGptApi;
      case "family-sub":
        return w.laneFamilySub(name);
      default:
        return w.laneFamilyApi(name);
    }
  };

  const pickWorth =
    pick.plan && pick.model ? inferredQuota(pick.plan, pick.model, inRatio, baseOf(pick.plan)) : null;
  const pickShop = shopFor(shopOf(family), pick.plan);
  const foundRows = found ? foundFields(t, found) : [];

  return (
    <div className="worth">
      <header className="worth-head">
        <p className="kicker">{t.worthEn}</p>
        <h1>{w.title}</h1>
        <p className="worth-lede">{w.lede}</p>
      </header>

      <section className="worth-pickers" aria-label={w.pickProductTitle}>
        <div className="worth-selects">
          <BrandSelect
            label={w.pickProductTitle}
            value={family}
            onChange={(id) => pickFamily(id as Family)}
            searchPlaceholder={w.searchProduct}
            options={productOptions}
          />
          <BrandSelect
            label={w.pickModelTitle}
            value={model?.id ?? ""}
            onChange={setModelId}
            options={modelOptions}
            emptyText={FAMILY_SOURCES[family].verifiedAt ? w.noTokens : w.pricePending}
          />
        </div>
        {hasModel ? (
          <p className="worth-hint">
            {borrowedRulers ? w.borrowedPick(famName(family)) : w.pickModelHint}
            {FAMILY_SOURCES[family].publicNote ? ` ${loc(FAMILY_SOURCES[family].publicNote)}` : ""}
          </p>
        ) : (
          <p className="worth-empty">
            {FAMILY_SOURCES[family].verifiedAt ? w.noModel(famName(family)) : w.pendingData(famName(family))}
          </p>
        )}
      </section>

      <section className="worth-data" aria-label={w.stepData}>
        <div className="worth-data-main">
          <span className="worth-step">{w.stepData}</span>

          <div className="worth-field">
            <span className="select-label">{w.budget}</span>
            <div className="worth-budget">
              <div className="switch-row">
                {BUDGETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`switch-item ${currency === "USD" && budgetNum === n ? "is-on" : ""}`}
                    onClick={() => setBudgetPreset(n)}
                  >
                    ${n}
                  </button>
                ))}
              </div>
              <label className="worth-amount">
                <em>{currency === "CNY" ? "¥" : "$"}</em>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={currency === "CNY" ? 10 : 1}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  aria-label={w.budgetCustom}
                />
              </label>
              <div className="switch-row" role="listbox" aria-label="Currency">
                {(["USD", "CNY"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="option"
                    aria-selected={c === currency}
                    className={`switch-item ${c === currency ? "is-on" : ""}`}
                    onClick={() => switchCurrency(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <p className="small">
              {currency === "CNY"
                ? `${w.approx} ${usd(budgetUsd)} · ${w.rateNote(CNY_PER_USD.toFixed(4), CNY_RATE_NOTE)}`
                : `${w.approx} ${cny(budgetUsd * CNY_PER_USD)}`}
            </p>
          </div>

          {familyPlans.length ? (
            <div className="worth-field">
              <span className="select-label">{w.currentPlan}</span>
              <div className="switch-row">
                <button
                  type="button"
                  className={`switch-item ${currentPlanId == null ? "is-on" : ""}`}
                  onClick={() => setCurrentPlanId(null)}
                >
                  {w.notSure}
                </button>
                {familyPlans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`switch-item ${currentPlanId === p.id ? "is-on" : ""}`}
                    onClick={() => setCurrentPlanId(p.id)}
                  >
                    {loc(p.name)} <span className="worth-dim">{shortPrice(p)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="worth-field">
            <span className="select-label">
              {w.mix} · {t.mixIn} {inPct}% · {t.mixOut} {100 - inPct}%
              {model ? ` · ${t.blended} ${usd(blendedPerMTok(model, inRatio))} ${t.perMTok}` : ""}
            </span>
            <div className="mix-track">
              <input
                className="mix-range"
                type="range"
                min={MIX_MIN}
                max={MIX_MAX}
                step={5}
                value={inPct}
                style={{ ["--pct" as string]: `${mixFill}%` }}
                onChange={(e) => setInPct(Number(e.target.value))}
                aria-label={t.pickMix}
              />
            </div>
          </div>

          <div className="worth-field">
            <span className="select-label">{w.usage}</span>
            <div className="worth-budget">
              <div className="switch-row">
                {(
                  [
                    ["none", w.usageNone],
                    ["light", w.usageLight],
                    ["medium", w.usageMedium],
                    ["heavy", w.usageHeavy],
                    ["tokens", w.usageTokens],
                    ["requests", w.usageRequests],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`switch-item ${usageMode === key ? "is-on" : ""}`}
                    onClick={() => setUsageMode(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {usageMode === "tokens" || usageMode === "requests" ? (
                <label className="worth-amount is-unit">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={usageValue}
                    onChange={(e) => setUsageValue(e.target.value)}
                    aria-label={usageMode === "tokens" ? w.usageTokensUnit : w.usageRequestsUnit}
                  />
                  <em>{usageMode === "tokens" ? w.usageTokensUnit : w.usageRequestsUnit}</em>
                </label>
              ) : null}
            </div>
            {usageMode === "light" || usageMode === "medium" || usageMode === "heavy" ? (
              <p className="small">{w.usagePresetNote}</p>
            ) : usageMode === "requests" ? (
              <p className="small">{w.usageRequestNote(TOKENS_PER_REQUEST_K)}</p>
            ) : null}
          </div>
        </div>

        <div className="worth-import">
          <span className="worth-step">{w.importTitle}</span>
          <div
            className={`worth-drop ${dragging ? "is-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <FileArrowUp size={22} />
            <span>
              {w.dropHint}{" "}
              <button type="button" className="worth-link" onClick={() => fileRef.current?.click()}>
                {w.choose}
              </button>
            </span>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".csv,.tsv,.json,.txt,.pdf,.zip,text/*,application/json,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
                e.target.value = "";
              }}
            />
          </div>
          <textarea
            className="worth-paste"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={w.pastePlaceholder}
            rows={4}
          />
          <div className="worth-import-foot">
            <p className="small">{w.localOnly}</p>
            <button
              type="button"
              className="cta is-ghost"
              disabled={!paste.trim() || reading}
              onClick={() => receive(parseImportText(paste))}
            >
              {reading ? w.reading : w.recognize}
            </button>
          </div>

          {failure ? <p className="worth-fail">{failure}</p> : null}

          {found ? (
            <div className="worth-found">
              <strong>{w.found(found.source.toUpperCase())}</strong>
              <ul>
                {foundRows.map((row) => (
                  <li
                    key={row.key}
                    className={row.key === "dates" ? "is-meta" : skip.has(row.key) ? "is-off" : ""}
                  >
                    {row.key === "dates" ? null : (
                      <button type="button" onClick={() => toggle(row.key)} aria-pressed={!skip.has(row.key)}>
                        {skip.has(row.key) ? <X size={12} weight="bold" /> : <Check size={12} weight="bold" />}
                      </button>
                    )}
                    <span>{row.label}</span>
                    <b>{row.value}</b>
                  </li>
                ))}
                {found.rows ? (
                  <li className="is-meta">
                    <span>{w.fRows(found.rows)}</span>
                    <b>
                      {found.dateFrom ? `${found.dateFrom} → ${found.dateTo}` : ""}
                      {monthScale(found) < 1 ? ` · ${w.perMonthNote(spanDays(found))}` : ""}
                    </b>
                  </li>
                ) : null}
              </ul>
              <p className="small">{w.applyNote}</p>
              <div className="worth-found-actions">
                <button type="button" className="cta is-ghost" onClick={() => setFound(null)}>
                  {w.dismiss}
                </button>
                <button type="button" className="cta is-blue" onClick={applyFound}>
                  {w.apply}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="worth-run">
        <button type="button" className="cta is-blue" onClick={run} disabled={budgetUsd <= 0}>
          {shown ? w.jump : w.run}
          <ArrowDown size={14} weight="bold" />
        </button>
      </div>

      {shown ? (
        <section className="worth-result" ref={resultRef} aria-labelledby="worth-result-title">
          <h2 id="worth-result-title">{w.resultTitle}</h2>
          {verdict ? (
<p className="worth-verdict">{verdictText(t, verdict, budgetLabel, laneLabel)}</p>
          ) : null}

          <article className="worth-pick">
            <div className="worth-pick-main">
              <span className="fp-meta">
                {pick.kind === "api" ? w.pickApi : w.pickKicker}
                {pick.over ? <em className="worth-over">{w.overTag}</em> : null}
              </span>
              {pick.kind === "none" ? (
                <p className="worth-note">
                  {!plansOf(family).length && hasModel
                    ? w.apiPlatformPick(famName(family))
                    : freeOnly(family)
                    ? w.freeOnlyPick(famName(family))
                    : FAMILY_SOURCES[family].verifiedAt
                      ? w.pickNone
                      : w.pendingData(famName(family))}
                </p>
              ) : (
                <>
                  <strong className="fp-display">
                    <BrandMark family={family} size={22} />
                    {pick.kind === "api"
                      ? `${loc(pick.model?.name) ?? ""} API`
                      : pick.plan
                        ? planTitle(pick.plan)
                        : ""}
                  </strong>
                  <span className="worth-pick-price">
                    {pick.kind === "api" ? `${usd(pick.priceUsd)} / ${w.direct}` : loc(pick.plan?.priceLabel)}
                    {pickShop ? (
                      <Link to="/shop" className="tag is-promo">
                        {w.shopPromo(formatCny(pickShop.priceCny))}
                      </Link>
                    ) : null}
                  </span>
                  <ul className="worth-reasons">
                    {pick.reasons.map((r, i) => (
                      <li key={i}>{reasonText(t, r, family)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            {pick.kind !== "none" ? (
              <div className="fp-score">
                <span className="fp-meta">
                  {pick.kind === "api" ? w.exact : pick.tokensM == null && pick.plan?.unitLabel ? w.officialTitle : w.guess}
                </span>
                {pick.tokensM == null && pick.plan?.unitLabel ? (
                  <b className="is-unit">{loc(pick.plan.unitLabel)}</b>
                ) : (
                  <>
                    <b>{pick.tokensM != null ? mTok(pick.tokensM) : "—"}</b>
                    <span className="fp-meta">{w.tokensUnit}</span>
                  </>
                )}
                {pick.model ? (
                  <span className="fp-meta">{w.ruler(loc(pick.model.name), inPct)}</span>
                ) : (
                  <span className="fp-meta">{w.noTokens}</span>
                )}
                {pickWorth && pickWorth.creditsM > 0 ? (
                  <span className="fp-meta">{w.split(mTok(pickWorth.usageM), mTok(pickWorth.creditsM))}</span>
                ) : null}
              </div>
            ) : null}
          </article>

          <h3 className="worth-sub">{w.matrixTitle(budgetLabel)}</h3>
          <div className="worth-lanes">
            {lanes.map((lane) => (
              <LaneCard
                key={lane.key}
                t={t}
                lane={lane}
                label={laneLabel(lane)}
                inPct={inPct}
                max={maxLane}
                monthlyM={monthlyM}
                inRatio={inRatio}
                isPick={
                  (lane.kind === "sub" && lane.family === family && lane.plan?.id === pick.plan?.id && pick.kind === "plan") ||
                  (lane.kind === "api" && pick.kind === "api" && lane.model?.id === pick.model?.id)
                }
              />
            ))}
          </div>

          {near.length ? (
            <>
              <h3 className="worth-sub">{w.nearTitle(famName(family), budgetLabel)}</h3>
              <p className="small worth-sub-note">{w.nearHint}</p>
              <ol className="worth-near">
                {near.map((plan) => {
                  const q = inferredQuota(plan, model, inRatio, baseOf(plan));
                  const within = (plan.priceUsd ?? 0) <= budgetUsd * 1.02;
                  const width = model ? Math.min(100, (q.totalM / maxNear(near, model, inRatio)) * 100) : 0;
                  return (
                    <li
                      key={plan.id}
                      className={`${plan.id === pick.plan?.id ? "is-pick" : ""} ${plan.id === currentPlanId ? "is-on" : ""}`}
                      onClick={() => setCurrentPlanId(plan.id === currentPlanId ? null : plan.id)}
                    >
                      <span className="worth-near-name">
                        <b>{loc(plan.name)}</b>
                        <em className={within ? "is-ok" : ""}>{within ? w.inBudget : w.overTag}</em>
                        {plan.confidence === "index" ? <em className="is-review">{w.unverified}</em> : null}
                        <small>
                          {plan.multiplierVsBase && plan.multiplierVsBase > 1 ? `${plan.multiplierVsBase}× · ` : ""}
                          {plan.apiCreditsUsd ? `${t.credits} ${usd(plan.apiCreditsUsd, 0)} · ` : ""}
                          {plan.includesCodeAgent ? t.codeAgent : loc(plan.unitLabel) ?? ""}
                        </small>
                      </span>
                      <span className="worth-near-price">{shortPrice(plan)}</span>
                      {model ? (
                        <>
                          <span className="fp-bar" aria-hidden>
                            <span style={{ width: `${width}%` }} />
                          </span>
                          <span className="worth-near-amt">{mTok(q.totalM)}</span>
                        </>
                      ) : (
                        <span className="worth-near-amt is-unit">{loc(plan.unitLabel) ?? w.noTokens}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          ) : null}

          {pick.plan ? (
            <div className="worth-official">
              <strong>
                {planTitle(pick.plan)} · {w.officialTitle}
              </strong>
              <p>{loc(pick.plan.quotaOfficial)}</p>
              <p className="small">
                {w.source} {loc(pick.plan.sourceNote)}
                {!pick.plan.exactQuotaPublished ? ` · ${t.quotaUnpublished}` : ""}
              </p>
              {pick.plan.confidence === "index" ? <p className="worth-review">{w.unverifiedLong}</p> : null}
              <div className="block-links">
                {pick.plan.officialUrl ? (
                  <a href={pick.plan.officialUrl} target="_blank" rel="noreferrer">
                    {t.verified} {pick.plan.verifiedAt} <ArrowUpRight size={12} />
                  </a>
                ) : null}
                {pick.model?.officialUrl ? (
                  <a href={pick.model.officialUrl} target="_blank" rel="noreferrer">
                    {loc(pick.model.name)} {t.verified} {pick.model.verifiedAt} <ArrowUpRight size={12} />
                  </a>
                ) : null}
                {shopOf(family).length ? (
                  <Link to="/shop" className="tag is-promo">
                    {t.promoShop} {shopOf(family).length}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <h3 className="worth-sub">{w.howTitle}</h3>
          <ol className="feat-grid worth-how">
            <li>
              <b>{w.fn1Title}</b>
              <span>{w.fn1}</span>
            </li>
            <li>
              <b>{w.fn2Title}</b>
              <span>{w.fn2}</span>
            </li>
            <li>
              <b>{w.fn3Title}</b>
              <span>{w.fn3}</span>
            </li>
          </ol>
          <p className="quota-formula">{w.formula}</p>
        </section>
      ) : null}
    </div>
  );
}

function maxNear(rows: Plan[], model: NonNullable<ReturnType<typeof modelById>>, inRatio: number) {
  return Math.max(0.001, ...rows.map((p) => inferredQuota(p, model, inRatio, baseOf(p)).totalM));
}

function foundFields(t: Copy, r: ImportResult) {
  const w = t.w;
  const scale = monthScale(r);
  const rows: { key: FieldKey; label: string; value: string }[] = [];
  if (r.family) rows.push({ key: "family", label: w.fProduct, value: famName(r.family) });
  if (r.planId || r.seenPlan) {
    const plan = r.planId ? planById(r.planId) : null;
    rows.push({ key: "plan", label: w.fPlan, value: plan ? planTitle(plan) : `${r.seenPlan} · ${w.unmatched}` });
  }
  if (r.modelId || r.seenModel) {
    const m = r.modelId ? modelById(r.modelId) : null;
    rows.push({ key: "model", label: w.fModel, value: m ? `${loc(m.name)}${r.seenModel && r.seenModel !== m.name ? ` ← ${r.seenModel}` : ""}` : `${r.seenModel} · ${w.unmatched}` });
  }
  if (r.spendUsd) rows.push({ key: "spend", label: w.fSpend, value: `${usd(r.spendUsd)}${scale < 1 ? ` → ${usd(r.spendUsd * scale)} / mo` : ""}` });
  else if (r.spendCny) rows.push({ key: "spend", label: w.fSpend, value: `${cny(r.spendCny)}${scale < 1 ? ` → ${cny(r.spendCny * scale)} / mo` : ""}` });
  const mix = mixOf(r);
  if (mix != null) rows.push({ key: "mix", label: w.fMix, value: `${mix}%` });
  if (r.totalTokens) {
    const detail = r.inputTokens || r.outputTokens ? ` (${t.mixIn} ${mTok((r.inputTokens ?? 0) / 1e6)} · ${t.mixOut} ${mTok((r.outputTokens ?? 0) / 1e6)})` : "";
    const perMonth = scale < 1 ? ` → ${mTok((r.totalTokens * scale) / 1e6)} / mo` : "";
    rows.push({ key: "tokens", label: w.fTokens, value: `${mTok(r.totalTokens / 1e6)}${detail}${perMonth}` });
  }
  if (r.requests) rows.push({ key: "requests", label: w.fRequests, value: r.requests.toLocaleString() });
  if (r.dateFrom && !r.rows) rows.push({ key: "dates", label: w.fDates, value: r.dateFrom === r.dateTo ? r.dateFrom : `${r.dateFrom} → ${r.dateTo}` });
  return rows;
}

function LaneCard({
  t,
  lane,
  label,
  inPct,
  max,
  monthlyM,
  inRatio,
  isPick,
}: {
  t: Copy;
  lane: Lane;
  label: string;
  inPct: number;
  max: number;
  monthlyM: number | null;
  inRatio: number;
  isPick: boolean;
}) {
  const w = t.w;
  const width = lane.tokensM ? Math.min(100, (lane.tokensM / max) * 100) : 0;
  const shop = shopFor(lane.shop, lane.plan);
  const isSub = lane.kind === "sub";
  return (
    <article className={`worth-lane ${isPick ? "is-pick" : ""}`}>
      <header>
        <BrandMark family={lane.family} size={16} />
        <b>{label}</b>
        <em>{!isSub ? w.exact : lane.tokensM == null && lane.plan?.unitLabel ? w.officialUnit : w.guess}</em>
      </header>
      <p className="worth-lane-plan">
        {isSub
          ? lane.plan
            ? `${loc(lane.plan.name)} · ${shortPrice(lane.plan)}`
            : freeOnly(lane.family)
              ? w.freeOnly
              : w.noPrice
          : `${loc(lane.model?.name) ?? ""} · ${w.direct}`}
      </p>
      <strong className={`worth-lane-num ${lane.tokensM == null && lane.plan?.unitLabel ? "is-unit" : ""}`}>
        {lane.tokensM != null ? mTok(lane.tokensM) : isSub && lane.plan?.unitLabel ? loc(lane.plan.unitLabel) : "—"}
      </strong>
      <span className="fp-bar" aria-hidden>
        <span style={{ width: `${width}%` }} />
      </span>
      <ul className="worth-lane-notes">
        {lane.model ? <li>{w.ruler(loc(lane.model.name), inPct)}</li> : <li>{w.noTokens}</li>}
        {lane.borrowedRuler ? <li>{w.borrowed}</li> : null}
        {lane.plan?.confidence === "index" || lane.model?.confidence === "index" ? (
          <li className="is-review">{w.unverifiedShort}</li>
        ) : null}
        {lane.creditsM > 0 ? <li>{w.split(mTok(lane.usageM), mTok(lane.creditsM))}</li> : null}
        {isSub && lane.status === "over" && lane.plan ? <li className="is-warn">{w.overLane(shortPrice(lane.plan))}</li> : null}
        {isSub && lane.status === "ok" && lane.leftoverUsd >= 1 ? <li>{w.left(usd(lane.leftoverUsd, 0))}</li> : null}
        {isSub && lane.nextPlan ? <li>{w.nextUp(loc(lane.nextPlan.name), shortPrice(lane.nextPlan))}</li> : null}
        {!isSub && monthlyM && lane.model ? (
          <li>{w.usageCost(mTok(monthlyM), usd(apiCostUsd(monthlyM, lane.model, inRatio)))}</li>
        ) : null}
      </ul>
      {shop ? (
        <Link to="/shop" className="tag is-promo">
          {w.shopPromo(formatCny(shop.priceCny))}
        </Link>
      ) : null}
    </article>
  );
}
