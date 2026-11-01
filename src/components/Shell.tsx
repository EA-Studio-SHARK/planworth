import { NavLink, Outlet } from "react-router-dom";

const GITHUB = "https://github.com/EA-Studio-SHARK/planworth";

const links = [
  { to: "/", label: "对照", end: true },
  { to: "/recommend", label: "推荐" },
  { to: "/articles", label: "文章" },
  { to: "/shop", label: "直充", promo: true },
];

export function Shell() {
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <strong>对照台</strong>
          <span>Planworth</span>
        </NavLink>
        <nav className="nav" aria-label="主导航">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `${isActive ? "is-on" : ""} ${l.promo ? "is-promo" : ""}`.trim()
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="top-right">
          <a className="gh" href={GITHUB} target="_blank" rel="noreferrer">
            EA-Studio-SHARK/planworth
          </a>
          <a className="star" href={GITHUB} target="_blank" rel="noreferrer">
            Star
          </a>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="site-foot">
        价格来自官方页面与 2026-08-18 订阅核验 JSON。未公开的 token 配额标为未获取。
        <br />
        直充为推广位，非官方渠道。对照在浏览器本地完成，不保存密钥。
      </footer>
    </div>
  );
}
