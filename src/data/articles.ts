import { currentLang } from "../lib/localize";
import { ARTICLES_EN, CATEGORIES_EN, FAQ_EN, SOURCE_LABELS_EN } from "./en/articles";
import type { Article, ArticleCategory } from "./types";

const SUPPORTED = { label: "Anthropic 支持的国家和地区", href: "https://www.anthropic.com/supported-countries" };
const APPEAL = { label: "警告、封禁与申诉", href: "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals" };
const TERMS = { label: "消费者服务条款", href: "https://www.anthropic.com/legal/consumer-terms" };
const AUP = { label: "使用政策", href: "https://www.anthropic.com/legal/aup" };
const PHONE = { label: "手机号验证", href: "https://support.claude.com/en/articles/8287232-verify-your-phone-number" };
const KYC = { label: "身份验证", href: "https://support.claude.com/en/articles/14328960-identity-verification-on-claude" };
const CARD = { label: "银行卡为什么被拒", href: "https://support.claude.com/en/articles/9402418-why-was-my-card-declined" };
const USAGE = { label: "付费档的用量怎么算", href: "https://support.claude.com/en/articles/11647753" };
const PRICING = { label: "Claude 官方定价", href: "https://claude.com/pricing" };
const API_PRICE = { label: "Claude API 牌价", href: "https://platform.claude.com/docs/en/about-claude/pricing" };
const QUICKSTART = { label: "Claude Code 快速上手", href: "https://code.claude.com/docs/en/quickstart" };
const TRANSPARENCY = { label: "Anthropic 透明度中心", href: "https://www.anthropic.com/transparency/system-trust-reporting" };

const CATEGORIES_ZH: { id: ArticleCategory; title: string; lede: string }[] = [
  { id: "safety", title: "防封号", lede: "官方写明了什么，哪些是传言，出事了怎么办。" },
  { id: "pay", title: "充值", lede: "怎么付、卡被拒怎么查、买哪一档最划算。" },
  { id: "guide", title: "使用教程", lede: "从第一周到 Claude Code，把钱花在刀刃上。" },
];

