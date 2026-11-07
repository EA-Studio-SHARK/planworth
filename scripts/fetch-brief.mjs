// Pulls raw material for the daily brief: GitHub star gains and Product Hunt launches.
// Usage: node scripts/fetch-brief.mjs [YYYY-MM-DD]   (set GITHUB_TOKEN for a higher rate limit)
// Writes src/data/brief-raw/<date>.json and <date>.readmes.json, and refreshes the star baseline
// in src/data/github-hot.json. Running it twice in a day is safe: star gains are measured once.
import fs from "node:fs";
import { BLOCK_RE, RAW_DIR, recentUrls, today } from "./brief-lib.mjs";

const date = process.argv[2] ?? today();
const rawPath = `${RAW_DIR}/${date}.json`;
const readmePath = `${RAW_DIR}/${date}.readmes.json`;
const baselinePath = "src/data/github-hot.json";
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const previous = new Map(baseline.items.map((r) => [`${r.owner}/${r.repo}`, r.stars]));
const days = Math.max(1, Math.round((Date.parse(date) - Date.parse(baseline.snapshotDate)) / 86400000));
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "exploreai-brief",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function plainReadme(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("|"))
    .join(" / ");
}

/** raw.githubusercontent.com has no API quota, so a day's reading never runs out halfway. */
async function readmeOf(name) {
  for (const file of ["README.md", "readme.md", "README.MD", "README.rst", "README"]) {
    const res = await fetch(`https://raw.githubusercontent.com/${name}/HEAD/${file}`, { headers: { "User-Agent": "exploreai-brief" } });
    if (res.ok) return res.text();
  }
  const { content } = await gh(`/repos/${name}/readme`);
  return Buffer.from(content, "base64").toString("utf8");
}

/** README excerpts for every project the writer could pick, so nothing is written from the one-line description. */
async function fetchReadmes(raw) {
  const used = recentUrls(date);
  const out = {};
  for (const r of raw.repos) {
    const name = `${r.owner}/${r.repo}`;
    const entry = { used: used.has(r.url), blocked: false, excerpt: "" };
    if (!entry.used) {
      try {
        const text = plainReadme(await readmeOf(name));
        entry.excerpt = text.slice(0, 1800);
        entry.blocked = BLOCK_RE.test(`${r.description} ${text}`);
      } catch (error) {
        entry.error = String(error.message);
      }
    }
    out[name] = entry;
  }
  const open = Object.values(out).filter((e) => !e.used && !e.blocked && e.excerpt).length;
  // Keep no file when reading failed, so the next run tries again instead of trusting empty notes.
  if (!open) throw new Error(`${date}: no README could be read`);
  fs.writeFileSync(readmePath, JSON.stringify(out, null, 2) + "\n");
  console.log(`${date}: ${open} usable READMEs (recently used and blocked ones left out)`);
}

if (fs.existsSync(rawPath)) {
  console.log(`${date}: raw material already fetched, keeping its star gains`);
  if (!fs.existsSync(readmePath)) await fetchReadmes(JSON.parse(fs.readFileSync(rawPath, "utf8")));
  process.exit(0);
}

const since = new Date(Date.parse(date) - 21 * 86400000).toISOString().slice(0, 10);
const queries = [
  `claude OR "claude code" OR codex in:name,description,topics created:>${since}`,
  `agent OR llm OR mcp in:name,description,topics created:>${since}`,
  `agent OR llm OR "claude code" in:name,description,topics stars:>3000 pushed:>${since}`,
];
const seen = new Map();
for (const q of queries) {
  const { items } = await gh(`/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=40`);
  for (const r of items) seen.set(r.full_name, r);
}
const repos = [...seen.values()].map((r) => {
  const before = previous.get(r.full_name);
  const isNew = Date.parse(r.created_at) > Date.parse(since);
  return {
    owner: r.owner.login,
    repo: r.name,
    url: r.html_url,
    description: r.description ?? "",
    language: r.language,
    stars: r.stargazers_count,
    createdAt: r.created_at.slice(0, 10),
    isNew,
    // Gain since the last snapshot when we have one; a new repo's whole count otherwise.
    gain: before != null ? r.stargazers_count - before : isNew ? r.stargazers_count : null,
  };
});
repos.sort((a, b) => (b.gain ?? -1) - (a.gain ?? -1));

const feed = await (await fetch("https://www.producthunt.com/feed", { headers: { "User-Agent": "exploreai-brief" } })).text();
const launches = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
  const pick = (re) => (e.match(re)?.[1] ?? "").trim();
  const tagline = pick(/<content[^>]*>([\s\S]*?)<\/content>/)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/Discussion\s*\|\s*Link/, "").trim();
  return {
    name: pick(/<title>([\s\S]*?)<\/title>/).replace(/&amp;/g, "&"),
    tagline,
    url: pick(/<link[^>]*href="([^"]+)"/),
    publishedAt: pick(/<published>([^<]+)</).slice(0, 10),
  };
});

const out = { date, baselineDate: baseline.snapshotDate, days, repos: repos.slice(0, 60), launches };
fs.writeFileSync(rawPath, JSON.stringify(out, null, 2) + "\n");

// Next run measures gains from today, for every repo we have ever tracked.
for (const r of repos) previous.set(`${r.owner}/${r.repo}`, r.stars);
const items = [...previous].map(([name, stars]) => {
  const [owner, repo] = name.split("/");
  return { owner, repo, stars };
});
fs.writeFileSync(baselinePath, JSON.stringify({ snapshotDate: date, source: "GitHub REST Search API", items }, null, 2) + "\n");
console.log(`${date}: ${out.repos.length} repos (gain over ${days}d), ${launches.length} launches`);
await fetchReadmes(out);
