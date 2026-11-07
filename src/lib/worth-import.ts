import { API_MODELS } from "../data/api-models";
import { plans } from "../data/plans";
import type { Family } from "../data/types";

/** Everything is read in the browser with FileReader / pdf.js; nothing is uploaded. */

export type ImportSource = "csv" | "json" | "text" | "pdf";

export type ImportResult = {
  source: ImportSource;
  family?: Family;
  planId?: string;
  modelId?: string;
  spendUsd?: number;
  spendCny?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  requests?: number;
  dateFrom?: string;
  dateTo?: string;
  rows?: number;
  /** Raw names seen in the file, shown so the user can judge the guess. */
  seenModel?: string;
  seenPlan?: string;
};

export type ImportFailure = { error: "zip" | "image" | "encrypted" | "empty" | "unreadable" };

export type ImportOutcome = ImportResult | ImportFailure;

export function isFailure(x: ImportOutcome): x is ImportFailure {
  return "error" in x;
}

export function hasFindings(r: ImportResult) {
  return Boolean(
    r.family || r.planId || r.modelId || r.spendUsd || r.spendCny || r.inputTokens ||
      r.outputTokens || r.totalTokens || r.requests,
  );
}

const MAX_BYTES = 12 * 1024 * 1024;

export async function readImportFile(file: File): Promise<ImportOutcome> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_BYTES) return { error: "unreadable" };
  if (/\.(png|jpe?g|webp|heic|gif|bmp)$/.test(name) || file.type.startsWith("image/")) {
    return { error: "image" };
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (/\.zip$/.test(name) || (head[0] === 0x50 && head[1] === 0x4b)) return { error: "zip" };
  const isPdf =
    /\.pdf$/.test(name) || String.fromCharCode(...head.slice(0, 5)) === "%PDF-";
  if (isPdf) return readPdf(file);
  const text = await file.text();
  return parseImportText(text, name);
}

