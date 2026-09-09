import { CatalogProduct } from "@/lib/shrinkCatalog";

export const PALLET_CATALOG_ENDPOINT = "https://functions.poehali.dev/97c53cc2-dbdc-4d66-b0db-3519506f9704";

export type PalletProduct = CatalogProduct & {
  brand: string;
  video: string;
  inStock: boolean;
  kind: "wrapper" | "palletizer" | "accessory";
  mobility: "stationary" | "mobile" | "arm";
  categoryName: string;
  sort: number;
};

export const KIND_TABS: { id: string; name: string }[] = [
  { id: "wrapper", name: "Паллетоупаковщики" },
  { id: "palletizer", name: "Роботы-паллетайзеры" },
  { id: "accessory", name: "Опции и аксессуары" },
];

let cache: Promise<{ products: PalletProduct[]; brands: string[] }> | null = null;

export function loadPalletCatalog(): Promise<{ products: PalletProduct[]; brands: string[] }> {
  if (!cache) {
    cache = fetch(PALLET_CATALOG_ENDPOINT)
      .then(r => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then(d => {
        const products: PalletProduct[] = Array.isArray(d?.products) ? d.products : [];
        const brands: string[] = Array.isArray(d?.brands) ? d.brands : [];
        return { products, brands };
      })
      .catch(e => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

/** Ключевые параметры карточки различаются по брендам — как на исходном лендинге. */
const BRAND_KEY_PARAMS: Record<string, string[]> = {
  "ТЕХНОСИБ": [
    "Предварительное растяжение пленки",
    "Макс. габариты паллеты (ДхШ) (мм)",
    "Макс. высота груза (мм)",
    "Макс. вес паллеты (кг)",
  ],
  "Robopac (Робопак)": [
    "Диаметр поворотного стола (мм)",
    "Максимальный вес упаковываемого груза (включая поддон) (кг)",
    "Максимальная высота упаковываемого груза (включая поддон) (мм)",
    "Максимальный размер поддона (мм)",
  ],
  "Hualian": [
    "Диаметр платформы (мм)",
    "Тип оборудования",
    "Предварительное растяжение пленки",
    "Максимальная высота паллета с грузом (мм)",
  ],
};

export function keyParamsFor(p: PalletProduct, limit = 4) {
  const wanted = BRAND_KEY_PARAMS[p.brand];
  const result: { name: string; value: string }[] = [];
  if (wanted) {
    for (const w of wanted) {
      const found = p.params.find(x => x.name === w);
      if (found) result.push(found);
    }
  }
  for (const x of p.params) {
    if (result.length >= limit) break;
    if (!result.some(r => r.name === x.name)) result.push(x);
  }
  return result.slice(0, limit);
}
