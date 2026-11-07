/* Client environment sample inspired by CheckCC (yacuo/check-cc, MIT).
 * This is a redesigned subset: timezone, locale, language, UA, screen, and public IP lookup.
 * Source: https://github.com/yacuo/check-cc.git
 * License: third_party/check-cc/LICENSE
 */

const HOSTING =
  /amazon|aws|google cloud|gcp|microsoft azure|digitalocean|hetzner|ovh|vultr|linode|alibaba|aliyun|tencent|huawei cloud|cloudflare|oracle cloud|datacamp|m247|choopa|colocrossing|hivelocity|leaseweb/i;

export type EnvRaw = {
  timezone: string;
  offset: string;
  language: string;
  languages: string;
  locale: string;
  ua: string;
  platform: string;
  screen: string;
  cores: string;
  webdriver: boolean;
  ip: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  org: string | null;
  ipTimezone: string | null;
  hosting: boolean;
  tzMismatch: boolean;
  langMismatch: boolean;
};

function offsetLabel(minutesEast: number) {
  const sign = minutesEast >= 0 ? "+" : "-";
  const abs = Math.abs(minutesEast);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function langMismatch(lang: string, countryCode: string | null) {
  if (!countryCode) return false;
  const code = countryCode.toUpperCase();
  const primary = lang.split("-")[0]?.toLowerCase() ?? "";
  const zhRegions = new Set(["CN", "TW", "HK", "MO", "SG"]);
  const enRegions = new Set(["US", "GB", "AU", "CA", "NZ", "IE"]);
  if (zhRegions.has(code) && primary && primary !== "zh") return true;
  if (enRegions.has(code) && primary === "zh") return true;
  return false;
}

type IpWho = {
  success?: boolean;
  ip?: string;
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  timezone?: { id?: string };
  connection?: { isp?: string; org?: string };
};

export async function sampleEnv(): Promise<EnvRaw> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
  const offset = offsetLabel(-new Date().getTimezoneOffset());
  const language = navigator.language || "—";
  const languages = (navigator.languages?.length ? [...navigator.languages] : [language]).join(", ");
  let locale = "—";
  try {
    locale = Intl.NumberFormat().resolvedOptions().locale || "—";
  } catch {
    /* ignore */
  }
  const ua = navigator.userAgent || "—";
  const platform = navigator.platform || "—";
  const screen = `${window.screen.width}×${window.screen.height} · ${window.screen.colorDepth}-bit`;
  const cores = navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : "—";
  const webdriver = Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver);

  let ip: string | null = null;
  let country: string | null = null;
  let countryCode: string | null = null;
  let city: string | null = null;
  let org: string | null = null;
  let ipTimezone: string | null = null;

  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    const data = (await res.json()) as IpWho;
    if (data?.success) {
      ip = data.ip ?? null;
      country = data.country ?? null;
      countryCode = data.country_code ?? null;
      city = [data.city, data.region].filter(Boolean).join(" / ") || null;
      org = data.connection?.isp || data.connection?.org || null;
      ipTimezone = data.timezone?.id ?? null;
    }
  } catch {
    /* public IP lookup is optional */
  }

  const hosting = Boolean(org && HOSTING.test(org));
  const tzMismatch = Boolean(ipTimezone && timezone && ipTimezone !== timezone);

  return {
    timezone,
    offset,
    language,
    languages,
    locale,
    ua,
    platform,
    screen,
    cores,
    webdriver,
    ip,
    country,
    countryCode,
    city,
    org,
    ipTimezone,
    hosting,
    tzMismatch,
    langMismatch: langMismatch(language, countryCode),
  };
}
