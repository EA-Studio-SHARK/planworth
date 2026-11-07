import { Link } from "react-router-dom";
import { usePrefs } from "../context/Prefs";

const CHECKCC = "https://github.com/yacuo/check-cc.git";
const FINGERPOINT = "https://github.com/Ikaleio/lm-detector";

export function DisclaimerPage() {
  const { t } = usePrefs();

  const sections = [
    { title: t.discS1Title, body: t.discS1 },
    { title: t.discS2Title, body: t.discS2 },
    { title: t.discS3Title, body: t.discS3 },
    { title: t.discS4Title, body: t.discS4 },
    { title: t.discS5Title, body: t.discS5 },
    { title: t.discS6Title, body: t.discS6 },
    { title: t.discS7Title, body: t.discS7 },
  ];

  return (
    <div className="legal-page">
      <header className="page-head">
        <p className="kicker">{t.discKicker}</p>
        <h1 className="page-title">{t.discTitle}</h1>
        <p className="lede">{t.discLede}</p>
      </header>

      <div className="legal">
        {sections.map((section) => (
          <section className="block" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <p className="credit">
        CheckCC · <a href={CHECKCC} target="_blank" rel="noreferrer">{CHECKCC}</a>
        <br />
        Fingerpoint · <a href={FINGERPOINT} target="_blank" rel="noreferrer">{FINGERPOINT}</a>
        <br />
        {t.discUpdated}
        {" · "}
        <Link to="/partners">{t.navPartners}</Link>
        {" · "}
        <Link to="/shop">{t.navShop}</Link>
      </p>
    </div>
  );
}
