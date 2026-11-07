import m_claude from "@lobehub/icons-static-svg/icons/claude-color.svg?raw";
import m_gpt from "@lobehub/icons-static-svg/icons/openai.svg?raw";
import m_gemini from "@lobehub/icons-static-svg/icons/gemini-color.svg?raw";
import m_grok from "@lobehub/icons-static-svg/icons/grok.svg?raw";
import m_perplexity from "@lobehub/icons-static-svg/icons/perplexity-color.svg?raw";
import m_mistral from "@lobehub/icons-static-svg/icons/mistral-color.svg?raw";
import m_poe from "@lobehub/icons-static-svg/icons/poe-color.svg?raw";
import m_mscopilot from "@lobehub/icons-static-svg/icons/copilot-color.svg?raw";
import m_deepseek from "@lobehub/icons-static-svg/icons/deepseek-color.svg?raw";
import m_kimi from "@lobehub/icons-static-svg/icons/kimi-color.svg?raw";
import m_qwen from "@lobehub/icons-static-svg/icons/qwen-color.svg?raw";
import m_doubao from "@lobehub/icons-static-svg/icons/doubao-color.svg?raw";
import m_zhipu from "@lobehub/icons-static-svg/icons/zhipu-color.svg?raw";
import m_minimax from "@lobehub/icons-static-svg/icons/minimax-color.svg?raw";
import m_yuanbao from "@lobehub/icons-static-svg/icons/yuanbao-color.svg?raw";
import m_wenxin from "@lobehub/icons-static-svg/icons/wenxin-color.svg?raw";
import m_spark from "@lobehub/icons-static-svg/icons/spark-color.svg?raw";
import m_stepfun from "@lobehub/icons-static-svg/icons/stepfun-color.svg?raw";
import m_baichuan from "@lobehub/icons-static-svg/icons/baichuan-color.svg?raw";
import m_sensenova from "@lobehub/icons-static-svg/icons/sensenova-color.svg?raw";
import m_tiangong from "@lobehub/icons-static-svg/icons/tiangong-color.svg?raw";
import m_ai360 from "@lobehub/icons-static-svg/icons/ai360-color.svg?raw";
import m_longcat from "@lobehub/icons-static-svg/icons/longcat-color.svg?raw";
import m_mimo from "@lobehub/icons-static-svg/icons/xiaomimimo.svg?raw";
import m_cursor from "@lobehub/icons-static-svg/icons/cursor.svg?raw";
import m_copilot from "@lobehub/icons-static-svg/icons/githubcopilot.svg?raw";
import m_windsurf from "@lobehub/icons-static-svg/icons/windsurf.svg?raw";
import m_trae from "@lobehub/icons-static-svg/icons/trae-color.svg?raw";
import m_qoder from "@lobehub/icons-static-svg/icons/qoder-color.svg?raw";
import m_codebuddy from "@lobehub/icons-static-svg/icons/codebuddy-color.svg?raw";
import m_codegeex from "@lobehub/icons-static-svg/icons/codegeex-color.svg?raw";
import m_manus from "@lobehub/icons-static-svg/icons/manus.svg?raw";
import m_coze from "@lobehub/icons-static-svg/icons/coze.svg?raw";
import m_midjourney from "@lobehub/icons-static-svg/icons/midjourney.svg?raw";
import m_runway from "@lobehub/icons-static-svg/icons/runway.svg?raw";
import m_pika from "@lobehub/icons-static-svg/icons/pika.svg?raw";
import m_luma from "@lobehub/icons-static-svg/icons/luma-color.svg?raw";
import m_ideogram from "@lobehub/icons-static-svg/icons/ideogram.svg?raw";
import m_kling from "@lobehub/icons-static-svg/icons/kling-color.svg?raw";
import m_jimeng from "@lobehub/icons-static-svg/icons/jimeng-color.svg?raw";
import m_hailuo from "@lobehub/icons-static-svg/icons/hailuo-color.svg?raw";
import m_vidu from "@lobehub/icons-static-svg/icons/vidu-color.svg?raw";
import m_suno from "@lobehub/icons-static-svg/icons/suno.svg?raw";
import m_elevenlabs from "@lobehub/icons-static-svg/icons/elevenlabs.svg?raw";
import m_openrouter from "@lobehub/icons-static-svg/icons/openrouter-color.svg?raw";
import m_siliconcloud from "@lobehub/icons-static-svg/icons/siliconcloud-color.svg?raw";
import type { Family } from "../data/types";

/** Official brand marks from @lobehub/icons-static-svg (MIT). Mono marks follow currentColor. */
const MARKS: Record<Family, string> = {
  claude: m_claude,
  gpt: m_gpt,
  gemini: m_gemini,
  grok: m_grok,
  perplexity: m_perplexity,
  mistral: m_mistral,
  poe: m_poe,
  mscopilot: m_mscopilot,
  deepseek: m_deepseek,
  kimi: m_kimi,
  qwen: m_qwen,
  doubao: m_doubao,
  zhipu: m_zhipu,
  minimax: m_minimax,
  yuanbao: m_yuanbao,
  wenxin: m_wenxin,
  spark: m_spark,
  stepfun: m_stepfun,
  baichuan: m_baichuan,
  sensenova: m_sensenova,
  tiangong: m_tiangong,
  ai360: m_ai360,
  longcat: m_longcat,
  mimo: m_mimo,
  cursor: m_cursor,
  copilot: m_copilot,
  windsurf: m_windsurf,
  trae: m_trae,
  qoder: m_qoder,
  codebuddy: m_codebuddy,
  codegeex: m_codegeex,
  manus: m_manus,
  coze: m_coze,
  midjourney: m_midjourney,
  runway: m_runway,
  pika: m_pika,
  luma: m_luma,
  ideogram: m_ideogram,
  kling: m_kling,
  jimeng: m_jimeng,
  hailuo: m_hailuo,
  vidu: m_vidu,
  suno: m_suno,
  elevenlabs: m_elevenlabs,
  openrouter: m_openrouter,
  siliconcloud: m_siliconcloud,
};

export function BrandMark({ family, size = 18 }: { family: Family | string; size?: number }) {
  const svg = MARKS[family as Family];
  if (!svg) {
    return (
      <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r="7" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }
  return (
    <span
      className="brand-logo"
      aria-hidden
      style={{ fontSize: size, width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg.replace(/<title>.*?<\/title>/, "") }}
    />
  );
}
