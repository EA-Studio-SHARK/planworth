// Shared by fetch-brief.mjs and check-brief.mjs.
import fs from "node:fs";

export const BRIEF_DIR = "src/data/briefs";
export const RAW_DIR = "src/data/brief-raw";
/** A project may not come back until this many issues have passed. */
export const REPEAT_WINDOW = 3;

/** Topics this site does not promote. A hit in a project's description or README keeps it out of the brief. */
export const BLOCK_RE =
  /bypass\w*\s+(\w+\s+)?(bot|captcha|anti|detection|cloudflare|region|geo|restriction|paywall|ban)|bot[- ]check|anti[- ]?(detect|bot)|captcha|jailbreak|day[- ]?trad|trading (agent|bot|skill)|指纹浏览器|接码|绕过|防封|封号|风控|破解|越狱|反爬|成品号|炒股/i;

/** Calendar date in China, wherever this runs. A cloud runner on UTC would get yesterday before 8am. */
export function today() {
  return new Date().toLocaleDateString("sv", { timeZone: "Asia/Shanghai" });
}

export function issues() {
  if (!fs.existsSync(BRIEF_DIR)) return [];
  return fs
    .readdirSync(BRIEF_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(`${BRIEF_DIR}/${f}`, "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function urlsOf(brief) {
  return [brief.lead, ...brief.sections.flatMap((s) => s.items)].map((i) => i.url);
}

/** URLs used by the REPEAT_WINDOW issues before `date`. */
export function recentUrls(date) {
  return new Set(
    issues()
      .filter((b) => b.date < date)
      .slice(0, REPEAT_WINDOW)
      .flatMap(urlsOf),
  );
}
