import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefs } from "../context/Prefs";
import {
  classifyExit,
  lookupIp,
  probeIpv6,
  probeOfficialNodes,
  probeWebRtc,
  sameTimezone,
  localExtras,
  type IpIntel,
  type NodeProbe,
  type WebRtcProbe,
} from "../lib/env-net";
import { getSignalWeight } from "../vendor/checkcc/config";
import {
  collectBrowserEnvironment,
  collectBrowserSignals,
  defaultSignals,
  signalsScore,
  sleep,
} from "../vendor/checkcc/client-engine";
import { detectorLocaleText } from "../vendor/checkcc/locale";
import { accessStatus, evaluateAccess } from "../vendor/checkcc/scoring";
import type { RegionCode, SignalResult } from "../vendor/checkcc/types";

const SITE = "https://checkcc.org/";
const REPO = "https://github.com/yacuo/check-cc.git";

type Report = {
  score: number;
  status: string;
  statusKey: string;
  confidence: string;
  matchedRegion: string | null;
  signals: SignalResult[];
  ip: IpIntel | null;
  nodes: NodeProbe[];
  webrtc: WebRtcProbe | null;
  ipv6: string | null;
};

function badgeClass(score: number, ready: boolean) {
  if (!ready) return "";
  if (score === 0) return "is-ok";
  if (score >= 70) return "is-hot";
  if (score >= 40) return "is-mid";
  return "is-low";
}

function capColor(score: number) {
  if (score >= 70) return "#f472b6";
  if (score >= 40) return "#818cf8";
  if (score > 0) return "#38bdf8";
  return "#34d399";
}

const GAUGE = 228;
const GAUGE_STROKE = 18;

