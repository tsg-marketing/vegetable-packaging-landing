import { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";
import QuizSideTab from "@/components/QuizSideTab";
import VacuumQuiz, { VacuumQuizPayload } from "@/components/VacuumQuiz";
import ProductGallery from "@/components/ProductGallery";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";

// Страница вакуумного упаковочного оборудования /vacuum

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const CATALOG_ENDPOINT = "https://functions.poehali.dev/981263b7-3a88-449e-abf8-f61fbd2b5289";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/files/4636d5a7-aed0-42a8-9883-c7efdaac6536.png";
const IMG_GUARANTEE = "https://cdn.poehali.dev/files/a4eac8fe-dca9-4118-87d7-6de8054161e3.jpg";

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

const KEY_PARAMS = [
  "Производительность вакуумного насоса",
  "Размер вакуумной камеры",
  "Длина запайки",
  "Тип",
  "Мощность",
  "Габариты",
  "Вес",
];

const HIDDEN_PARAM_NAMES = ["guid", "видео (ссылка)", "видео(ссылка)", "видео"];

function isHiddenParam(name: string): boolean {
  const n = name.trim().toLowerCase();
  return HIDDEN_PARAM_NAMES.some(h => n === h);
}

function visibleParams(params: CatalogParam[]): CatalogParam[] {
  return params.filter(p => !isHiddenParam(p.name));
}

function getVideoUrl(params: CatalogParam[]): string | null {
  const p = params.find(x => /видео.*ссылк/i.test(x.name) || /^видео$/i.test(x.name.trim()));
  if (!p) return null;
  const raw = (p.value || "").trim();
  if (!raw) return null;
  const first = raw.split(/[,\s;]+/).find(s => /^https?:\/\//i.test(s));
  if (!first) return null;
  if (!/(rutube\.ru|youtube\.com|youtu\.be)/i.test(first)) return null;
  return first;
}

function getEmbedUrl(url: string): string {
  const rt = url.match(/rutube\.ru\/video\/([\w-]+)/i);
  if (rt) return `https://rutube.ru/play/embed/${rt[1]}/?autoplay=1`;
  const yt1 = url.match(/youtu\.be\/([\w-]+)/i);
  if (yt1) return `https://www.youtube.com/embed/${yt1[1]}?autoplay=1`;
  const yt2 = url.match(/[?&]v=([\w-]+)/i);
  if (yt2) return `https://www.youtube.com/embed/${yt2[1]}?autoplay=1`;
  return url;
}

function getVideoThumb(url: string): string | null {
  const rt = url.match(/rutube\.ru\/video\/([\w-]+)/i);
  if (rt) return `https://rutube.ru/api/video/${rt[1]}/thumbnail/?redirect=1`;
  const yt1 = url.match(/youtu\.be\/([\w-]+)/i);
  if (yt1) return `https://img.youtube.com/vi/${yt1[1]}/hqdefault.jpg`;
  const yt2 = url.match(/[?&]v=([\w-]+)/i);
  if (yt2) return `https://img.youtube.com/vi/${yt2[1]}/hqdefault.jpg`;
  return null;
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

function pickParams(params: CatalogParam[]): CatalogParam[] {
  const filtered = visibleParams(params);
  const found: CatalogParam[] = [];
  for (const key of KEY_PARAMS) {
    const p = filtered.find(x => x.name.toLowerCase() === key.toLowerCase());
    if (p) found.push(p);
    if (found.length >= 4) break;
  }
  if (found.length < 4) {
    for (const p of filtered) {
      if (found.length >= 4) break;
      if (!found.find(f => f.name === p.name)) found.push(p);
    }
  }
  return found;
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return "По запросу";
  return new Intl.NumberFormat("ru-RU").format(price) + " руб";
}

type TabKey = "all" | "291" | "294" | "292" | "290";
const CATALOG_TABS: { key: TabKey; label: string; categoryId?: string }[] = [
  { key: "all", label: "Вакуум-упаковочное" },
  { key: "291", label: "Бескамерные", categoryId: "291" },
  { key: "294", label: "Однокамерные", categoryId: "294" },
  { key: "292", label: "Двухкамерные", categoryId: "292" },
  { key: "290", label: "Вакуумные упаковщики", categoryId: "290" },
];

const EXTRA_VIDEOS: { id: string; name: string; url: string }[] = [
  { id: "extra-1", name: "Вакуумная упаковка продуктов — демонстрация", url: "https://rutube.ru/video/00227bfba52f39f035dd131ecaa0adef/" },
  { id: "extra-2", name: "Работа промышленного вакуумного упаковщика", url: "https://rutube.ru/video/968cbe87c330f29ea7bdce80355a916b/" },
];

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

const PROBLEMS = [
  { icon: "Timer", title: "Короткий срок годности", desc: "Скоропортящаяся продукция теряет товарный вид и списывается из ассортимента" },
  { icon: "ClipboardX", title: "Не проходит аудит сетей", desc: "Сети требуют вакуум, газонаполнение и герметичный шов под товарный знак" },
  { icon: "TrendingDown", title: "Высокий расход плёнки", desc: "Ручная и плохая запайка даёт развакуум, перерасход материалов до 25%" },
  { icon: "AlertTriangle", title: "Длинная пусконаладка", desc: "Машины без поддержки простаивают неделями из-за нехватки расходников" },
];

const ADVANTAGES = [
  { icon: "Boxes", title: "В наличии", desc: "Отгрузка со склада в Новосибирске и Москве в день оплаты" },
  { icon: "Layers", title: "Линейка моделей", desc: "Настольные и напольные, 1 или 2 камеры, под любой объём" },
  { icon: "ShieldCheck", title: "До 3-х лет гарантия", desc: "На всё оборудование с бесплатной пусконаладкой" },
  { icon: "Package", title: "Полная комплектация", desc: "Пакеты, ленты, тефлон и масло уже в комплекте" },
  { icon: "Droplets", title: "Герметичный пакет", desc: "Двойной шов 3,5 мм исключает развакуум при транспортировке" },
  { icon: "Sparkles", title: "Универсальность", desc: "Пищевые, медицинские, косметические и промышленные товары" },
  { icon: "Settings2", title: "Автопрограммы", desc: "Быстрая настройка цикла под продукт — обучение оператора за 1 день" },
  { icon: "Wrench", title: "Оперативный сервис", desc: "Расходники на складе, замена планки и плёнки за 1 рабочий день" },
  { icon: "Gauge", title: "Мощные насосы", desc: "От 12 до 100 м³/ч — Busch и Becker для тяжёлых нагрузок" },
  { icon: "Minus", title: "Двойной шов", desc: "Две струны 3,5 мм — товарный вид и 100% герметичность" },
  { icon: "Award", title: "Сертификация", desc: "CE, ISO 9001, декларация ТР ТС для работы в РФ и СНГ" },
  { icon: "Clock", title: "Работа 24/7", desc: "Промышленный ресурс для непрерывного производства" },
];

const APPLICATIONS = [
  { icon: "Beef", title: "Идеально для мяса", items: ["Увеличение срока хранения до 3х", "Защита от окисления", "Презентабельный вид", "Сохранение вкуса и структуры"] },
  { icon: "Fish", title: "Идеально для рыбы", items: ["Защита от обветривания", "Герметичная упаковка", "Сохранение свежести", "Удобная презентация"] },
  { icon: "Cake", title: "Идеально для сыра", items: ["Контроль созревания", "Защита от плесени", "Товарный вид", "Длительное хранение"] },
  { icon: "Nut", title: "Идеально для орехов", items: ["Прекращение доступа кислорода", "Защита от влаги", "Защита от пыли и загрязнений", "Предотвращение засыхания ядер"] },
  { icon: "Package", title: "Для непищевых товаров", items: ["Защита от влаги и пыли", "Презентация продукции", "Сохранность при транспортировке", "Универсальность"] },
  { icon: "HeartPulse", title: "Для медицинских товаров", items: ["Стерильность упаковки", "Длительное хранение", "Защита от загрязнений", "Соответствие стандартам"] },
  { icon: "Sparkles", title: "Для косметических товаров", items: ["Сохранение свойств", "Защита от окисления", "Презентабельный вид", "Увеличение срока годности"] },
  { icon: "PawPrint", title: "Для товаров для животных", items: ["Свежесть корма", "Защита от влаги", "Удобная фасовка", "Длительное хранение"] },
];

const OPTIONS = [
  { icon: "Flame", title: "Газонаполнение (MAP)", desc: "Модифицированная атмосфера с инертным газом увеличивает срок годности в 3–5 раз", bullets: ["Снижение окисления на 90%", "Сохранение цвета мяса", "Защита от бактерий"] },
  { icon: "Scissors", title: "Автоматическая запайка/обрезка", desc: "Двойной шов и чистая обрезка края пакета за один цикл", bullets: ["Идеальный товарный вид", "Экономия времени", "100% герметичность"] },
];

const PROCESS = [
  { num: 1, icon: "PackageOpen", title: "Загрузка", desc: "Размещение продукта в камере" },
  { num: 2, icon: "Sliders", title: "Настройка", desc: "Выбор программы на панели" },
  { num: 3, icon: "Wind", title: "Вакуумирование", desc: "Откачка воздуха из пакета" },
  { num: 4, icon: "Flame", title: "Газонаполнение", desc: "MAP - замена воздуха газом (опция)" },
  { num: 5, icon: "Zap", title: "Запайка", desc: "Двойная запайка, широкая запайка, запайка-обрезка" },
  { num: 6, icon: "CheckCircle2", title: "Контроль", desc: "Проверка герметичности шва" },
];

const GUARANTEES = [
  { icon: "ShieldCheck", title: "Гарантия до 3 лет", desc: "На всё оборудование с бесплатной пусконаладкой" },
  { icon: "Award", title: "Сертификация CE, ISO 9001", desc: "Соответствие международным стандартам качества" },
  { icon: "FileCheck", title: "Декларация соответствия", desc: "Документы для работы на территории РФ и СНГ" },
];

const SERVICES = [
  { icon: "MapPin", title: "Наличие на складах", desc: "В Новосибирске и Москве" },
  { icon: "Truck", title: "Доставка РФ и СНГ", desc: "Экспресс-отправка со склада в день оплаты" },
  { icon: "GraduationCap", title: "Обучение персонала", desc: "Инструктаж на объекте клиента включён" },
  { icon: "CreditCard", title: "Лизинг и рассрочка", desc: "Гибкие условия оплаты и финансирования" },
];

const FAQS = [
  { q: "Насколько надёжен двойной шов?", a: "Двойная запайка состоит из двух 3,5 мм выпуклых струн. Это позволяет быть уверенным, что остатки продукта или жидкости будут вытеснены с зоны шва во время запаечного цикла. Обеспечивает максимальную герметичность и исключает развакуум пакета при транспортировке." },
  { q: "Какие пакеты подходят и как выбрать размер?", a: "Используются специальные вакуумные пакеты с рифлением или гладкие плёнки. Размер выбирается исходя из габаритов продукта + 5–7 см запаса на запайку. Наши специалисты помогут подобрать оптимальный тип." },
  { q: "Сроки поставки и условия гарантии?", a: "Оборудование в наличии на складе — отгрузка в день оплаты. Доставка по РФ 2–7 дней. Гарантия до 3 лет на оборудование, консультация по подключению и эксплуатации." },
  { q: "Как организована пусконаладка и обучение?", a: "Инженер проводит установку, настройку оборудования и обучение персонала на объекте клиента в течение 1 дня. Услуга включена в стоимость, за исключением командировочных расходов сервисного инженера." },
  { q: "Как обслуживать насос и планку запайки?", a: "Регламент обслуживания включает: проверку уровня масла в насосе раз в месяц, очистку планки запайки после смены, замену тефлоновой ленты раз в 3–6 месяцев. Обучение включено, сервис по договору." },
  { q: "Какие есть сертификаты?", a: "Все модели имеют сертификаты CE (европейский стандарт безопасности), ISO 9001 (система менеджмента качества), декларацию соответствия ТР ТС для работы в РФ и СНГ." },
  { q: "Есть ли лизинг и рассрочка?", a: "Да, работаем с ведущими лизинговыми компаниями. Возможна рассрочка на индивидуальных условиях. Оформление от 1 дня." },
  { q: "Сколько стоит оборудование?", a: "Стоимость нашего оборудования от 50 тыс. руб. Точная цена зависит от характеристик модели, условий доставки, наличия товара на складе. Оставьте заявку, менеджер свяжется и предоставит детальную информацию." },
  { q: "Какую модель выбрать?", a: "Выбор зависит от ваших задач: объёма упаковки, типа продукции, размеров продукта. Наш менеджер поможет подобрать оптимальное оборудование под ваши потребности." },
];

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "#catalog" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Применение", href: "#applications" },
  { label: "Опции", href: "#options" },
  { label: "Сервис", href: "#service" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#contacts" },
];

const PACK_TYPES = ["Мясо и мясопродукты", "Рыба и морепродукты", "Сыры и молочка", "Колбасные изделия", "Полуфабрикаты", "Медицина и косметика", "Промышленные товары", "Другое"];

export default function Vacuum() {
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
  const [catalogTab, setCatalogTab] = useState<TabKey>("all");
  const [catalogSearch, setCatalogSearch] = useState("");

  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);

  const catalogCounts = (() => {
    const counts: Record<string, number> = { all: catalog.length };
    for (const t of CATALOG_TABS) {
      if (t.categoryId) counts[t.key] = catalog.filter(p => p.categoryId === t.categoryId).length;
    }
    return counts;
  })();

  useEffect(() => { setCatalogShow(9); }, [catalogTab, catalogSearch]);

  useEffect(() => {
    if (detailsProduct || videoModal) document.body.style.overflow = "hidden";
    else if (!fosOpen && !thanksOpen) document.body.style.overflow = "";
  }, [detailsProduct, videoModal, fosOpen, thanksOpen]);

  const filteredCatalog = catalog.filter(p => {
    const q = catalogSearch.trim().toLowerCase();
    if (q) {
      return p.name.toLowerCase().includes(q);
    }
    const tab = CATALOG_TABS.find(t => t.key === catalogTab);
    if (tab?.categoryId && p.categoryId !== tab.categoryId) return false;
    return true;
  });

  const catalogVideos = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; url: string; image: string }[] = [];
    for (const v of EXTRA_VIDEOS) {
      seen.add(v.url);
      out.push({ id: v.id, name: v.name, url: v.url, image: IMG_HERO });
    }
    return out;
  }, [catalog]);
  const [quizOpen, setQuizOpen] = useState(false);

  const submitQuiz = useCallback(async (data: VacuumQuizPayload): Promise<boolean> => {
    return sendLead({
      source: "quiz",
      page: "vacuum",
      name: data.name,
      phone: data.phone,
      email: data.email,
      product: data.product,
      size: data.size,
      volume: data.volume,
      budget: data.budget,
      quizAnswers: {
        product: data.product,
        size: data.size,
        volume: data.volume,
        budget: data.budget,
      },
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("vacuumQuizAutoShown") === "1") return;
    } catch { /* ignore */ }
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem("vacuumQuizAutoShown", "1"); } catch { /* ignore */ }
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

  useEffect(() => {
    if (fosOpen || thanksOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [fosOpen, thanksOpen]);

  const openFos = useCallback((productName?: string) => {
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
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
      page: "vacuum",
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
      page: "vacuum",
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
          <div className="lg:col-span-5 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(28px,4.5vw,52px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              Промышленные<br />
              <span style={{ color: "var(--orange)" }}>вакуумные упаковщики</span><br />
              по доступным ценам
            </h1>

            <p className="text-lg text-[#555] mb-8 max-w-xl leading-relaxed">
              Гарантия до 3 лет. Мощные насосы. Двойной шов. Газонаполнение.
              Настольные и напольные модели. Бесплатное тестирование в демозале.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => openFos()} className="btn-orange text-base px-8 py-3.5">
                Получить КП
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-8 py-3.5">
                Смотреть модели
              </button>
            </div>

            <ul className="space-y-3">
              {[
                "1, 2 камеры — настольные и напольные",
                "Корпус из нержавеющей стали SUS304",
                "Подбор модели за 15 минут",
              ].map(t => (
                <li key={t} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--orange)" }}>
                    <Icon name="Check" size={14} className="text-white" />
                  </div>
                  <span className="text-[17px] text-[#1A1A1A] font-medium leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 relative fade-up-1 flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Промышленный вакуумный упаковщик"
              loading="lazy"
              className="w-full h-auto lg:h-[640px] xl:h-[720px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section id="problems" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">С чем сталкиваются производители</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card-hover rounded-xl border border-gray-100 p-6 bg-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                  <Icon name={p.icon} fallback="AlertCircle" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-base mb-2">{p.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Каталог оборудования</h2>
            <p className="text-[#666] mt-2 max-w-xl mx-auto">Выберите подходящее вакуумно-упаковочное оборудование для вашего производства</p>
          </div>

          <div className="max-w-md mx-auto mb-6 relative">
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

          <div className="bg-white rounded-lg border border-gray-200 p-1 mb-8 flex flex-wrap gap-1 overflow-x-auto">
            {CATALOG_TABS.filter(tab => (catalogCounts[tab.key] ?? 0) > 0).map(tab => {
              const active = catalogTab === tab.key;
              const count = catalogCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setCatalogTab(tab.key)}
                  className={`flex-1 min-w-[140px] px-4 py-3 rounded-md text-[13px] sm:text-[14px] font-semibold transition-all whitespace-nowrap ${
                    active ? "bg-[#F7F7F7] text-[#1A1A1A] shadow-sm" : "text-[#888] hover:text-[#1A1A1A]"
                  }`}
                >
                  {tab.label} <span className={active ? "text-[#1A1A1A]" : "text-[#aaa]"}>({count})</span>
                </button>
              );
            })}
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
                  <p className="text-sm text-[#666] mb-4">Попробуйте изменить запрос или выбрать другую категорию</p>
                  <button onClick={() => { setCatalogSearch(""); setCatalogTab("all"); }} className="btn-outline-orange">
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCatalog.slice(0, catalogShow).map(p => {
                    const keyParams = pickParams(p.params);
                    return (
                      <div key={p.id} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                        <ProductGallery
                          images={p.pictures}
                          alt={p.name}
                          fallback={IMG_HERO}
                          className="aspect-[16/10] bg-white flex items-center justify-center overflow-hidden"
                          imgClassName="w-full h-full object-contain p-4"
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
                            <div className="font-bold text-xl mb-3 text-[#3897FF]">{formatPrice(p.price)}</div>
                            <div className="space-y-2">
                              <button
                                onClick={() => setDetailsProduct(p)}
                                className="w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all bg-[#3897FF] hover:bg-[#2980E0] text-white inline-flex items-center justify-center gap-2"
                              >
                                <Icon name="Eye" size={16} />
                                Узнать подробнее
                              </button>
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
                <div className="mt-10 bg-white rounded-xl border border-gray-100 p-6 text-center">
                  <p className="text-[#555] mb-4">Нужна индивидуальная конфигурация или подбор под задачу?</p>
                  <button onClick={() => openFos()} className="btn-orange">Подобрать под задачу</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* VIDEO */}
      {catalogVideos.length > 0 && (
        <section id="video" className="py-16 bg-[#F7F7F7]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h2 className="section-title">Посмотрите как работает наше оборудование</h2>
              <p className="text-[#888] mt-2">Видео с реальной работой вакуумных упаковщиков</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalogVideos.map(v => {
                const thumb = getVideoThumb(v.url) || v.image;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVideoModal(v.url)}
                    className="group relative bg-[#1A1A1A] rounded-xl overflow-hidden aspect-video shadow-md hover:shadow-xl transition-shadow text-left"
                  >
                    <img src={thumb || v.image} alt={v.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ background: "var(--orange)" }}>
                        <Icon name="Play" size={24} className="text-white ml-0.5" />
                      </div>
                    </div>
                    <p className="absolute bottom-0 left-0 right-0 px-3 py-2.5 text-white text-[13px] font-semibold leading-snug line-clamp-2">{v.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ADVANTAGES */}
      <section id="advantages" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Почему выбирают наше оборудование</h2>
            <p className="text-[#888] mt-2 max-w-2xl mx-auto">12 причин, по которым производители выбирают вакуум-упаковщики ТЕХНОСИБ</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="card-hover rounded-xl border border-gray-100 p-6 bg-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                  <Icon name={a.icon} fallback="CheckCircle" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-base mb-2">{a.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="btn-outline-orange">
              <Icon name="Settings" size={18} className="mr-2" />
              Подобрать модель под вашу задачу
            </button>
          </div>
        </div>
      </section>

      {/* APPLICATIONS */}
      <section id="applications" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Применение</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {APPLICATIONS.map((app, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(56,151,255,0.10)" }}>
                  <Icon name={app.icon} fallback="Package" size={24} className="text-[#3897FF]" />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-3">{app.title}</h3>
                <ul className="space-y-1.5">
                  {app.items.map((it, k) => (
                    <li key={k} className="flex items-start gap-2 text-[13px] text-[#555] leading-snug">
                      <Icon name="Check" size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="btn-outline-orange">
              <Icon name="MessageSquare" size={18} className="mr-2" />
              Получить рекомендации по упаковке вашего продукта
            </button>
          </div>
        </div>
      </section>

      {/* OPTIONS */}
      <section id="options" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Опции и расходные материалы</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {OPTIONS.map((op, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-7 card-hover">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(255,102,0,0.10)" }}>
                  <Icon name={op.icon} fallback="Sparkles" size={28} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-xl mb-2">{op.title}</h3>
                <p className="text-[14px] text-[#666] mb-4 leading-relaxed">{op.desc}</p>
                <ul className="space-y-2">
                  {op.bullets.map((b, k) => (
                    <li key={k} className="flex items-start gap-2 text-[14px] text-[#1A1A1A]">
                      <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button onClick={() => openFos()} className="px-6 py-3 rounded-lg bg-white border border-gray-200 hover:border-orange-300 text-[#1A1A1A] font-semibold text-sm inline-flex items-center gap-2 transition-colors">
              <Icon name="Package" size={18} style={{ color: "var(--orange)" }} />
              Заказать расходники со склада
            </button>
          </div>
        </div>
      </section>

      {/* PROCESS / HOW IT WORKS — DARK BLUE */}
      <section id="process" className="py-20 text-white" style={{ background: "linear-gradient(135deg, #1E5A8A 0%, #2A6FA8 50%, #1E5A8A 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-[clamp(26px,3.8vw,40px)] font-bold mb-3">Как это работает</h2>
            <p className="text-white/80 max-w-2xl mx-auto">Полный цикл вакуумной упаковки с автоматическими программами и контролем качества</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROCESS.map(p => (
              <div key={p.num} className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: "var(--orange)" }}>
                  {p.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name={p.icon} fallback="Circle" size={18} className="text-white/80" />
                    <h3 className="font-bold text-white text-base">{p.title}</h3>
                  </div>
                  <p className="text-sm text-white/75 leading-snug">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button onClick={() => document.getElementById("video")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-3 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors">
              <Icon name="Play" size={16} />
              Посмотреть демонстрацию
            </button>
            <button onClick={() => openFos()} className="px-6 py-3 rounded-lg bg-white hover:bg-gray-100 text-[#1A1A1A] text-sm font-semibold inline-flex items-center gap-2 transition-colors">
              <Icon name="Calendar" size={16} />
              Записаться в демозал
            </button>
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="guarantees" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-[clamp(24px,3.2vw,34px)] font-bold text-[#1A1A1A] mb-6 leading-tight">Гарантии и сертификаты</h2>
            <ul className="space-y-4">
              {GUARANTEES.map((g, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(56,151,255,0.10)" }}>
                    <Icon name={g.icon} fallback="ShieldCheck" size={18} className="text-[#3897FF]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-0.5 leading-tight">{g.title}</h3>
                    <p className="text-[13px] text-[#888] leading-snug">{g.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#F7F7F7] shadow-sm">
            <img
              src={IMG_GUARANTEE}
              alt="Продукты в вакуумной упаковке"
              className="w-full h-full object-cover aspect-[4/3]"
              loading="lazy"
            />
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
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 card-hover">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(56,151,255,0.10)" }}>
                  <Icon name={s.icon} fallback="CheckCircle" size={22} className="text-[#3897FF]" />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-2">{s.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{s.desc}</p>
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
      <section id="contacts" className="py-16 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-[clamp(26px,3.8vw,40px)] font-bold mb-3">Получить коммерческое предложение</h2>
            <p className="text-white/70">Заполните форму — менеджер свяжется в течение 15 минут</p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 text-[#1A1A1A]">
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
                placeholder="Объём, особенности упаковки, требования..."
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
      <footer className="bg-[#1A1A1A] text-white/70 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-9 w-auto mb-4 brightness-0 invert" />
            <p>Промышленное упаковочное оборудование.<br />Поставка, пусконаладка, сервис под ключ.</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Контакты</p>
            <p><a href="tel:88005057831" className="hover:text-orange-500 transition-colors">8 800 505-78-31</a></p>
            <p><a href="mailto:pack@t-sib.ru" className="hover:text-orange-500 transition-colors">pack@t-sib.ru</a></p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Оборудование</p>
            <p><a href="/vegetables" className="hover:text-orange-500 transition-colors">Упаковка овощей и фруктов</a></p>
            <p><a href="/vacuum" className="hover:text-orange-500 transition-colors">Вакуумные упаковщики</a></p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-6 border-t border-white/10 text-xs text-white/50">
          © {new Date().getFullYear()} ТЕХНОСИБ. Все права защищены.
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
                />
                <div>
                  <div className="bg-[#EEF6FF] rounded-xl p-4 mb-4">
                    <p className="text-xs uppercase tracking-wider text-[#666] mb-1">Цена</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#3897FF]">{formatPrice(detailsProduct.price)}</p>
                  </div>
                  {detailsProduct.vendor && (
                    <p className="text-sm text-[#666] mb-2"><span className="text-[#999]">Производитель: </span><span className="text-[#1A1A1A] font-semibold">{detailsProduct.vendor}</span></p>
                  )}
                </div>
              </div>

              {detailsProduct.description && stripHtml(detailsProduct.description) && (
                <div className="mb-6">
                  <h4 className="font-bold text-[#3897FF] text-[13px] uppercase tracking-wider mb-2">Описание</h4>
                  <p className="text-[14px] text-[#444] leading-relaxed whitespace-pre-line">{stripHtml(detailsProduct.description)}</p>
                </div>
              )}

              {visibleParams(detailsProduct.params).length > 0 && (
                <div>
                  <h4 className="font-bold text-[#3897FF] text-[13px] uppercase tracking-wider mb-3">Характеристики</h4>
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
      <VacuumQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} />
    </div>
  );
}