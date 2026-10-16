export type ContentFile = { file: string; title: string; size: number; count?: number };

export const SITE_CONTENT_DATE = "16.10.2026";

export const SITE_CONTENT_FILES: { pages: ContentFile[]; all: ContentFile; zip: ContentFile } = {
  "pages": [
    {
      "file": "home.txt",
      "title": "Главная",
      "size": 421799,
      "count": 96
    },
    {
      "file": "vegetables.txt",
      "title": "Оборудование для упаковки овощей",
      "size": 88229,
      "count": 18
    },
    {
      "file": "vacuum.txt",
      "title": "Вакуумное оборудование",
      "size": 850818,
      "count": 174
    },
    {
      "file": "gorizontalnoe.txt",
      "title": "Горизонтальное упаковочное оборудование",
      "size": 329266,
      "count": 62
    },
    {
      "file": "kartonajnoe.txt",
      "title": "Картонажное оборудование",
      "size": 237045,
      "count": 51
    },
    {
      "file": "obanderolivanie.txt",
      "title": "Обандероливающие машины",
      "size": 50312,
      "count": 11
    },
    {
      "file": "termousadka.txt",
      "title": "Термоусадочное оборудование",
      "size": 406957,
      "count": 92
    },
    {
      "file": "traysealers.txt",
      "title": "Запайщики лотков",
      "size": 499940,
      "count": 111
    },
    {
      "file": "pallet.txt",
      "title": "Паллетоупаковщики и паллетайзеры",
      "size": 600665,
      "count": 86
    }
  ],
  "all": {
    "file": "all-site-content.txt",
    "title": "Весь контент одним файлом",
    "size": 3485058
  },
  "zip": {
    "file": "site-content.zip",
    "title": "Все файлы архивом (ZIP)",
    "size": 1060021
  }
};
