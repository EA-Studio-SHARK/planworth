# ExploreAI

**充值一件套：文案 → 使用 → 充值 → 环境 → 指纹。**

官网：<https://app.exploreai.chat>

帮你在给 AI 工具付费之前算清楚：同样的钱换哪个模型最划算，官方规则怎么走，当前环境和模型是不是你以为的那样。

## 里面有什么

| 页面 | 做什么 |
| --- | --- |
| 专栏 | 防封号、充值和使用教程，只讲官方规则和申诉 |
| 每日早报 | 每天筛选 GitHub 和 Product Hunt 上值得看的 AI 项目，中英双语 |
| 对照 | 117 个套餐、49 个模型，同样的钱能换多少，可以导入自己的账单 |
| 商店 | 推广商品，逐件标明对应的官方档位和需要提交什么。这不是官方渠道 |
| 环境 | 检查 IP、时区、语言和连通性 |
| 指纹 | 判断 API 背后实际是哪个模型 |

## 隐私

静态站，没有后端和用户数据库。对照和指纹只在你的浏览器里计算；环境检测开始后才会连第三方查询 IP 和连通性，名单写在环境页上。

## 本地运行

```bash
npm install
npm run dev
```

然后打开 <http://localhost:5173/>。

## 数据怎么来

- 套餐和 API 价格来自官方页。`confidence: "live"` 表示已对照官方页，`"index"` 表示还没逐页核对，页面显示「待复核」。
- 官方没公开的配额写成「推测」或「未获取」，不用估算数冒充。
- 英文是提前写好的静态内容，不会把页面内容发给翻译服务。`npm run build` 发现英文站有中文就会失败。

## 每日早报

标准写在 [scripts/BRIEF-RULES.md](scripts/BRIEF-RULES.md)。每期是 `src/data/briefs/` 下的一个文件，必须通过校验才会发布：

```bash
node scripts/check-brief.mjs
npm run build
```

校验会核对 star 数、项目是否真实存在、夸张用语、近期重复和链接是否可访问。不合格就不发，站点继续显示上一期。

自动流程：每天 06:30 GitHub Actions 抓素材，07:30 Claude 写稿并推到 `claude/brief-*` 分支，Actions 校验通过后才合并到 `main` 并部署。

## 致谢

环境检测和模型指纹基于 [CheckCC](https://github.com/yacuo/check-cc) 和 [LM Fingerpoint Detector](https://github.com/Ikaleio/lm-detector)，它们的版权和许可说明见 [third_party/NOTICE.md](third_party/NOTICE.md)。