function EnvGauge({
  score,
  ringPct,
  ready,
  running,
  caption,
  ariaLabel,
}: {
  score: number;
  ringPct: number;
  ready: boolean;
  running: boolean;
  caption: string;
  ariaLabel: string;
}) {
  const p = Math.max(0, Math.min(100, ringPct));
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = GAUGE * dpr;
    canvas.height = GAUGE * dpr;

    const paint = (value: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, GAUGE, GAUGE);

      const cx = GAUGE / 2;
      const cy = GAUGE / 2;
      const radius = cx - GAUGE_STROKE / 2;
      const track = getComputedStyle(wrap).getPropertyValue("--env-track").trim() || "#d0d4db";

      ctx.lineWidth = GAUGE_STROKE;
      ctx.lineCap = "butt";
      ctx.strokeStyle = track;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (value <= 0.05) return;

      const start = -Math.PI / 2;
      const end = start + (value / 100) * Math.PI * 2;
      const cap = getComputedStyle(wrap).getPropertyValue("--env-cap").trim() || "#38bdf8";
      const grad = ctx.createConicGradient(start, cx, cy);
      grad.addColorStop(0, "#34d399");
      grad.addColorStop(0.25, "#38bdf8");
      grad.addColorStop(0.52, "#818cf8");
      grad.addColorStop(0.78, "#e879f9");
      grad.addColorStop(1, "#f472b6");

      ctx.lineCap = "butt";
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, end);
      ctx.stroke();

      const dot = GAUGE_STROKE / 2;
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(cx + radius * Math.cos(start), cy + radius * Math.sin(start), dot, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.arc(cx + radius * Math.cos(end), cy + radius * Math.sin(end), dot, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = () => {
      const target = p;
      if (reduce) {
        shown.current = target;
        paint(target);
        return;
      }
      const next = shown.current + (target - shown.current) * 0.2;
      shown.current = Math.abs(target - next) < 0.12 ? target : next;
      paint(shown.current);
      if (shown.current !== target) raf = requestAnimationFrame(tick);
    };

    const onTheme = () => {
      shown.current = reduce ? p : shown.current;
      paint(shown.current);
    };

    tick();
    const obs = new MutationObserver(onTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [p]);

  return (
    <div
      ref={wrapRef}
      className={`env-gauge ${ready ? "is-ready" : running ? "is-run" : "is-idle"} ${p > 0 ? "is-live" : ""}`}
      style={{ ["--env-cap" as string]: capColor(score) }}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="env-gauge-glow" aria-hidden />
      <canvas className="env-gauge-canvas" ref={canvasRef} aria-hidden />
      <div className="env-gauge-core">
        <strong className={ready || running ? "" : "is-empty"}>{ready || running ? score : "0"}</strong>
        <small>{caption}</small>
      </div>
    </div>
  );
}

export function CheckccPage() {
  const { lang, t } = usePrefs();
  const text = detectorLocaleText[lang === "en" ? "en" : "zh"];
  const [report, setReport] = useState<Report | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);
  const [live, setLive] = useState<SignalResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      defaultSignals.map((signal) => ({
        ...signal,
        label: text.signalLabels[signal.id] ?? signal.label,
        value: text.pending,
      })),
    [text],
  );

  async function run() {
    setRunning(true);
    setError(null);
    setReport(null);
    setProgress(0);
    setActive(0);
    setLive(pending.map((signal) => ({ ...signal, value: text.pending })));
    try {
      const snapshot = collectBrowserEnvironment(text);
      const extras = localExtras();
      const netPromise = Promise.all([lookupIp(), probeOfficialNodes(), probeWebRtc(), probeIpv6()]);

      const browser = collectBrowserSignals("auto", text, undefined, snapshot);
      const working: SignalResult[] = pending.map((signal) => ({ ...signal, value: text.pending }));
      for (let i = 0; i < browser.signals.length; i += 1) {
        const next = browser.signals[i];
        const slot = working.findIndex((row) => row.id === next.id);
        if (slot >= 0) working[slot] = next;
        else working.push(next);
        setLive([...working]);
        setActive(slot >= 0 ? slot : i);
        setProgress(Math.round(((i + 1) / (browser.signals.length + 8)) * 82));
        await sleep(280);
      }

      const [ip, nodes, webrtc, ipv6] = await netPromise;
      const access = evaluateAccess({
        region: "auto",
        country: ip?.countryCode || undefined,
        timezone: snapshot.timezone,
        languages: snapshot.languages,
        locale: snapshot.locale,
        userAgent: snapshot.userAgent,
        source: "browser",
      });
      const countryHit = Boolean(access.signals.find((signal) => signal.id === "country")?.contribution);
      const extraSignals: SignalResult[] = [];
      const upsert = (signal: SignalResult) => {
        extraSignals.push(signal);
        const slot = working.findIndex((row) => row.id === signal.id);
        if (slot >= 0) working[slot] = signal;
        else working.push(signal);
        setLive([...working]);
        setActive(slot >= 0 ? slot : working.length - 1);
      };

      if (ip) {
        upsert({
          id: "country",
          label: text.signalLabels.country,
          value: `${ip.country} / ${ip.countryCode || ip.ip}`,
          score: countryHit ? 1 : 0,
          weight: getSignalWeight("country", 20),
          contribution: countryHit ? getSignalWeight("country", 20) : 0,
          source: "server",
        });
        await sleep(220);
        upsert({
          id: "ipAddress",
          label: text.signalLabels.ipAddress,
          value: ip.ip,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "server",
        });
        upsert({
          id: "browserIpLocation",
          label: text.signalLabels.browserIpLocation,
          value: `${ip.city} / ${ip.country}`,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "server",
        });
        upsert({
          id: "browserIpOrg",
          label: text.signalLabels.browserIpOrg,
          value: `${ip.org} / ${ip.isp}`,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "server",
        });
        const tzMatch = sameTimezone(ip.timezone, snapshot.timezone);
        upsert({
          id: "ipTimezone",
          label: t.envIpTz,
          value:
            tzMatch === false
              ? `${t.envTzMismatch} ${ip.timezone}`
              : `${ip.timezone}${tzMatch ? ` · ${t.envTzOk}` : ""}`,
          score: tzMatch === false ? 0.6 : 0,
          weight: 0,
          contribution: 0,
          source: "server",
        });
        await sleep(220);
        const kind = classifyExit(ip.org, ip.isp);
        upsert({
          id: "ipType",
          label: t.envIpType,
          value: kind === "datacenter" ? t.envTypeDc : kind === "carrier" ? t.envTypeHome : t.envTypeUnknown,
          score: kind === "datacenter" ? 0.4 : 0,
          weight: 0,
          contribution: 0,
          source: "server",
        });
        await sleep(180);
      }

      if (webrtc) {
        const match = ip && webrtc.publicAddresses.length
          ? webrtc.publicAddresses.some((addr) => addr === ip.ip)
          : null;
        upsert({
          id: "proxyCountry",
          label: t.envWebRtc,
          value:
            webrtc.status !== "ok"
              ? t.envWebRtcOff
              : `${webrtc.publicAddresses.join(" / ") || "—"} · ${t.envStun} ${webrtc.stun.replace("stun:", "")}${
                  match === true ? ` · ${t.envWebRtcMatch}` : match === false ? ` · ${t.envWebRtcDiff}` : ""
                }`,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "combined",
        });
        await sleep(180);
      }

      upsert({
        id: "ipv6",
        label: t.envIpv6,
        value: ipv6 || t.envIpv6None,
        score: 0,
        weight: 0,
        contribution: 0,
        source: "server",
      });
      await sleep(180);
      upsert({
        id: "ua",
        label: t.envUa,
        value: extras.webdriver ? `${extras.ua} · ${t.envWebdriver}` : extras.ua,
        score: extras.webdriver ? 0.3 : 0,
        weight: 0,
        contribution: 0,
        source: "browser",
      });
      await sleep(160);
      upsert({
        id: "deviceMeta",
        label: t.envScreen,
        value: `${extras.screen} · ${extras.cores} ${t.envCores}`,
        score: 0,
        weight: 0,
        contribution: 0,
        source: "browser",
      });

      setProgress(100);
      const countrySignal = extraSignals.find((signal) => signal.id === "country") ?? null;
      const score = Math.min(100, signalsScore(browser.signals, countrySignal ? [countrySignal] : []));
      const statusKey = accessStatus(score);
      const regionKey = access.matchedRegion as Exclude<RegionCode, "auto"> | null;
      const confidence =
        score === 0
          ? `${text.confidence.safe} ${text.confidence.supportedRegion}`
          : score >= 70
            ? `${text.confidence.high} ${text.confidence.highRiskRegion}`
            : score >= 40
              ? `${text.confidence.medium} ${text.confidence.highRiskRegion}`
              : `${text.confidence.low} ${text.confidence.highRiskRegion}`;
      setReport({
        score,
        status: text.status[statusKey] ?? statusKey,
        statusKey,
        confidence,
        matchedRegion: regionKey ? text.regions[regionKey] : null,
        signals: [...(countrySignal ? [countrySignal] : []), ...browser.signals, ...extraSignals.filter((s) => s.id !== "country")],
        ip,
        nodes,
        webrtc,
        ipv6,
      });
      setLive(null);
    } catch {
      setError(t.envFail);
    } finally {
      setRunning(false);
      setActive(-1);
    }
  }

  const ready = Boolean(report) && !running;
  const liveScore = live
    ? Math.min(
        100,
        live.reduce((sum, signal) => sum + (signal.contribution || 0), 0),
      )
    : 0;
  const score = ready ? report!.score : running ? liveScore : 0;
  const meaning =
    !ready
      ? t.envIdle
      : score >= 70
        ? t.envMeaningHigh
        : score >= 31
          ? t.envMeaningMid
          : score > 0
            ? t.envMeaningLow
            : t.envMeaningZero;
  const cards = ready ? report!.signals : live ?? pending;
  const ringPct = ready || running ? Math.max(0, Math.min(100, score)) : 0;
  const exitKind = report?.ip ? classifyExit(report.ip.org, report.ip.isp) : "unknown";

  return (
    <div className="term-page">
      <header className="page-head">
        <p className="kicker">CheckCC</p>
        <h1 className="page-title">{t.envTitle}</h1>
        <p className="lede">{t.envLede}</p>
      </header>

      <ol className="feat-grid">
        <li>
          <b>{t.envHow1Title}</b>
          <span>{t.envHow1}</span>
        </li>
        <li>
          <b>{t.envHow2Title}</b>
          <span>{t.envHow2}</span>
        </li>
        <li>
          <b>{t.envHow3Title}</b>
          <span>{t.envHow3}</span>
        </li>
      </ol>

      <div className="env-scan">
        <button className="cta is-blue" type="button" onClick={() => void run()} disabled={running}>
          {running ? t.envRunning : t.envRun}
        </button>
        {running ? (
          <div className="env-progress" aria-hidden>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
      {error ? <p className="small">{error}</p> : null}

      <section className="env-board">
        <div className="env-verdict">
          <EnvGauge
            score={score}
            ringPct={ringPct}
            ready={ready}
            running={running}
            caption={ready ? t.envScore : running ? t.envChecking : t.envWait}
            ariaLabel={`${ready || running ? score : "0"} ${t.envScore}`}
          />
          <span className={`env-badge ${badgeClass(score, ready)}`}>
            {ready ? report!.confidence : running ? t.envChecking : t.envWait}
          </span>
          <p>
            {ready
              ? `${report!.status}${report!.matchedRegion ? ` · ${t.envRegion} ${report!.matchedRegion}` : ""}`
              : t.envIdle}
          </p>
        </div>

        <div>
          {report?.ip ? (
            <div className="env-ip">
              <div>
                <span>IP</span>
                <b>
                  {report.ip.ip} · {report.ip.type}
                </b>
              </div>
              <div>
                <span>{t.envIp}</span>
                <b>{report.ip.country}</b>
              </div>
              <div>
                <span>{t.envCity}</span>
                <b>{report.ip.city}</b>
              </div>
              <div>
                <span>ASN</span>
                <b>{report.ip.asn}</b>
              </div>
              <div>
                <span>{t.envOrg}</span>
                <b>{report.ip.org}</b>
              </div>
              <div>
                <span>{t.envIsp}</span>
                <b>{report.ip.isp}</b>
              </div>
              <div>
                <span>{t.envIpTz}</span>
                <b>{report.ip.timezone}</b>
              </div>
              <div>
                <span>{t.envIpType}</span>
                <b>{exitKind === "datacenter" ? t.envTypeDc : exitKind === "carrier" ? t.envTypeHome : t.envTypeUnknown}</b>
              </div>
              <div>
                <span>{t.envLat}</span>
                <b>{report.ip.lat}</b>
              </div>
              <div>
                <span>{t.envProvider}</span>
                <b>{report.ip.provider}</b>
              </div>
            </div>
          ) : ready ? (
            <p className="small">{t.envIpFail}</p>
          ) : null}

          {ready && report?.nodes.length ? (
            <table className="env-nodes">
              <caption>{t.envNodes}</caption>
              <thead>
                <tr>
                  <th>{t.envNodeName}</th>
                  <th>{t.nodesStatus}</th>
                  <th>{t.nodesMs}</th>
                </tr>
              </thead>
              <tbody>
                {report.nodes.map((node) => (
                  <tr key={node.id}>
                    <td>
                      <b>{node.name}</b>
                    </td>
                    <td className={node.status === "reachable" ? "is-ok" : "is-fail"}>
                      {node.status === "reachable" ? t.nodesOk : t.nodesFail}
                    </td>
                    <td>{node.ms != null ? `${node.ms} ms` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <div className="env-signals">
            {cards.map((signal, index) => {
              const runningCard = running && index === active;
              const hit = ready && signal.contribution > 0;
              const ok = ready && signal.contribution === 0;
              return (
                <article
                  key={signal.id}
                  className={`env-card ${runningCard ? "is-run" : hit ? "is-hit" : ok ? "is-ok" : ""}`}
                >
                  <header>
                    <b>{signal.label}</b>
                    <em>
                      {ready
                        ? `${hit ? t.envHit : t.envClear} ${signal.contribution}/${signal.weight}`
                        : runningCard
                          ? t.envChecking
                          : "--"}
                    </em>
                  </header>
                  <p>{signal.value || text.pending}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="env-meaning">
        <h2>{t.envMeaningTitle}</h2>
        <p>{meaning}</p>
        {ready && exitKind === "datacenter" ? <p>{t.envHosting}</p> : null}
        <p>{t.envNotBan}</p>
      </section>

      <p className="block-links">
        <a href={SITE} target="_blank" rel="noreferrer">
          {t.envOpenSite} <ArrowUpRight size={14} />
        </a>
        <a href={REPO} target="_blank" rel="noreferrer">
          GitHub <ArrowUpRight size={14} />
        </a>
      </p>
      <p className="small">{t.envDisclaimer}</p>
      <p className="credit">
        {t.envCredit}{" "}
        <a href={REPO} target="_blank" rel="noreferrer">
          {REPO}
        </a>
        . {t.envCreditSite}{" "}
        <a href={SITE} target="_blank" rel="noreferrer">
          checkcc.org
        </a>
        .
      </p>
    </div>
  );
}
