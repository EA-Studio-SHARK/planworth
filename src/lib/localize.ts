// English for data that is written in Chinese: an exact-match table first, then a phrase table
// for the regular price and unit labels. scripts/check-i18n.mjs fails the build if anything is left over.
import { FAMILY_SHORT, type Lang } from "../i18n";
import EN from "../data/en/plans.json";

const TABLE = EN as Record<string, string>;
const CJK = /[一-鿿]/;

/** Order matters: longer phrases have to go before the words inside them. */
const PHRASES: [string, string][] = [
  ["未获取（网页端注册即用，API 按量）", "Not available (free to sign up on the web, API pay-as-you-go)"],
  ["公测，付费档即将上线", "public beta, paid tiers coming"],
  ["2 人起，合计", "2-user minimum, total"],
  ["连续包月，", "auto-renew, "],
  ["连续包月", "auto-renew"],
  ["包年 8 折", "20% off annual"],
  ["年付折合", "annual"],
  ["年付约", "annual about"],
  ["首月低至", "first month from"],
  ["仅月付", "monthly only"],
  ["单月", "single month"],
  ["年付", "annual"],
  ["月付", "monthly"],
  ["首月", "first month"],
  ["限时加赠", "limited-time bonus"],
  ["限时", "limited-time"],
  [" credits 起/月", "+ credits/mo"],
  [" 起 / 月", "+/mo"],
  [" 起/月", "+/mo"],
  [" / 人 / 月", "/user/mo"],
  [" / 席", "/seat"],
  [" / 月", "/mo"],
  [" / 年", "/yr"],
  ["/月", "/mo"],
  ["/天", "/day"],
  [" 周 Pro 试用", "-week Pro trial"],
  ["优先积分", "priority credits"],
  ["资源点", "resource points"],
  ["灵感值", "inspiration points"],
  ["贝壳", "shells"],
  ["积分", "credits"],
  ["小时", "hours"],
  ["无限", "unlimited"],
  ["日 / 周", "daily/weekly"],
  ["签到", "check-in"],
  ["基础", "base"],
  ["奖励", "bonus"],
  ["或", "or"],
  ["约", "about"],
  ["免费", "Free"],
  ["未获取", "Not available"],
  ["（", " ("],
  ["）", ")"],
  ["，", ", "],
];

let current: Lang = "zh";

/** Called by PrefsProvider while rendering, so display code can translate without passing lang around. */
export function setLocaleLang(lang: Lang) {
  current = lang;
}

export function currentLang() {
  return current;
}

export function toEnglish(text: string) {
  const exact = TABLE[text];
  if (exact) return exact;
  let out = text;
  for (const [zh, en] of PHRASES) if (out.includes(zh)) out = out.replaceAll(zh, en);
  return out;
}

/** A plan or model string in the visitor's language. */
export function loc(text: string): string;
export function loc(text: string | null | undefined): string | null | undefined;
export function loc(text: string | null | undefined) {
  if (!text || current !== "en" || !CJK.test(text)) return text;
  return toEnglish(text);
}

/** Display name of a product family. */
export function famName(family: string) {
  return loc(FAMILY_SHORT[family]) ?? family;
}