async function readPdf(file: File): Promise<ImportOutcome> {
  try {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    const text = parts.join("\n").trim();
    if (!text) return { error: "empty" };
    const result = parseText(text);
    return { ...result, source: "pdf" };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name} ${err.message}` : "";
    if (/password|encrypt/i.test(msg)) return { error: "encrypted" };
    return { error: "unreadable" };
  }
}

export function parseImportText(raw: string, name = ""): ImportOutcome {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return { error: "empty" };
  if (/\.json$/.test(name) || /^[[{]/.test(text)) {
    try {
      return parseJson(JSON.parse(text));
    } catch {
      /* not JSON after all, fall through */
    }
  }
  if (/\.(csv|tsv)$/.test(name) || looksLikeCsv(text)) {
    const csv = parseCsv(text);
    if (csv) return csv;
  }
  return parseText(text);
}

/* ---------- model / plan matching ---------- */

const MODEL_RULES: [RegExp, string][] = [
  [/fable/i, "fable-5.1"],
  [/opus/i, "opus-5.5"],
  [/haiku/i, "haiku-5.5"],
  [/sonnet/i, "sonnet-5.5"],
  [/gpt-?6\.1|6\.1[\s-]*sol/i, "gpt-6.1-sol"],
  [/astra/i, "gpt-6-astra"],
  [/luna/i, "gpt-6-luna"],
  [/gpt-?6(?!\.)|6[\s-]sol/i, "gpt-6-sol"],
  [/gpt-?5\.6/i, "gpt-5.6-sol"],
  [/gpt-?4\.1/i, "gpt-4.1"],
  [/argon|gemini-?4/i, "gemini-4-argon"],
  [/gemini-?3\.1-?pro/i, "gemini-3.1-pro"],
  [/gemini-?3\.[5-9]-?flash-?lite/i, "gemini-3.5-flash-lite"],
  [/gemini-?3\.[6-8]-?flash/i, "gemini-3.8-flash"],
];

export function matchModel(name: string) {
  for (const [re, id] of MODEL_RULES) if (re.test(name)) return id;
  return undefined;
}

function familyOfModel(id: string | undefined) {
  return id ? API_MODELS.find((m) => m.id === id)?.family : undefined;
}

type PlanRule = { re: RegExp; family: Family; planId?: string };

const PLAN_RULES: PlanRule[] = [
  { re: /claude\s*(ultra|max\s*20)/i, family: "claude", planId: "claude-ultra" },
  { re: /claude\s*(max)\b/i, family: "claude", planId: "claude-max" },
  { re: /claude\s*pro\b/i, family: "claude", planId: "claude-pro" },
  { re: /chatgpt\s*plus\b/i, family: "gpt", planId: "chatgpt-plus" },
  { re: /(?:chatgpt|gpt)\s*pro\s*\(?\$?500/i, family: "gpt", planId: "chatgpt-pro-500" },
  { re: /(?:chatgpt|gpt)\s*pro\s*\(?\$?200/i, family: "gpt", planId: "chatgpt-pro-200" },
  { re: /(?:chatgpt|gpt)\s*pro\s*\(?\$?100/i, family: "gpt", planId: "chatgpt-pro-100" },
  { re: /chatgpt\s*pro\b|gpt\s*pro\b/i, family: "gpt" },
  { re: /chatgpt\s*go\b/i, family: "gpt", planId: "chatgpt-go" },
  { re: /cursor\s*plus\b/i, family: "cursor", planId: "cursor-plus" },
  { re: /cursor\s*premium\b/i, family: "cursor", planId: "cursor-premium" },
  { re: /cursor\s*super\b/i, family: "cursor", planId: "cursor-super" },
  { re: /cursor\s*ultra\b/i, family: "cursor", planId: "cursor-ultra" },
  { re: /cursor\s*pro\b/i, family: "cursor" },
  { re: /copilot\s*pro\s*\+|copilot\s*pro\s*plus/i, family: "copilot", planId: "copilot-pro-plus" },
  { re: /copilot\s*max\b/i, family: "copilot", planId: "copilot-max" },
  { re: /copilot\s*pro\b/i, family: "copilot", planId: "copilot-pro" },
  { re: /google\s*ai\s*ultra\s*20/i, family: "gemini", planId: "gemini-ai-ultra-20x" },
  { re: /google\s*ai\s*ultra/i, family: "gemini", planId: "gemini-ai-ultra-5x" },
  { re: /google\s*ai\s*pro|gemini\s*(advanced|pro)\b/i, family: "gemini", planId: "gemini-ai-pro" },
  { re: /google\s*ai\s*plus/i, family: "gemini", planId: "gemini-ai-plus" },
  { re: /perplexity\s*pro/i, family: "perplexity", planId: "perplexity-pro" },
  { re: /midjourney\s*(basic)/i, family: "midjourney", planId: "midjourney-basic" },
  { re: /midjourney\s*(standard)/i, family: "midjourney", planId: "midjourney-standard" },
  { re: /midjourney\s*(mega)/i, family: "midjourney", planId: "midjourney-mega" },
  { re: /midjourney\s*(pro)/i, family: "midjourney", planId: "midjourney-pro" },
  { re: /runway\s*(standard)/i, family: "runway", planId: "runway-standard" },
  { re: /runway\s*(pro)/i, family: "runway", planId: "runway-pro" },
  { re: /runway\s*(max|unlimited)/i, family: "runway", planId: "runway-max" },
  { re: /elevenlabs\s*(starter)/i, family: "elevenlabs", planId: "eleven-starter" },
  { re: /elevenlabs\s*(creator)/i, family: "elevenlabs", planId: "eleven-creator" },
  { re: /elevenlabs\s*(pro)/i, family: "elevenlabs", planId: "eleven-pro" },
];

const FAMILY_WORDS: [RegExp, Family][] = [
  [/anthropic|claude/i, "claude"],
  [/openai|chatgpt|codex/i, "gpt"],
  [/cursor/i, "cursor"],
  [/gemini|google\s*ai|google\s*one/i, "gemini"],
  [/copilot/i, "copilot"],
  [/perplexity/i, "perplexity"],
  [/midjourney/i, "midjourney"],
  [/runway/i, "runway"],
  [/elevenlabs|eleven\s*labs/i, "elevenlabs"],
];

function matchPlan(text: string) {
  for (const rule of PLAN_RULES) {
    const m = text.match(rule.re);
    if (m) return { ...rule, seen: m[0].replace(/\s+/g, " ").trim() };
  }
  return null;
}

function matchFamily(text: string) {
  for (const [re, family] of FAMILY_WORDS) if (re.test(text)) return family;
  return undefined;
}

/* ---------- numbers ---------- */

function num(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw !== "string") return 0;
  const cleaned = raw.replace(/[$,¥￥\s]|USD|CNY|RMB/gi, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** "1.2M" / "350K" / "12万" / "3 百万" → absolute count. */
function scaled(value: string, unit: string | undefined) {
  const n = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  switch ((unit ?? "").toLowerCase()) {
    case "k":
    case "千":
      return n * 1e3;
    case "万":
      return n * 1e4;
    case "m":
    case "百万":
    case "mtok":
      return n * 1e6;
    case "b":
    case "十亿":
      return n * 1e9;
    case "亿":
      return n * 1e8;
    default:
      return n;
  }
}

function isoDate(raw: string) {
  const m = raw.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!m) return undefined;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function spanOf(dates: string[]) {
  const sorted = dates.filter(Boolean).sort();
  return sorted.length ? { dateFrom: sorted[0], dateTo: sorted[sorted.length - 1] } : {};
}

/* ---------- CSV ---------- */

function looksLikeCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 4);
  if (lines.length < 2) return false;
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const cols = lines[0].split(sep).length;
  return cols >= 2 && lines.every((l) => Math.abs(l.split(sep).length - cols) <= 1);
}

function splitCsv(text: string): string[][] {
  const sep = text.split(/\r?\n/, 1)[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const COL = {
  input: /^(input|prompt|n_context)(_tokens?)?(_total)?$|^uncached_input_tokens$|^input tokens$/,
  cachedInput: /^(cache_read|cached|input_cached|cache_creation)(_input)?_tokens$|^ephemeral_\w+_input_tokens$/,
  output: /^(output|completion|n_generated)(_tokens?)?(_total)?$|^output tokens$/,
  total: /^(n_tokens|tokens|total_tokens|token_count|usage_tokens)$/,
  cost: /^(cost|cost_usd|amount|amount_usd|usd|total_cost|price|spend|line_item_cost)$/,
  model: /^(model|model_name|snapshot_id|model_id|line_item)$/,
  date: /^(date|day|timestamp|start_time|starting_at|usage_date|usage_date_utc|created_at|period_start|bucket_start)$/,
  requests: /^(requests|n_requests|num_model_requests|request_count|num_requests)$/,
  tokenType: /^(token_type|usage_type|type|line_item)$/,
  unit: /^(quantity_unit|unit)$/,
  count: /^(usage|usage_count|count|quantity|value)$/,
};

function parseCsv(text: string): ImportResult | null {
  const rows = splitCsv(text);
  if (rows.length < 2) return null;
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/^"|"$/g, ""));
  const find = (re: RegExp) => header.findIndex((h) => re.test(h) || re.test(h.replace(/_/g, " ")));
  const idx = {
    input: find(COL.input),
    cachedInput: find(COL.cachedInput),
    output: find(COL.output),
    total: find(COL.total),
    cost: find(COL.cost),
    model: find(COL.model),
    date: find(COL.date),
    requests: find(COL.requests),
    tokenType: find(COL.tokenType),
    count: find(COL.count),
    unit: find(COL.unit),
  };
  const known = Object.values(idx).filter((i) => i >= 0).length;
  if (known === 0) return null;

  let input = 0;
  let output = 0;
  let total = 0;
  let cost = 0;
  let requests = 0;
  const dates: string[] = [];
  const modelWeight = new Map<string, number>();
  const body = rows.slice(1);

  for (const r of body) {
    let rowTokens = 0;
    if (idx.tokenType >= 0 && idx.count >= 0 && idx.input < 0 && idx.output < 0) {
      // Long format (one row per token type), as in some console exports.
      const kind = (r[idx.tokenType] ?? "").toLowerCase();
      const unit = idx.unit >= 0 ? (r[idx.unit] ?? "").toLowerCase() : "token";
      const n = /token/.test(unit) ? num(r[idx.count]) : 0;
      if (/output|completion/.test(kind)) output += n;
      else if (/input|prompt|cache/.test(kind)) input += n;
      rowTokens = n;
    } else {
      const i = idx.input >= 0 ? num(r[idx.input]) : 0;
      const c = idx.cachedInput >= 0 ? num(r[idx.cachedInput]) : 0;
      const o = idx.output >= 0 ? num(r[idx.output]) : 0;
      input += i + c;
      output += o;
      const t = idx.total >= 0 ? num(r[idx.total]) : 0;
      total += t;
      rowTokens = i + c + o || t;
    }
    if (idx.cost >= 0) cost += num(r[idx.cost]);
    if (idx.requests >= 0) requests += num(r[idx.requests]);
    if (idx.date >= 0) {
      const d = isoDate(r[idx.date] ?? "");
      if (d) dates.push(d);
    }
    if (idx.model >= 0) {
      const name = (r[idx.model] ?? "").trim();
      if (name) modelWeight.set(name, (modelWeight.get(name) ?? 0) + (rowTokens || 1));
    }
  }

  const topModel = [...modelWeight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const modelId = topModel ? matchModel(topModel) : undefined;
  const tokenSum = input + output;
  const result: ImportResult = {
    source: "csv",
    rows: body.length,
    modelId,
    seenModel: topModel,
    family: familyOfModel(modelId) ?? (topModel ? matchFamily(topModel) : undefined),
    inputTokens: input || undefined,
    outputTokens: output || undefined,
    totalTokens: tokenSum || total || undefined,
    spendUsd: cost > 0 ? round2(cost) : undefined,
    requests: requests || undefined,
    ...spanOf(dates),
  };
  return result;
}

/* ---------- JSON ---------- */

function parseJson(data: unknown): ImportResult {
  let input = 0;
  let output = 0;
  let total = 0;
  let cost = 0;
  let requests = 0;
  const dates: string[] = [];
  const models = new Map<string, number>();
  const strings: string[] = [];

  const walk = (node: unknown, depth: number) => {
    if (depth > 12 || node == null) return;
    if (Array.isArray(node)) {
      for (const item of node.slice(0, 50000)) walk(item, depth + 1);
      return;
    }
    if (typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const keys = Object.keys(obj);
    const hasSplit = keys.some((k) => COL.input.test(k.toLowerCase()) || COL.output.test(k.toLowerCase()));
    let localTokens = 0;
    for (const key of keys) {
      const k = key.toLowerCase();
      const v = obj[key];
      if (typeof v === "number" || (typeof v === "string" && /^\d[\d.,]*$/.test(v))) {
        const n = num(v);
        if (COL.input.test(k) || COL.cachedInput.test(k)) {
          input += n;
          localTokens += n;
        } else if (COL.output.test(k)) {
          output += n;
          localTokens += n;
        } else if (COL.total.test(k) && !hasSplit) {
          total += n;
          localTokens += n;
        } else if (COL.requests.test(k)) requests += n;
        else if (/^(cost|cost_usd|amount_usd|total_cost|amount_due|amount_paid|total)$/.test(k) && typeof v === "number") {
          // Stripe-style invoices store cents.
          cost += /amount_due|amount_paid/.test(k) || (k === "total" && "currency" in obj) ? n / 100 : n;
        } else if (/^(start_time|end_time|created|period_start|period_end)$/.test(k) && n > 1e9) {
          dates.push(new Date((n > 1e12 ? n : n * 1000)).toISOString().slice(0, 10));
        }
      } else if (typeof v === "string") {
        if (COL.model.test(k)) models.set(v, (models.get(v) ?? 0) + 1);
        else if (COL.date.test(k)) {
          const d = isoDate(v);
          if (d) dates.push(d);
        } else if (v.length < 200) strings.push(v);
      } else if (k === "amount" && v && typeof v === "object" && "value" in (v as object)) {
        cost += num((v as { value: unknown }).value);
      } else {
        walk(v, depth + 1);
      }
    }
    if (localTokens) {
      const model = typeof obj.model === "string" ? obj.model : undefined;
      if (model) models.set(model, (models.get(model) ?? 0) + localTokens);
    }
  };
  walk(data, 0);

  const topModel = [...models.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const modelId = topModel ? matchModel(topModel) : undefined;
  const textual = parseText(strings.join("\n"));
  return {
    ...textual,
    source: "json",
    modelId: modelId ?? textual.modelId,
    seenModel: topModel ?? textual.seenModel,
    family: familyOfModel(modelId) ?? textual.family ?? (topModel ? matchFamily(topModel) : undefined),
    inputTokens: input || undefined,
    outputTokens: output || undefined,
    totalTokens: input + output || total || undefined,
    spendUsd: cost > 0 ? round2(cost) : textual.spendUsd,
    requests: requests || undefined,
    ...spanOf(dates),
  };
}

/* ---------- free text ---------- */

function parseText(text: string): ImportResult {
  const plan = matchPlan(text);
  const modelHit = MODEL_RULES.find(([re]) => re.test(text));
  const modelId = modelHit?.[1];
  const seenModel = modelHit ? text.match(modelHit[0])?.[0] : undefined;

  const usd = [...text.matchAll(/(?:US\s?\$|\$|USD\s?)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s?(?:USD|美元|美金|刀)/gi)]
    .map((m) => num(m[1] ?? m[2]))
    .filter((n) => n > 0 && n < 100000);
  const cny = [...text.matchAll(/(?:[¥￥]|CNY\s?|RMB\s?)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s?(?:元|块|CNY|RMB|人民币)/gi)]
    .map((m) => num(m[1] ?? m[2]))
    .filter((n) => n > 0 && n < 1000000);

  const tokenOf = (re: RegExp) => {
    const m = text.match(re);
    return m ? scaled(m[1], m[2]) : 0;
  };
  const amount = String.raw`(\d[\d,]*(?:\.\d+)?)\s*(k|m|b|千|万|百万|亿|mtok)?`;
  const input = tokenOf(new RegExp(String.raw`(?:input|prompt|输入)[^\d\n]{0,24}` + amount, "i"));
  const output = tokenOf(new RegExp(String.raw`(?:output|completion|输出)[^\d\n]{0,24}` + amount, "i"));
  const total =
    tokenOf(new RegExp(amount + String.raw`\s*tokens?`, "i")) ||
    tokenOf(new RegExp(String.raw`tokens?[^\d\n]{0,16}` + amount, "i"));
  const reqMatch = text.match(/(\d[\d,]*)\s*(?:requests?|次请求|次调用|calls?)/i);
  const dates = [...text.matchAll(/\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}/g)].map((m) => isoDate(m[0]) ?? "");

  // Plan names set the spend more reliably than the largest number on an invoice.
  const listed = plan?.planId ? plans.find((p) => p.id === plan.planId)?.priceUsd : undefined;
  const spendUsd = usd.length ? Math.max(...usd) : undefined;

  return {
    source: "text",
    family: plan?.family ?? familyOfModel(modelId) ?? matchFamily(text),
    planId: plan?.planId,
    seenPlan: plan?.seen,
    modelId,
    seenModel,
    spendUsd: spendUsd ?? (cny.length ? undefined : listed ?? undefined),
    spendCny: cny.length ? Math.max(...cny) : undefined,
    inputTokens: input || undefined,
    outputTokens: output || undefined,
    totalTokens: input + output || total || undefined,
    requests: reqMatch ? num(reqMatch[1]) : undefined,
    ...spanOf(dates),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
