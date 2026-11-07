// Refreshes prices and stock for the curated shop items, and reports anything new in the shop.
// New products are never listed automatically: someone has to read what they ask the buyer for,
// state it in `credential`, and check they are not number farms or ready-made accounts.
import fs from "node:fs";

const TOKEN = "D1740DED";
const date = process.argv[2] ?? new Date().toLocaleDateString("sv", { timeZone: "Asia/Shanghai" });
const res = await fetch("https://wzyp.cn/shopApi/Shop/goodsList", {
  method: "POST",
  headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
  body: JSON.stringify({ token: TOKEN, keywords: "", category_id: 0, goods_type: "card", current: 1, pageSize: 100 }),
});
const body = await res.json();
if (body.code !== 1) throw new Error(`shop API: ${body.msg}`);

const path = "src/data/shop-live.json";
const known = JSON.parse(fs.readFileSync(path, "utf8"));
const items = {};
for (const g of body.data.list) items[g.goods_key] = { price: g.price, stock: g.extend?.stock_count ?? 0 };
const listed = Object.keys(known.items);
const missing = listed.filter((k) => !items[k]);
const fresh = Object.keys(items).filter((k) => !listed.includes(k) && !(known.excluded ?? []).includes(k));
const next = {
  snapshot: date,
  excluded: known.excluded ?? [],
  items: Object.fromEntries(listed.map((k) => [k, items[k] ?? { price: known.items[k].price, stock: 0 }])),
};
fs.writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
console.log(`${date}: ${listed.length} listed, ${missing.length} gone from the shop, ${fresh.length} new to review`);
for (const k of missing) console.log(`  gone: ${k}`);
for (const g of body.data.list) if (fresh.includes(g.goods_key)) console.log(`  review: ${g.goods_key} ${g.name}`);
