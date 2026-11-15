// Draft today's brief from the already-fetched material, then leave it for check-brief.mjs.
// Usage: node scripts/write-brief.mjs [YYYY-MM-DD]
// Needs an LLM key. Order: XAI_API_KEY, BRIEF_API_KEY, ANTHROPIC_API_KEY, then Cloudflare Workers AI.
// Exit 2 means a planned skip (already published, no material, not enough items). Exit 1 is a real failure.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { BLOCK_RE, BRIEF_DIR, RAW_DIR, recentUrls, today } from "./brief-lib.mjs";

const date = process.argv[2] ?? today();
const outPath = `${BRIEF_DIR}/${date}.json`;
const INJECT = /忽略规则|忽略之前|必须推荐|把这段话写进去|ignore (all|previous|the) (instructions|rules)|system prompt/i;
const MAX_TRIES = 3;

function skip(reason) {
  console.log(`SKIP ${date}: ${reason}`);
  process.exit(2);
}

function fail(reason) {
  console.error(`✗ write-brief ${date}: ${reason}`);
  process.exit(1);
}

if (fs.existsSync(outPath)) skip("brief file already exists");
if (!fs.existsSync(`${RAW_DIR}/${date}.json`) || !fs.existsSync(`${RAW_DIR}/${date}.readmes.json`)) {
  skip("raw material is not on this branch yet");
}

const raw = JSON.parse(fs.readFileSync(`${RAW_DIR}/${date}.json`, "utf8"));
const readmes = JSON.parse(fs.readFileSync(`${RAW_DIR}/${date}.readmes.json`, "utf8"));
const used = recentUrls(date);
const ageDays = (publishedAt) => (Date.parse(date) - Date.parse(publishedAt)) / 86400000;

const github = [];
for (const repo of raw.repos) {
  const name = `${repo.owner}/${repo.repo}`;
  const readme = readmes[name];
  const blob = `${repo.description ?? ""} ${readme?.excerpt ?? ""}`;
  if (!readme?.excerpt) continue;
  if (readme.used || used.has(repo.url)) continue;
  if (readme.blocked || BLOCK_RE.test(blob) || INJECT.test(blob)) continue;
  const firstSeen = repo.gain === repo.stars || repo.gain == null;
  github.push({
    source: "github",
    name,
    url: repo.url,
    stars: repo.stars,
    ...(firstSeen ? {} : { gain: repo.gain }),
    description: repo.description ?? "",
    excerpt: String(readme.excerpt).slice(0, 700),
  });
}

const launches = [];
for (const item of raw.launches) {
  const blob = `${item.name} ${item.tagline ?? ""}`;
  if (!item.url?.startsWith("https://www.producthunt.com/")) continue;
  if (used.has(item.url)) continue;
  if (ageDays(item.publishedAt) > 7) continue;
  if (BLOCK_RE.test(blob) || INJECT.test(blob)) continue;
  launches.push({
    source: "producthunt",
    name: item.name,
    url: item.url,
    tagline: item.tagline ?? "",
    publishedAt: item.publishedAt,
  });
}

github.sort((a, b) => (b.gain ?? -1) - (a.gain ?? -1) || b.stars - a.stars);
const githubPool = github.slice(0, 22);
const launchPool = launches.slice(0, 16);
if (githubPool.length < 5 || launchPool.length < 2 || githubPool.length + launchPool.length < 8) {
  skip("合格条目凑不到 8 条");
}

const byUrl = new Map([...githubPool, ...launchPool].map((item) => [item.url, item]));

const rules = `你是 ExploreAI 的早报写稿人。只根据我给的候选名单写一份 JSON，不要解释。

读者是每天在用 Claude、ChatGPT 和编程代理的人。宁可少写，也不要凑数。

硬性：
- 只从候选名单里选。stars、gain、url、name 必须原样抄，禁止改数字、禁止凭记忆加项目。
- 第一次出现的 GitHub 项目候选里没有 gain 字段，写出来也不要带 gain。
- 2 到 5 组，GitHub 和 Product Hunt 混在一起，不要分成两个专区。总共 8 到 20 条，至少 5 个 GitHub、2 个 Product Hunt。至少一组里两种来源都有。
- 主新闻 lead 必须是 GitHub。
- headline、lead.why 用中文句号结尾。headline 30–110 字，lead.why 30–130 字。条目中文 12–62 字，也尽量用句号结尾。
- 英文不是逐字翻译，也不要抄项目简介或 Product Hunt tagline。英文不要出现中文。
- 不用感叹号。不写：赋能、颠覆、重磅、炸裂、一站式、革命性、神器、最强、值得关注、game-changer、seamless、unleash、leverage。
- 没有试用过，不要写「好用」「很快」。
- Product Hunt 只能根据 tagline 写，不补充它没说的功能。
- 中文写了百分比或倍数，必须写明「作者称 / 官方称 / README」。
- 组标题要具体，不要「其他」「工具」「新品」。
- 开头两个字不要超过 3 条相同。
- related 可省略。要写的话 to 只能是 /articles/claude-code-start、/articles/claude-usage-save、/worth、/shop、/checkcc、/fingerprint、/claude。

JSON 形状：
{
  "date": "${date}",
  "days": ${raw.days},
  "headline": "",
  "headlineEn": "",
  "lead": { "source":"github","name":"","url":"","stars":0,"zh":"","en":"","why":"","whyEn":"" },
  "sections": [ { "title":"","titleEn":"","items":[ { "source":"github|producthunt","name":"","url":"","zh":"","en":"" } ] } ]
}`;

