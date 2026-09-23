import { CatalogProduct } from "@/lib/shrinkCatalog";

export const POFF_PLACEHOLDER_IMG =
  "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/ea77bc7e-f6ce-4b89-a17a-1eaa0bbd19fa.png";

type Row = { width: string; length: number; thickness: number; price: number };

const ROWS: Row[] = [
  { width: "200/400", length: 1000, thickness: 12.5, price: 1196 },
  { width: "300/600", length: 1000, thickness: 12.5, price: 1794 },
  { width: "300/600", length: 1250, thickness: 15, price: 2691 },
  { width: "300/600", length: 1000, thickness: 19, price: 2727.4 },
  { width: "350/700", length: 750, thickness: 15, price: 1885 },
  { width: "400/800", length: 1250, thickness: 15, price: 3588 },
  { width: "450/900", length: 1000, thickness: 19, price: 4089.8 },
  { width: "550/1100", length: 1000, thickness: 19, price: 4999.8 },
];

export const POFF_PRODUCTS: CatalogProduct[] = ROWS.map((r, i) => {
  const name = `Плёнка ПОФ ${r.width} мм × ${r.length} м × ${r.thickness} мкм`;
  return {
    id: `poff-${i + 1}`,
    categoryId: "357",
    name,
    vendor: "",
    price: r.price,
    priceText: String(r.price),
    currency: "RUB",
    url: "",
    description:
      `Термоусадочная полиолефиновая плёнка (ПОФ) в рулоне. Ширина полурукава ${r.width} мм, ` +
      `намотка ${r.length} м, толщина ${r.thickness} мкм. Подходит для упаковки пищевой и непищевой ` +
      `продукции на ручных, полуавтоматических и автоматических термоупаковочных аппаратах. ` +
      `Цена указана за рулон, отгрузка со склада.`,
    pictures: [POFF_PLACEHOLDER_IMG],
    params: [
      { name: "Ширина", value: `${r.width} мм` },
      { name: "Намотка", value: `${r.length} м` },
      { name: "Толщина", value: `${r.thickness} мкм` },
      { name: "Тип", value: "Полиолефиновая термоусадочная" },
    ],
  };
});
