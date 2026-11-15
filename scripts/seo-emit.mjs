import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://app.exploreai.chat";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const pages = JSON.parse(fs.readFileSync(path.join(root, "src/seo/pages.json"), "utf8"));
const articlesSrc = fs.readFileSync(path.join(root, "src/data/articles.ts"), "utf8");

function unquote(raw) {
  return JSON.parse(`"${raw}"`);
}

function field(block, name) {
  const m = block.match(new RegExp(`${name}: "((?:\\\\.|[^"\\\\])*)"`));
  return m ? unquote(m[1]) : "";
}

function parseTs(src, i) {
  while (i < src.length && /[\s,]/.test(src[i])) i++;
  const ch = src[i];
  if (ch === `"`) {
    let j = i + 1;
    let out = "";
    while (j < src.length) {
      const c = src[j];
      if (c === `\\`) {
        out += src.slice(j, j + 2);
        j += 2;
        continue;
      }
      if (c === `"`) return [unquote(out), j + 1];
      out += c;
      j++;
    }
    throw new Error("unterminated string");
  }
  if (ch === "[") {
    const arr = [];
    i++;
    while (i < src.length) {
      while (i < src.length && /[\s,]/.test(src[i])) i++;
      if (src[i] === "]") return [arr, i + 1];
      const [val, next] = parseTs(src, i);
      arr.push(val);
      i = next;
    }
    throw new Error("unterminated array");
  }
  if (ch === "{") {
    const obj = {};
    i++;
    while (i < src.length) {
      while (i < src.length && /[\s,]/.test(src[i])) i++;
      if (src[i] === "}") return [obj, i + 1];
      const keyMatch = src.slice(i).match(/^([A-Za-z_][\w]*)\s*:/);
      if (!keyMatch) throw new Error(`expected key at ${i}`);
      i += keyMatch[0].length;
      const [val, next] = parseTs(src, i);
      obj[keyMatch[1]] = val;
      i = next;
    }
    throw new Error("unterminated object");
  }
  const lit = src.slice(i).match(/^(true|false|null|-?\d+(?:\.\d+)?)/);
  if (lit) {
    const raw = lit[1];
    const val = raw === "true" ? true : raw === "false" ? false : raw === "null" ? null : Number(raw);
    return [val, i + raw.length];
  }
  throw new Error(`cannot parse at ${i}: ${src.slice(i, i + 40)}`);
}

function parseBody(block) {
  const idx = block.indexOf("body: [");
  if (idx < 0) return [];
  try {
    const [val] = parseTs(block, idx + "body: ".length);
    return Array.isArray(val) ? val : [];
  } catch (error) {
    console.warn(`seo-emit: body parse failed (${error.message})`);
    return [];
  }
}

