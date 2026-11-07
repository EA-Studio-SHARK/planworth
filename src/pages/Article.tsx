import { ArrowRight, ArrowUpRight, CheckCircle, Copy, Lightbulb, Warning } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CourseCta } from "../components/CourseCta";
import { usePrefs } from "../context/Prefs";
import { articleById, articleCategories } from "../data/articles";
import type { ArticleBlock } from "../data/types";

function CodeBlock({ label, text }: { label?: string; text: string }) {
  const { t } = usePrefs();
  const [copied, setCopied] = useState(false);
  return (
    <figure className="art-code">
      {label ? <figcaption>{label}</figcaption> : null}
      <pre>
        <code>{text}</code>
      </pre>
      <button
        type="button"
        aria-label={t.fpCopy}
        onClick={() => {
          void navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? t.fpCopied : <Copy size={15} />}
      </button>
    </figure>
  );
}

function Block({ block, id }: { block: ArticleBlock; id: string }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return <h2 id={id}>{block.text}</h2>;
    case "ul":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="art-steps">
          {block.items.map((item, i) => (
            <li key={item.title}>
              <em>{i + 1}</em>
              <div>
                <b>{item.title}</b>
                <span>{item.text}</span>
              </div>
            </li>
          ))}
        </ol>
      );
    case "check":
      return (
        <ul className="art-check">
          {block.items.map((item) => (
            <li key={item}>
              <CheckCircle size={20} weight="fill" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside className={`art-callout is-${block.tone}`}>
          {block.tone === "warn" ? <Warning size={20} weight="fill" /> : <Lightbulb size={20} weight="fill" />}
          <div>
            <b>{block.title}</b>
            <span>{block.text}</span>
          </div>
        </aside>
      );
    case "code":
      return <CodeBlock label={block.label} text={block.text} />;
    case "tool":
      return (
        <Link to={block.to} className="art-tool">
          <span>
            <b>{block.title}</b>
            {block.text}
          </span>
          <ArrowRight size={18} weight="bold" />
        </Link>
      );
    case "quote":
      return (
        <blockquote>
          {block.text}
          {block.cite ? <cite>{block.cite}</cite> : null}
        </blockquote>
      );
    case "table":
      return (
        <div className="table-wrap art-table">
          <table>
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function ArticlePage() {
  const { t } = usePrefs();
  const c = t.col;
  const { id } = useParams();
  const article = id ? articleById(id) : null;

  if (!article) {
    return (
      <div className="col2">
        <h1 className="page-title">{c.notFound}</h1>
        <Link to="/claude">{c.backToList}</Link>
      </div>
    );
  }

  const category = articleCategories().find((x) => x.id === article.category);
  const toc = article.body.flatMap((block, i) => (block.type === "h2" ? [{ id: `sec-${i}`, text: block.text }] : []));

  return (
    <div className="art">
      <article className="art-main">
        <p className="art-crumb">
          <Link to="/claude">{c.title}</Link> / {category?.title}
        </p>
        <h1>{article.title}</h1>
        <p className="art-meta">
          {c.read(article.readMin)} · {c.checked} {article.date}
        </p>

        <section className="art-points" aria-label={c.keyPoints}>
          <b>{c.keyPoints}</b>
          <ul>
            {article.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <div className="art-body">
          {article.body.map((block, i) => (
            <Block key={i} block={block} id={`sec-${i}`} />
          ))}
        </div>

        <section className="art-sources">
          <h2>{c.sources}</h2>
          <ul>
            {article.sources.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer">
                  {s.label} <ArrowUpRight size={13} />
                </a>
              </li>
            ))}
          </ul>
          <p>{c.foot}</p>
        </section>

        <section className="art-next">
          <h2>{c.next}</h2>
          <div>
            {article.next.map((nextId) => {
              const a = articleById(nextId);
              return a ? (
                <Link key={nextId} to={`/articles/${nextId}`} className="col2-card">
                  <b>{a.title}</b>
                  <span>{a.summary}</span>
                </Link>
              ) : null;
            })}
          </div>
        </section>

        <CourseCta />
      </article>

      <nav className="art-toc" aria-label={c.toc}>
        <b>{c.toc}</b>
        {toc.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
