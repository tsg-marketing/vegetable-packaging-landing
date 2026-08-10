export const SHRINK_CATALOG_ENDPOINT = "https://functions.poehali.dev/bae3763f-b42a-4df2-9959-e36b33277698";

export type CatalogParam = { name: string; value: string };
export type CatalogProduct = {
  id: string;
  categoryId: string;
  name: string;
  vendor: string;
  price: number;
  priceText: string;
  currency: string;
  url: string;
  description: string;
  pictures: string[];
  params: CatalogParam[];
};

const HIDDEN_PARAMS = ["бренд", "название бренда", "картинки товара"];

export function isHiddenParam(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (n === "guid") return true;
  if (HIDDEN_PARAMS.includes(n)) return true;
  if (/видео/i.test(name)) return true;
  return false;
}

export function visibleParams(params: CatalogParam[]): CatalogParam[] {
  return params.filter(p => !isHiddenParam(p.name));
}

export function getVideoUrl(params: CatalogParam[]): string | null {
  const p = params.find(x => /видео/i.test(x.name));
  if (!p) return null;
  const raw = (p.value || "").trim();
  if (!raw) return null;
  const first = raw.split(/[,\s;]+/).find(s => /^https?:\/\//i.test(s));
  return first || null;
}

export function stripHtml(html: string): string {
  if (!html) return "";
  let s = html.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<\/(p|div|br|li|h[1-6])>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&quot;/gi, '"');
  s = s.replace(/&#39;|&apos;/gi, "'");
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

export function formatPrice(price: number): string {
  if (!price || price <= 0) return "Цена по запросу";
  return new Intl.NumberFormat("ru-RU").format(price) + " руб";
}

let cache: Promise<CatalogProduct[]> | null = null;

export function loadShrinkCatalog(): Promise<CatalogProduct[]> {
  if (!cache) {
    cache = fetch(SHRINK_CATALOG_ENDPOINT)
      .then(r => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then(d => {
        const list: CatalogProduct[] = Array.isArray(d?.products) ? d.products : [];
        list.sort((a, b) => (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER));
        return list;
      })
      .catch(e => {
        cache = null;
        throw e;
      });
  }
  return cache;
}
