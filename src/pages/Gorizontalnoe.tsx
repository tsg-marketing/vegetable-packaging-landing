import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm, currentPagePath } from "@/lib/utm";
import QuizSideTab from "@/components/QuizSideTab";
import FlowpackQuiz, { FlowpackQuizPayload } from "@/components/FlowpackQuiz";
import ProductGallery from "@/components/ProductGallery";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";

// Страница горизонтальных упаковочных машин flow-pack /gorizontalnoe

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const CATALOG_ENDPOINT = "https://functions.poehali.dev/645b9ab5-57b6-4cb1-909a-3e9f160f751e";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0d32b09-ff0b-4093-8fe4-1bb4733d849b.jpg";

type CatalogParam = { name: string; value: string };
type CatalogProduct = {
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

function isHiddenParam(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (n === "guid") return true;
  if (/видео/i.test(name)) return true;
  return false;
}

function visibleParams(params: CatalogParam[]): CatalogParam[] {
  return params.filter(p => !isHiddenParam(p.name));
}

function getVideoUrl(params: CatalogParam[]): string | null {
  const p = params.find(x => /видео.*ссылк/i.test(x.name) || /^видео\s*\(ссылка\)$/i.test(x.name.trim()));
  if (!p) return null;
  const raw = (p.value || "").trim();
  if (!raw) return null;
  const first = raw.split(/[,\s;]+/).find(s => /^https?:\/\//i.test(s));
  if (!first) return null;
  if (!/(rutube\.ru|youtube\.com|youtu\.be)/i.test(first)) return null;
  return first;
}

function stripHtml(html: string): string {
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

function formatPrice(price: number): string {
  if (!price || price <= 0) return "По запросу";
  return new Intl.NumberFormat("ru-RU").format(price) + " руб";
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function sendLead(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const baseName = String(payload.name ?? "").trim();
    const nameWithUrl = baseName && pageUrl ? `${baseName} — ${pageUrl}` : baseName;
    const res = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: currentPagePath(),
        ...payload,
        name: nameWithUrl,
        utm: readUtm(),
        pageUrl,
      }),
    });
    if (!res.ok) return false;
    const j = await res.json().catch(() => ({ ok: true }));
    const ok = j?.ok !== false;
    if (ok) ymGoal("FOS_send");
    return ok;
  } catch {
    return false;
  }
}

const HERO_BULLETS = [
  "Бренд от ведущих азиатских и европейских производителей",
  "Плёнка от 180 до 950 мм — под любой размер продукта",
  "Точная электроника и быстрая переналадка",
  "Опции под задачу: вакуум, газовая среда, термоусадка, нержавейка",
];

const PROBLEMS = [
  { icon: "Timer", title: "Медленная ручная фасовка, нехватка людей", desc: "Автомат до 330 уп/мин — заменяет бригаду упаковщиков" },
  { icon: "ClipboardX", title: "Неравномерные швы, негерметичность, возвраты", desc: "ПИД-контроль температуры + сервопривод = стабильный герметичный шов" },
  { icon: "TrendingDown", title: "Перерасход плёнки", desc: "Датчик длины продукта (LVA) формирует пакет точно по изделию" },
  { icon: "AlertTriangle", title: "Непрезентабельный вид на полке сети", desc: "Упаковка «подушка» с точным совмещением рисунка по фотометке" },
];

const ADVANTAGES = [
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/24ddbcc5-501f-42db-943a-57ce6640b462.jpg", title: "Скорость до 330 уп/мин", desc: "Высокоскоростные модели с 4-позиционным узлом поперечной сварки (DXDZ-250S)" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/0fc9af56-97da-4560-9f26-8d7f2810cc8f.jpg", title: "Универсальность форматов", desc: "Плёнка от 180 до 950 мм, длина пакета от 45 мм до неограниченной. Один тип машины под десятки продуктов" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/3b0e5ab2-df31-4fed-83ad-da34316b0784.jpg", title: "Сервоприводы и PLC-управление", desc: "До 30 программ в памяти, переналадка за ~3 минуты, сенсорная панель" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/48cfea4e-e385-45db-8ce3-54cb28bbbefb.jpg", title: "«Нет продукта — нет пакета»", desc: "Машина не формирует пустую упаковку, экономит плёнку и исключает брак" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/6eb5cce0-db50-45c3-8d54-0ac102f110ac.jpg", title: "Гибкие опции", desc: "Газовая среда (МГС), вакуумирование, термоусадка, датировка, этикетировка, нержавейка" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/b52328f5-da09-436c-afa9-ec8f19d2d4da.jpg", title: "Надёжные комплектующие", desc: "Рама из углеродистой стали с защитным покрытием" },
];

const APPLICATIONS = [
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/903d8360-d4f1-4511-bffb-54ac0e956bf9.jpg", title: "Кондитерские изделия", desc: "Конфеты, печенье, вафли, батончики, зефир, шоколад" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/305780b8-cbed-4064-9a7e-41bddb5bdb62.jpg", title: "Хлебобулочные изделия", desc: "Булочки, рулеты, лаваши, хлеб" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/558035ac-41bc-44de-874b-a2ee69a57a90.jpg", title: "Замороженные продукты", desc: "Мороженое, полуфабрикаты" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/0d1722a9-4f8e-49a4-a6b6-8eea41b2397d.jpg", title: "Свежие овощи и зелень", desc: "Салаты, листовая зелень (нижняя подача)" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/8ccc2cb5-8b47-4aff-b9cd-0e25c2c38e85.jpg", title: "Непищевые товары", desc: "Мыло, губки, бытовая химия, канцелярия, сувениры" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/9905c1a9-289a-4133-aadb-b6bfa7fd5eb6.jpg", title: "Медицина и гигиена", desc: "Маски, салфетки, перчатки, гигиенические наборы" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/d9c744b6-f0cb-457d-aa72-3be1833fc6c9.jpg", title: "Промышленные изделия", desc: "Трубы, профили, шланги, кабель (длинномер)" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/a9cea142-8b46-4299-a2a6-86fb9f1ad9e8.jpg", title: "Текстиль и мягкие изделия", desc: "Подушки, спецодежда, пуховые изделия (вакуум-компрессия)" },
];

