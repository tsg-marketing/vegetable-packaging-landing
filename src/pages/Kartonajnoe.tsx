import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";
import ProductGallery from "@/components/ProductGallery";
import QuizSideTab from "@/components/QuizSideTab";
import CartonQuiz, { type CartonQuizPayload } from "@/components/CartonQuiz";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";

// Страница картонажного упаковочного оборудования /kartonajnoe

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const CATALOG_ENDPOINT = "https://functions.poehali.dev/714167da-e3c6-45bc-9647-de3991debd61";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/e080e415-acc2-4182-8331-888da44fa6e4.jpg";

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
  const p = params.find(x => /видео|video/i.test(x.name));
  if (!p) return null;
  const raw = (p.value || "").trim();
  if (!raw) return null;
  const first = raw.split(/[\s,;]+/).find(s => /^https?:\/\//i.test(s));
  return first || null;
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
    const res = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        utm: readUtm(),
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
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

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "#catalog" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Решения", href: "#solutions" },
  { label: "Подбор", href: "#selector" },
  { label: "О компании", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#contacts" },
];

const FAQS = [
  { q: "Чем формирователь отличается от заклейщика?", a: "Формирователь собирает короб из плоской заготовки и заклеивает дно. Заклейщик закрывает уже наполненный короб сверху и снизу. Часто их используют в паре с укладкой продукции между ними." },
  { q: "Полуавтомат или автомат — что выбрать?", a: "Полуавтомат требует оператора (придержать клапаны, подать короб) — это дешевле и подходит для небольших объёмов. Автомат работает без участия человека — для потока и крупных производств." },
  { q: "Нужен ли компрессор?", a: "Зависит от модели. Многим заклейщикам компрессор не нужен (работают от сети). Формирователям и пневматическим моделям требуется давление 0,4–0,6 МПа. У некоторых моделей (например, CXJ-6040C) компрессор приобретается отдельно." },
  { q: "Какую ленту можно использовать?", a: "БОПП, ПВХ, крафт, бумажную, водоактивируемую (на FXW-6050), а также брендированный скотч с логотипом. Стандартная ширина — 48, 60, 76 мм." },
  { q: "Можно ли встроить в существующую линию?", a: "Да. Большинство моделей работают автономно или интегрируются в упаковочную линию, в том числе с весами, сканерами и системами учёта WMS." },
  { q: "Подойдёт ли для маркетплейсов?", a: "Да — есть специальные модели под малые короба и форматы «самолёт» №1–13 (GPA-30, GPK-30H15/20, GPE-50)." },
  { q: "Что с гарантией и сервисом?", a: "Официальная гарантия производителя 12 месяцев, пусконаладка, гарантийное и послегарантийное обслуживание, доставка по РФ и странам ТС." },
  { q: "Какой срок поставки?", a: "Зависит от наличия на складе. Уточняйте у менеджера — часть моделей доступна к отгрузке сразу." },
];

const HERO_BULLETS = [
  { icon: "Zap", bold: "Производительность до 50 коробов/мин", rest: " — под любой объём упаковки" },
  { icon: "Package", bold: "Короба от 130×80 мм до 850×600 мм", rest: " — мелкие посылки и крупная тара" },
  { icon: "Wrench", bold: "Быстрая переналадка под новый типоразмер", rest: " без остановки линии" },
  { icon: "ShieldCheck", bold: "Официальная гарантия 12 месяцев", rest: " + сервис и пусконаладка" },
];

const ADVANTAGES = [
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/cf0bf663-bfb9-4d53-872d-62209c73d899.jpg", title: "Меньше ручного труда", desc: "Один аппарат заменяет несколько упаковщиков — высвобождаете персонал в пиковые сезоны." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/2b22d063-5d1c-471d-a0ec-97f86a8f2676.jpg", title: "Стабильное качество шва", desc: "Лента ложится ровно, без пузырей и перекосов — упаковка выглядит аккуратно при отгрузке." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/27c4d987-50f9-46b4-8358-7cd878c7a78a.jpg", title: "Экономный расход скотча", desc: "Автоматическая обрезка ленты и экономный расход скотча — снижение операционных затрат." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/6e2a2a41-3895-482e-9082-ff6d8e3a3591.jpg", title: "Работа с любой лентой", desc: "БОПП, ПВХ, крафт, водоактивируемая, брендированный скотч с логотипом." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/29e73a6c-b7c8-474c-9b7a-3742c4596249.jpg", title: "Надёжные комплектующие", desc: "Ресурс выключателей до 100 000 циклов." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/f3c658b8-c17d-45da-80d3-fc66a54c6d0b.jpg", title: "Автономно или в линии", desc: "Каждая машина работает отдельно или встраивается в упаковочный конвейер." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/34719d32-a546-4589-b35b-5df105d8923c.jpg", title: "Сигнализация расходников", desc: "Оповещение об окончании ленты или заготовок — меньше простоев." },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/cce423ce-5ac9-4143-b933-35380ad32f93.jpg", title: "Мобильность", desc: "Конструкция на колёсах с фиксаторами — легко перемещать по цеху." },
];

