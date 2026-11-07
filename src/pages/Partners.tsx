import { Link } from "react-router-dom";
import { usePrefs } from "../context/Prefs";
import { articleList } from "../data/articles";
import { FAMILY_ORDER } from "../data/plans";

const X_URL = "https://x.com/_ExploreAI";
const TELEGRAM_URL = "https://t.me/ExploreAllStudio";

// Official marks, from simple-icons (CC0).
const TELEGRAM_MARK =
  "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z";
const X_MARK =
  "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";

function Mark({ d, size }: { d: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function PartnersPage() {
  const { t } = usePrefs();
  const c = t.coop;
  const types = [
    { title: t.coopFn1Title, bring: c.t1Bring, offer: c.t1Offer },
    { title: t.coopFn2Title, bring: c.t2Bring, offer: c.t2Offer },
    { title: t.coopFn3Title, bring: c.t3Bring, offer: c.t3Offer },
  ];

  return (
    <div className="coop-page">
      <header className="page-hero">
        <p className="kicker">{t.coopKicker}</p>
        <h1>{c.title}</h1>
        <p>{c.lede}</p>
        <div className="coop-links">
          <a className="cta is-blue" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
            <Mark d={TELEGRAM_MARK} size={22} />
            Telegram
          </a>
          <a className="cta is-ghost" href={X_URL} target="_blank" rel="noreferrer">
            <Mark d={X_MARK} size={18} />
            {c.xDm}
          </a>
        </div>
        <p className="coop-hint">{c.ctaBody}</p>
      </header>

      <div className="coop-stats">
        <div>
          <b>{FAMILY_ORDER.length}</b>
          <span>{c.statProducts}</span>
        </div>
        <div>
          <b>{articleList().length}</b>
          <span>{c.statArticles}</span>
        </div>
        <div>
          <b>5</b>
          <span>{c.statTools}</span>
        </div>
      </div>

      <h2 className="page-rows-title">{c.typesTitle}</h2>
      <ol className="page-rows coop-types">
        {types.map((type) => (
          <li key={type.title}>
            <b>{type.title}</b>
            <div>
              <small>{c.youBring}</small>
              <p>{type.bring}</p>
            </div>
            <div>
              <small>{c.weOffer}</small>
              <p>{type.offer}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="coop-no">
        <b>{c.noTitle}</b>
        {t.coopNo} <Link to="/disclaimer">{c.noRead}</Link>
      </p>
    </div>
  );
}