type SeriesBullet = { text: string; links?: string[] };
type SeriesItem = {
  icon: string;
  title: string;
  imageTokens: string[];
  fallbackImg: string;
  intro: string;
  bullets: SeriesBullet[];
};

const SERIES: SeriesItem[] = [
  {
    icon: "Boxes",
    title: "Базовые автоматы DXDZ (серии 250–600)",
    imageTokens: ["DXDZ-250", "DXDZ"],
    fallbackImg: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0d32b09-ff0b-4093-8fe4-1bb4733d849b.jpg",
    intro: "Самые востребованные, оптимальная цена.",
    bullets: [
      { text: "Шаговый или 2 сервомотора, плёнка 250–600 мм" },
      { text: "Для кондитерки, хлеба и непищёвки" },
      { text: "От компактных до широких моделей", links: ["DXDZ-250B", "DXDZ-600D"] },
    ],
  },
  {
    icon: "Settings",
    title: "Машины со спецфункциями",
    imageTokens: ["450X", "600DX", "590B"],
    fallbackImg: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0d32b09-ff0b-4093-8fe4-1bb4733d849b.jpg",
    intro: "Под нестабильные продукты и особые задачи.",
    bullets: [
      { text: "Нижняя подача плёнки — зелень, салаты, салфетки", links: ["250X", "450X", "600DX", "520W"] },
      { text: "С вакуумом — срок годности, компрессия текстиля", links: ["450XV", "600XV", "600XD"] },
      { text: "С термоусадкой — полиолефиновая плёнка", links: ["590A/180", "590B/180"] },
    ],
  },
  {
    icon: "Crown",
    title: "Премиум-серии (3 сервопривода)",
    imageTokens: ["SWIFT", "PEARL", "FALCON"],
    fallbackImg: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0d32b09-ff0b-4093-8fe4-1bb4733d849b.jpg",
    intro: "Для высоконагруженных линий.",
    bullets: [
      { text: "Мгновенная переналадка по названию продукта" },
      { text: "Датчик длины (LVA) и память на 30 программ" },
      { text: "Модельный ряд премиум-серий", links: ["SWIFT", "PEARL", "SHAMAL", "PULSAR", "BORA", "HURRICANE", "FALCON"] },
    ],
  },
];

const PROCESS = [
  { num: 1, icon: "PackageOpen", title: "Продукт подаётся на конвейер", desc: "Вручную или автоподатчиком" },
  { num: 2, icon: "Layers", title: "Плёнка формируется в рукав", desc: "И сваривается продольным швом" },
  { num: 3, icon: "Scissors", title: "Формируются два поперечных шва", desc: "В начале и конце продукта" },
  { num: 4, icon: "Package", title: "Нож обрезает готовый пакет", desc: "Герметичная упаковка «подушка»" },
];

const GUARANTEES = [
  { icon: "ShieldCheck", title: "Гарантия до 3 лет", desc: "На всё оборудование с бесплатной пусконаладкой" },
  { icon: "Award", title: "Сертификация CE, ISO 9001", desc: "Соответствие международным стандартам качества" },
  { icon: "FileCheck", title: "Декларация соответствия", desc: "Документы для работы на территории РФ и СНГ" },
];

const SERVICES = [
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/fa477267-7521-4633-93b8-5ab3e6af1486.jpg", title: "Наличие на складах", desc: "В Новосибирске и Москве" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/5842e0f8-8e07-4d8b-862d-ea93be2b0686.jpg", title: "Доставка РФ и СНГ", desc: "Экспресс-отправка со склада в день оплаты" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/1282aae5-2da0-4623-990e-68750f676dd7.jpg", title: "Обучение персонала", desc: "Инструктаж на объекте клиента включён" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/6441e3aa-1d2f-40c2-8397-537fa22d6c2a.jpg", title: "Лизинг и рассрочка", desc: "Гибкие условия оплаты и финансирования" },
];