const SOLUTIONS = [
  { icon: "ShoppingCart", branch: "Маркетплейсы и e-commerce", solve: "Быстрая упаковка посылок в пик сезона, форматы «самолёт»" },
  { icon: "Warehouse", branch: "Склады и фулфилмент", solve: "Формирование тары на потоке, интеграция с маркетплейсами, весами, сканерами" },
  { icon: "UtensilsCrossed", branch: "Пищевое производство", solve: "Стабильная заклейка транспортной тары, нержавеющие узлы" },
  { icon: "Pill", branch: "Фармацевтика, косметика", solve: "Аккуратная упаковка, защита от вскрытия" },
  { icon: "Truck", branch: "Логистика и дистрибуция", solve: "Высокая скорость на крупнотоннажных потоках до 50 коробов/мин" },
  { icon: "Boxes", branch: "Производство FMCG, бытовой химии", solve: "Серийная упаковка однотипной продукции без участия оператора" },
];

type SeriesRow = { series: string; perf: string; size: string; note: string };
type SelectorTab = {
  key: string;
  label: string;
  icon: string;
  subtitle: string;
  columns: [string, string, string, string];
  rows: SeriesRow[];
  tips: string[];
};

const SELECTOR_TABS: SelectorTab[] = [
  {
    key: "formers",
    label: "Формирователи",
    icon: "Box",
    subtitle: "Собирают короб из плоской заготовки и заклеивают дно",
    columns: ["Серия", "Производительность", "Размер короба", "Под что"],
    rows: [
      { series: "CXJ (4030C, 5035C, 6040A/C, 8560A, 4540D)", perf: "8–24 кор/мин", size: "от 200×150 до 850×600", note: "Базовое формирование, пищёвка, логистика" },
      { series: "GPK-E (40E, 50E, 60)", perf: "8–12 кор/мин", size: "средние и крупные", note: "Экономичные, цена на ~50% ниже аналогов" },
      { series: "GPK-H (30H15/20, 40H18/30/50, 50H20)", perf: "15–50 кор/мин", size: "от малых e-commerce до средних", note: "Высокоскоростные горизонтальные, для потока" },
      { series: "D-1500", perf: "до 1600 кор/час", size: "300×200 до 600×600", note: "Премиум, память настроек, удалённый контроль" },
    ],
    tips: [
      "Малые короба для маркетплейсов → GPK-30H15 / 30H20",
      "Высокий поток на складе → GPK-40H30 / 40H50 (до 30–50 кор/мин)",
      "Крупная тара → GPK-60, CXJ-8560A",
      "Бюджет ограничен → серия GPK-E",
    ],
  },
  {
    key: "sealers",
    label: "Заклейщики",
    icon: "PackageCheck",
    subtitle: "Заклеивают верх и низ собранного короба",
    columns: ["Серия", "Тип", "Производительность", "Особенность"],
    rows: [
      { series: "FXJ (4030A, 5050A/AS/B/L/Q/QS/Z/ZX, 2550X, 6050, 6050С, 8070B)", perf: "Полуавтомат / авто", size: "18–45 кор/мин", note: "Самая широкая линейка, любой размер" },
      { series: "EC-60", perf: "Полуавтомат", size: "25–40 кор/мин", note: "Бюджетный для малого/среднего бизнеса" },
      { series: "FXW-6050", perf: "Автомат", size: "до 15 кор/мин", note: "Водоактивируемая крафт-лента (эко)" },
      { series: "GPA (30, 50E, 50P)", perf: "Полуавтомат", size: "до 20 кор/мин", note: "Для маркетплейсов, короба №1–12" },
      { series: "GPB-56", perf: "Полуавтомат", size: "до 20 кор/мин", note: "Высокие, узкие и тяжёлые короба" },
      { series: "GPC (50, 50D)", perf: "Автомат", size: "поток", note: "С автозакрытием клапанов" },
      { series: "GPE (50, 50P)", perf: "Автомат", size: "8–12 кор/мин", note: "Автонастройка под размер, частая смена тары" },
    ],
    tips: [
      "Посылки для маркетплейсов → GPA-30, GPE-50",
      "Тяжёлые/габаритные короба → FXJ-8070B (до 50 кг), GPB-56",
      "Эко-упаковка крафт-лентой → FXW-6050",
      "Полная автоматика без оператора → GPC-50D, GPE-50P",
    ],
  },
  {
    key: "combo",
    label: "Комбо и спец.",
    icon: "Combine",
    subtitle: "Формирование + заклейка дна, фальцовка, клей-расплав",
    columns: ["Модель", "Функция", "", ""],
    rows: [
      { series: "CXJ-6040A / 6040C", perf: "Формирование + заклейка дна за один цикл", size: "", note: "" },
      { series: "DZF-5050 / 5050A", perf: "Складывание и заклейка дна, укладка товара", size: "", note: "" },
      { series: "FXJ-5050Z", perf: "Фальцовка верхних ушей + заклейка сверху/снизу", size: "", note: "" },
      { series: "FXJ-5050ZBR", perf: "Заклейка термоклеем-расплавом (защита от вскрытия)", size: "", note: "" },
      { series: "JFX-5050B / 5060", perf: "Заклейка углов/стыков клапанов", size: "", note: "" },
    ],
    tips: [],
  },
];

