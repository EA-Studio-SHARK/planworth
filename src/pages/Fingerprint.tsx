import { ArrowClockwise, ArrowUpRight, Copy, TerminalWindow } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "../context/Prefs";
import type { Copy as CopyText } from "../i18n";
import {
  analyzeFingerprints,
  loadFingerpoint,
  newChallenges,
  parseNumbers,
  type Analysis,
  type Challenge,
  type FingerpointEngine,
} from "../lib/fingerpoint";

const SITE = "https://lm.ikale.io/";
const REPO = "https://github.com/Ikaleio/lm-detector";
const MODELTRACE = "https://github.com/xqy2006/ModelTrace";
const DOCS = "https://lm.ikale.io/docs/";
const CLI = "bunx lmfpd@latest --help";
const VISIBLE = 8;

function pct(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function needOf(challenge: Challenge) {
  return Math.max(80, Math.ceil(challenge.expected_count * 0.55));
}

export function FingerprintPage() {
  const { t } = usePrefs();
  const [engine, setEngine] = useState<FingerpointEngine | null>(null);
  const [loadPct, setLoadPct] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>(() => newChallenges());
  const [samples, setSamples] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let live = true;
    loadFingerpoint((loaded, total) => {
      if (live && total) setLoadPct(Math.min(99, Math.round((loaded / total) * 100)));
    })
      .then((next) => {
        if (!live) return;
        setEngine(next);
        setLoadPct(100);
      })
      .catch(() => {
        if (live) setLoadError(t.fpLoadFail);
      });
    return () => {
      live = false;
    };
  }, [t.fpLoadFail]);

  const parsed = useMemo(() => samples.map((text) => parseNumbers(text)), [samples]);
  const accepted = parsed.filter((nums, i) => nums.length >= needOf(challenges[i])).length;

  async function copyPrompt(index: number) {
    await navigator.clipboard.writeText(challenges[index].prompt);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1200);
  }

  function refreshPrompts() {
    setChallenges(newChallenges());
    setSamples(["", "", ""]);
    setResult(null);
    setError(null);
    setShowAll(false);
  }

  async function run() {
    if (!engine) return;
    setBusy(true);
    setError(null);
    try {
      const outputs = challenges.map((challenge, index) => ({
        text: samples[index],
        expected_count: challenge.expected_count,
      }));
      const next = analyzeFingerprints(outputs, engine);
      setResult(next);
      setShowAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.fpLoadFail);
    } finally {
      setBusy(false);
    }
  }

  const notModel = result?.decision === "not_model";
  const unscorable =
    Boolean(result) &&
    (notModel || result?.decision === "unscorable" || (result?.results.length ?? 0) === 0);
  const top = result?.results[0];
  const ranking = result ? (showAll ? result.results : result.results.slice(0, VISIBLE)) : [];
  const hasScores = result?.results.some((row) => row.probability != null) ?? false;
  const confidence = top?.probability ?? result?.probability ?? null;
  const lowConf = confidence != null && confidence < 0.75;
  const maxScore = Math.max(0.0001, ...(result?.results.map((row) => row.score) ?? [0]));
  const statusLabel = notModel
    ? t.fpNotModel
    : result?.decision === "partial"
      ? t.fpPartial
      : result?.decision === "unscorable"
        ? t.fpUnscorable
        : hasScores
          ? t.fpCalibrated
          : t.fpUncalibrated;

  return (
    <div className="fp-page">
      <header className="page-head fp-head">
        <div>
          <p className="kicker">Fingerpoint</p>
          <h1 className="page-title">{t.fpTitle}</h1>
          <p className="lede">{t.fpLede}</p>
        </div>
        <p
          className={`fp-engine ${loadError ? "is-fail" : engine ? "is-ready" : ""}`}
        >
          {loadError ? loadError : engine ? t.fpEngineReady : `${t.fpEngineLoading} ${loadPct}%`}
        </p>
      </header>

      <ol className="feat-grid" aria-label={t.fpHow}>
        <li>
          <b>{t.fpFn1Title}</b>
          <span>{t.fpFn1}</span>
        </li>
        <li>
          <b>{t.fpFn2Title}</b>
          <span>{t.fpFn2}</span>
        </li>
        <li>
          <b>{t.fpFn3Title}</b>
          <span>{t.fpFn3}</span>
        </li>
      </ol>

      <div className="cli-bar">
        <TerminalWindow size={16} weight="bold" />
        <span>{t.fpCli}</span>
        <code>
          <em>$</em> {CLI}
        </code>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigator.clipboard.writeText(CLI)}
        >
          <Copy size={14} />
        </button>
        <a href={DOCS} target="_blank" rel="noreferrer" className="cli-doc">
          {t.fpDocs} <ArrowUpRight size={12} />
        </a>
      </div>

      <div className={`fp-grid ${result ? "is-collapsed" : ""}`}>
        {challenges.map((challenge, index) => {
          const count = parsed[index].length;
          const need = needOf(challenge);
          const ok = count >= need;
          if (result) {
            return (
              <details key={challenge.id} className="fp-card is-fold">
                <summary>
                  {t.fpSample} {index + 1} · {count} {t.fpDigits}
                </summary>
                <SampleBody
                  t={t}
                  challenge={challenge}
                  index={index}
                  count={count}
                  need={need}
                  copied={copied === index}
                  value={samples[index]}
                  onCopy={() => void copyPrompt(index)}
                  onChange={(text) => {
                    const next = [...samples];
                    next[index] = text;
                    setSamples(next);
                  }}
                />
              </details>
            );
          }
          return (
            <article key={challenge.id} className="fp-card">
              <header>
                <strong>
                  {t.fpSample} {index + 1}
                </strong>
                <em className={ok ? "is-ok" : ""}>{ok ? t.fpOk : t.fpWait}</em>
              </header>
              <SampleBody
                t={t}
                challenge={challenge}
                index={index}
                count={count}
                need={need}
                copied={copied === index}
                value={samples[index]}
                onCopy={() => void copyPrompt(index)}
                onChange={(text) => {
                  const next = [...samples];
                  next[index] = text;
                  setSamples(next);
                }}
              />
            </article>
          );
        })}
      </div>

      <div className="fp-actions">
        <button className="cta is-ghost" type="button" onClick={refreshPrompts}>
          <ArrowClockwise size={14} />
          {t.fpRefresh}
        </button>
        <button className="cta is-blue" type="button" onClick={() => void run()} disabled={!engine || busy || accepted < 1}>
          {busy ? t.fpDetecting : accepted < 1 ? t.fpNeed : t.fpDetect}
        </button>
      </div>
      {error ? <p className="small">{error}</p> : null}

      {result ? (
        <section className="fp-result" aria-labelledby="fp-result-title">
          <h2 id="fp-result-title">{t.fpResult}</h2>

          <div className="fp-winner">
            {unscorable || !top ? (
              <div className="fp-summary">
                <div>
                  <span className="fp-meta">{statusLabel}</span>
                  <strong className="fp-display">{notModel ? t.fpNotModel : t.fpUnscorable}</strong>
                  <p>{result.evidence?.reason || (notModel ? t.fpNotModelBody : t.fpUnscorable)}</p>
                </div>
                <div className="fp-score">
                  <b>—</b>
                  <span className="fp-meta">{t.fpConfidence}</span>
                  <span className="fp-meta">{t.fpNoConf}</span>
                </div>
              </div>
            ) : (
              <div className="fp-summary">
                <div>
                  <span className="fp-meta">{statusLabel}</span>
                  <strong className="fp-display">{result.prediction_name || top.display_name}</strong>
                  {result.family_prediction_name ? (
                    <span className="fp-family">{result.family_prediction_name}</span>
                  ) : null}
                  {lowConf ? <span className="fp-flag">{t.fpLowConf}</span> : null}
                </div>
                <div className="fp-score">
                  <b>{hasScores ? pct(confidence) : "—"}</b>
                  <span className="fp-meta">{t.fpConfidence}</span>
                  <span className="fp-meta">
                    {hasScores
                      ? `${t.fpSourceBefore}lm.ikale.io${t.fpSourceAfter}`
                      : t.fpNeedThree}
                  </span>
                </div>
              </div>
            )}
            <dl className="fp-facts">
              <div>
                <dt>{t.fpUsed}</dt>
                <dd>
                  {result.used_outputs}/3
                </dd>
              </div>
              <div>
                <dt>{t.fpEvidence}</dt>
                <dd>{result.evidence?.reason || t.fpRankingNote}</dd>
              </div>
            </dl>
          </div>

          {result.diagnostics?.length ? (
            <ul className="fp-diag">
              {result.diagnostics.map((row, index) => (
                <li key={row.index} className={row.accepted ? "is-ok" : ""}>
                  <b>
                    {t.fpDiag} {index + 1}
                  </b>
                  <span>
                    {row.parsed_numbers} / {row.minimum_numbers}+
                  </span>
                  <em>{row.accepted ? t.fpAccepted : t.fpRejected}</em>
                </li>
              ))}
            </ul>
          ) : null}

          {!unscorable ? <p className="fp-note">{t.fpRankingNote}</p> : null}

          {!unscorable ? (
            <ol className="fp-rank">
              {ranking.map((row, index) => {
                const bar = hasScores
                  ? Math.max(0, Math.min(100, (row.probability ?? 0) * 100))
                  : Math.max(0, Math.min(100, (row.score / maxScore) * 100));
                return (
                  <li key={row.model} className="fp-rank-row">
                    <span className="fp-idx">{index + 1}</span>
                    <span className="fp-rank-name">{row.display_name}</span>
                    <span className="fp-rank-family">{row.family_name}</span>
                    <span className="fp-bar" aria-hidden>
                      <span style={{ width: `${bar}%` }} />
                    </span>
                    <span className="fp-rank-pct" title={hasScores ? t.fpConfidence : t.fpRankScore}>
                      {hasScores ? pct(row.probability) : "—"}
                    </span>
                  </li>
                );
              })}
              {result.results.length > VISIBLE ? (
                <li className="fp-rank-more">
                  <button type="button" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? t.fpShowLess : t.fpShowAll.replace("{n}", String(result.results.length))}
                  </button>
                </li>
              ) : null}
            </ol>
          ) : null}

          <p className="small">{t.fpClosedSet}</p>
        </section>
      ) : null}

      <p className="credit">
        {t.fpCredit}{" "}
        <a href={REPO} target="_blank" rel="noreferrer">
          {REPO}
        </a>
        . {t.fpThanks}{" "}
        <a href={MODELTRACE} target="_blank" rel="noreferrer">
          xqy2006/ModelTrace
        </a>
        .{" "}
        <a href={SITE} target="_blank" rel="noreferrer">
          lm.ikale.io
        </a>
        .
      </p>
    </div>
  );
}

function SampleBody({
  t,
  challenge,
  index,
  count,
  need,
  copied,
  value,
  onCopy,
  onChange,
}: {
  t: CopyText;
  challenge: Challenge;
  index: number;
  count: number;
  need: number;
  copied: boolean;
  value: string;
  onCopy: () => void;
  onChange: (text: string) => void;
}) {
  return (
    <>
      <div className="fp-prompt">
        <div className="fp-prompt-head">
          <span>{t.fpPrompt}</span>
          <button type="button" onClick={onCopy}>
            <Copy size={14} />
            {copied ? t.fpCopied : t.fpCopy}
          </button>
        </div>
        <pre>{challenge.prompt}</pre>
      </div>
      <label className="fp-reply">
        <span>
          {t.fpReply}
          <em>
            {count} / {need}+
          </em>
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.fpPlaceholder}
          spellCheck={false}
          aria-label={`${t.fpReply} ${index + 1}`}
        />
      </label>
    </>
  );
}
