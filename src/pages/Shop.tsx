import { ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { usePrefs } from "../context/Prefs";
import { loc } from "../lib/localize";
import { formatCny, SHOP_NAME, SHOP_SNAPSHOT, SHOP_URL, shopItems } from "../data/shop";

export function ShopPage() {
  const { t, lang } = usePrefs();
  const c = t.shop;
  const en = lang === "en";
  const main = shopItems.filter((i) => i.tier === "main");
  const more = shopItems.filter((i) => i.tier === "more");
  const families = [...new Set(shopItems.map((i) => i.family))];
  return (
    <div className="shop2">
      <header className="page-hero">
        <p className="kicker">{c.kicker}</p>
        <h1>{c.title}</h1>
        <p>{c.lede}</p>
      </header>

      <div className="shop2-grid">
        {main.map((item, i) => {
          const out = item.stock <= 0;
          return (
            <article key={item.id} className={`shop2-card ${i === 0 ? "is-lead" : ""}`}>
              <div className="shop2-top">
                <BrandMark family={item.family} size={34} />
                <em>{c.promo}</em>
              </div>
              <h2>{en ? item.nameEn : item.name}</h2>
              <p className="shop2-map">{c.maps(en ? item.officialEquivalentEn : item.officialEquivalent)}</p>
              <p className="shop2-price">{formatCny(item.priceCny)}</p>
              <p className={`shop2-cred ${item.credential === "sk" || item.credential === "token" ? "is-warn" : ""}`}>
                {c.credential[item.credential]}
              </p>
              <p className="shop2-stock">{out ? c.soldOut(SHOP_SNAPSHOT) : c.stock(item.stock, SHOP_SNAPSHOT)}</p>
              <div className="shop2-actions">
                {out ? (
                  <span className="cta is-ghost is-disabled">{c.soldOutBtn}</span>
                ) : (
                  <a className="cta is-blue" href={item.url} target="_blank" rel="noreferrer">
                    {c.buy} <ArrowUpRight size={15} weight="bold" />
                  </a>
                )}
                <Link className="cta is-ghost" to={`/worth?family=${item.family}`}>
                  {c.compare}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <section className="shop2-more" aria-label={c.moreTitle}>
        <div className="shop2-more-head">
          <div>
            <h2 className="page-rows-title">{c.moreTitle}</h2>
            <p>{c.moreLede}</p>
          </div>
          <div className="shop2-logos" aria-hidden>
            {families.map((f) => (
              <BrandMark key={f} family={f} size={30} />
            ))}
          </div>
        </div>
        <ul className="shop2-more-grid">
          {more.map((item) => (
            <li key={item.id}>
              <a href={item.url} target="_blank" rel="noreferrer">
                <BrandMark family={item.family} size={24} />
                <span>
                  <b>{en ? item.nameEn : item.name}</b>
                  <small>{en ? item.officialEquivalentEn : item.officialEquivalent}</small>
                  <small className={item.credential === "sk" || item.credential === "token" ? "is-warn" : ""}>
                    {c.credential[item.credential]}
                  </small>
                </span>
                <em>{formatCny(item.priceCny)}</em>
              </a>
            </li>
          ))}
        </ul>
        <a className="shop2-all" href={SHOP_URL} target="_blank" rel="noreferrer">
          {c.moreAll} <ArrowUpRight size={15} weight="bold" />
        </a>
      </section>

      <h2 className="page-rows-title">{c.checkTitle}</h2>
      <ol className="page-rows">
        <li>
          <b>{c.check1Title}</b>
          <span>{c.check1}</span>
        </li>
        <li>
          <b>{c.check2Title}</b>
          <span>{c.check2}</span>
        </li>
        <li>
          <b>{c.check3Title}</b>
          <span>
            {c.check3} <Link to="/articles/claude-billing">{c.readPay}</Link>
          </span>
        </li>
      </ol>

      <p className="page-foot">
        {loc(SHOP_NAME)} · {c.ownNote} <Link to="/articles/third-party-recharge">{c.readTop}</Link>
        {" · "}
        <Link to="/disclaimer">{c.readDisc}</Link>
        {" · "}
        <a href={SHOP_URL} target="_blank" rel="noreferrer">
          {c.openShop}
        </a>
      </p>
    </div>
  );
}