function parseArticles(src) {
  const start = src.indexOf("export const ARTICLES_ZH");
  const end = src.indexOf("export const ARTICLE_FAQ_ZH");
  const chunk = src.slice(start, end);
  return chunk
    .split(/\n  \{\n    id: "/)
    .slice(1)
    .map((block) => {
      const id = block.match(/^([^"]+)"/)?.[1] ?? "";
      const kp = block.match(/keyPoints: \[([\s\S]*?)\],/)?.[1] ?? "";
      const keyPoints = [...kp.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => unquote(m[1]));
      return {
        id,
        title: field(block, "title"),
        date: field(block, "date"),
        summary: field(block, "summary"),
        keyPoints,
        body: parseBody(block),
      };
    })
    .filter((row) => row.id && row.title);
}

function parseFaq(src) {
  const start = src.indexOf("export const ARTICLE_FAQ_ZH");
  const end = src.indexOf("function toEnglish");
  const chunk = src.slice(start, end);
  const rows = [];
  const re = /q: "((?:\\.|[^"\\])*)",\s*a: "((?:\\.|[^"\\])*)"/g;
  for (const m of chunk.matchAll(re)) rows.push({ q: unquote(m[1]), a: unquote(m[2]) });
  return rows;
}

function briefs() {
  const dir = path.join(root, "src/data/briefs");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function abs(urlPath) {
  return urlPath === "/" ? `${ORIGIN}/` : `${ORIGIN}${urlPath}`;
}

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

function blockHtml(block) {
  if (!block || typeof block !== "object") return "";
  switch (block.type) {
    case "p":
      return `<p>${esc(block.text)}</p>`;
    case "h2":
      return `<h2>${esc(block.text)}</h2>`;
    case "ul":
    case "check":
      return `<ul>${(block.items ?? []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    case "steps":
      return `<ol>${(block.items ?? [])
        .map((item) => `<li><b>${esc(item.title)}</b> ${esc(item.text)}</li>`)
        .join("")}</ol>`;
    case "callout":
      return `<aside><b>${esc(block.title)}</b><p>${esc(block.text)}</p></aside>`;
    case "code":
      return `<pre><code>${esc(block.text)}</code></pre>`;
    case "tool":
      return `<p><a href="${esc(block.to)}">${esc(block.title)}</a> ${esc(block.text)}</p>`;
    case "quote":
      return `<blockquote>${esc(block.text)}${block.cite ? `<cite>${esc(block.cite)}</cite>` : ""}</blockquote>`;
    case "table": {
      const head = (block.headers ?? []).map((cell) => `<th>${esc(cell)}</th>`).join("");
      const rows = (block.rows ?? [])
        .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
        .join("");
      return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    default:
      return "";
  }
}

function snapshot(page) {
  const points = (page.points ?? []).map((item) => `<li>${esc(item)}</li>`).join("");
  const body = (page.blocks ?? []).map(blockHtml).join("");
  const extra = page.extraHtml ?? "";
  const links = (page.links ?? [])
    .map((item) => `<a href="${esc(item.href)}">${esc(item.label)}</a>`)
    .join("");
  return `<article class="seo-snapshot"><p>ExploreAI</p><h1>${esc(page.h1)}</h1><p>${esc(page.description)}</p>${
    points ? `<ul>${points}</ul>` : ""
  }${body}${extra}${links ? `<nav>${links}</nav>` : ""}</article>`;
}

function stripShared(html) {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>/g, "")
    .replace(/\s*<meta property="og:[^"]+"[^>]*>/g, "")
    .replace(/\s*<meta name="twitter:[^"]+"[^>]*>/g, "")
    .replace(/\s*<meta name="robots"[^>]*>/g, "")
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
}

function headInject(page) {
  const url = abs(page.path);
  const tags = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:image" content="${ORIGIN}/og.png" />`,
    `<meta property="og:site_name" content="ExploreAI" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${ORIGIN}/og.png" />`,
  ];
  if (page.jsonLd.length) {
    const json = page.jsonLd.length === 1 ? JSON.stringify(page.jsonLd[0]) : JSON.stringify(page.jsonLd);
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }
  return tags.join("\n    ");
}

function render(template, page) {
  let html = stripShared(template);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(page.description)}" />`,
  );
  html = html.replace("</head>", `    ${headInject(page)}\n  </head>`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${snapshot(page)}</div>`);
  return html;
}

function writeRoute(urlPath, html) {
  if (urlPath === "/") {
    fs.writeFileSync(path.join(dist, "index.html"), html);
    return;
  }
  const rel = urlPath.replace(/^\//, "");
  const file = path.join(dist, `${rel}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  const index = path.join(dist, rel, "index.html");
  fs.mkdirSync(path.dirname(index), { recursive: true });
  fs.writeFileSync(index, html);
}

const NAV = [
  { href: "/", label: "首页" },
  { href: "/worth", label: "额度对照" },
  { href: "/claude", label: "专栏" },
  { href: "/claude/brief", label: "每日早报" },
  { href: "/fingerprint", label: "模型指纹" },
  { href: "/checkcc", label: "环境检测" },
  { href: "/shop", label: "商店" },
];

function org() {
  return {
    "@type": "Organization",
    name: "ExploreAI",
    url: `${ORIGIN}/`,
    logo: `${ORIGIN}/avatar.png`,
    sameAs: [
      "https://github.com/EA-Studio-SHARK/planworth",
      "https://x.com/_ExploreAI",
      "https://t.me/ExploreAllStudio",
    ],
  };
}

const articles = parseArticles(articlesSrc);
const faq = parseFaq(articlesSrc);
const issues = briefs();
const built = today();

if (!articles.length) {
  console.error("seo-emit: parsed 0 articles");
  process.exit(1);
}

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const docs = [];

for (const page of pages) {
  const jsonLd = [];
  if (page.path === "/") {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ExploreAI",
      url: `${ORIGIN}/`,
      inLanguage: ["zh-CN", "en"],
      publisher: org(),
    });
    if (faq.length) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: "zh-CN",
        mainEntity: faq.map((row) => ({
          "@type": "Question",
          name: row.q,
          acceptedAnswer: { "@type": "Answer", text: row.a },
        })),
      });
    }
  }
  docs.push({
    path: page.path,
    title: page.title,
    description: page.description,
    h1: page.title.split("｜")[0],
    type: "website",
    lastmod: built,
    links: page.path === "/" ? NAV : [{ href: "/", label: "回到首页" }],
    jsonLd,
  });
}