const LINE_STEPS = [
  { icon: "Box", title: "Формирователь" },
  { icon: "Hand", title: "Укладка продукции" },
  { icon: "PackageCheck", title: "Заклейщик" },
  { icon: "Truck", title: "Отгрузка" },
];

const GUARANTEES = [
  { icon: "ShieldCheck", title: "Гарантия 12 месяцев", desc: "На всё оборудование с пусконаладкой" },
  { icon: "Award", title: "Сертификация CE, ISO 9001", desc: "Соответствие международным стандартам качества" },
  { icon: "FileCheck", title: "Декларация соответствия", desc: "Документы для работы на территории РФ и СНГ" },
];

const SERVICES = [
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/fa477267-7521-4633-93b8-5ab3e6af1486.jpg", title: "Наличие на складах", desc: "В Новосибирске и Москве" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/5842e0f8-8e07-4d8b-862d-ea93be2b0686.jpg", title: "Доставка РФ и СНГ", desc: "Экспресс-отправка со склада в день оплаты" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/1282aae5-2da0-4623-990e-68750f676dd7.jpg", title: "Обучение персонала", desc: "Инструктаж на объекте клиента включён" },
  { img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/6441e3aa-1d2f-40c2-8397-537fa22d6c2a.jpg", title: "Лизинг и рассрочка", desc: "Гибкие условия оплаты и финансирования" },
];

export default function Kartonajnoe() {
  const [selectorTab, setSelectorTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const [kpData, setKpData] = useState({ name: "", phone: "", email: "", details: "" });
  const [kpAgree, setKpAgree] = useState(false);
  const [kpErrors, setKpErrors] = useState<{ name?: string; phone?: string; agree?: string }>({});
  const [kpSubmitting, setKpSubmitting] = useState(false);

  const [fosOpen, setFosOpen] = useState<{ productName?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogShow, setCatalogShow] = useState(9);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCat, setCatalogCat] = useState("all");

  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);

  useEffect(() => { setCatalogShow(9); }, [catalogSearch, catalogCat]);

  useEffect(() => {
    const anyOpen = detailsProduct || videoModal || lightbox || fosOpen || thanksOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailsProduct, videoModal, lightbox, fosOpen, thanksOpen]);

  const CATEGORY_TABS = [
    { id: "all", label: "Все" },
    { id: "559", label: "Формирователи коробов" },
    { id: "558", label: "Заклейщики коробов" },
    { id: "325", label: "Картонажное оборудование" },
  ];
  const catCount = (id: string) => id === "all" ? catalog.length : catalog.filter(p => p.categoryId === id).length;

  const filteredCatalog = catalog.filter(p => {
    if (catalogCat !== "all" && p.categoryId !== catalogCat) return false;
    const q = catalogSearch.trim().toLowerCase();
    if (q) return p.name.toLowerCase().includes(q);
    return true;
  });

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
      page: "kartonajnoe",
      name: fosData.name.trim(),
      phone: fosData.phone.trim(),
      email: fosData.email.trim(),
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  }, [fosData, fosOpen, fosSubmitting, validateFos]);

  const submitQuiz = useCallback(async (data: CartonQuizPayload): Promise<boolean> => {
    return sendLead({
      source: "quiz",
      page: "kartonajnoe",
      name: data.name,
      phone: data.phone,
      email: data.email,
      task: data.task,
      size: data.size,
      speed: data.speed,
      options: data.options.join(", "),
      quizAnswers: {
        task: data.task,
        size: data.size,
        speed: data.speed,
        options: data.options.join(", "),
      },
    });
  }, []);

  const submitKp = useCallback(async () => {
    const errs: { name?: string; phone?: string; agree?: string } = {};
    if (kpData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(kpData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (!kpAgree) errs.agree = "Необходимо согласие";
    setKpErrors(errs);
    if (Object.keys(errs).length > 0 || kpSubmitting) return;
    setKpSubmitting(true);
    await sendLead({
      source: "kp_form",
      page: "kartonajnoe",
      name: kpData.name.trim(),
      phone: kpData.phone.trim(),
      email: kpData.email.trim(),
      comment: kpData.details.trim(),
    });
    setKpSubmitting(false);
    setKpData({ name: "", phone: "", email: "", details: "" });
    setKpAgree(false);
    setThanksOpen(true);
  }, [kpData, kpAgree, kpSubmitting]);

  const scrollTo = (href: string) => {
    if (href.startsWith("/")) { window.location.href = href; return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
    setEquipmentOpen(false);
  };

  const findProduct = useCallback((token: string): CatalogProduct | undefined => {
    const t = token.trim().toLowerCase().replace(/[\s-]+/g, "");
    if (!t) return undefined;
    return catalog.find(p => p.name.toLowerCase().replace(/[\s-]+/g, "").includes(t));
  }, [catalog]);

  const goToModel = useCallback((token: string) => {
    const prod = findProduct(token);
    if (prod) { setDetailsProduct(prod); return; }
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  }, [findProduct]);

  // Разбивает строку серии на кликабельные модели: "CXJ (4030C, 5035C)" → ссылки
  const renderModels = (text: string) => {
    const m = text.match(/^(.*?)\(([^)]*)\)(.*)$/);
    if (!m) {
      return (
        <button onClick={() => goToModel(text)} className="font-semibold text-left hover:underline" style={{ color: "var(--orange)" }}>
          {text}
        </button>
      );
    }
    const prefix = m[1].trim();
    const tokens = m[2].split(/[,/]/).map(s => s.trim()).filter(Boolean);
    return (
      <span className="leading-relaxed">
        {prefix && <span className="text-[#1A1A1A]">{prefix} </span>}
        <span className="inline-flex flex-wrap gap-1.5 align-middle">
          {tokens.map((tok, i) => (
            <button
              key={i}
              onClick={() => goToModel(prefix ? `${prefix.split(" ")[0]}-${tok}` : tok)}
              className="text-[12.5px] font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.22)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
            >
              {tok}
            </button>
          ))}
        </span>
      </span>
    );
  };

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
                  <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 min-w-[280px]">
                    <a href="/vegetables" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Упаковка овощей и фруктов</a>
                    <a href="/vacuum" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Вакуумные упаковщики</a>
                    <a href="/gorizontalnoe" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Горизонтальные машины flow-pack</a>
                    <a href="/kartonajnoe" className="block px-4 py-2 text-sm text-orange-600 font-semibold hover:bg-[#FFF5EE] transition-colors">Картонажное оборудование</a>
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
              <a href="/gorizontalnoe" className="block text-base text-[#444] py-1.5 pl-2">Горизонтальные машины flow-pack</a>
              <a href="/kartonajnoe" className="block text-base text-orange-600 font-semibold py-1.5 pl-2">Картонажное оборудование</a>
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
            <h1 className="text-[clamp(26px,4vw,44px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              Формирователи и заклейщики коробов от ведущих <span style={{ color: "var(--orange)" }}>Азиатских и Европейских</span> производителей
            </h1>

            <ul className="grid gap-y-4 mb-8 max-w-2xl mt-2">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[18px] sm:text-[20px] text-[#1A1A1A] leading-snug">
                  <Icon name={b.icon} fallback="CheckCircle2" size={28} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span><span className="font-bold">{b.bold}</span>{b.rest}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setQuizOpen(true)} className="btn-orange text-base px-8 py-3.5">
                Подобрать оборудование
              </button>
              <button onClick={() => openFos()} className="btn-outline-orange text-base px-8 py-3.5">
                Получить КП
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 fade-up flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Формирователь и заклейщик коробов"
              className="w-full h-auto lg:h-[520px] xl:h-[580px] object-contain drop-shadow-2xl rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* ECONOMY / ADVANTAGES */}
      <section id="advantages" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Почему это оборудование экономит ваши деньги</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">Автоматизация формирования и заклейки коробов снижает затраты на персонал, материалы и простои</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="card-hover rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden bg-[#F0F0F0]">
                  <img src={a.img} alt={a.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#1A1A1A] text-[18px] mb-2 leading-snug">{a.title}</h3>
                  <p className="text-[16px] text-[#444] leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="btn-orange">
              <Icon name="Calculator" size={18} className="mr-2" />
              Рассчитать экономию
            </button>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Каталог картонажного оборудования</h2>
            <p className="text-[#666] mt-2 max-w-xl mx-auto">Формирователи коробов, заклейщики коробов и картонажное оборудование</p>
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

          {!catalogLoading && !catalogError && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {CATEGORY_TABS.map(t => {
                const active = catalogCat === t.id;
                const cnt = catCount(t.id);
                if (t.id !== "all" && cnt === 0) return null;
                return (
                  <button
                    key={t.id}
                    onClick={() => setCatalogCat(t.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all border"
                    style={active
                      ? { background: "var(--orange)", color: "#fff", borderColor: "var(--orange)" }
                      : { background: "#fff", color: "#444", borderColor: "#E5E5E5" }}
                  >
                    {t.label}
                    <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: active ? "rgba(255,255,255,0.25)" : "#F0F0F0", color: active ? "#fff" : "#888" }}>{cnt}</span>
                  </button>
                );
              })}
            </div>
          )}

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
            </>
          )}
        </div>
      </section>

      {/* SOLUTIONS — Экран 4 */}
      <section id="solutions" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Решения под вашу задачу</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">Подберём оборудование под отрасль, объём и формат упаковки</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {SOLUTIONS.map((s, i) => (
              <div key={i} className="card-hover bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={s.icon} fallback="Boxes" size={26} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-2 leading-snug">{s.branch}</h3>
                <p className="text-[14px] text-[#555] leading-relaxed">{s.solve}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SELECTOR — Экран 5 */}
      <section id="selector" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Какой формирователь коробов выбрать</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">Три типа оборудования — выберите вкладку и сравните серии</p>
          </div>

          {/* Line scheme */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 mb-8">
            <p className="text-center text-[13px] uppercase tracking-wider font-semibold mb-5" style={{ color: "var(--orange)" }}>Схема линии</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-2">
              {LINE_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                  <div className="flex flex-col items-center text-center w-full sm:w-32">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: "rgba(255,102,0,0.1)" }}>
                      <Icon name={step.icon} fallback="Box" size={26} style={{ color: "var(--orange)" }} />
                    </div>
                    <span className="text-[14px] font-semibold text-[#1A1A1A] leading-snug">{step.title}</span>
                  </div>
                  {i < LINE_STEPS.length - 1 && (
                    <Icon name="ArrowRight" size={22} className="rotate-90 sm:rotate-0 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {SELECTOR_TABS.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setSelectorTab(i)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all border"
                style={selectorTab === i
                  ? { background: "var(--orange)", color: "#fff", borderColor: "var(--orange)" }
                  : { background: "#fff", color: "#444", borderColor: "#E5E5E5" }}
              >
                <Icon name={t.icon} fallback="Box" size={18} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {(() => {
            const tab = SELECTOR_TABS[selectorTab];
            const visibleCols = tab.columns.filter(c => c !== "");
            return (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 sm:px-7 pt-5 pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-[#1A1A1A] text-lg">{tab.label} коробов</h3>
                  <p className="text-[14px] text-[#666] mt-0.5">{tab.subtitle}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-[#FAFAFA]">
                        {visibleCols.map((c, i) => (
                          <th key={i} className="px-4 sm:px-6 py-3 text-[12px] uppercase tracking-wider font-bold text-[#888]">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tab.rows.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-[#FFF8F3] transition-colors">
                          <td className="px-4 sm:px-6 py-3.5 text-[14px] font-semibold text-[#1A1A1A] align-top">{renderModels(r.series)}</td>
                          <td className="px-4 sm:px-6 py-3.5 text-[14px] text-[#444] align-top">{r.perf}</td>
                          {visibleCols.length > 2 && <td className="px-4 sm:px-6 py-3.5 text-[14px] text-[#444] align-top">{r.size}</td>}
                          {visibleCols.length > 3 && <td className="px-4 sm:px-6 py-3.5 text-[14px] text-[#444] align-top">{r.note}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {tab.tips.length > 0 && (
                  <div className="px-5 sm:px-7 py-5 border-t border-gray-100" style={{ background: "rgba(255,102,0,0.04)" }}>
                    <p className="font-bold text-[14px] mb-3" style={{ color: "var(--orange)" }}>Подсказка по выбору</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      {tab.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-[14px] text-[#444] leading-snug">
                          <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="mt-8 text-center">
            <button onClick={() => setQuizOpen(true)} className="btn-orange">
              <Icon name="Headset" size={18} className="mr-2" />
              Помочь с выбором серии
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

      {/* QUIZ CTA */}
      <section id="quiz" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-[#1A1A1A]">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(255,102,0,0.18)" }} />
            <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full" style={{ background: "rgba(255,102,0,0.10)" }} />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--orange)" }}>
                <Icon name="ListChecks" size={32} className="text-white" />
              </div>
              <h2 className="text-[clamp(24px,3.5vw,36px)] font-bold text-white mb-3 leading-tight">
                Подберём оборудование за 4 шага
              </h2>
              <p className="text-white/70 text-[17px] mb-7 max-w-xl mx-auto leading-snug">
                Ответьте на 4 вопроса — инженер подберёт 2–3 модели под ваши параметры и пришлёт цены
              </p>
              <button
                onClick={() => setQuizOpen(true)}
                className="btn-orange text-base px-9 py-4 inline-flex items-center gap-2"
              >
                <Icon name="Smile" size={20} className="text-white" />
                Пройти квиз
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-[#F7F7F7]">
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

      {/* CONTACTS / KP FORM */}
      <section id="contacts" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Получите подборку и цены под вашу задачу</h2>
            <p className="text-[#666] max-w-2xl mx-auto leading-relaxed">
              Оставьте контакты — инженер подберёт 2–3 модели, рассчитает комплектацию и пришлёт коммерческое
              предложение в течение рабочего дня. При необходимости проведём тест на вашем коробе.
            </p>
          </div>

          <div className="bg-[#F7F7F7] rounded-2xl p-6 sm:p-8 text-[#1A1A1A] border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя</label>
                <input
                  type="text"
                  value={kpData.name}
                  onChange={e => { setKpData({ ...kpData, name: e.target.value }); if (kpErrors.name) setKpErrors({ ...kpErrors, name: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:border-orange-500"
                  style={{ borderColor: kpErrors.name ? "#E53935" : "#E0E0E0" }}
                  placeholder="Иван Петров"
                />
                {kpErrors.name && <p className="text-xs text-red-500 mt-1">{kpErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  value={kpData.phone}
                  onChange={e => { setKpData({ ...kpData, phone: formatPhoneRu(e.target.value) }); if (kpErrors.phone) setKpErrors({ ...kpErrors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setKpData({ ...kpData, phone: "+7 " }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:border-orange-500"
                  style={{ borderColor: kpErrors.phone ? "#E53935" : "#E0E0E0" }}
                  placeholder="+7 (___) ___-__-__"
                />
                {kpErrors.phone && <p className="text-xs text-red-500 mt-1">{kpErrors.phone}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={kpData.email}
                onChange={e => setKpData({ ...kpData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-orange-500"
                placeholder="your@email.com"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">Объём упаковки в смену / тип короба</label>
              <textarea
                value={kpData.details}
                onChange={e => setKpData({ ...kpData, details: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Например: 5000 коробов в смену, размер 400×300×200, нужна автоматика"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none mb-4">
              <input
                type="checkbox"
                checked={kpAgree}
                onChange={e => { setKpAgree(e.target.checked); if (kpErrors.agree) setKpErrors({ ...kpErrors, agree: undefined }); }}
                className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
              />
              <PolicyDisclaimer />
            </label>
            {kpErrors.agree && <p className="text-xs text-red-500 mb-2">{kpErrors.agree}</p>}

            <button onClick={submitKp} disabled={kpSubmitting} className="btn-orange w-full text-base py-4 disabled:opacity-60">
              {kpSubmitting ? "Отправляем..." : "Получить КП с ценами"}
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
                <div className="mb-5">
                  <h4 className="font-bold text-[13px] uppercase tracking-wider mb-2" style={{ color: "var(--orange)" }}>Описание</h4>
                  <p className="text-[14px] text-[#444] leading-relaxed whitespace-pre-line line-clamp-4">{stripHtml(detailsProduct.description)}</p>
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
                if (/vk\.com|vkvideo\.ru/i.test(videoModal)) {
                  return <iframe className="absolute inset-0 w-full h-full" src={videoModal.replace(/\/video/, "/video_ext.php?oid=").includes("video_ext") ? videoModal : videoModal} title="Видео" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />;
                }
                return (
                  <video className="absolute inset-0 w-full h-full" src={videoModal} controls autoPlay playsInline>
                    <a href={videoModal} target="_blank" rel="noopener noreferrer">Открыть видео</a>
                  </video>
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
      <CartonQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} />
    </div>
  );
}