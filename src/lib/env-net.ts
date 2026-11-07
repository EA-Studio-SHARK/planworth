import { isPublicIp } from "../vendor/checkcc/client-engine";

export type NodeProbe = {
  id: string;
  name: string;
  host: string;
  url: string;
  status: "reachable" | "timeout" | "error" | "pending";
  ms: number | null;
};

export const OFFICIAL_NODES: Array<Pick<NodeProbe, "id" | "name" | "host" | "url">> = [
  { id: "claude.ai", name: "claude.ai", host: "claude.ai", url: "https://claude.ai/cdn-cgi/trace" },
  { id: "www.anthropic.com", name: "www.anthropic.com", host: "www.anthropic.com", url: "https://www.anthropic.com/" },
  { id: "api.anthropic.com", name: "api.anthropic.com", host: "api.anthropic.com", url: "https://api.anthropic.com/" },
];

async function timedFetch(url: string, timeoutMs: number, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", credentials: "omit" });
    return { ok: true as const, ms: Math.round(performance.now() - started), res };
  } catch {
    return { ok: false as const, ms: null, aborted: controller.signal.aborted };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function probeOfficialNodes(timeoutMs = 3500): Promise<NodeProbe[]> {
  return Promise.all(
    OFFICIAL_NODES.map(async (node) => {
      const hit = await timedFetch(node.url, timeoutMs, {
        mode: "no-cors",
        redirect: "follow",
        referrerPolicy: "no-referrer",
      });
      if (hit.ok) return { ...node, status: "reachable" as const, ms: hit.ms };
      return { ...node, status: hit.aborted ? ("timeout" as const) : ("error" as const), ms: null };
    }),
  );
}

export type IpIntel = {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  org: string;
  isp: string;
  asn: string;
  timezone: string;
  type: string;
  lat: string;
  provider: string;
};

type Json = Record<string, unknown>;

function rec(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
}

function text(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asnOf(value: string) {
  if (!value) return "";
  const upper = value.toUpperCase();
  if (/^AS\d+$/.test(upper)) return upper;
  return /^\d+$/.test(upper) ? `AS${upper}` : value;
}

function parseIntel(payload: unknown, provider: string): IpIntel | null {
  const root = rec(payload);
  if (!root || root.success === false) return null;
  const ip = text(root.ip);
  if (!ip || !isPublicIp(ip)) return null;
  const connection = rec(root.connection);
  const timezone = rec(root.timezone);
  const countryCode = (text(root.country_code) || text(root.countryCode)).toUpperCase();
  const lat = text(root.latitude) || text(root.lat);
  const lng = text(root.longitude) || text(root.lon) || text(root.lng);
  return {
    ip,
    country: text(root.country) || text(root.country_name) || "—",
    countryCode,
    city: [text(root.city), text(root.region)].filter(Boolean).join(" / ") || "—",
    org: text(connection?.org) || text(root.org) || text(root.organization_name) || "—",
    isp: text(connection?.isp) || text(root.isp) || "—",
    asn: asnOf(text(connection?.asn) || text(root.asn)) || "—",
    timezone: text(timezone?.id) || text(root.timezone) || "—",
    type: text(root.type) || text(root.version) || (ip.includes(":") ? "IPv6" : "IPv4"),
    lat: lat && lng ? `${lat}, ${lng}` : "—",
    provider,
  };
}

const IP_ENDPOINTS = [
  { url: "https://ipwho.is/", host: "ipwho.is" },
  { url: "https://get.geojs.io/v1/ip/geo.json", host: "get.geojs.io" },
  { url: "https://ipapi.co/json/", host: "ipapi.co" },
];

export async function lookupIp(): Promise<IpIntel | null> {
  for (const endpoint of IP_ENDPOINTS) {
    const hit = await timedFetch(endpoint.url, 3500, {
      headers: { Accept: "application/json" },
      referrerPolicy: "no-referrer",
    });
    if (!hit.ok || !hit.res.ok) continue;
    try {
      const intel = parseIntel(await hit.res.json(), endpoint.host);
      if (intel) return intel;
    } catch {
      /* next provider */
    }
  }
  return null;
}

export type WebRtcProbe = {
  status: "ok" | "unsupported" | "timeout" | "error";
  stun: string;
  publicAddresses: string[];
  privateAddresses: string[];
};

function parseCandidate(raw: string) {
  const parts = raw.trim().replace(/^a=/, "").split(/\s+/);
  if (parts.length < 8 || !parts[0].startsWith("candidate:")) return null;
  const address = parts[4];
  const typeIndex = parts.indexOf("typ");
  const type = typeIndex > 0 ? parts[typeIndex + 1] : "";
  if (!address || !type) return null;
  return { address, type };
}

export function probeWebRtc(timeoutMs = 2500, stun = "stun:stun.cloudflare.com:3478"): Promise<WebRtcProbe> {
  const Peer = globalThis.RTCPeerConnection;
  if (typeof Peer !== "function") {
    return Promise.resolve({ status: "unsupported", stun, publicAddresses: [], privateAddresses: [] });
  }
  return new Promise((resolve) => {
    const found: Array<{ address: string; type: string }> = [];
    let peer: RTCPeerConnection | null = null;
    let done = false;
    const finish = (status: WebRtcProbe["status"]) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      try {
        peer?.close();
      } catch {
        /* ignore */
      }
      const unique = (list: string[]) => Array.from(new Set(list));
      const publics = unique(found.filter((row) => isPublicIp(row.address)).map((row) => row.address));
      const privates = unique(found.filter((row) => !isPublicIp(row.address) && !row.address.endsWith(".local")).map((row) => row.address));
      resolve({ status, stun, publicAddresses: publics, privateAddresses: privates });
    };
    const timer = window.setTimeout(() => finish(found.length ? "ok" : "timeout"), timeoutMs);
    try {
      peer = new Peer({ iceServers: [{ urls: stun }] });
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          finish("ok");
          return;
        }
        const parsed = parseCandidate(event.candidate.candidate);
        if (parsed) found.push(parsed);
      };
      peer.onicegatheringstatechange = () => {
        if (peer?.iceGatheringState === "complete") finish("ok");
      };
      try {
        peer.createDataChannel("exploreai");
      } catch {
        /* offer is enough */
      }
      void peer.createOffer().then((offer) => peer?.setLocalDescription(offer)).catch(() => finish("error"));
    } catch {
      finish("error");
    }
  });
}

