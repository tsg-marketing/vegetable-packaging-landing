import { CatalogProduct } from "@/lib/shrinkCatalog";

const B = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/";

export const POFF_PLACEHOLDER_IMG =
  "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/ea77bc7e-f6ce-4b89-a17a-1eaa0bbd19fa.png";

type Row = { width: string; length: number; thickness: number; price: number; img: string };

const ROWS: Row[] = [
  { width: "200/400", length: 1000, thickness: 12.5, price: 1196, img: B + "8c262bf9-7c5f-479d-96f1-62379bd319b7.jpg" },
  { width: "300/600", length: 1000, thickness: 12.5, price: 1794, img: B + "e4414bb7-33ae-4642-92a3-636befa4fb23.jpg" },
  { width: "300/600", length: 1250, thickness: 15, price: 2691, img: B + "2c5953bc-83f1-4873-9fe0-342cf6dfe5b3.jpg" },
  { width: "300/600", length: 1000, thickness: 19, price: 2727.4, img: B + "8f502018-e704-4c36-a648-44ede59eeec3.jpg" },
  { width: "350/700", length: 750, thickness: 15, price: 1885, img: B + "43bc99bb-08da-45c4-9c6b-36ec76a85660.jpg" },
  { width: "400/800", length: 1250, thickness: 15, price: 3588, img: B + "2b435c4d-bba3-46a0-997d-7cb2c9244190.jpg" },
  { width: "450/900", length: 1000, thickness: 19, price: 4089.8, img: B + "b1bde5f1-5646-444e-b173-e527e555ed3d.jpg" },
  { width: "550/1100", length: 1000, thickness: 19, price: 4999.8, img: B + "bb489f1b-7783-4532-98dd-b8e1a8c0b765.jpg" },
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
    pictures: [r.img],
    params: [
      { name: "Ширина", value: `${r.width} мм` },
      { name: "Намотка", value: `${r.length} м` },
      { name: "Толщина", value: `${r.thickness} мкм` },
    ],
  };
});
