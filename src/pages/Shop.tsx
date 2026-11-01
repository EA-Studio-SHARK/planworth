import { Link } from "react-router-dom";
import { FAMILY_LABEL } from "../data/types";
import { formatCny, SHOP_NAME, SHOP_SNAPSHOT, SHOP_URL, shopItems } from "../data/shop";

export function ShopPage() {
  return (
    <>
      <p className="kicker">推广 · {SHOP_NAME}</p>
      <h1 className="page-title">直充</h1>
      <p className="lede">
        对照完套餐可以走店铺卡密。这是推广位，不是 Anthropic / OpenAI / Cursor 官方渠道。
        官方禁止账号共享；不要把密码或验证码发给任何人。
      </p>
      <p className="disclaimer">
        快照 {SHOP_SNAPSHOT}。库存以店铺页面为准。人在 Claude 不支持地区时，代充不能授予使用资格。
        先读 <Link to="/articles/claude-safety">Claude 封号与申诉</Link>
        {" · "}
        <Link to="/articles/third-party-recharge">代充说明</Link>
        {" · "}
        <a href={SHOP_URL} target="_blank" rel="noreferrer">打开店铺</a>
      </p>
      <div className="shop-grid">
        {shopItems.map((s) => (
          <article className="shop-card" key={s.id}>
            <span className="tag is-promo">推广</span>
            <h2 style={{ margin: 0, fontSize: 15 }}>{s.name}</h2>
            <div className="price">{formatCny(s.priceCny)}</div>
            <p className="small">
              {FAMILY_LABEL[s.family]} · 对应 {s.officialEquivalent}
              <br />
              快照库存 {s.stock}
            </p>
            <a className="cta is-promo" href={s.url} target="_blank" rel="noreferrer">
              去购买
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
