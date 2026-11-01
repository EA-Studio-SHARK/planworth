import { Link, useParams } from "react-router-dom";
import { articleById } from "../data/articles";

export function ArticlePage() {
  const { id } = useParams();
  const article = id ? articleById(id) : null;
  if (!article) {
    return (
      <>
        <h1 className="page-title">没有这篇文章</h1>
        <p>
          <Link to="/articles">返回文章列表</Link>
        </p>
      </>
    );
  }
  return (
    <article className="prose">
      <p className="small">
        <Link to="/articles">文章</Link> / {article.date}
      </p>
      <h1>{article.title}</h1>
      {article.body.map((block, i) => {
        if (block.type === "p") return <p key={i}>{block.text}</p>;
        if (block.type === "h2") return <h2 key={i}>{block.text}</h2>;
        if (block.type === "ul") {
          return (
            <ul key={i}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "note") {
          return (
            <p className="note" key={i}>
              {block.text}
            </p>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={i}>
              {block.text}
              {block.cite ? <cite>{block.cite}</cite> : null}
            </blockquote>
          );
        }
        if (block.type === "table") {
          return (
            <div className="table-wrap" key={i}>
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
                    <tr key={row.join("-")}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <div className="links" key={i}>
            {block.items.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        );
      })}
    </article>
  );
}
