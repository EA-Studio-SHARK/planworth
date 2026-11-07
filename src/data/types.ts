export type Family =
  | "claude"
  | "gpt"
  | "gemini"
  | "grok"
  | "perplexity"
  | "mistral"
  | "poe"
  | "mscopilot"
  | "deepseek"
  | "kimi"
  | "qwen"
  | "doubao"
  | "zhipu"
  | "minimax"
  | "yuanbao"
  | "wenxin"
  | "spark"
  | "stepfun"
  | "baichuan"
  | "sensenova"
  | "tiangong"
  | "ai360"
  | "longcat"
  | "mimo"
  | "cursor"
  | "copilot"
  | "windsurf"
  | "trae"
  | "qoder"
  | "codebuddy"
  | "codegeex"
  | "manus"
  | "coze"
  | "midjourney"
  | "runway"
  | "pika"
  | "luma"
  | "ideogram"
  | "kling"
  | "jimeng"
  | "hailuo"
  | "vidu"
  | "suno"
  | "elevenlabs"
  | "openrouter"
  | "siliconcloud";

export const FAMILY_LABEL: Record<Family, string> = {
  claude: "Claude",
  gpt: "ChatGPT / Codex",
  gemini: "Gemini",
  grok: "Grok",
  deepseek: "DeepSeek",
  kimi: "Kimi",
  qwen: "通义千问 Qwen",
  doubao: "豆包",
  zhipu: "智谱 GLM",
  minimax: "MiniMax",
  yuanbao: "腾讯元宝",
  wenxin: "文心一言",
  cursor: "Cursor",
  copilot: "GitHub Copilot",
  perplexity: "Perplexity",
  midjourney: "Midjourney",
  runway: "Runway",
  elevenlabs: "ElevenLabs",
  mistral: "Mistral Le Chat",
  poe: "Poe",
  mscopilot: "Microsoft Copilot",
  spark: "讯飞星火",
  stepfun: "阶跃星辰 跃问",
  baichuan: "百川 百小应",
  sensenova: "商汤 商量",
  tiangong: "昆仑万维 天工",
  ai360: "360 智脑 / 纳米 AI",
  longcat: "美团 LongCat",
  mimo: "小米 MiMo",
  windsurf: "Windsurf",
  trae: "字节 Trae",
  qoder: "阿里 Qoder",
  codebuddy: "腾讯 CodeBuddy",
  codegeex: "智谱 CodeGeeX",
  manus: "Manus",
  coze: "扣子 Coze",
  pika: "Pika",
  luma: "Luma Dream Machine",
  ideogram: "Ideogram",
  kling: "快手 可灵",
  jimeng: "字节 即梦",
  hailuo: "MiniMax 海螺",
  vidu: "生数 Vidu",
  suno: "Suno",
  openrouter: "OpenRouter",
  siliconcloud: "硅基流动 SiliconCloud",
};

export type Plan = {
  id: string;
  family: Family;
  product: string;
  name: string;
  priceUsd: number | null;
  priceLabel: string;
  billing: string;
  models: string[];
  quotaOfficial: string;
  exactQuotaPublished: boolean;
  apiCreditsUsd: number | null;
  /** Official monthly usage in dollars when the vendor states it (e.g. Copilot AI Credits). */
  usageUsdPublished?: number | null;
  /** Non-token allowance for image / video / voice plans, in the vendor's own unit. */
  unitLabel?: string;
  multiplierVsBase: number | null;
  basePlanId: string | null;
  apiBilledSeparately: boolean;
  includesCodeAgent: boolean;
  officialUrl: string;
  verifiedAt: string;
  sourceNote: string;
  /** "index" = official page quoted via a search summary, not read in full yet. Unset = checked. */
  confidence?: Confidence;
};

export type Confidence = "live" | "index" | "missing";

export type ApiModel = {
  id: string;
  family: Family;
  name: string;
  inputPerMTok: number;
  outputPerMTok: number;
  officialUrl: string;
  verifiedAt: string;
  note?: string;
  confidence?: Confidence;
};

export type ShopItem = {
  id: string;
  family: Family;
  name: string;
  nameEn: string;
  priceCny: number;
  stock: number;
  url: string;
  promo: true;
  officialEquivalent: string;
  officialEquivalentEn: string;
  /** Official monthly USD price when the item maps to exactly one plan, for showing the markup. */
  officialUsd?: number;
  /** Main cards up top, or the compact "more" list below them. */
  tier: "main" | "more";
  /** What the buyer has to hand over, from the shop's own notes. sk and token work as login credentials. */
  credential: "sk" | "token" | "userId" | "code";
};

export type ArticleCategory = "safety" | "pay" | "guide";

export type Article = {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: ArticleCategory;
  readMin: number;
  /** The answer up front, shown before the body. */
  keyPoints: string[];
  body: ArticleBlock[];
  sources: { label: string; href: string }[];
  /** Ids of the articles to read next. */
  next: string[];
};

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "check"; items: string[] }
  | { type: "callout"; tone: "tip" | "warn"; title: string; text: string }
  | { type: "code"; label?: string; text: string }
  | { type: "tool"; to: string; title: string; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "table"; headers: string[]; rows: string[][] };
