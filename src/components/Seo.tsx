import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePrefs } from "../context/Prefs";
import { absoluteUrl, resolveSeo } from "../seo";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Per-route title, description, canonical and share cards. Crawlers that run JS see this. */
export function Seo() {
  const { pathname } = useLocation();
  const { lang } = usePrefs();

  useEffect(() => {
    const doc = resolveSeo(pathname, lang);
    const url = absoluteUrl(doc.path);
    document.title = doc.title;
    upsertMeta("name", "description", doc.description);
    upsertMeta("name", "robots", "index, follow");
    upsertLink("canonical", url);
    upsertMeta("property", "og:title", doc.title);
    upsertMeta("property", "og:description", doc.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", doc.type);
    upsertMeta("property", "og:image", doc.image);
    upsertMeta("property", "og:site_name", "ExploreAI");
    upsertMeta("property", "og:locale", lang === "en" ? "en_US" : "zh_CN");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", doc.title);
    upsertMeta("name", "twitter:description", doc.description);
    upsertMeta("name", "twitter:image", doc.image);

    const prev = document.getElementById("seo-ld");
    prev?.remove();
    if (doc.jsonLd.length) {
      const script = document.createElement("script");
      script.id = "seo-ld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(doc.jsonLd.length === 1 ? doc.jsonLd[0] : doc.jsonLd);
      document.head.appendChild(script);
    }
  }, [pathname, lang]);

  return null;
}
