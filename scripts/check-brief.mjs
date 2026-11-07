// Quality gate for the daily brief. An issue that fails here is not published.
// Usage: node scripts/check-brief.mjs [YYYY-MM-DD] [--no-network]
// Standards are explained in scripts/BRIEF-RULES.md.
import fs from "node:fs";
import { BLOCK_RE, BRIEF_DIR, RAW_DIR, recentUrls, today } from "./brief-lib.mjs";

const args = process.argv.slice(2);
const offline = args.includes("--no-network");
const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? today();

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

function load(path) {
  if (!fs.existsSync(path)) {
    console.error(`✗ ${path} is missing`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const brief = load(`${BRIEF_DIR}/${date}.json`);
const raw = load(`${RAW_DIR}/${date}.json`);
const readmes = load(`${RAW_DIR}/${date}.readmes.json`);

const CJK = /[一-鿿]/;
const HYPE_ZH = /赋能|颠覆|重磅|炸裂|一站式|革命性|震撼|王炸|封神|杀疯|遥遥领先|史上|最强|神器|黑科技|保姆级|必看|必备|全面升级|强势|干货|闭眼入|天花板|划时代|里程碑式|值得关注|不容错过/;
const HYPE_EN = /\b(game[- ]?chang\w*|revolution\w*|groundbreaking|cutting[- ]edge|supercharg\w*|unleash\w*|seamless\w*|blazing\w*|empower\w*|must[- ]have|next[- ]gen\w*|mind[- ]blowing|best[- ]in[- ]class|leverag\w*)\b/i;
const CLAIM = /\d+(\.\d+)?\s*(%|％|倍|×|x\b)/;
const ATTRIBUTED_ZH = /作者|官方|自称|自测|测得|称|README|宣称|发布方/;
const ATTRIBUTED_EN = /author|maker|team|claim|says|measured|according|official|faster|more|fewer/i;
const CATALOG = /^(https:\/\/github\.com\/|https:\/\/www\.producthunt\.com\/)/;

const articleIds = new Set(
  [...fs.readFileSync("src/data/articles.ts", "utf8").matchAll(/^\s+id: "([a-z0-9-]+)",?$/gm)].map((m) => m[1]),
);
const pages = /^\/(worth|shop|checkcc|fingerprint|claude|partners)(\b|$|\?)/;

function checkText(where, zh, en, zhRange, enMax) {
  if (typeof zh !== "string" || !CJK.test(zh)) return fail(where, "中文缺失");
  if (zh.length < zhRange[0] || zh.length > zhRange[1]) fail(where, `中文 ${zh.length} 字，应在 ${zhRange.join("–")}`);
  if (!/[。？]$/.test(zh) && zhRange[0] >= 30) fail(where, "中文要以句号结尾");
  if (/[!！]/.test(zh)) fail(where, "中文不用感叹号");
  const hypeZh = zh.match(HYPE_ZH);
  if (hypeZh) fail(where, `中文含空话「${hypeZh[0]}」`);
  if (typeof en !== "string" || en.length < 15) return fail(where, "英文缺失");
  if (CJK.test(en)) fail(where, "英文里有中文");
  if (en.length > enMax) fail(where, `英文 ${en.length} 字符，上限 ${enMax}`);
  if (/!/.test(en)) fail(where, "英文不用感叹号");
  const hypeEn = en.match(HYPE_EN);
  if (hypeEn) fail(where, `英文含空话「${hypeEn[0]}」`);
}

// Issue shape.
if (brief.date !== date) fail("date", `文件名是 ${date}，内容写的 ${brief.date}`);
if (brief.days !== raw.days) fail("days", `应为 ${raw.days}（素材是 ${raw.days} 天的增量）`);
checkText("headline", brief.headline, brief.headlineEn, [30, 110], 300);
if (!brief.lead) fail("lead", "没有主新闻");
checkText("lead.why", brief.lead?.why, brief.lead?.whyEn, [30, 130], 340);

const sections = brief.sections ?? [];
if (sections.length < 2 || sections.length > 5) fail("sections", `${sections.length} 组，应为 2–5 组`);
const all = [brief.lead, ...sections.flatMap((s) => s.items ?? [])];
if (all.length < 8 || all.length > 20) fail("issue", `共 ${all.length} 条，应为 8–20 条`);
const github = all.filter((i) => i.source === "github").length;
const launches = all.filter((i) => i.source === "producthunt").length;
if (github < 5) fail("issue", `GitHub 只有 ${github} 条，至少 5 条`);
if (launches < 2) fail("issue", `新品只有 ${launches} 条，至少 2 条`);
if (!sections.some((s) => new Set((s.items ?? []).map((i) => i.source)).size === 2)) {
  fail("issue", "GitHub 和新品要混在同一组，至少一组里两者都有");
}

for (const s of sections) {
  if (!s.title || !s.titleEn || CJK.test(s.titleEn)) fail(`section「${s.title}」`, "缺标题或英文标题");
  if (/^(其他|其它|杂项|更多|工具|新品)$/.test(s.title ?? "")) fail(`section「${s.title}」`, "标题太笼统，要说清这组讲什么");
  const n = (s.items ?? []).length;
  if (n < 2 || n > 8) fail(`section「${s.title}」`, `${n} 条，应为 2–8 条`);
}

// Items.
const repeats = recentUrls(date);
const seen = new Set();
const repos = new Map(raw.repos.map((r) => [r.url, r]));
const feed = new Map(raw.launches.map((l) => [l.url, l]));
for (const item of all) {
  const where = item.name ?? item.url ?? "item";
  if (!item.url || !CATALOG.test(item.url)) fail(where, "链接必须是 GitHub 或 Product Hunt");
  if (seen.has(item.url)) fail(where, "本期重复");
  seen.add(item.url);
  if (repeats.has(item.url)) fail(where, "最近 3 期已经写过");
  checkText(where, item.zh, item.en, [12, 62], 190);
  if (item.zh && CLAIM.test(item.zh) && !ATTRIBUTED_ZH.test(item.zh)) {
    fail(where, "中文写了百分比或倍数，要说明是谁说的（作者称 / 官方称）");
  }
  if (item.en && CLAIM.test(item.en) && !ATTRIBUTED_EN.test(item.en)) fail(where, "英文的数字要说明来源");

  if (item.source === "github") {
    const repo = repos.get(item.url);
    if (!repo) {
      fail(where, "不在今天的素材里，不能凭记忆写");
      continue;
    }
    const firstSeen = repo.gain === repo.stars || repo.gain == null;
    if (item.stars !== repo.stars) fail(where, `star 应为 ${repo.stars}，写的 ${item.stars}`);
    if (firstSeen ? item.gain != null : item.gain !== repo.gain) {
      fail(where, firstSeen ? "第一次观察到，不能写增量" : `增量应为 ${repo.gain}，写的 ${item.gain}`);
    }
    const name = `${repo.owner}/${repo.repo}`;
    if (item.name !== name) fail(where, `名字应为 ${name}`);
    const readme = readmes[name];
    if (!readme?.excerpt) fail(where, "没读到 README，不能写");
    if (readme?.blocked || BLOCK_RE.test(`${repo.description} ${readme?.excerpt ?? ""}`)) fail(where, "项目内容不适合本站，见 BRIEF-RULES.md");
    if (item.en?.trim() === repo.description.trim()) fail(where, "英文直接抄了项目简介");
  } else if (item.source === "producthunt") {
    const launch = feed.get(item.url);
    if (!launch) {
      fail(where, "不在今天的素材里");
      continue;
    }
    const age = (Date.parse(date) - Date.parse(launch.publishedAt)) / 86400000;
    if (age > 7) fail(where, `发布于 ${launch.publishedAt}，超过 7 天不算新品`);
    if (BLOCK_RE.test(`${launch.name} ${launch.tagline}`)) fail(where, "内容不适合本站");
    if (item.stars != null || item.gain != null) fail(where, "新品没有 star 数");
  } else {
    fail(where, `来源 ${item.source} 不认识`);
  }

  if (item.related) {
    const { to, label, labelEn } = item.related;
    if (!label || !labelEn) fail(where, "站内链接缺文字");
    const article = to?.match(/^\/articles\/([a-z0-9-]+)$/);
    if (article ? !articleIds.has(article[1]) : !pages.test(to ?? "")) fail(where, `站内链接 ${to} 不存在`);
  }
}

// Same opening over and over reads like a template.
const openings = new Map();
for (const item of all) {
  const key = (item.zh ?? "").slice(0, 2);
  openings.set(key, (openings.get(key) ?? 0) + 1);
}
for (const [key, n] of openings) if (n > 3) fail("issue", `${n} 条都以「${key}」开头，读起来像模板`);

// The lead must be worth leading with: a real number, and not last issue's story.
if (brief.lead?.source !== "github") fail("lead", "主新闻要是能给出数字的 GitHub 项目");

if (!offline) {
  await Promise.all(
    [...seen]
      .filter((u) => u.startsWith("https://github.com/"))
      .map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD", redirect: "manual", headers: { "User-Agent": "exploreai-brief" } });
          if (res.status >= 400) fail(url, `打不开（${res.status}）`);
          if (res.status >= 300) fail(url, `已跳转到 ${res.headers.get("location")}，要写新地址`);
        } catch (error) {
          console.warn(`  没能检查 ${url}：${error.message}`);
        }
      }),
  );
}

if (errors.length) {
  console.error(`✗ ${date} 不合格，${errors.length} 处：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ ${date} 合格：${all.length} 条（GitHub ${github}，新品 ${launches}），${sections.length} 组`);
