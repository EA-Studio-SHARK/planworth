import { ChartBar, Fingerprint, GlobeSimple, Handshake, House, ShieldCheck, Storefront } from "@phosphor-icons/react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { usePrefs } from "../context/Prefs";
import { GlassNav } from "./GlassTabs";
import { LanguageToggle, ThemeToggle } from "./PrefMenus";
import { ScrollToTop } from "./ScrollToTop";

const GITHUB = "https://github.com/EA-Studio-SHARK/planworth";

export function Shell() {
  const { t } = usePrefs();

  const links = [
    { to: "/", label: t.navHome, end: true, icon: <House size={18} weight="regular" /> },
    { to: "/worth", label: t.navWorth, icon: <ChartBar size={18} weight="regular" /> },
    { to: "/claude", also: "/articles", label: t.navClaude, icon: <ShieldCheck size={18} weight="regular" /> },
    { to: "/fingerprint", label: t.navFp, icon: <Fingerprint size={18} weight="regular" /> },
    { to: "/checkcc", label: t.navEnv, icon: <GlobeSimple size={18} weight="regular" /> },
    { to: "/shop", label: t.navShop, icon: <Storefront size={18} weight="regular" /> },
    { to: "/partners", label: t.navPartners, icon: <Handshake size={18} weight="regular" /> },
  ];

  return (
    <div className="app">
      <ScrollToTop />
      <header className="chrome">
        <NavLink to="/" className="brand">
          <img className="brand-mark" src="./avatar.png" alt="ExploreAI" width={36} height={36} />
          <strong>{t.brand}</strong>
        </NavLink>
        <div className="chrome-center">
          <GlassNav links={links} />
        </div>
        <div className="chrome-right">
          <LanguageToggle />
          <ThemeToggle />
          <a className="star" href={GITHUB} target="_blank" rel="noreferrer" title="GitHub">
            <img className="github-mark" src="./github-mark.svg" width={20} height={20} alt="" />
            <span className="visually-hidden">GitHub</span>
          </a>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="site-foot">
        {t.footer}
        <br />
        {t.footerShop}
        <br />
        {t.footerCredit}
        <nav className="foot-links">
          <Link to="/partners">{t.navPartners}</Link>
          <Link to="/disclaimer">{t.discTitle}</Link>
        </nav>
      </footer>
    </div>
  );
}
