// Tell Bing and IndexNow partners that a URL changed. Google ignores this; Search Console still needs a one-time sitemap submit.
import fs from "node:fs";
import { today } from "./brief-lib.mjs";

const ORIGIN = "https://app.exploreai.chat";
const KEY = "7101fe2779297759413b522fde0ddf2c";
const date = process.argv[2] ?? today();
const fromSitemap = fs.existsSync("dist/sitemap.xml")
  ? [...fs.readFileSync("dist/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  : [];
const urls = [
  ...new Set([
    `${ORIGIN}/`,
    `${ORIGIN}/claude`,
    `${ORIGIN}/claude/brief`,
    `${ORIGIN}/claude/brief/${date}`,
    `${ORIGIN}/articles/claude-safety`,
    `${ORIGIN}/sitemap.xml`,
    ...fromSitemap,
  ]),
];

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: "app.exploreai.chat",
    key: KEY,
    keyLocation: `${ORIGIN}/${KEY}.txt`,
    urlList: urls,
  }),
});
if (!res.ok) {
  console.warn(`indexnow ${res.status} ${await res.text()}`);
  process.exit(0);
}
console.log(`indexnow: ${urls.length} urls`);