export async function probeIpv6(timeoutMs = 3000) {
  const hit = await timedFetch("https://api6.ipify.org?format=json", timeoutMs, {
    headers: { Accept: "application/json" },
    referrerPolicy: "no-referrer",
  });
  if (!hit.ok || !hit.res.ok) return null;
  try {
    const ip = text((await hit.res.json()).ip);
    if (ip.includes(":") && !/^::ffff:/i.test(ip) && isPublicIp(ip)) return ip;
  } catch {
    return null;
  }
  return null;
}

const DATACENTER = [
  "amazon", "aws", "google cloud", "microsoft", "azure", "digitalocean", "linode", "akamai",
  "ovh", "hetzner", "vultr", "cloudflare", "alibaba", "aliyun", "tencent", "huawei cloud",
  "hosting", "datacenter", "data center", "colocation", "vps",
];
const CARRIER = [
  "china telecom", "chinanet", "china unicom", "unicom", "china mobile", "cmnet",
  "comcast", "verizon", "at&t", "broadband", "telecom",
];

export function classifyExit(org: string, isp: string) {
  const hay = `${org} ${isp}`.toLowerCase();
  if (DATACENTER.some((token) => hay.includes(token))) return "datacenter" as const;
  if (CARRIER.some((token) => hay.includes(token))) return "carrier" as const;
  return "unknown" as const;
}

export function sameTimezone(ipZone: string | null | undefined, browserZone: string | null | undefined) {
  const a = ipZone?.trim();
  const b = browserZone?.trim();
  if (!a || !b || a === "—") return null;
  if (a === b) return true;
  try {
    const offset = (zone: string) => {
      const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value;
      return name ?? "";
    };
    return offset(a) === offset(b);
  } catch {
    return null;
  }
}

export function localExtras() {
  const ua = navigator.userAgent;
  const cores = navigator.hardwareConcurrency || 0;
  const screenLabel = `${window.screen.width}×${window.screen.height} / ${window.screen.colorDepth}bit`;
  return {
    ua,
    cores,
    screen: screenLabel,
    webdriver: Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver),
    platform: navigator.platform || "",
    brands:
      (navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } }).userAgentData?.brands
        ?.map((item) => item.brand)
        .join(" / ") || "",
  };
}
