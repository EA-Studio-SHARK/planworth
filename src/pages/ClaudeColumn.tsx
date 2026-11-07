import { ArrowRight, ArrowUpRight, CaretDown, GithubLogo, RocketLaunch } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CourseCta } from "../components/CourseCta";
import { GlassTabs } from "../components/GlassTabs";
import { usePrefs } from "../context/Prefs";
import { articleById, articleCategories, articleFaq, articleList } from "../data/articles";
import { briefByDate, briefs, type BriefItem } from "../data/briefs";

const START_HERE = ["claude-safety", "claude-billing", "claude-first-week"];

function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(n);
}

export function ClaudeColumnPage({ tab }: { tab: "articles" | "brief" }) {
  const { t } = usePrefs();
  const navigate = useNavigate();
  return (
    <div className="col2">
      <header className="page-hero col2-hero">
        <h1>{tab === "brief" ? t.col.briefTitle : t.col.heroTitle}</h1>
        <p>{tab === "brief" ? t.col.briefLede : t.col.lede}</p>
      </header>
      <GlassTabs
        ariaLabel={t.navClaude}
        value={tab}
        onChange={(id) => navigate(id === "brief" ? "/claude/brief" : "/claude")}
        tabs={[
          { id: "articles", label: t.col.tabArticles },
          { id: "brief", label: t.col.tabBrief },
        ]}
      />
      {tab === "brief" ? <BriefView /> : <Library />}
      <CourseCta />
    </div>
  );
}

function Library() {
  const { t, lang } = usePrefs();
  const c = t.col;
  const brief = briefs[0];
  const articles = articleList();
  const categories = articleCategories();
  const [filter, setFilter] = useState("all");
  const [lead, ...rest] = START_HERE.flatMap((id) => articleById(id) ?? []);
  const catTitle = (id: string) => categories.find((x) => x.id === id)?.title;
  const shown = articles.filter((a) => filter === "all" || a.category === filter);

  return (
    <>
      <section aria-label={c.startHere}>
        <h2 className="col2-h">{c.startHere}</h2>
        <div className="col2-start">
          <Link to={`/articles/${lead.id}`} className="col2-card is-lead">
            <em>{catTitle(lead.category)}</em>
            <b>{lead.title}</b>
            <span>{lead.summary}</span>
            <small>{c.read(lead.readMin)}</small>
          </Link>
          {rest.map((a) => (
            <Link key={a.id} to={`/articles/${a.id}`} className="col2-card">
              <em>{catTitle(a.category)}</em>
              <b>{a.title}</b>
              <span>{a.summary}</span>
              <small>{c.read(a.readMin)}</small>
            </Link>
          ))}
        </div>
      </section>

      <Link to="/claude/brief" className="col2-brief-link">
        <span>
          <em>
            {c.briefTitle} · {brief.date}
          </em>
          {lang === "en" ? brief.headlineEn : brief.headline}
        </span>
        <ArrowRight size={18} weight="bold" />
      </Link>

      <section>
        <div className="col2-list-head">
          <h2 className="col2-h">{c.allArticles(articles.length)}</h2>
          <GlassTabs
            size="sm"
            ariaLabel={c.allArticles(articles.length)}
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: "all", label: c.filterAll },
              ...categories.map((cat) => ({ id: cat.id, label: cat.title })),
            ]}
          />
        </div>
        <ol className="col2-rows">
          {shown.map((a) => (
            <li key={a.id}>
              <Link to={`/articles/${a.id}`}>
                <em>{catTitle(a.category)}</em>
                <div>
                  <b>{a.title}</b>
                  <span>{a.summary}</span>
                </div>
                <small>{c.read(a.readMin)}</small>
                <ArrowRight size={18} />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="col2-h">{c.faq}</h2>
        <div className="col2-faq">
          {articleFaq().map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <CaretDown size={16} weight="bold" />
              </summary>
              <p>
                {item.a} <Link to={item.to}>{c.readMore}</Link>
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function ItemRow({ item }: { item: BriefItem }) {
  const { t, lang } = usePrefs();
  const c = t.col;
  return (
    <li className="brief-item">
      <span className={`brief-src is-${item.source}`} title={item.source === "github" ? "GitHub" : "Product Hunt"}>
        {item.source === "github" ? <GithubLogo size={18} /> : <RocketLaunch size={18} />}
      </span>
      <div>
        <a href={item.url} target="_blank" rel="noreferrer">
          {item.name} <ArrowUpRight size={13} />
        </a>
        <p>{lang === "en" ? item.en : item.zh}</p>
        {item.related ? (
          <Link to={item.related.to}>{lang === "en" ? item.related.labelEn : item.related.label}</Link>
        ) : null}
      </div>
      <span className="brief-num">
        {item.source === "producthunt" ? (
          c.launch
        ) : item.gain != null ? (
          <>
            <b>+{item.gain.toLocaleString("en-US")}</b>
            <small>★ {compact(item.stars ?? 0)}</small>
          </>
        ) : (
          <>
            <b>{c.newRepo}</b>
            <small>★ {compact(item.stars ?? 0)}</small>
          </>
        )}
      </span>
    </li>
  );
}

function BriefView() {
  const { t, lang } = usePrefs();
  const c = t.col;
  const { date } = useParams();
  const brief = briefByDate(date);
  if (!brief) {
    return (
      <p>
        {c.noIssue} <Link to="/claude/brief">{c.latest}</Link>
      </p>
    );
  }
  const en = lang === "en";
  const count = 1 + brief.sections.reduce((n, s) => n + s.items.length, 0);
  return (
    <article className="brief">
      <p className="brief-date">
        {brief.date} · {c.briefCount(count)}
      </p>
      <p className="brief-headline">{en ? brief.headlineEn : brief.headline}</p>

      <section className="brief-lead">
        <em>{c.briefLead}</em>
        <a href={brief.lead.url} target="_blank" rel="noreferrer">
          {brief.lead.name} <ArrowUpRight size={18} />
        </a>
        <p>{en ? brief.lead.en : brief.lead.zh}</p>
        <p className="brief-why">{en ? brief.lead.whyEn : brief.lead.why}</p>
        <span className="brief-lead-num">
          {brief.lead.gain != null ? (
            <>
              <b>+{brief.lead.gain.toLocaleString("en-US")}</b> {c.gainIn(brief.days)}
            </>
          ) : (
            <b>{c.newRepo}</b>
          )}{" "}
          · ★ {compact(brief.lead.stars ?? 0)}
        </span>
      </section>

      {brief.sections.map((s) => (
        <section key={s.title}>
          <h2 className="col2-h">{en ? s.titleEn : s.title}</h2>
          <ol className="brief-list">
            {s.items.map((item) => (
              <ItemRow key={item.url} item={item} />
            ))}
          </ol>
        </section>
      ))}

      <p className="brief-basis">{c.briefBasis}</p>
      {briefs.length > 1 ? (
        <nav className="block-links" aria-label={c.archive}>
          {c.archive}
          {briefs.map((b) => (
            <Link key={b.date} to={`/claude/brief/${b.date}`}>
              {b.date}
            </Link>
          ))}
        </nav>
      ) : null}
    </article>
  );
}