export const ARTICLES_ZH: Article[] = [
  {
    id: "claude-safety",
    category: "safety",
    title: "Claude 账号被封怎么办：先分清原因，再走官方入口",
    date: "2026-11-08",
    readMin: 10,
    summary: "先分清停用、额度用尽、付款失败和身份验证。真被停用就登录原账号申诉。人在大陆、香港、澳门，先看地区政策，换 IP 改变不了这一点。",
    keyPoints: [
      "先分清账号停用、额度用尽、付款失败、身份验证。只有受限页带申诉表才是封号。",
      "资格看实际所在地。中国大陆、香港、澳门不在支持名单。换网络出口或外国卡改变不了这一点。本文不教绕过。",
      "真被停用就用原账号走官方申诉。证件、密码、验证码只交给官方流程，不要发给店铺。",
    ],
    body: [
      { type: "h2", text: "先看页面原话：你碰到的是哪一种" },
      { type: "p", text: "别一看到报错就换设备、换网络、开新号。下面四种情况，只有第一种才叫封号，入口完全不同。" },
      {
        type: "table",
        headers: ["你看到的", "实际是什么", "该去哪"],
        rows: [
          ["登录后是受限页面，带申诉表", "账号被停用", "用这个账号登录，填页面上的申诉表"],
          ["付款失败、卡被拒", "支付问题", "人在支持地区时，按官方绑卡步骤排查"],
          ["提示用量到了，几小时后恢复", "额度用尽", "等重置，或在设置里看用量"],
          ["身份验证没通过", "验证问题", "在官方流程里重试，次数用尽再联系官方"],
        ],
      },
      { type: "h2", text: "地区这一条，看的是人在哪" },
      { type: "p", text: "2026-10-25 核对的支持地区名单里有美国、日本、新加坡、韩国、台湾等，没有中国大陆、香港、澳门。没列出来的地区，一律算不支持。政策约束的是实际位于不支持地区的个人，以及注册地、总部或多数控制权在不支持地区的机构。" },
      {
        type: "callout",
        tone: "warn",
        title: "换出口、换卡，都改变不了人在哪",
        text: "帮助中心写的是 physically located。人在大陆、香港或澳门使用，本身就在政策外面。VPN 出口和外国银行卡不改变实际所在地。中国国籍本身不是限制，人在支持地区仍要遵守账号和所属机构的规则。使用政策把「违反支持地区政策访问，或帮助别人这样访问」列为滥用。本文不写绕过方法。",
      },
      { type: "h2", text: "哪些是官方规则，哪些只是传闻" },
      { type: "p", text: "官方没有公布 IP、设备、时区或订阅档位的封禁权重。下面只有写明出处的才是规则，其余不能用来判断某一次停用的真实原因。" },
      {
        type: "table",
        headers: ["说法", "实际情况"],
        rows: [
          ["用中文聊天会被封", "公开条款里没有这一条。公摊、调休之类的「中国特征词」是段子，不是官方封号条款"],
          ["人身在大陆、香港、澳门", "这是官方写明的停用理由。后续检测、绑卡、身份验证都改变不了这一条"],
          ["环境检测全绿就能长期用", "本站环境页不是 Anthropic 的资格查询。绿了也不代表人在支持地区"],
          ["订了高档就一定要做身份验证，失败就立刻封号", "官方没这么写。验证失败可以在允许次数内重试，用尽后再联系官方"],
          ["被封了开个新号就行", "不要用新号规避已有的停用决定。先走原账号的官方申诉"],
        ],
      },
      { type: "h2", text: "账号受限时，这些不要做" },
      { type: "p", text: "下面每条都是为了别把情况弄得更难申诉，不是一份绕过清单。" },
      {
        type: "table",
        headers: ["不要做", "为什么", "卡住了怎么办"],
        rows: [
          ["换不同网络出口，想绕过地区限制", "出口变了，人还在原地。检测工具也不能授予使用资格", "先核对支持地区政策"],
          ["把环境检测当成官方风控评分", "官方没公布 IP、时区、指纹的权重", "留下页面原话，按官方说明处理"],
          ["用 VoIP、Google Voice 或接码号码验证", "官方手机号说明不接受这些号码", "用支持地区、能收短信的自己的号码"],
          ["买拼车号、成品号，或把验证码发给别人", "你控制不了原邮箱，申诉和导出都进不去，凭据还可能泄露", "只用自己控制的账号"],
          ["上传假证件，或把证件照片发给店铺", "不符合官方验证要求，也不该把证件交给第三方", "只在官方验证页提交真实、有效的实体证件"],
          ["被停用后立刻再注册新号", "可能违反条款，也解决不了原账号", "先登录原账号走申诉"],
        ],
      },
      { type: "h2", text: "人在支持地区，自己绑卡怎么走" },
      { type: "p", text: "官方订阅先要求人实际位于支持地区，付款方式也符合要求。人在不支持地区时，换卡或找人代充都不能改变地区资格。人在支持地区但卡被拒，再核对发卡国、账单地址和 3DS。" },
      {
        type: "steps",
        items: [
          { title: "用自己的邮箱登录", text: "不要用别人注册好的号。进得去邮箱、能收安全邮件，后面申诉和验证才有入口。" },
          { title: "打开 Settings → Billing", text: "选要买的档。网页订阅默认自动续费。官方接受信用卡和借记卡，不接受 PayPal、Venmo。" },
          { title: "核对发卡国和账单地址", text: "账单地址要和发卡国一致，也要和银行留档一致。需要时在银行 App 里做完 3DS，别中途关页面。" },
          { title: "被拒先看官方排查", text: "核对余额、稍后重试，或联系发卡行。仍不行再联系 Anthropic 支持。不要把第三方充值当成地区政策的例外。" },
        ],
      },
      { type: "tool", to: "/shop", title: "卡过不了，再看商店", text: "商店是推广位，不是官方渠道。每件标明对应官方哪一档，价格和库存以店铺页为准。不要把密码或验证码发给店铺。" },
      { type: "h2", text: "身份验证失败，按官方流程重试" },
      { type: "p", text: "官方可能在特定功能或安全检查时要求实体政府证件，有时还要实时自拍。它核的是你是不是真人、证件是不是有效、自拍和证件是不是同一个人。它不证明你人在支持地区，也不能让已停用的账号自动恢复。" },
      {
        type: "callout",
        tone: "tip",
        title: "证件只交给官方验证页",
        text: "照片模糊、证件过期或页面故障，也可能导致失败。先在官方流程里重试，次数用尽再用官方帮助表单。不要把证件照片、自拍、密码或验证码发给店铺。本站不能承诺通过验证或解封。",
      },
      { type: "h2", text: "已经停用，先申诉，别再加新信号" },
      {
        type: "steps",
        items: [
          { title: "先看页面原话", text: "额度用尽、卡被拒、组织被暂停、账号停用，入口不同。只有受限页带申诉表才是封号。" },
          { title: "用被停用的那个号登录", text: "官方表要求登录原账号。进不去原邮箱，这条路基本没有。" },
          { title: "按事实填一次", text: "写清邮箱、出现时间、页面或邮件原句。不要编「人在美国出差」。透明度中心的推翻数字是全部申诉，不能推算地区停用的成功率。" },
          { title: "等结果，不要再开新号", text: "官方说回复可能比平时慢。等待期间别注册新号绕过。能导出数据就先导出，本站不能承诺任何账号长期可用。" },
        ],
      },
      { type: "p", text: "透明度中心 2026-07-23 的更新写明：2026 年 1 月到 6 月封禁 1140 万个账号，收到 39.8 万次申诉，推翻 4.2 万次。这是全部产品的合计，官方没有单独公布地区停用的推翻率。" },
      { type: "tool", to: "/checkcc", title: "环境只是提示", text: "时区、语言和出口 IP 会不会互相打架，可以在本站看一眼。绿了也不等于符合地区政策，更查不到封禁原因。" },
    ],
    sources: [APPEAL, SUPPORTED, AUP, PHONE, CARD, KYC, TRANSPARENCY],
    next: ["claude-region", "claude-appeal"],
  },
  {
    id: "claude-region",
    category: "safety",
    title: "Claude 支持哪些地区：看的是人在哪，不是 IP 和国籍",
    date: "2026-10-25",
    readMin: 3,
    summary: "中国大陆、香港、澳门不在官方名单里。VPN 和外国银行卡都改变不了实际所在地，中国国籍本身也不是限制。",
    keyPoints: [
      "官方名单里有美国、日本、新加坡、韩国、台湾等，没有中国大陆、香港、澳门。",
      "判断标准是实际所在地（physically located），不是网络出口，也不是国籍。",
      "人在支持地区就可以正常用，中文聊天也不是公开列出的封号理由。",
    ],
    body: [
      { type: "h2", text: "三种常见情况" },
      {
        type: "table",
        headers: ["你的情况", "能不能用"],
        rows: [
          ["中国国籍，人在日本、新加坡等支持地区", "可以，国籍不是限制，仍要遵守账号和所在机构的规定"],
          ["人在中国大陆、香港或澳门", "不在支持名单里"],
          ["人在不支持地区，用 VPN 或外国银行卡", "实际所在地没变，使用政策把这类访问列为滥用"],
        ],
      },
      { type: "h2", text: "这些东西改变不了地区资格" },
      {
        type: "ul",
        items: [
          "换网络出口，或者环境检测全绿。",
          "换外国银行卡，或者走第三方充值。",
          "通过身份验证或绑定手机号。官方写明的停用理由不会因此消失。",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "机构也有地区要求",
        text: "政策同样约束注册或总部位于不支持地区的机构。公司账号的情况，看所在机构适用的政策。",
      },
      { type: "tool", to: "/checkcc", title: "看看环境提示", text: "环境检测只是提示，不是官方资格查询。结果绿了，也不代表符合地区政策。" },
    ],
    sources: [SUPPORTED, AUP, APPEAL],
    next: ["claude-safety", "claude-appeal"],
  },
  {
    id: "claude-appeal",
    category: "safety",
    title: "账号被封了怎么办：申诉一步步走",
    date: "2026-11-05",
    readMin: 5,
    summary: "必须用被封的账号登录才能申诉。先确认是封号，备份数据，按事实填表，然后等结果。",
    keyPoints: [
      "申诉表只有登录被封的账号才能打开，所以别弄丢邮箱，也别急着开新号。",
      "按事实写。编所在地、传假证件只会让事情更糟。",
      "2026 年上半年官方推翻了约一成申诉，不算容易，但确实有机会。",
    ],
    body: [
      { type: "h2", text: "按顺序做这五步" },
      {
        type: "steps",
        items: [
          { title: "确认真的是封号", text: "登录 claude.ai。受限页面带申诉表才是封号。额度用尽、卡被拒不用申诉。如果页面写的是组织因异常活动被暂停，点「Request a review」请团队复核。" },
          { title: "先导出数据", text: "因违反使用政策被封的账号，通常还能自己导出数据或删除账号，不用联系官方。有些违规情况下导出会受限，所以能导的时候先导。" },
          { title: "处理还在扣的订阅", text: "账号在申诉，订阅不一定自动停。去你当初付款的地方看一眼，别一边申诉一边继续扣费。" },
          { title: "填申诉表", text: "在受限页面填表。写清楚你用 Claude 做什么、为什么认为是误判。只写事实，不用长篇大论。" },
          { title: "等结果", text: "官方说现在回复比平时慢。等待期间别注册新号绕过，这样只会让情况更复杂。" },
        ],
      },
      { type: "h2", text: "申诉表里写什么" },
      {
        type: "ul",
        items: [
          "账号邮箱，以及大致的注册和付费时间。",
          "你实际所在的地区，照实写。",
          "主要用途，比如写代码、翻译、整理资料。",
          "你认为误判的具体理由。如果是用了违规内容，说明已经停止。",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "这三样只交给官方流程",
        text: "证件、密码、验证码，只提交到官方页面。任何声称能「代申诉」「内部解封」的人，都不要给。",
      },
      { type: "h2", text: "成功率大概多少" },
      {
        type: "quote",
        text: "2026 年 1-6 月，Anthropic 封禁 1140 万个账号，收到申诉 39.8 万次，推翻 4.2 万次。",
        cite: "Anthropic 透明度中心",
      },
      { type: "p", text: "算下来，提交的申诉里大约一成被推翻。官方没有单独公布地区类封禁的推翻率，所以如果你人确实在不支持地区，别把这个比例套到自己身上。" },
      { type: "h2", text: "收到的只是警告怎么办" },
      { type: "p", text: "警告不等于封号，它表示官方认为某些提示词违反了使用政策。如果认为是误判，按帮助中心文章里给的邮箱，写明情况和账号信息去申辩。平时注意别反复触发，「反复违反」才是封号理由。" },
    ],
    sources: [APPEAL, TRANSPARENCY, AUP],
    next: ["claude-safety", "claude-billing"],
  },
  {
    id: "claude-billing",
    category: "pay",
    title: "Claude 怎么充值：官方流程，和卡被拒的七种原因",
    date: "2026-11-05",
    readMin: 5,
    summary: "人在支持地区时，用自己的账号和卡走官方 Billing。卡被拒按七种原因逐条查。",
    keyPoints: [
      "官方接受信用卡和借记卡，不接受 PayPal 和 Venmo。",
      "最常见的失败原因是账单地址对不上，或 3D Secure 没走完。",
      "人在不支持地区时，换卡或代充都不能给你使用资格。",
    ],
    body: [
      { type: "h2", text: "官方充值四步" },
      {
        type: "steps",
        items: [
          { title: "先想好买哪档", text: "不确定就先买 Pro。不够用再升级，对照页能算出每档大概相当于多少 token。" },
          { title: "打开 Billing", text: "登录 claude.ai，进 Settings → Billing。" },
          { title: "填卡和账单地址", text: "地址和银行留档保持一致，发卡国和账单国家都要在支持名单里。" },
          { title: "走完 3D Secure", text: "在银行 App 确认或输入一次性密码，别中途关页面。" },
        ],
      },
      {
        type: "table",
        headers: ["档位", "月付", "用量", "附带 API credits"],
        rows: [
          ["Pro", "$20（年付约 $17 / 月）", "基础档，记为 1×", "无"],
          ["Max", "$100", "5× Pro", "$100 / 月"],
          ["Ultra", "$200", "周额度 10× Pro", "$200 / 月"],
        ],
      },
      { type: "h2", text: "卡被拒，按这七条查" },
      {
        type: "table",
        headers: ["原因", "怎么办"],
        rows: [
          ["账单地区不支持", "核对账单地址和发卡国都在支持名单里，且两者一致"],
          ["账单地址对不上", "和银行留档逐字对齐，包括拼写和重音符号"],
          ["3D Secure 没完成", "走完验证，输入一次性密码或在银行 App 确认"],
          ["支付方式不支持", "换信用卡或借记卡，PayPal、Venmo 不收"],
          ["余额不足", "确认卡里够付全款，不确定就问银行"],
          ["临时技术问题", "过一会儿再试，或换一张卡"],
          ["银行拒绝", "打给发卡行问原因，Anthropic 收不到具体原因"],
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "额度不够不一定要升级",
        text: "用量到顶时可以开 usage credits，工作不用停，按量继续付费。偶尔超一次不必换档，经常超再升级。",
      },
      { type: "tool", to: "/worth", title: "算算买哪档划算", text: "输入预算或导入账单，看同样的钱充 Claude、订 ChatGPT、买 API 各换多少。" },
    ],
    sources: [CARD, PRICING, SUPPORTED],
    next: ["sub-vs-api", "third-party-recharge"],
  },
  {
    id: "sub-vs-api",
    category: "pay",
    title: "$20 买 Pro 还是买 API：先算用量再决定",
    date: "2026-11-05",
    readMin: 4,
    summary: "订阅不公布精确 token 数。能硬算的只有 API 牌价、官方倍率和附带 credits，这篇教你怎么比。",
    keyPoints: [
      "同样 $20，按 Sonnet 5.5、输入占 70% 算，API 能买约 4.55M token。",
      "Max 和 Ultra 带等额 API credits，所以 $100 档推测能到约 45.5M，是直连的两倍。",
      "用得少、用得不规律选 API；每天都用、要 Claude Code 和网页聊天选订阅。",
    ],
    body: [
      { type: "h2", text: "能算的只有三样" },
      {
        type: "ul",
        items: [
          "API 牌价：Sonnet 5.5 是输入 $2、输出 $10，每百万 token。",
          "官方倍率：Max 是 5× Pro，Ultra 周额度是 10× Pro。这是相对用量，不是 token 数。",
          "附带 credits：Max $100 / 月，Ultra $200 / 月，Pro 没有。",
        ],
      },
      { type: "p", text: "网页聊天的精确配额官方没公开。所以本站订阅那栏都标「推测」：倍率 × 基础档标价，按模型牌价折成 token，再加上 credits。" },
      { type: "h2", text: "算一笔账" },
      {
        type: "table",
        headers: ["花费", "怎么买", "约多少 token", "口径"],
        rows: [
          ["$20", "直连 API", "4.55M", "牌价直算"],
          ["$20", "Pro", "4.55M", "推测"],
          ["$100", "直连 API", "22.7M", "牌价直算"],
          ["$100", "Max", "45.5M", "推测，用量 + credits 各一半"],
          ["$200", "直连 API", "45.5M", "牌价直算"],
          ["$200", "Ultra", "90.9M", "推测，用量 + credits 各一半"],
        ],
      },
      { type: "p", text: "都按 Sonnet 5.5、输入 70%、输出 30% 算，混合单价 $4.4 每百万 token。换成 Opus 5.5，同样的钱 token 数减半。" },
      { type: "h2", text: "怎么选" },
      {
        type: "table",
        headers: ["你的情况", "建议"],
        rows: [
          ["每月用量不到 $16 的 API 费用", "直接买 API，用多少付多少"],
          ["每天都用，要网页聊天和 Claude Code", "Pro 起步"],
          ["Pro 经常到顶", "先开 usage credits 试一个月，还不够再上 Max"],
          ["要接自己的程序", "API，订阅账号不能跑脚本"],
        ],
      },
      { type: "tool", to: "/worth", title: "用你自己的数算", text: "把账单 CSV 拖进来，自动识别用量，按你的输入输出比重算。" },
    ],
    sources: [API_PRICE, PRICING, USAGE],
    next: ["claude-usage-save", "claude-billing"],
  },
  {
    id: "third-party-recharge",
    category: "pay",
    title: "充值卡和代充：能解决什么，解决不了什么",
    date: "2026-11-05",
    readMin: 3,
    summary: "第三方充值只解决付款这一步，解决不了地区资格。买之前看清对应官方哪一档，算好差价。",
    keyPoints: [
      "第三方充值不是官方渠道，本站商店也只是推广位。",
      "它解决不了地区资格，也不会降低封号风险。",
      "绝不把密码和验证码交给卖家。SK 和 Token 相当于登录凭证，提交前要想清楚。",
    ],
    body: [
      { type: "h2", text: "它到底解决什么" },
      { type: "p", text: "如果你人在支持地区、账号是自己的，只是手上的卡付不了款，充值卡能帮你过付款这一关。除此以外它什么也改变不了。" },
      {
        type: "table",
        headers: ["问题", "充值卡能解决吗"],
        rows: [
          ["卡付不了款", "能"],
          ["人在不支持地区", "不能，资格看实际所在地"],
          ["账号已经被封", "不能，要走官方申诉"],
          ["担心被封", "不能，反而多一层不确定"],
        ],
      },
      { type: "h2", text: "买之前看四件事" },
      {
        type: "check",
        items: [
          "对应官方哪一档写清楚了吗？比如「Claude Pro 月卡」对应官方 $20。",
          "差价能接受吗？本站推广的 Claude Pro 月卡 ¥156，官方 $20 按 2026-11-04 中间价 6.7180 约 ¥134，差价约 ¥22。商店每件都算好了。",
          "卖家要你的密码或验证码吗？要就别买。要 SK、Token 这类凭证的也要想清楚：它们相当于登录凭证，拿到的人能进你的账号。本站商店逐件标明了要提交什么。",
          "出问题谁负责？库存和履约以店铺为准，官方不会管第三方订单。",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "拼车和成品号是另一回事",
        text: "条款明确禁止共享账号和转售。这类账号你控制不了原邮箱，被封了也没法申诉。",
      },
      { type: "tool", to: "/shop", title: "看推广商品", text: "每件都标了对应的官方档位。这是推广位，不是官方渠道。" },
    ],
    sources: [TERMS, SUPPORTED, PRICING],
    next: ["claude-billing", "claude-safety"],
  },
  {
    id: "claude-first-week",
    category: "guide",
    title: "Claude 第一周怎么用：别一上来就把额度烧光",
    date: "2026-11-05",
    readMin: 6,
    summary: "刚充完 Pro，先用一周摸清额度。这篇按天安排：选模型、建项目、开关功能，最后再上 Claude Code。",
    keyPoints: [
      "网页、桌面端和 Claude Code 共用一个额度，5 小时窗口从你发第一条消息开始算。",
      "日常任务用低一点的 effort，长对话及时开新的，额度能撑很久。",
      "第一周的目标不是用满，而是摸清自己一个窗口能干多少活。",
    ],
    body: [
      { type: "h2", text: "先搞懂额度怎么走" },
      {
        type: "ul",
        items: [
          "会话限额：每 5 小时重置一次，从你的第一条消息开始算。",
          "周限额：所有模型合计，在账号固定的时间重置。部分档位对 Fable 还有单独的周限额。",
          "在 Settings → Usage 能看到还剩多少。",
        ],
      },
      { type: "h2", text: "第一周这样安排" },
      {
        type: "steps",
        items: [
          { title: "第 1 天：拿真活试", text: "别问「你是谁」。拿一件手头正在做的事交给它，比如一份要改的文档。说清目标、读者和格式。结束后去 Usage 看花了多少。" },
          { title: "第 2 天：换模型比一比", text: "同一个任务分别用 Haiku、Sonnet 和 Opus 跑，比较效果和额度消耗。多数日常任务 Sonnet 就够了。" },
          { title: "第 3 天：建一个项目", text: "把长期要用的资料放进 Project，写几句指令。指令保持简短，用不到的文件及时删掉，它们也占额度。" },
          { title: "第 4 天：试试开关", text: "联网搜索、连接的应用、thinking，都是有用才开。用完关掉，下次对话不再为它们付额度。" },
          { title: "第 5 天：练习开新对话", text: "一个话题结束就开新对话。长对话每轮都要带上前文，越往后越贵。" },
          { title: "周末：决定要不要升级", text: "回看这周到顶了几次。一次没到就留在 Pro，偶尔到顶用 usage credits，经常到顶再看 Max。" },
        ],
      },
      { type: "h2", text: "提问的三个习惯" },
      {
        type: "table",
        headers: ["别这样", "这样"],
        rows: [
          ["帮我改一下这篇文章", "把这篇文章改短到 500 字，读者是新手，保留三个数据"],
          ["这个报错怎么办", "贴完整报错，说明你做了什么、期望什么"],
          ["一次塞五件事", "拆成步骤，一步确认了再走下一步"],
        ],
      },
      { type: "tool", to: "/worth", title: "不够用时算一下", text: "看 Pro、Max 和直连 API 哪个更适合你的用量。" },
    ],
    sources: [USAGE, PRICING],
    next: ["claude-usage-save", "claude-code-start"],
  },
  {
    id: "claude-code-start",
    category: "guide",
    title: "Claude Code 上手：从安装到第一次改代码",
    date: "2026-11-05",
    readMin: 6,
    summary: "一行命令装好，登录，在项目里问第一个问题，改第一处代码。常用命令和新手容易踩的坑都在这。",
    keyPoints: [
      "Pro、Max、Ultra 都能用，也可以用 Console 账号按量付费。",
      "它和网页聊天共用订阅额度，用太猛聊天也会到顶。",
      "先让它读懂项目再动手，每次任务说具体一点。",
    ],
    body: [
      { type: "h2", text: "第一步：安装" },
      { type: "code", label: "macOS / Linux / WSL", text: "curl -fsSL https://claude.ai/install.sh | bash" },
      { type: "code", label: "Windows PowerShell", text: "irm https://claude.ai/install.ps1 | iex" },
      { type: "code", label: "Homebrew", text: "brew install --cask claude-code" },
      { type: "p", text: "装完开一个新终端，确认能打印版本号。提示找不到 claude，通常是安装目录还没进 PATH。Windows 建议装 Git for Windows。" },
      { type: "code", text: "claude --version" },
      { type: "h2", text: "第二步：进项目，登录" },
      { type: "code", text: "cd 你的项目目录\nclaude" },
      { type: "p", text: "第一次会让你在浏览器里登录。登录一次就记住了，之后要换账号在里面输入 /login。" },
      { type: "h2", text: "第三步：按这个顺序试" },
      {
        type: "steps",
        items: [
          { title: "先问，不动手", text: "问它「这个项目是做什么的」「入口在哪」。它会自己读需要的文件，不用手动贴。" },
          { title: "改一处小的", text: "比如「给主文件加一个 hello world 函数」。它会先给你看改动，问你批不批。" },
          { title: "用 Git 收尾", text: "说「我改了哪些文件」「用一句清楚的话提交」。分支和合并冲突也能直接说。" },
          { title: "再做真任务", text: "修 bug、写测试、改 README。把现象和期望都写清楚。" },
        ],
      },
      { type: "h2", text: "常用命令" },
      {
        type: "table",
        headers: ["命令", "干什么"],
        rows: [
          ["claude", "开始交互"],
          ["claude \"任务\"", "带着任务开始"],
          ["claude -p \"问题\"", "问一次就退出"],
          ["claude -c", "接着当前目录最近的对话"],
          ["claude -r", "选一个以前的对话继续"],
          ["/help", "看所有命令"],
          ["/clear", "清空对话，换任务时用"],
          ["Shift + Tab", "切换权限模式"],
        ],
      },
      { type: "h2", text: "新手最容易踩的坑" },
      {
        type: "check",
        items: [
          "任务太模糊。别说「修一下 bug」，要说「输错密码后页面空白，修这个」。",
          "一次要太多。大任务拆成几步，一步步确认。",
          "换任务不清空。上一个任务的上下文会一直占额度，换任务就 /clear。",
          "不看改动就批。至少看一眼它要改什么，尤其是删除和命令。",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "用订阅还是 API Key",
        text: "设置了 ANTHROPIC_API_KEY 并同意使用时，它走按量计费，不走订阅额度。想用订阅额度的话，确认没有误设这个环境变量。",
      },
    ],
    sources: [QUICKSTART, USAGE, PRICING],
    next: ["claude-usage-save", "claude-first-week"],
  },
  {
    id: "claude-usage-save",
    category: "guide",
    title: "额度总不够：官方给的五个办法，和什么时候该升级",
    date: "2026-11-05",
    readMin: 4,
    summary: "同样的 Pro，有人一个窗口做半天活，有人半小时到顶。差别主要在这五件事上。",
    keyPoints: [
      "最有效的两招：长对话开新的，日常任务调低 effort。",
      "聊天、桌面端和 Claude Code 共用额度，别以为分开算。",
      "偶尔到顶用 usage credits，经常到顶再升级。",
    ],
    body: [
      { type: "h2", text: "什么最费额度" },
      { type: "p", text: "官方列了四样：对话越长越复杂越费、用的功能、选的模型、选的 effort 档位。claude.ai、Claude Code 和桌面端的用量都计入同一个限额。" },
      { type: "h2", text: "官方给的五个办法" },
      {
        type: "steps",
        items: [
          { title: "日常任务调低 effort", text: "改错字、翻译这类事不需要最高档。" },
          { title: "有开关的模型关掉 thinking", text: "简单问题用不上长时间思考。" },
          { title: "开新对话，别一直续", text: "话题换了就开新的，这是省额度最明显的一招。" },
          { title: "关掉用不到的连接和搜索", text: "连接的应用和联网搜索，不需要时就关。" },
          { title: "精简项目", text: "项目指令写短，用不到的文件删掉。" },
        ],
      },
      { type: "h2", text: "到顶了怎么办" },
      {
        type: "table",
        headers: ["情况", "怎么办"],
        rows: [
          ["一周到顶一两次", "等 5 小时窗口重置，先把不急的活放一放"],
          ["手头的活不能停", "开 usage credits，继续干，按量付费"],
          ["几乎每天都到顶", "算一下 Max，$100 档是 5× Pro，还带 $100 API credits"],
          ["主要是跑程序", "走 API，订阅账号不能跑脚本"],
        ],
      },
      { type: "tool", to: "/worth", title: "算算该不该升级", text: "填上你的月用量，看直连 API 要花多少、哪一档够用。" },
    ],
    sources: [USAGE, PRICING],
    next: ["sub-vs-api", "claude-code-start"],
  },
];

export const ARTICLE_FAQ_ZH: { q: string; a: string; to: string }[] = [
  {
    q: "中国大陆现在能合规使用 Claude 吗？",
    a: "人在中国大陆、香港或澳门时，这些地区不在 Anthropic 当前支持名单中。中国国籍本身不是限制条件。",
    to: "/articles/claude-region",
  },
  {
    q: "账号被封后怎么申诉？",
    a: "先确认提示是账号停用，而不是额度用尽或付款失败。登录被停用的原账号，用受限页面的申诉表，按真实情况填写。",
    to: "/articles/claude-appeal",
  },
  {
    q: "环境检测绿了，就能用 Claude 吗？",
    a: "不能。环境检测是第三方网络和浏览器提示，不是官方的资格查询，也查不到封禁原因。",
    to: "/articles/claude-safety",
  },
  {
    q: "本站的充值是官方渠道吗？",
    a: "不是。商店是推广位。第三方充值不能改变地区资格，也不应该向你要密码。部分商品要提交 SK 或 Token，商店里逐件标明了。",
    to: "/articles/third-party-recharge",
  },
];

function toEnglish(article: Article): Article {
  const en = ARTICLES_EN[article.id];
  if (!en) return article;
  return {
    ...article,
    ...en,
    sources: article.sources.map((source) => ({ ...source, label: SOURCE_LABELS_EN[source.href] ?? source.label })),
  };
}

export function articleList() {
  return currentLang() === "en" ? ARTICLES_ZH.map(toEnglish) : ARTICLES_ZH;
}

export function articleCategories() {
  if (currentLang() !== "en") return CATEGORIES_ZH;
  return CATEGORIES_ZH.map((cat) => ({ ...cat, ...CATEGORIES_EN[cat.id] }));
}

export function articleFaq() {
  if (currentLang() !== "en") return ARTICLE_FAQ_ZH;
  return ARTICLE_FAQ_ZH.map((item, i) => ({ ...item, ...FAQ_EN[i] }));
}

export function articleById(id: string) {
  const article = ARTICLES_ZH.find((a) => a.id === id);
  if (!article) return null;
  return currentLang() === "en" ? toEnglish(article) : article;
}
