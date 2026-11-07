// Fails when the English site would show Chinese: plan data with no translation, article blocks that
// drifted from the Chinese version, or a brief without English text.
// Usage: node scripts/check-i18n.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const CJK = /[一-鿿]/;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-i18n-"));
const out = path.join(dir, "bundle.mjs");
await build({
  stdin: {
    contents: `
      export { plans, FAMILY_SOURCES } from "./src/data/plans.ts";
      export { API_MODELS } from "./src/data/api-models.ts";
      export { shopItems } from "./src/data/shop.ts";
      export { toEnglish } from "./src/lib/localize.ts";
      export { FAMILY_SHORT, copy } from "./src/i18n.ts";
      export { ARTICLES_ZH, ARTICLE_FAQ_ZH } from "./src/data/articles.ts";
      export { ARTICLES_EN, FAQ_EN, CATEGORIES_EN, SOURCE_LABELS_EN } from "./src/data/en/articles.ts";
    `,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  logLevel: "error",
  loader: { ".json": "json" },
});
const m = await import(out);
fs.rmSync(dir, { recursive: true });

const errors = [];
function checkEnglish(where, zh) {
  if (!zh || !CJK.test(zh)) return;
  const en = m.toEnglish(zh);
  if (CJK.test(en)) errors.push(`${where}: 「${zh}」 → 「${en}」`);
}

for (const p of m.plans) {
  for (const key of ["name", "priceLabel", "unitLabel", "quotaOfficial", "sourceNote"]) checkEnglish(`${p.id}.${key}`, p[key]);
}
for (const model of m.API_MODELS) checkEnglish(`${model.id}.name`, model.name);
for (const [family, source] of Object.entries(m.FAMILY_SOURCES)) checkEnglish(`${family}.publicNote`, source.publicNote);
for (const [family, name] of Object.entries(m.FAMILY_SHORT)) checkEnglish(`family ${family}`, name);
for (const item of m.shopItems) {
  if (!item.nameEn || CJK.test(item.nameEn)) errors.push(`shop ${item.id}: nameEn`);
  if (!item.officialEquivalentEn || CJK.test(item.officialEquivalentEn)) errors.push(`shop ${item.id}: officialEquivalentEn`);
}

// Interface copy: functions are called with placeholder text so their templates get checked too.
function walkCopy(value, where) {
  if (typeof value === "string") {
    // The language menu names Chinese in Chinese on purpose.
    if (CJK.test(value) && !/langZh$/.test(where)) errors.push(`copy ${where}: ${value}`);
  } else if (typeof value === "function") {
    try {
      walkCopy(value("x", "y", "z", "w"), where);
    } catch {
      /* a template that needs real arguments */
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walkCopy(v, `${where}[${i}]`));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walkCopy(v, `${where}.${k}`);
  }
}
walkCopy(m.copy.en, "en");

// Articles: same blocks, same links, same code as the Chinese version.
function shape(block) {
  if (block.type === "table") return `table:${block.headers.length}:${block.rows.map((r) => r.length).join(",")}`;
  if (block.type === "tool") return `tool:${block.to}`;
  if (block.type === "callout") return `callout:${block.tone}`;
  if (block.type === "code") return `code:${block.label ?? ""}`;
  if (block.items) return `${block.type}:${block.items.length}`;
  return block.type;
}
for (const article of m.ARTICLES_ZH) {
  const en = m.ARTICLES_EN[article.id];
  if (!en) {
    errors.push(`article ${article.id}: 没有英文`);
    continue;
  }
  const textOf = JSON.stringify({ t: en.title, s: en.summary, k: en.keyPoints, b: en.body });
  if (CJK.test(textOf)) errors.push(`article ${article.id}: 英文里有中文 ${textOf.match(/.{0,30}[一-鿿].{0,10}/)[0]}`);
  if (en.keyPoints.length !== article.keyPoints.length) errors.push(`article ${article.id}: keyPoints 条数不同`);
  const a = article.body.map(shape);
  const b = en.body.map(shape);
  if (a.join("|") !== b.join("|")) {
    const i = a.findIndex((x, n) => x !== b[n]);
    errors.push(`article ${article.id}: 第 ${i + 1} 块结构不同（中文 ${a[i]}，英文 ${b[i]}）`);
  }
  for (const source of article.sources) {
    if (!m.SOURCE_LABELS_EN[source.href]) errors.push(`article ${article.id}: 来源 ${source.href} 没有英文名`);
  }
}
for (const id of Object.keys(m.ARTICLES_EN)) {
  if (!m.ARTICLES_ZH.some((a) => a.id === id)) errors.push(`英文文章 ${id} 没有对应的中文`);
}
if (m.FAQ_EN.length !== m.ARTICLE_FAQ_ZH.length) errors.push("FAQ 条数不同");
if (CJK.test(JSON.stringify([m.FAQ_EN, m.CATEGORIES_EN, m.SOURCE_LABELS_EN]))) errors.push("FAQ、分类或来源的英文里有中文");

// Briefs.
for (const file of fs.readdirSync("src/data/briefs").filter((f) => f.endsWith(".json"))) {
  const b = JSON.parse(fs.readFileSync(`src/data/briefs/${file}`, "utf8"));
  const items = [b.lead, ...b.sections.flatMap((s) => s.items)];
  const strings = [b.headlineEn, b.lead.whyEn, ...b.sections.map((s) => s.titleEn), ...items.flatMap((i) => [i.en, i.related?.labelEn])];
  if (strings.some((s) => s && CJK.test(s))) errors.push(`brief ${file}: 英文里有中文`);
  if (!b.headlineEn || !b.lead.whyEn || items.some((i) => !i.en)) errors.push(`brief ${file}: 缺英文`);
}

if (errors.length) {
  console.error(`✗ 英文版还差 ${errors.length} 处：`);
  for (const e of errors.slice(0, 60)) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✓ 英文版没有遗漏的中文");
