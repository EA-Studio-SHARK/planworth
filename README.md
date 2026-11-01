# 对照台 Planworth

单个产品：把 ChatGPT、Claude、Cursor 等订阅换算成 API token 价值，按模型和月用量推荐套餐，并带推广代充与文章。

适合挂在 GitHub Pages。没有 GitHub 热门项目目录。

## 本地

```bash
npm install
npm run dev
```

打开 http://localhost:5173/

## 数据

- `src/data/plans.ts`：套餐。Claude / ChatGPT / Cursor 主力档核验于 2026-11-01 官网；其余来自 2026-08-18 订阅核验 JSON。
- `src/data/api-models.ts`：API 牌价（Anthropic、OpenAI 2026-11-01）。
- `src/data/shop.ts`：EA小铺推广商品快照 2026-10-31。标「推广」，非官方渠道。
- `src/data/subscriptions.raw.json`：原始核验表，供对照，页面不直接渲染。

未公开的精确 token 配额写成「未获取」或「官方未公开」，不用估算数冒充官方配额。自带 API credits 才写成美元。

## 发布 GitHub Pages

`vite.config.ts` 使用 `base: './'`，路由是 HashRouter。把 `npm run build` 的 `dist/` 推到 `gh-pages` 即可。未接到「发布」前不要 push。
