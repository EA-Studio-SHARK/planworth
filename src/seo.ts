import { articleById, articleFaq } from "./data/articles";
import { briefByDate } from "./data/briefs";
import pages from "./seo/pages.json";

export const SITE_ORIGIN = "https://app.exploreai.chat";
export const SITE_NAME = "ExploreAI";
export const OG_IMAGE = `${SITE_ORIGIN}/og.png`;

const SAME_AS = [
  "https://github.com/EA-Studio-SHARK/planworth",
  "https://x.com/_ExploreAI",
  "https://t.me/ExploreAllStudio",
];

export type SeoDoc = {
  path: string;
  title: string;
  description: string;
  image: string;
  type: "website" | "article";
  jsonLd: Record<string, unknown>[];
};

type StaticPage = {
  path: string;
  title: string;
  description: string;
  titleEn: string;
  descriptionEn: string;
};

const STATIC = pages as StaticPage[];

export function canonicalPath(pathname: string) {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path: string) {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

function org() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/avatar.png`,
    sameAs: SAME_AS,
  };
}

function crumb(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    inLanguage: ["zh-CN", "en"],
    publisher: org(),
  };
}

function faqLd(lang: "zh" | "en") {
  const rows = articleFaq();
  if (!rows.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang === "en" ? "en" : "zh-CN",
    mainEntity: rows.map((row) => ({
      "@type": "Question",
      name: row.q,
      acceptedAnswer: { "@type": "Answer", text: row.a },
    })),
  };
}

export function resolveSeo(pathname: string, lang: "zh" | "en"): SeoDoc {
  const path = canonicalPath(pathname);
  const en = lang === "en";
  const articleId = path.startsWith("/articles/") ? path.slice("/articles/".length) : "";
  const article = articleId ? articleById(decodeURIComponent(articleId)) : null;
  if (article) {
    const title = `${article.title}｜${SITE_NAME}`;
    const url = absoluteUrl(`/articles/${article.id}`);
    return {
      path: `/articles/${article.id}`,
      title,
      description: article.summary,
      image: OG_IMAGE,
      type: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.summary,
          datePublished: article.date,
          inLanguage: en ? "en" : "zh-CN",
          mainEntityOfPage: url,
          author: org(),
          publisher: org(),
          image: OG_IMAGE,
        },
        crumb([
          { name: SITE_NAME, path: "/" },
          { name: en ? "Guides" : "专栏", path: "/claude" },
          { name: article.title, path: `/articles/${article.id}` },
        ]),
      ],
    };
  }

  const briefMatch = path.match(/^\/claude\/brief\/(\d{4}-\d{2}-\d{2})$/);
  if (briefMatch) {
    const brief = briefByDate(briefMatch[1]);
    if (brief && brief.date === briefMatch[1]) {
      const title = en ? brief.headlineEn : brief.headline;
      return {
        path,
        title: `${brief.date} ${en ? "brief" : "早报"}｜${SITE_NAME}`,
        description: title,
        image: OG_IMAGE,
        type: "article",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            datePublished: brief.date,
            description: title,
            inLanguage: en ? "en" : "zh-CN",
            mainEntityOfPage: absoluteUrl(path),
            author: org(),
            publisher: org(),
          },
        ],
      };
    }
  }

  const found = STATIC.find((page) => page.path === path) ?? STATIC[0];
  const title = en ? found.titleEn : found.title;
  const description = en ? found.descriptionEn : found.description;
  const jsonLd: Record<string, unknown>[] = path === "/" ? [websiteLd()] : [];
  if (path === "/") {
    const faq = faqLd(lang);
    if (faq) jsonLd.push(faq);
  }
  return { path: found.path, title, description, image: OG_IMAGE, type: "website", jsonLd };
}