const FAQS = [
  { q: "Какую машину выбрать под мой продукт и объём?", a: "Выбор зависит от размера и формы изделия, требуемой производительности и нужных опций. Для мелкоштучки правильной формы подходят базовые серии 250–400, для крупных и высоких изделий — серия 600 и выше. Оставьте заявку — инженер подберёт оптимальную модель под ваш продукт и объём." },
  { q: "Чем отличается верхняя подача плёнки от нижней?", a: "При верхней подаче рулон расположен над конвейером — это классический вариант для продуктов стабильной формы (кондитерка, хлеб). Нижняя подача формирует рукав снизу и подходит для нестабильных и мягких изделий — зелени, салатов, салфеток, которые удобнее укладывать на плёнку." },
  { q: "Какую плёнку использовать?", a: "Для большинства задач применяется термосвариваемая полипропиленовая (БОПП) или ламинированная плёнка шириной от 180 до 950 мм. Для термоусадки используется полиолефиновая плёнка. Подбор материала зависит от продукта и требований к упаковке — поможем определиться." },
  { q: "Нужен ли компрессор?", a: "Для базовых моделей компрессор не требуется. Для машин с вакуумированием, газовой средой или термоусадкой нужен компрессор, обеспечивающий давление около 0,6 МПа. Точные требования зависят от конкретной комплектации." },
  { q: "Сроки поставки и пусконаладки?", a: "Модели в наличии отгружаются со склада в Новосибирске или Москве в день оплаты, остальное — под заказ. Пусконаладку и настройку проводит инженер на объекте клиента, обычно в течение 1 дня после доставки." },
  { q: "Есть ли обучение операторов?", a: "Да, обучение операторов входит в пусконаладку. Инженер настраивает оборудование и обучает персонал работе, смене программ и базовому обслуживанию на месте установки." },
];

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "#catalog" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Применение", href: "#applications" },
  { label: "О компании", href: "#about" },
  { label: "Сервис", href: "#service" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#contacts" },
];

const PACK_TYPES = ["Кондитерские изделия", "Хлебобулочные изделия", "Замороженные продукты", "Свежие овощи и зелень", "Непищевые товары", "Медицина и гигиена", "Промышленные изделия (длинномер)", "Текстиль и мягкие изделия", "Другое"];