for (const article of articles) {
  docs.push({
    path: `/articles/${article.id}`,
    title: `${article.title}｜ExploreAI`,
    description: article.summary,
    h1: article.title,
    type: "article",
    lastmod: article.date || built,
    points: article.keyPoints,
    blocks: article.body,
    links: [
      { href: "/claude", label: "专栏" },
      { href: "/", label: "首页" },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.summary,
        datePublished: article.date,
        inLanguage: "zh-CN",
        mainEntityOfPage: abs(`/articles/${article.id}`),
        author: org(),
        publisher: org(),
        image: `${ORIGIN}/og.png`,
      },
    ],
  });
}

for (const issue of issues) {
  docs.push({
    path: `/claude/brief/${issue.date}`,
    title: `${issue.date} 早报｜ExploreAI`,
    description: issue.headline,
    h1: `${issue.date} 早报`,
    type: "article",
    lastmod: issue.date,
    extraHtml: `<p>${esc(issue.lead?.zh ?? "")}</p><p>${esc(issue.lead?.why ?? "")}</p>${(issue.sections ?? [])
      .map(
        (section) =>
          `<h2>${esc(section.title)}</h2>${(section.items ?? []).map((item) => `<p>${esc(item.zh)}</p>`).join("")}`,
      )
      .join("")}`,
    links: [{ href: "/claude/brief", label: "全部早报" }],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: issue.headline,
        datePublished: issue.date,
        description: issue.headline,
        inLanguage: "zh-CN",
        mainEntityOfPage: abs(`/claude/brief/${issue.date}`),
        author: org(),
        publisher: org(),
      },
    ],
  });
}

for (const doc of docs) writeRoute(doc.path, render(template, doc));

const urls = docs
  .map(
    (doc) => `  <url>
    <loc>${abs(doc.path)}</loc>
    <lastmod>${doc.lastmod}</lastmod>
  </url>`,
  )
  .join("\n");
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
);
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Sogou web spider
Allow: /

User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`,
);
fs.writeFileSync(
  path.join(dist, "llms.txt"),
  `# ExploreAI

> 个人工具站，不是模型厂商官方站点。看懂 Claude 防封号和地区规则，算清同样的钱能换多少，充完查环境、核对中转模型。未公开的网页配额不写成精确 token。

## 页面

- [首页](${ORIGIN}/): 五步：文案、对照、充值、环境、指纹
- [额度对照](${ORIGIN}/worth): 同样的预算，Claude、ChatGPT 和直连 API 各能换多少
- [专栏](${ORIGIN}/claude): 防封号、充值、上手，只讲官方规则
- [每日早报](${ORIGIN}/claude/brief): GitHub 和 Product Hunt
- [模型指纹](${ORIGIN}/fingerprint): 核对中转接口像不像它说的模型
- [环境检测](${ORIGIN}/checkcc): 时区、语言、出口 IP。不是官方资格查询
- [商店](${ORIGIN}/shop): 推广位，不是官方渠道

## 不做

不提供接码、成品号或地区伪装方法。
`,
);

console.log(`seo-emit: ${docs.length} urls, ${articles.length} articles, ${issues.length} briefs`);
