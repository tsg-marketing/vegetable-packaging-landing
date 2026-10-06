import { useCallback, useEffect, useState } from "react";

export type CompareItem = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  picture: string;
  url?: string;
  params: { name: string; value: string }[];
  source: string;
};

const KEY = "tsib_compare_v1";
const EVENT = "tsib-compare-change";
export const COMPARE_LIMIT = 8;

function read(): CompareItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: CompareItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: string) => items.some(i => i.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    const list = read();
    if (list.some(i => i.id === item.id)) {
      write(list.filter(i => i.id !== item.id));
      return true;
    }
    if (list.length >= COMPARE_LIMIT) return false;
    write([...list, item]);
    return true;
  }, []);

  const remove = useCallback((id: string) => write(read().filter(i => i.id !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { items, has, toggle, remove, clear };
}
