import { useEffect } from "react";

import { getPageMeta, SITE_URL } from "@/lib/pageMeta";

interface SeoOptions {
  title: string;
  description: string;
  image?: string;
}

function setMeta(selector: string, attr: string, value: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [key, val] = selector.replace(/[[\]"']/g, "").split("=");
    if (key === "name") el.setAttribute("name", val);
    else el.setAttribute("property", val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, "content");
  el.setAttribute("content", value);
}

/** Динамически задаёт title и meta-описания под конкретную страницу SPA. */
export function useSeo({ title, description, image }: SeoOptions): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const path = window.location.pathname;
    const meta = getPageMeta(path);
    const ogImage = image || meta.image;
    const url = SITE_URL + (path === "/" ? "/" : path.replace(/\/$/, ""));

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:site_name"]', "content", "Техно-Сиб");
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:image:alt"]', "content", title);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }, [title, description, image]);
}