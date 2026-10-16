export type ContentFile = { file: string; title: string; size: number };

export const SITE_CONTENT_DATE = "16.10.2026";

export const SITE_CONTENT_FILES: { pages: ContentFile[]; catalogs: ContentFile[]; all: ContentFile; zip: ContentFile } = {
  "pages": [
    {
      "file": "home.txt",
      "title": "Главная",
      "size": 23459
    },
    {
      "file": "vegetables.txt",
      "title": "Упаковка овощей",
      "size": 19040
    },
    {
      "file": "vacuum.txt",
      "title": "Вакуумное оборудование",
      "size": 12778
    },
    {
      "file": "gorizontalnoe.txt",
      "title": "Горизонтальное оборудование",
      "size": 17325
    },
    {
      "file": "kartonajnoe.txt",
      "title": "Картонажное оборудование",
      "size": 13787
    },
    {
      "file": "obanderolivanie.txt",
      "title": "Обандероливающие машины",
      "size": 15990
    },
    {
      "file": "termousadka.txt",
      "title": "Термоусадочное оборудование",
      "size": 17691
    },
    {
      "file": "traysealers.txt",
      "title": "Запайщики лотков",
      "size": 19212
    },
    {
      "file": "pallet.txt",
      "title": "Паллетоупаковщики",
      "size": 20646
    },
    {
      "file": "about_us.txt",
      "title": "О компании",
      "size": 9978
    }
  ],
  "catalogs": [
    {
      "file": "catalog-vegetables.txt",
      "title": "Упаковка овощей",
      "size": 80649
    },
    {
      "file": "catalog-vacuum.txt",
      "title": "Вакуумное оборудование",
      "size": 843032
    },
    {
      "file": "catalog-gorizontalnoe.txt",
      "title": "Горизонтальное оборудование",
      "size": 317379
    },
    {
      "file": "catalog-kartonajnoe.txt",
      "title": "Картонажное оборудование",
      "size": 227527
    },
    {
      "file": "catalog-obanderolivanie.txt",
      "title": "Обандероливающие машины",
      "size": 40065
    },
    {
      "file": "catalog-termousadka.txt",
      "title": "Термоусадочное оборудование",
      "size": 382198
    },
    {
      "file": "catalog-traysealers.txt",
      "title": "Запайщики лотков",
      "size": 489070
    },
    {
      "file": "catalog-pallet.txt",
      "title": "Паллетоупаковщики и паллетайзеры",
      "size": 583461
    }
  ],
  "all": {
    "file": "all-site-content.txt",
    "title": "Весь контент одним файлом",
    "size": 3133341
  },
  "zip": {
    "file": "site-content.zip",
    "title": "Все файлы архивом (ZIP)",
    "size": 947280
  }
};
