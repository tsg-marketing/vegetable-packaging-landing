import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description: string;
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
export function useSeo({ title, description }: SeoOptions): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
  }, [title, description]);
}