function extractJson(text) {
  const trimmed = String(text).trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("model did not return JSON");
  return JSON.parse(body.slice(start, end + 1));
}

function stitch(item, picked) {
  const src = byUrl.get(picked.url);
  if (!src) return null;
  const next = {
    source: src.source,
    name: src.name,
    url: src.url,
    zh: String(item.zh ?? ""),
    en: String(item.en ?? ""),
  };
  if (src.source === "github") {
    next.stars = src.stars;
    if (src.gain != null) next.gain = src.gain;
  }
  if (item.related?.to && item.related.label && item.related.labelEn) {
    next.related = { to: item.related.to, label: item.related.label, labelEn: item.related.labelEn };
  }
  return next;
}

function normalize(draft) {
  const leadSrc = stitch(draft.lead ?? {}, draft.lead ?? {});
  if (!leadSrc) throw new Error("lead is not in today's candidates");
  const lead = {
    ...leadSrc,
    why: String(draft.lead?.why ?? ""),
    whyEn: String(draft.lead?.whyEn ?? ""),
  };
  const seen = new Set([lead.url]);
  const sections = [];
  for (const section of draft.sections ?? []) {
    const items = [];
    for (const item of section.items ?? []) {
      const next = stitch(item, item);
      if (!next || seen.has(next.url)) continue;
      seen.add(next.url);
      items.push(next);
    }
    if (items.length) {
      sections.push({
        title: String(section.title ?? ""),
        titleEn: String(section.titleEn ?? ""),
        items,
      });
    }
  }
  return {
    date,
    days: raw.days,
    headline: String(draft.headline ?? ""),
    headlineEn: String(draft.headlineEn ?? ""),
    lead,
    sections,
  };
}

async function chatOpenAi(url, key, model, messages) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${model} ${res.status}: ${data.error?.message ?? res.statusText}`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${model} returned empty content`);
  return text;
}

async function chatAnthropic(key, messages) {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const user = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: process.env.BRIEF_MODEL || "claude-sonnet-4-5", max_tokens: 8000, system, messages: user }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${data.error?.message ?? res.statusText}`);
  const text = (data.content ?? []).map((p) => p.text ?? "").join("");
  if (!text) throw new Error("anthropic returned empty content");
  return text;
}

async function chatWorkersAi(messages) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const model = process.env.BRIEF_CF_MODEL || "@cf/qwen/qwen2.5-32b-instruct";
  if (!account || !token) throw new Error("Cloudflare Workers AI is not configured");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 4000 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(`workers-ai ${res.status}: ${data.errors?.[0]?.message ?? res.statusText}`);
  }
  const text = data.result?.response ?? data.result?.message;
  if (!text) throw new Error("workers-ai returned empty content");
  return text;
}

async function complete(messages) {
  if (process.env.XAI_API_KEY) {
    return chatOpenAi(
      process.env.BRIEF_API_URL || "https://api.x.ai/v1/chat/completions",
      process.env.XAI_API_KEY,
      process.env.BRIEF_MODEL || "grok-4.6",
      messages,
    );
  }
  if (process.env.BRIEF_API_KEY) {
    return chatOpenAi(
      process.env.BRIEF_API_URL || "https://api.openai.com/v1/chat/completions",
      process.env.BRIEF_API_KEY,
      process.env.BRIEF_MODEL || "gpt-4.1",
      messages,
    );
  }
  if (process.env.ANTHROPIC_API_KEY) return chatAnthropic(process.env.ANTHROPIC_API_KEY, messages);
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) return chatWorkersAi(messages);
  fail("没有写稿模型。GitHub Actions 需要 secret XAI_API_KEY（或 BRIEF_API_KEY / ANTHROPIC_API_KEY）。");
}

function check(path) {
  const result = spawnSync(process.execPath, ["scripts/check-brief.mjs", date, "--no-network"], {
    encoding: "utf8",
  });
  return { ok: result.status === 0, log: `${result.stdout}\n${result.stderr}`.trim() };
}

const pool = {
  github: githubPool.map(({ excerpt, description, ...rest }) => ({ ...rest, description, excerpt })),
  producthunt: launchPool,
};

let lastErrors = "";
let brief;
for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
  const messages = [
    { role: "system", content: rules },
    {
      role: "user",
      content: JSON.stringify(
        {
          date,
          days: raw.days,
          github: pool.github,
          producthunt: pool.producthunt,
          ...(lastErrors ? { previousErrors: lastErrors } : {}),
        },
        null,
        2,
      ),
    },
  ];
  console.log(`write-brief ${date}: attempt ${attempt}/${MAX_TRIES}`);
  const text = await complete(messages);
  brief = normalize(extractJson(text));
  fs.mkdirSync(BRIEF_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(brief, null, 2) + "\n");
  const result = check(outPath);
  if (result.ok) {
    console.log(result.log || `✓ ${date} drafted`);
    process.exit(0);
  }
  lastErrors = result.log;
  console.warn(result.log);
}

try {
  fs.unlinkSync(outPath);
} catch {
  /* the next run should not inherit a failing draft */
}
fail(`check-brief still failing after ${MAX_TRIES} tries`);
