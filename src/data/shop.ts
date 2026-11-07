import live from "./shop-live.json";
import type { Family, ShopItem } from "./types";

export const SHOP_URL = "https://wzyp.cn/shop/D1740DED";
export const SHOP_NAME = "EA小铺";
export const SHOP_SNAPSHOT = live.snapshot;

type Curated = Omit<ShopItem, "priceCny" | "stock" | "url" | "promo">;

/**
 * Number farms, ready-made accounts, and anything that needs the seller to log in or the buyer to
 * send a password are left out (see `excluded` in shop-live.json). `credential` states what each
 * remaining item needs, and the page shows it. scripts/fetch-shop.mjs refreshes price and stock.
 */
const CURATED: Curated[] = [
  { id: "ryz1gn", family: "claude", name: "Claude Pro 月卡充值", nameEn: "Claude Pro monthly top-up", officialEquivalent: "Claude Pro $20 / 月", officialEquivalentEn: "Claude Pro, $20 / month", officialUsd: 20, tier: "main", credential: "sk" },
  { id: "jm28vy", family: "claude", name: "Claude Max 5× 月卡充值", nameEn: "Claude Max 5× monthly top-up", officialEquivalent: "Claude Max $100 / 月", officialEquivalentEn: "Claude Max, $100 / month", officialUsd: 100, tier: "main", credential: "sk" },
  { id: "oxq6b6", family: "gpt", name: "ChatGPT Plus 自助卡密", nameEn: "ChatGPT Plus self-serve code", officialEquivalent: "ChatGPT Plus $20 / 月", officialEquivalentEn: "ChatGPT Plus, $20 / month", officialUsd: 20, tier: "main", credential: "code" },
  { id: "dilygu", family: "gpt", name: "ChatGPT Pro 5× 月卡", nameEn: "ChatGPT Pro 5× monthly", officialEquivalent: "ChatGPT Pro 100 $100 / 月", officialEquivalentEn: "ChatGPT Pro 100, $100 / month", officialUsd: 100, tier: "main", credential: "token" },
  { id: "z905r7", family: "grok", name: "SuperGrok Plus 月卡", nameEn: "SuperGrok Plus monthly", officialEquivalent: "SuperGrok Plus $100 / 月", officialEquivalentEn: "SuperGrok Plus, $100 / month", officialUsd: 100, tier: "main", credential: "code" },
  { id: "ukj15b", family: "claude", name: "Claude Max 20× 月卡", nameEn: "Claude Max 20× monthly", officialEquivalent: "Claude 高档会员（以店铺说明为准）", officialEquivalentEn: "A top Claude plan (see the shop's notes)", tier: "more", credential: "sk" },
  { id: "kojl87", family: "gpt", name: "ChatGPT Plus iOS 渠道", nameEn: "ChatGPT Plus, iOS channel", officialEquivalent: "ChatGPT Plus $20 / 月", officialEquivalentEn: "ChatGPT Plus, $20 / month", officialUsd: 20, tier: "more", credential: "code" },
  { id: "kgkvpw", family: "gpt", name: "ChatGPT Plus iOS 直充", nameEn: "ChatGPT Plus, iOS direct", officialEquivalent: "ChatGPT Plus $20 / 月", officialEquivalentEn: "ChatGPT Plus, $20 / month", officialUsd: 20, tier: "more", credential: "code" },
  { id: "s6oqa2", family: "gpt", name: "ChatGPT Pro 500 月卡", nameEn: "ChatGPT Pro 500 monthly", officialEquivalent: "ChatGPT Pro 500 $500 / 月", officialEquivalentEn: "ChatGPT Pro 500, $500 / month", officialUsd: 500, tier: "more", credential: "code" },
  { id: "v7idaa", family: "grok", name: "Grok Ultra 充值码", nameEn: "Grok Ultra top-up code", officialEquivalent: "Grok 高档会员（以店铺说明为准）", officialEquivalentEn: "A top Grok plan (see the shop's notes)", tier: "more", credential: "userId" },
];

const liveItems: Record<string, { price: number; stock: number }> = live.items;

export const shopItems: ShopItem[] = CURATED.map((item) => ({
  ...item,
  priceCny: liveItems[item.id]?.price ?? 0,
  stock: liveItems[item.id]?.stock ?? 0,
  url: `https://wzyp.cn/item/${item.id}`,
  promo: true,
}));

export function shopOf(family: Family) {
  return shopItems.filter((s) => s.family === family && s.stock > 0);
}

export function formatCny(n: number) {
  return `¥${n.toLocaleString("zh-CN", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
