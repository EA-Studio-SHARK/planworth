import { Link } from "react-router-dom";
import { articles } from "../data/articles";

export function ArticlesPage() {
  return (
    <>
      <p className="kicker">说明与专栏</p>
      <h1 className="page-title">文章</h1>
      <p className="lede">
        先放 Claude 封号与申诉、订阅换算方法、代充边界。不写虚拟号、接码、批量注册或地区伪装。
      </p>
      <div className="article-list">
        {articles.map((a) => (
          <Link className="article-card" key={a.id} to={`/articles/${a.id}`}>
            <time dateTime={a.date}>{a.date}</time>
            <h2>{a.title}</h2>
            <p>{a.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
