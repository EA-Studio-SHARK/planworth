import type { Article } from "./types";

export const articles: Article[] = [
  {
    id: "claude-safety",
    title: "Claude 账号被封怎么办？先确认原因，再走官方申诉",
    date: "2026-10-25",
    summary:
      "依据 Anthropic 官方地区政策、申诉与身份验证说明，区分停用、付款失败和额度用尽。不提供虚拟号、接码、批量注册或地区伪装教程。",
    body: [
      {
        type: "note",
        text: "本页解释公开资料，不保证解封或“防封”。第三方充值（推广）不能改变地区资格。证件、密码、验证码只提交到官方流程。",
      },
      {
        type: "p",
        text: "先区分账号停用、额度用尽、付款失败和身份验证提示。如果确实被停用，登录原账号使用官方申诉入口。人在中国大陆、香港或澳门，还要先看 Anthropic 的支持地区政策。中文聊天不是公开列出的封号理由，IP 检测也不能证明账号符合政策。",
      },
      { type: "h2", text: "地区限制看实际所在地" },
      {
        type: "p",
        text: "2026-10-25 核对本站打开的 Anthropic Supported Regions Policy：名单里有美国、日本、新加坡、韩国、台湾等；没有中国大陆、香港、澳门。未列出的地区一律视为不支持。政策约束实际位于不支持地区的个人，以及注册或总部位于不支持地区的机构。中国国籍本身不是禁用条件。",
      },
      {
        type: "ul",
        items: [
          "资格取决于实际所在地及适用的机构政策，不取决于是否使用中文。",
          "使用政策把「违反支持地区政策访问，或帮助别人这样访问」列为滥用。",
          "换卡、第三方充值、网络出口检测，都不改变人实际所在地区。",
        ],
      },
      { type: "h2", text: "现在主要要分清的几件事" },
      {
        type: "table",
        headers: ["现象", "先核对什么", "不要当成什么"],
        rows: [
          ["账号 disabled / 受限页带申诉", "官方申诉入口", "额度用尽或卡被拒"],
          ["付款失败 / 卡被拒", "账单国家、3DS、发卡行", "必然封号"],
          ["用量提示 / 5 小时窗口", "Pro / Max / Ultra 倍率", "账号被停用"],
          ["身份验证失败", "官方证件与自拍流程", "立刻永久封禁"],
        ],
      },
      { type: "h2", text: "明确不要做" },
      {
        type: "ul",
        items: [
          "不提供、也不建议用虚拟号码、接码平台、批量注册、地区伪装或封禁后换号绕过。",
          "不要把 CheckCC 一类第三方检测当成 Anthropic 官方资格证明。",
          "不要买拼车号、成品号，或把验证码交给他人。",
          "不要上传假证件。被停用后先走原账号申诉，不要开新号规避决定。",
        ],
      },
      { type: "h2", text: "自己绑卡" },
      {
        type: "p",
        text: "人在支持地区时，用自己的邮箱打开 claude.ai Settings → Billing，核对准发卡国、账单地址和 3DS。官方接受信用卡和借记卡。人在不支持地区时，换卡或代充都不能授予使用资格。",
      },
      { type: "h2", text: "本站能帮什么" },
      {
        type: "p",
        text: "对照台可以解释公开步骤，并把 EA小铺的 Claude Pro 月卡（推广）放在直充页。店铺不收密码和证件照片。KYC、申诉材料只应提交到官方页面。第三方充值不是 Anthropic 官方渠道。",
      },
      {
        type: "links",
        items: [
          { label: "支持国家和地区政策", href: "https://www.anthropic.com/supported-countries" },
          { label: "封禁原因与申诉", href: "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals" },
          { label: "使用政策", href: "https://www.anthropic.com/legal/aup" },
          { label: "手机号验证", href: "https://support.claude.com/en/articles/8287232-verify-your-phone-number" },
          { label: "银行卡被拒", href: "https://support.claude.com/en/articles/9402418-why-was-my-card-declined" },
          { label: "身份验证", href: "https://support.claude.com/en/articles/14328960-identity-verification-on-claude" },
          { label: "Claude Billing", href: "https://claude.ai/settings/billing" },
        ],
      },
      {
        type: "quote",
        text: "透明度中心：2026 年 1-6 月封禁 1140 万个账号，申诉 39.8 万次，推翻 4.2 万次。官方未披露“地区封禁”的单独推翻率。",
        cite: "anthropic.com/transparency/system-trust-reporting",
      },
    ],
  },
  {
    id: "sub-vs-api",
    title: "订阅换算成 token：官方公开了什么，什么只能估算",
    date: "2026-11-01",
    summary:
      "ChatGPT Plus、Claude Pro 这类会员大多不公布精确 token 数。能硬算的是 API 牌价、套餐自带的 API credits，以及官方写明的倍率。",
    body: [
      {
        type: "p",
        text: "对照台把「$20 会员值多少 token」拆成三层，避免把未公开配额写成精确数字。",
      },
      {
        type: "h2",
        text: "第一层：API 牌价",
      },
      {
        type: "p",
        text: "Anthropic 与 OpenAI 都公布每百万 token 的输入 / 输出价。例如 2026-11-01 核验：Claude Sonnet 5.5 为 $2 / $10 per MTok；GPT-6.1 Sol 短上下文标准档为 $2 / $10 per MTok。这是把「用量」翻译成美元的唯一硬尺子。",
      },
      {
        type: "h2",
        text: "第二层：套餐自带的 API credits",
      },
      {
        type: "ul",
        items: [
          "Claude Max $100：官网写明另含 $100 / 月 Claude Platform API credits。",
          "Claude Ultra $200：另含 $200 / 月 API credits。",
          "ChatGPT Pro：官网写 Up to $500 in monthly API credits。",
        ],
      },
      {
        type: "p",
        text: "这一层是订阅里能直接写成美元的 token 价值。它不等于网页聊天额度，聊天额度仍然按 5 小时窗口或周上限走。",
      },
      {
        type: "h2",
        text: "第三层：倍率，不是 token 数",
      },
      {
        type: "p",
        text: "Claude 对照表把 Pro 记为 1×，Max 为 5×，Ultra 周额度为 10× Pro。ChatGPT 在 2026-08-18 核验里写过 Pro $100 = 5× Plus Codex。这些是相对用量，不是「Plus = 某某百万 token」。本站推荐页用你输入的月 token，按 API 牌价算出「若走 API 要花多少」，再和套餐标价、自带 credits 比较。",
      },
      {
        type: "note",
        text: "默认按 70% 输入 + 30% 输出混合计价，可在推荐页改。这是计算假设，不是官方用量结构。",
      },
    ],
  },
  {
    id: "third-party-recharge",
    title: "第三方代充怎么标，以及它解决不了什么",
    date: "2026-11-01",
    summary:
      "直充页所有商品都标「推广」。官方条款禁止账号共享。代充不能改变 Claude 地区资格，也不能替代官方 Billing。",
    body: [
      {
        type: "p",
        text: "对照台把 EA小铺现有卡密放进直充页，方便对照完套餐后下单。这是推广位，不是 Anthropic / OpenAI / Cursor 官方渠道。",
      },
      {
        type: "h2",
        text: "官方怎么写第三方",
      },
      {
        type: "p",
        text: "2026-08-18 订阅核验里，ChatGPT、Claude、Cursor、Gemini 等官方材料都提示：共享账号、代充、成品号存在封号、资金损失和隐私风险；官方禁止多人共享同一账号。本站不推荐把密码或验证码交给任何人。",
      },
      {
        type: "h2",
        text: "本站收什么、不收什么",
      },
      {
        type: "ul",
        items: [
          "推广商品：Claude Pro 月卡、ChatGPT Plus 卡密、Cursor 月卡、Gemini 卡密、GPT Pro CDK。库存以店铺快照为准。",
          "不展示接码、成品号、美区秒冲类目。",
          "不写虚拟号、批量注册、地区伪装教程。",
        ],
      },
      {
        type: "note",
        text: "人在 Anthropic 不支持地区时，任何渠道的 Claude 充值都不能授予使用资格。先读 Claude 防封号一文。",
      },
    ],
  },
];

export function articleById(id: string) {
  return articles.find((a) => a.id === id) ?? null;
}