export default function Gorizontalnoe() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", pack: "", comment: "" });

  const [fosOpen, setFosOpen] = useState<{ productName?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formAgree, setFormAgree] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; agree?: string }>({});
  const [thanksOpen, setThanksOpen] = useState(false);

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogShow, setCatalogShow] = useState(9);
  const [catalogSearch, setCatalogSearch] = useState("");

  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);

  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => { setCatalogShow(9); }, [catalogSearch]);

  useEffect(() => {
    const anyOpen = detailsProduct || videoModal || lightbox || fosOpen || thanksOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailsProduct, videoModal, lightbox, fosOpen, thanksOpen]);

  const filteredCatalog = catalog.filter(p => {
    const q = catalogSearch.trim().toLowerCase();
    if (q) return p.name.toLowerCase().includes(q);
    return true;
  });

  const submitQuiz = useCallback(async (data: FlowpackQuizPayload): Promise<boolean> => {
    return sendLead({
      source: "quiz",
      name: data.name,
      phone: data.phone,
      email: data.email,
      product: data.product,
      size: data.size,
      speed: data.speed,
      options: data.options.join(", "),
      quizAnswers: {
        product: data.product,
        size: data.size,
        speed: data.speed,
        options: data.options.join(", "),
      },
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("gorizQuizAutoShown") === "1") return;
    } catch { /* ignore */ }
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem("gorizQuizAutoShown", "1"); } catch { /* ignore */ }
      setQuizOpen(true);
    }, 30000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(CATALOG_ENDPOINT);
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (cancelled) return;
        const list: CatalogProduct[] = Array.isArray(data?.products) ? data.products : [];
        list.sort((a, b) => {
          const pa = a.price || Number.MAX_SAFE_INTEGER;
          const pb = b.price || Number.MAX_SAFE_INTEGER;
          return pa - pb;
        });
        setCatalog(list);
      } catch {
        if (!cancelled) setCatalogError(true);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openFos = useCallback((productName?: string) => {
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosAgree(false);
    setFosSubmitting(false);
    setFosOpen({ productName });
  }, []);

  const validateFos = useCallback(() => {
    const errs: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (fosData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(fosData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (fosData.email.trim() && !EMAIL_RE.test(fosData.email.trim())) errs.email = "Укажите корректный e-mail";
    if (!fosAgree) errs.agree = "Необходимо согласие";
    setFosErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fosData, fosAgree]);

  const submitFos = useCallback(async () => {
    if (!validateFos() || fosSubmitting) return;
    setFosSubmitting(true);
    await sendLead({
      source: "fos",
      product: fosOpen?.productName || "",
      name: fosData.name.trim(),
      phone: fosData.phone.trim(),
      email: fosData.email.trim(),
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  }, [fosData, fosOpen, fosSubmitting, validateFos]);

  const submitMainForm = async () => {
    const errs: { name?: string; phone?: string; agree?: string } = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = "Введите имя";
    if (!formData.phone.trim() || !isValidPhoneRu(formData.phone)) {
      errs.phone = "Введите телефон в формате +7 и 10 цифр";
    }
    if (!formAgree) errs.agree = "Необходимо согласие";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0 || formSubmitting) return;
    setFormSubmitting(true);
    await sendLead({
      source: "main_form",
      name: formData.name,
      phone: formData.phone,
      pack: formData.pack,
      comment: formData.comment,
    });
    setFormSubmitting(false);
    setFormData({ name: "", phone: "", pack: "", comment: "" });
    setThanksOpen(true);
  };

  const scrollTo = (href: string) => {
    if (href.startsWith("/")) { window.location.href = href; return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
    setEquipmentOpen(false);
  };

  const findProduct = useCallback((token: string): CatalogProduct | undefined => {
    const t = token.trim().toLowerCase().replace(/\s+/g, "");
    return catalog.find(p => p.name.toLowerCase().replace(/\s+/g, "").includes(t));
  }, [catalog]);

  const seriesImage = useCallback((item: SeriesItem): string => {
    for (const token of item.imageTokens) {
      const prod = findProduct(token);
      if (prod && prod.pictures.length > 0) return prod.pictures[0];
    }
    return item.fallbackImg;
  }, [findProduct]);

  const goToProduct = useCallback((token: string) => {
    const prod = findProduct(token);
    if (prod) {
      setDetailsProduct(prod);
      return;
    }
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  }, [findProduct]);

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.1)]" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
          <a href="/" className="flex items-center flex-shrink-0 mr-auto">
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-9 md:h-10 w-auto" />
          </a>

          <nav className="hidden lg:flex items-center gap-4 xl:gap-5">
            {NAV.slice(0, 2).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-[13px] xl:text-sm font-medium text-[#444] hover:text-orange-600 transition-colors whitespace-nowrap">
                {l.label}
              </button>
            ))}
            <div className="relative" onMouseEnter={() => setEquipmentOpen(true)} onMouseLeave={() => setEquipmentOpen(false)}>
              <button className="text-[13px] xl:text-sm font-medium text-[#444] hover:text-orange-600 transition-colors whitespace-nowrap flex items-center gap-1">
                Оборудование
                <Icon name="ChevronDown" size={14} className={`transition-transform ${equipmentOpen ? "rotate-180" : ""}`} />
              </button>
              {equipmentOpen && (
                <div className="absolute left-0 top-full pt-2 z-50">
                  <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 min-w-[260px]">
                    <a href="/vegetables" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Упаковка овощей и фруктов</a>
                    <a href="/vacuum" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Вакуумные упаковщики</a>
                    <a href="/kartonajnoe" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Картонажное оборудование</a>
                  </div>
                </div>
              )}
            </div>
            {NAV.slice(2).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-[13px] xl:text-sm font-medium text-[#444] hover:text-orange-600 transition-colors whitespace-nowrap">
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 ml-4">
            <a href="tel:88005057831" className="text-sm font-semibold text-[#1A1A1A] hover:text-orange-600 transition-colors whitespace-nowrap">
              8 800 505-78-31
            </a>
            <button onClick={() => openFos()} className="btn-orange text-sm py-2 px-5 whitespace-nowrap">
              Оставить заявку
            </button>
          </div>

          <button className="lg:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
            <Icon name={mobileOpen ? "X" : "Menu"} size={24} className="text-[#1A1A1A]" />
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
            {NAV.slice(0, 2).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <div className="border-b border-gray-100 pb-2">
              <p className="text-xs font-semibold text-[#999] uppercase mb-2">Оборудование</p>
              <a href="/vegetables" className="block text-base text-[#444] py-1.5 pl-2">Упаковка овощей и фруктов</a>
              <a href="/vacuum" className="block text-base text-[#444] py-1.5 pl-2">Вакуумные упаковщики</a>
              <a href="/kartonajnoe" className="block text-base text-[#444] py-1.5 pl-2">Картонажное оборудование</a>
            </div>
            {NAV.slice(2).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <a href="tel:88005057831" className="text-base font-bold text-[#1A1A1A] py-2">8 800 505-78-31</a>
            <button onClick={() => { setMobileOpen(false); openFos(); }} className="btn-orange w-full mt-1">Оставить заявку</button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="pt-16 min-h-[88vh] flex items-center bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-12 lg:py-0">
          <div className="lg:col-span-6 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(26px,4vw,46px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              Горизонтальные упаковочные машины <span style={{ color: "var(--orange)" }}>flow-pack</span> для любого производства
            </h1>

            <p className="text-[20px] sm:text-[22px] font-semibold text-[#1A1A1A] mb-8 max-w-xl leading-snug">
              Более <span style={{ color: "var(--orange)" }}>50 моделей</span> в наличии и под заказ. До <span style={{ color: "var(--orange)" }}>330 упаковок</span> в минуту.
            </p>

            <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mb-8 max-w-2xl">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[17px] font-medium text-[#1A1A1A] leading-snug">
                  <Icon name="CheckCircle2" size={24} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => openFos()} className="btn-orange text-base px-8 py-3.5">
                Подобрать оборудование
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-8 py-3.5">
                Смотреть каталог
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 fade-up flex items-center justify-center">
            <img
              src="https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/6987fa02-cd88-4e57-944b-bcaecae0723b.png"
              alt="Горизонтальная упаковочная машина flow-pack"
              className="w-full h-auto lg:h-[560px] xl:h-[620px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section id="problems" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Какие проблемы решают наши горизонтальные упаковочные машины</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card-hover rounded-2xl p-7 bg-white border-2 shadow-sm" style={{ borderColor: "var(--orange)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={p.icon} fallback="AlertCircle" size={30} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-xl mb-3 leading-snug">{p.title}</h3>
                <p className="text-[16px] text-[#555] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="btn-orange">
              <Icon name="Calculator" size={18} className="mr-2" />
              Рассчитать экономию на упаковке
            </button>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Почему наши flow-pack машины выбирают производства</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="card-hover rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-[16/9] overflow-hidden bg-[#F0F0F0]">
                  <img src={a.img} alt={a.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-7">
                  <h3 className="font-bold text-[#1A1A1A] text-xl mb-3 leading-snug">{a.title}</h3>
                  <p className="text-[16px] text-[#555] leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="btn-outline-orange">
              <Icon name="Headset" size={18} className="mr-2" />
              Получить техническую консультацию
            </button>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Каталог оборудования</h2>
            <p className="text-[#666] mt-2 max-w-xl mx-auto">Подберите горизонтальную упаковочную машину flow-pack для вашего производства</p>
          </div>

          <div className="max-w-md mx-auto mb-8 relative">
            <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-orange-500 text-[14px]"
            />
            {catalogSearch && (
              <button
                onClick={() => setCatalogSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Очистить"
              >
                <Icon name="X" size={14} className="text-[#999]" />
              </button>
            )}
          </div>

          {catalogLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-9 bg-gray-100 rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!catalogLoading && catalogError && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Icon name="AlertCircle" size={32} className="mx-auto mb-3" style={{ color: "var(--orange)" }} />
              <p className="text-[#1A1A1A] font-semibold mb-1">Не удалось загрузить каталог</p>
              <p className="text-sm text-[#666] mb-4">Оставьте заявку — пришлём актуальный прайс на e-mail</p>
              <button onClick={() => openFos()} className="btn-orange">Запросить прайс</button>
            </div>
          )}

          {!catalogLoading && !catalogError && (
            <>
              {filteredCatalog.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                  <Icon name="SearchX" size={32} className="mx-auto mb-3 text-[#888]" />
                  <p className="text-[#1A1A1A] font-semibold mb-1">Ничего не найдено</p>
                  <p className="text-sm text-[#666] mb-4">Попробуйте изменить запрос</p>
                  <button onClick={() => setCatalogSearch("")} className="btn-outline-orange">
                    Сбросить поиск
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCatalog.slice(0, catalogShow).map(p => {
                    const keyParams = visibleParams(p.params);
                    const videoUrl = getVideoUrl(p.params);
                    return (
                      <div key={p.id} id={`product-${p.id}`} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col scroll-mt-24">
                        <ProductGallery
                          images={p.pictures}
                          alt={p.name}
                          fallback={IMG_HERO}
                          className="aspect-[16/10] bg-white flex items-center justify-center overflow-hidden"
                          imgClassName="w-full h-full object-contain p-4"
                          onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
                        />
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-3 leading-snug min-h-[44px]">{p.name}</h3>
                          {keyParams.length > 0 && (
                            <ul className="mb-4 space-y-1.5">
                              {keyParams.map((pr, i) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                                  <span className="text-[#888] mt-1">·</span>
                                  <span className="text-[#444]">
                                    <span className="text-[#444]">{pr.name}: </span>
                                    <span className="text-[#1A1A1A]">{pr.value}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-auto pt-3">
                            <div className="font-bold text-xl mb-3" style={{ color: "var(--orange)" }}>{formatPrice(p.price)}</div>
                            <div className="space-y-2">
                              <button
                                onClick={() => setDetailsProduct(p)}
                                className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all inline-flex items-center justify-center gap-2"
                                style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.2)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
                              >
                                <Icon name="Eye" size={16} />
                                Узнать подробнее
                              </button>
                              {videoUrl && (
                                <button
                                  onClick={() => setVideoModal(videoUrl)}
                                  className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all border border-gray-200 hover:border-orange-300 text-[#1A1A1A] inline-flex items-center justify-center gap-2"
                                >
                                  <Icon name="Play" size={16} style={{ color: "var(--orange)" }} />
                                  Смотреть видео
                                </button>
                              )}
                              <button
                                onClick={() => openFos(p.name)}
                                className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all text-white inline-flex items-center justify-center gap-2"
                                style={{ background: "var(--orange)" }}
                              >
                                <Icon name="MessageSquare" size={16} />
                                Оставить заявку
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredCatalog.length > catalogShow && (
                <div className="mt-8 text-center">
                  <button onClick={() => setCatalogShow(s => s + 9)} className="btn-outline-orange">
                    <Icon name="ChevronDown" size={18} className="mr-2" />
                    Показать ещё ({filteredCatalog.length - catalogShow})
                  </button>
                </div>
              )}

              {catalog.length > 0 && (
                <div className="mt-12">
                  <div
                    className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-6"
                    style={{ background: "linear-gradient(135deg, rgba(255,102,0,0.08), rgba(255,102,0,0.02))", border: "1px solid rgba(255,102,0,0.18)" }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: "var(--orange)" }}>
                      <Icon name="ListChecks" size={26} className="text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-1">Нужна индивидуальная конфигурация или подбор под задачу?</h3>
                      <p className="text-[#555] text-[15px] leading-relaxed">Ответьте на несколько вопросов — подберём подходящую машину flow-pack с ценами и видео работы.</p>
                    </div>
                    <button
                      onClick={() => setQuizOpen(true)}
                      className="px-6 py-3.5 rounded-lg font-semibold text-white text-base transition-opacity hover:opacity-90 whitespace-nowrap"
                      style={{ background: "var(--orange)" }}
                    >
                      Подобрать под задачу
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* APPLICATIONS */}
      <section id="applications" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Что можно упаковывать</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {APPLICATIONS.map((app, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover flex flex-col">
                <div className="aspect-[4/3] bg-[#F0F0F0] overflow-hidden">
                  <img src={app.img} alt={app.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-2">{app.title}</h3>
                  <p className="text-[13px] text-[#666] leading-snug">{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="btn-outline-orange">
              <Icon name="MessageSquare" size={18} className="mr-2" />
              Не нашли свой продукт? Спросите инженера
            </button>
          </div>
        </div>
      </section>

      {/* SERIES */}
      <section id="series" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">3 класса машин — под бюджет и задачу</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERIES.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover flex flex-col">
                <div className="aspect-square bg-white overflow-hidden">
                  <img src={seriesImage(s)} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#1A1A1A] text-lg mb-2 leading-snug">{s.title}</h3>
                  <p className="text-[14px] text-[#666] mb-4">{s.intro}</p>
                  <ul className="space-y-2.5 mb-5 flex-1">
                    {s.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-[14px] leading-snug">
                        <Icon name="Check" size={15} className="mt-1 flex-shrink-0" style={{ color: "var(--orange)" }} />
                        <span className="text-[#444]">
                          {b.text}
                          {b.links && b.links.length > 0 && (
                            <span className="block mt-1.5 flex flex-wrap gap-1.5">
                              {b.links.map(link => (
                                <button
                                  key={link}
                                  onClick={() => goToProduct(link)}
                                  className="text-[12.5px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                                  style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.2)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
                                >
                                  {link}
                                </button>
                              ))}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => openFos()} className="btn-outline-orange w-full">Подробнее</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS / HOW IT WORKS */}
      <section id="process" className="py-20 bg-[#F7F7F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Как работает flow-pack за 4 шага</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROCESS.map(p => (
              <div key={p.num} className="bg-white rounded-xl border border-gray-100 p-5 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: "var(--orange)" }}>
                    {p.num}
                  </div>
                  <Icon name={p.icon} fallback="Circle" size={22} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-base mb-1 leading-snug">{p.title}</h3>
                <p className="text-sm text-[#666] leading-snug">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[#555] max-w-2xl mx-auto mt-8 leading-relaxed">
            Датчик длины продукта (LVA) автоматически подбирает размер пакета — без перерасхода плёнки.
          </p>
          <div className="mt-8 text-center">
            <button onClick={() => openFos()} className="btn-orange inline-flex items-center gap-2">
              <Icon name="FlaskConical" size={16} className="text-white" />
              Заказать тест-упаковку вашего продукта
            </button>
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="guarantees" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Гарантии и сертификаты</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {GUARANTEES.map((g, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.10)" }}>
                  <Icon name={g.icon} fallback="ShieldCheck" size={22} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-1 leading-tight">{g.title}</h3>
                <p className="text-[13px] text-[#888] leading-snug">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT COMPANY */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-3">
            <h2 className="section-title">О компании ТЕХНОСИБ</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-3" style={{ background: "var(--orange)" }} />
          </div>
          <p className="text-center text-[#888] mb-10">Ваш надёжный партнёр с 2001 года</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[
              { icon: "Award", big: "25", title: "лет на рынке", desc: "Опыт и экспертиза в упаковочном оборудовании" },
              { icon: "MapPin", title: "2 города", desc: "Офисы в Москве и Новосибирске" },
              { icon: "Globe", title: "Проверенные партнёры", desc: "Из Европы, России и Китая" },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 text-center card-hover">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                  {c.big
                    ? <span className="text-2xl font-bold" style={{ color: "var(--orange)" }}>{c.big}</span>
                    : <Icon name={c.icon} fallback="Circle" size={26} style={{ color: "var(--orange)" }} />}
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-1">{c.title}</h3>
                <p className="text-[13px] text-[#888] leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <p className="text-[15px] text-[#555] leading-relaxed mb-5">
              Компания «Техно-Сиб» — надёжный поставщик и партнёр в сфере профессионального пищевого
              и фасовочно-упаковочного оборудования. Мы работаем с 2001 года и уже 25 лет помогаем предприятиям
              эффективно оснащать производства и склады пищевым и упаковочным оборудованием, предоставляем сервисное
              обслуживание, а также реализуем упаковочные и расходные материалы.
            </p>
            <div className="rounded-lg px-4 py-3 mb-5" style={{ background: "rgba(255,102,0,0.07)", borderLeft: "3px solid var(--orange)" }}>
              <p className="text-[15px] font-medium text-[#333]">
                Мы сотрудничаем с ведущими заводами-производителями Европы, России и Китая, подбирая решения
                под задачи и бюджет клиента.
              </p>
            </div>
            <p className="text-[15px] text-[#555] leading-relaxed mb-4">
              Собственные офисы продаж, склады, сервисная служба и отлаженная логистика в Москве и Новосибирске
              позволяют нам оперативно выполнять поставки и поддерживать оборудование на территории России и стран СНГ.
            </p>
            <p className="text-[15px] text-[#555] leading-relaxed mb-6">
              Экспертиза наших специалистов помогает решать задачи любого уровня сложности — от подбора единичной
              позиции до комплексного оснащения. «Техно-Сиб» всегда предложит оптимальное решение для вашего бизнеса
              и обеспечит надёжную поддержку на всех этапах работы.
            </p>
            <div className="border-t border-gray-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {[
                { title: "Комплексные решения", desc: "От подбора оборудования до сервисного обслуживания" },
                { title: "Быстрая доставка", desc: "Собственная логистика по всей России и СНГ" },
                { title: "Сервисная поддержка", desc: "Гарантийное и постгарантийное обслуживание" },
                { title: "Экспертная консультация", desc: "Помощь в выборе оптимального решения" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(255,102,0,0.1)" }}>
                    <Icon name="Check" size={15} style={{ color: "var(--orange)" }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] text-[15px] mb-0.5">{f.title}</h4>
                    <p className="text-[13px] text-[#888] leading-snug">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE */}
      <section id="service" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Сервис и доставка</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover flex flex-col">
                <div className="aspect-[4/3] bg-[#F0F0F0] overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Частые вопросы</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FFF5EE] transition-colors"
                >
                  <span className="font-semibold text-[#1A1A1A] text-[16px] leading-snug">{f.q}</span>
                  <Icon name={openFaq === i ? "Minus" : "Plus"} size={20} className="flex-shrink-0" style={{ color: "var(--orange)" }} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-[15px] text-[#555] leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => openFos()} className="btn-outline-orange">
              <Icon name="HelpCircle" size={18} className="mr-2" />
              Задать свой вопрос
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="contacts" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Получить коммерческое предложение</h2>
            <p className="text-[#666]">Заполните форму — менеджер свяжется в течение 15 минут</p>
          </div>

          <div className="bg-[#F7F7F7] rounded-2xl p-6 sm:p-8 text-[#1A1A1A] border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                  placeholder="Иван"
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: formatPhoneRu(e.target.value) })}
                  onFocus={e => { if (!e.target.value) setFormData({ ...formData, phone: "+7 " }); }}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                  placeholder="+7 (___) ___-__-__"
                />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Что упаковываете?</label>
              <select
                value={formData.pack}
                onChange={e => setFormData({ ...formData, pack: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 bg-white"
              >
                <option value="">— выберите —</option>
                {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">Комментарий</label>
              <textarea
                value={formData.comment}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Объём, размер продукта, нужные опции..."
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none mb-4">
              <input
                type="checkbox"
                checked={formAgree}
                onChange={e => { setFormAgree(e.target.checked); if (formErrors.agree) setFormErrors({ ...formErrors, agree: undefined }); }}
                className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
              />
              <PolicyDisclaimer />
            </label>
            {formErrors.agree && <p className="text-xs text-red-500 mb-2">{formErrors.agree}</p>}
            <button onClick={submitMainForm} disabled={formSubmitting} className="btn-orange w-full text-base py-4 disabled:opacity-60">
              {formSubmitting ? "Отправляем..." : "Отправить заявку"}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="inline-block bg-white rounded-lg px-3 py-2 mb-4">
                <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-white/55 leading-relaxed max-w-xs">
                Поставка и сервис упаковочного оборудования. 25 лет на рынке.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Навигация</p>
              <ul className="space-y-2">
                {NAV.map(l => (
                  <li key={l.href}>
                    <button onClick={() => scrollTo(l.href)}
                      className="text-sm text-white/65 hover:text-white transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Контакты</p>
              <ul className="space-y-3">
                <li>
                  <a href="tel:88005057831" className="text-sm text-white/65 hover:text-white transition-colors flex items-center gap-2">
                    <Icon name="Phone" size={14} className="text-orange-500" />
                    8 800 505-78-31
                  </a>
                </li>
                <li>
                  <a href="mailto:pack@t-sib.ru" className="text-[15px] text-white/65 hover:text-white transition-colors flex items-center gap-2">
                    <Icon name="Mail" size={14} className="text-orange-500" />
                    pack@t-sib.ru
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="MapPin" size={14} className="text-orange-500 mt-1 flex-shrink-0" />
                  <span className="text-[14px] text-white/65 leading-relaxed">Москва, ш. Энтузиастов, д. 56, стр. 32, офис 115</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="MapPin" size={14} className="text-orange-500 mt-1 flex-shrink-0" />
                  <span className="text-[14px] text-white/65 leading-relaxed">Новосибирск, ул. Электрозаводская, 2 к1, офис 304, 314</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/35">© {new Date().getFullYear()} Техно-Сиб. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* DETAILS MODAL */}
      {detailsProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={() => setDetailsProduct(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full my-4 relative flex flex-col max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-5 sm:px-7 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] pr-8 leading-tight">{detailsProduct.name}</h3>
              <button onClick={() => setDetailsProduct(null)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon name="X" size={20} className="text-[#666]" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 sm:px-7 py-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <ProductGallery
                  images={detailsProduct.pictures}
                  alt={detailsProduct.name}
                  fallback={IMG_HERO}
                  className="bg-[#F7F7F7] rounded-xl aspect-square flex items-center justify-center overflow-hidden"
                  imgClassName="w-full h-full object-contain p-4"
                  onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
                />
                <div>
                  <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                    <p className="text-xs uppercase tracking-wider text-[#666] mb-1">Цена</p>
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--orange)" }}>{formatPrice(detailsProduct.price)}</p>
                  </div>
                  {detailsProduct.vendor && (
                    <p className="text-sm text-[#666] mb-2"><span className="text-[#999]">Производитель: </span><span className="text-[#1A1A1A] font-semibold">{detailsProduct.vendor}</span></p>
                  )}
                  {getVideoUrl(detailsProduct.params) && (
                    <button
                      onClick={() => setVideoModal(getVideoUrl(detailsProduct.params) as string)}
                      className="mt-2 w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all border border-gray-200 hover:border-orange-300 text-[#1A1A1A] inline-flex items-center justify-center gap-2"
                    >
                      <Icon name="Play" size={16} style={{ color: "var(--orange)" }} />
                      Смотреть видео
                    </button>
                  )}
                </div>
              </div>

              {detailsProduct.description && stripHtml(detailsProduct.description) && (
                <div className="mb-6">
                  <h4 className="font-bold text-[13px] uppercase tracking-wider mb-2" style={{ color: "var(--orange)" }}>Описание</h4>
                  <p className="text-[14px] text-[#444] leading-relaxed whitespace-pre-line">{stripHtml(detailsProduct.description)}</p>
                </div>
              )}

              {visibleParams(detailsProduct.params).length > 0 && (
                <div>
                  <h4 className="font-bold text-[13px] uppercase tracking-wider mb-3" style={{ color: "var(--orange)" }}>Характеристики</h4>
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
                    {visibleParams(detailsProduct.params).map((pr, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 py-2.5 odd:bg-[#FAFAFA]">
                        <span className="text-[13px] text-[#666] sm:w-1/2">{pr.name}</span>
                        <span className="text-[13.5px] text-[#1A1A1A] font-medium sm:flex-1">{pr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-7 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => { const name = detailsProduct.name; setDetailsProduct(null); openFos(name); }}
                className="btn-orange w-full text-base py-3.5 inline-flex items-center justify-center gap-2"
              >
                <Icon name="MessageSquare" size={18} />
                Оставить заявку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {videoModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoModal(null)}>
          <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setVideoModal(null)} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <Icon name="X" size={22} />
            </button>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {(() => {
                const ytMatch = videoModal.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
                const rtMatch = videoModal.match(/rutube\.ru\/video\/([\w-]+)/);
                if (ytMatch) {
                  return <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`} title="Видео" allow="autoplay; encrypted-media" allowFullScreen />;
                }
                if (rtMatch) {
                  return <iframe className="absolute inset-0 w-full h-full" src={`https://rutube.ru/play/embed/${rtMatch[1]}`} title="Видео" allow="autoplay" allowFullScreen />;
                }
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center gap-3">
                    <Icon name="Film" size={48} className="opacity-60" />
                    <p>Видео доступно по внешней ссылке</p>
                    <a href={videoModal} target="_blank" rel="noopener noreferrer" className="btn-orange inline-flex items-center gap-2 px-5 py-2.5">
                      <Icon name="ExternalLink" size={16} />Открыть видео
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[115] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Закрыть"
          >
            <Icon name="X" size={22} />
          </button>

          <div className="absolute top-5 left-5 text-white/80 text-sm font-medium">
            {lightbox.idx + 1} / {lightbox.pictures.length}
          </div>

          {lightbox.pictures.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: (lb.idx - 1 + lb.pictures.length) % lb.pictures.length } : lb); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Предыдущее"
              >
                <Icon name="ChevronLeft" size={26} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: (lb.idx + 1) % lb.pictures.length } : lb); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Следующее"
              >
                <Icon name="ChevronRight" size={26} />
              </button>
            </>
          )}

          <img
            src={lightbox.pictures[lightbox.idx]}
            alt=""
            onClick={e => e.stopPropagation()}
            className="max-w-[92vw] max-h-[88vh] object-contain"
          />

          {lightbox.pictures.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 max-w-[92vw] overflow-x-auto px-4">
              {lightbox.pictures.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: i } : lb); }}
                  className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                  style={{ borderColor: i === lightbox.idx ? "var(--orange)" : "transparent", opacity: i === lightbox.idx ? 1 : 0.6 }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOS MODAL */}
      {fosOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setFosOpen(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 md:p-8 relative my-auto overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFosOpen(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
              aria-label="Закрыть"
            >
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>

            <h3 className="font-bold text-2xl text-[#1A1A1A] mb-2 pr-10">Оставить заявку</h3>
            <p className="text-[15px] text-[#666] mb-5 leading-relaxed break-words">
              {fosOpen.productName
                ? <>По товару: <span className="font-semibold text-[#1A1A1A]">{fosOpen.productName}</span></>
                : "Менеджер свяжется в течение 15 минут."}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                  Имя <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Иван Петров"
                  value={fosData.name}
                  onChange={e => { setFosData({ ...fosData, name: e.target.value }); if (fosErrors.name) setFosErrors({ ...fosErrors, name: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.name ? "#E53935" : "#E0E0E0" }}
                />
                {fosErrors.name && <p className="text-[13px] text-red-500 mt-1">{fosErrors.name}</p>}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                  Телефон <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={fosData.phone}
                  onChange={e => { setFosData({ ...fosData, phone: formatPhoneRu(e.target.value) }); if (fosErrors.phone) setFosErrors({ ...fosErrors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setFosData({ ...fosData, phone: "+7 " }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.phone ? "#E53935" : "#E0E0E0" }}
                />
                {fosErrors.phone && <p className="text-[13px] text-red-500 mt-1">{fosErrors.phone}</p>}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={fosData.email}
                  onChange={e => { setFosData({ ...fosData, email: e.target.value }); if (fosErrors.email) setFosErrors({ ...fosErrors, email: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.email ? "#E53935" : "#E0E0E0" }}
                />
                {fosErrors.email && <p className="text-[13px] text-red-500 mt-1">{fosErrors.email}</p>}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fosAgree}
                  onChange={e => { setFosAgree(e.target.checked); if (fosErrors.agree) setFosErrors({ ...fosErrors, agree: undefined }); }}
                  className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                />
                <PolicyDisclaimer />
              </label>
              {fosErrors.agree && <p className="text-[13px] text-red-500 -mt-2">{fosErrors.agree}</p>}

              <button
                onClick={submitFos}
                disabled={fosSubmitting}
                className="btn-orange w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {fosSubmitting ? "Отправляем…" : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THANKS MODAL */}
      {thanksOpen && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setThanksOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-7 md:p-9 relative text-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setThanksOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Закрыть"
            >
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
              <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
            </div>
            <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-3 leading-tight">
              Благодарим за обращение в компанию Техно-Сиб
            </h3>
            <p className="text-[#555] leading-relaxed mb-6">
              Менеджер свяжется с Вами в ближайшее время в часы работы.
            </p>
            <button onClick={() => setThanksOpen(false)} className="btn-orange px-10 py-3">
              Хорошо
            </button>
          </div>
        </div>
      )}

      {/* QUIZ SIDE TAB + MODAL */}
      <QuizSideTab onClick={() => setQuizOpen(true)} />
      <FlowpackQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} />
    </div>
  );
}