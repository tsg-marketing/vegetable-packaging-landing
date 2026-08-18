import { useEffect, useMemo, useRef } from "react";
import { buildAnchorMap } from "@/lib/productSlug";

type MinProduct = { id: string; name: string };

export function useProductHash<T extends MinProduct>(
  products: T[],
  openProduct: T | null,
  openByAnchor: (p: T) => void,
) {
  const anchors = useMemo(() => buildAnchorMap(products), [products]);
  const openRef = useRef(openByAnchor);
  openRef.current = openByAnchor;
  const appliedRef = useRef<string | null>(null);

  const byAnchor = useMemo(() => {
    const m: Record<string, T> = {};
    for (const p of products) {
      const a = anchors[p.id];
      if (a) m[a.toLowerCase()] = p;
    }
    return m;
  }, [products, anchors]);

  useEffect(() => {
    const apply = () => {
      const raw = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim();
      if (!raw) {
        appliedRef.current = null;
        return;
      }
      const key = raw.toLowerCase();
      const found = byAnchor[key];
      if (found && appliedRef.current !== key) {
        appliedRef.current = key;
        openRef.current(found);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [byAnchor]);

  useEffect(() => {
    if (!openProduct) {
      const raw = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim();
      if (raw && byAnchor[raw.toLowerCase()]) {
        appliedRef.current = null;
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
      return;
    }
    const a = anchors[openProduct.id];
    if (!a) return;
    appliedRef.current = a.toLowerCase();
    const url = `${window.location.pathname}${window.location.search}#${a}`;
    if (window.location.hash.replace(/^#/, "") !== a) {
      window.history.replaceState(null, "", url);
    }
  }, [openProduct, anchors, byAnchor]);

  return anchors;
}

export default useProductHash;