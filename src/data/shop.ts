import type { Family, ShopItem } from "./types";

export const SHOP_URL = "https://pay.ldxp.cn/shop/D1740DED";
export const SHOP_NAME = "EA小铺";
export const SHOP_SNAPSHOT = "2026-10-31";

export const shopItems: ShopItem[] = [
  {
    id: "ryz1gn",
    family: "claude",
    name: "Claude Pro 月卡充值",
    priceCny: 156,
    stock: 3,
    url: "https://pay.ldxp.cn/item/ryz1gn",
    promo: true,
    officialEquivalent: "Claude Pro $20 / 月",
  },
  {
    id: "oxq6b6",
    family: "gpt",
    name: "ChatGPT Plus 自助卡密（质保）",
    priceCny: 151,
    stock: 9,
    url: "https://pay.ldxp.cn/item/oxq6b6",
    promo: true,
    officialEquivalent: "ChatGPT Plus $20 / 月",
  },
  {
    id: "ifybsa",
    family: "cursor",
    name: "Cursor Pro 月卡",
    priceCny: 127.57,
    stock: 48,
    url: "https://pay.ldxp.cn/item/ifybsa",
    promo: true,
    officialEquivalent: "Cursor 个人付费档（以官网现价为准）",
  },
  {
    id: "cgs51d",
    family: "gemini",
    name: "Gemini Pro 一年卡密",
    priceCny: 33,
    stock: 75,
    url: "https://pay.ldxp.cn/item/cgs51d",
    promo: true,
    officialEquivalent: "Google AI Pro 约 $19.99 / 月",
  },
  {
    id: "36xsc9",
    family: "gpt",
    name: "GPT Pro 20x CDK 官网卡充",
    priceCny: 1160,
    stock: 6,
    url: "https://pay.ldxp.cn/item/36xsc9",
    promo: true,
    officialEquivalent: "ChatGPT Pro 高档（官网 From $100）",
  },
];

export function shopOf(family: Family) {
  return shopItems.filter((s) => s.family === family);
}

export function formatCny(n: number) {
  return `¥${n.toLocaleString("zh-CN", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
