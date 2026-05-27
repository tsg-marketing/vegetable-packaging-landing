import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";

// Страница вакуумного упаковочного оборудования /vacuum

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const CATALOG_ENDPOINT = "https://functions.poehali.dev/981263b7-3a88-449e-abf8-f61fbd2b5289";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/cfe23789-bc80-43d8-9bfa-338b2fa4d337.jpg";

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

function pickParams(params: CatalogParam[]): CatalogParam[] {
  const found: CatalogParam[] = [];
  for (const key of KEY_PARAMS) {
    const p = params.find(x => x.name.toLowerCase() === key.toLowerCase());
    if (p) found.push(p);
    if (found.length >= 3) break;
  }
  if (found.length < 3) {
    for (const p of params) {
      if (found.length >= 3) break;
      if (!found.find(f => f.name === p.name)) found.push(p);
    }
  }
  return found;
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return "По запросу";
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

const PHONE_RE = /^(\+7|7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/;
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
    return j?.ok !== false;
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

const QUIZ_STEPS = [
  { title: "Что будете упаковывать?", options: [
    { icon: "UtensilsCrossed", label: "Продукты питания" },
    { icon: "Package", label: "Непищевая продукция" },
    { icon: "Shirt", label: "Одежда" },
    { icon: "Cpu", label: "Электроника" },
    { icon: "HelpCircle", label: "Другое" },
  ]},
  { title: "Какой объём упаковки в смену?", options: [
    { icon: "Gauge", label: "До 100 пакетов" },
    { icon: "BarChart3", label: "100–500 пакетов" },
    { icon: "TrendingUp", label: "500–2000 пакетов" },
    { icon: "Rocket", label: "Свыше 2000" },
  ]},
  { title: "Размер продукта?", options: [
    { icon: "Minimize2", label: "Маленький (до 20 см)" },
    { icon: "Square", label: "Средний (20–40 см)" },
    { icon: "Maximize2", label: "Большой (от 40 см)" },
    { icon: "Layers", label: "Разный" },
  ]},
  { title: "Тип установки?", options: [
    { icon: "Table", label: "Настольная" },
    { icon: "Building", label: "Напольная" },
    { icon: "HelpCircle", label: "Подскажите" },
  ]},
  { title: "Нужно ли газонаполнение (MAP)?", options: [
    { icon: "Check", label: "Да, обязательно" },
    { icon: "X", label: "Нет" },
    { icon: "HelpCircle", label: "Расскажите подробнее" },
  ]},
  { title: "Когда планируете запуск?", options: [
    { icon: "Zap", label: "Срочно — в этом месяце" },
    { icon: "Calendar", label: "В течение 1–3 месяцев" },
    { icon: "Clock", label: "Изучаю варианты" },
  ]},
  { title: "Куда отправить подбор?", options: [] },
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
  { label: "Преимущества", href: "#advantages" },
  { label: "Каталог", href: "#catalog" },
  { label: "Применение", href: "#applications" },
  { label: "Опции", href: "#options" },
  { label: "Как работает", href: "#process" },
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
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [thanksOpen, setThanksOpen] = useState(false);

  const [videoPlay, setVideoPlay] = useState(false);

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogShow, setCatalogShow] = useState(9);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizContact, setQuizContact] = useState({ name: "", phone: "" });
  const [quizErrors, setQuizErrors] = useState<{ name?: string; phone?: string }>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const selectQuizOption = (label: string) => {
    const next = [...quizAnswers];
    next[quizStep] = label;
    setQuizAnswers(next);
    setTimeout(() => setQuizStep(s => Math.min(s + 1, QUIZ_STEPS.length - 1)), 250);
  };

  const submitQuiz = async () => {
    const errs: { name?: string; phone?: string } = {};
    if (quizContact.name.trim().length < 2) errs.name = "Укажите имя";
    if (!PHONE_RE.test(quizContact.phone.trim())) errs.phone = "Укажите корректный телефон";
    setQuizErrors(errs);
    if (Object.keys(errs).length > 0 || quizSubmitting) return;
    setQuizSubmitting(true);
    await sendLead({
      source: "quiz",
      page: "vacuum",
      name: quizContact.name.trim(),
      phone: quizContact.phone.trim(),
      answers: quizAnswers,
    });
    setQuizSubmitting(false);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizContact({ name: "", phone: "" });
    setThanksOpen(true);
  };

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
    const errs: { name?: string; phone?: string; email?: string } = {};
    if (fosData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!PHONE_RE.test(fosData.phone.trim())) errs.phone = "Укажите корректный телефон";
    if (!EMAIL_RE.test(fosData.email.trim())) errs.email = "Укажите корректный e-mail";
    setFosErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fosData]);

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
    const errs: { name?: string; phone?: string } = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = "Введите имя";
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || !PHONE_RE.test(formData.phone) || phoneDigits.length < 10 || phoneDigits.length > 11) {
      errs.phone = "Неверный телефон";
    }
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
            <div className="relative" onMouseEnter={() => setEquipmentOpen(true)} onMouseLeave={() => setEquipmentOpen(false)}>
              <button className="text-[13px] xl:text-sm font-medium text-[#444] hover:text-orange-600 transition-colors whitespace-nowrap flex items-center gap-1">
                Оборудование
                <Icon name="ChevronDown" size={14} className={`transition-transform ${equipmentOpen ? "rotate-180" : ""}`} />
              </button>
              {equipmentOpen && (
                <div className="absolute left-0 top-full pt-2 z-50">
                  <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 min-w-[260px]">
                    <a href="/vegetables" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Упаковка овощей и фруктов</a>
                    <a href="/vacuum" className="block px-4 py-2 text-sm text-orange-600 font-semibold bg-[#FFF5EE]">Вакуумные упаковщики</a>
                  </div>
                </div>
              )}
            </div>
            {NAV.map(l => (
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
            <div className="border-b border-gray-100 pb-2">
              <p className="text-xs font-semibold text-[#999] uppercase mb-2">Оборудование</p>
              <a href="/vegetables" className="block text-base text-[#444] py-1.5 pl-2">Упаковка овощей и фруктов</a>
              <a href="/vacuum" className="block text-base text-orange-600 font-semibold py-1.5 pl-2">Вакуумные упаковщики</a>
            </div>
            {NAV.map(l => (
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <h2 className="section-title mb-0">Каталог вакуумных упаковщиков</h2>
            <p className="text-sm text-[#888]">{catalog.length > 0 ? `${catalog.length} моделей в наличии и под заказ` : "Загружаем каталог с t-sib.ru..."}</p>
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

          {!catalogLoading && !catalogError && catalog.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {catalog.slice(0, catalogShow).map(p => {
                  const img = p.pictures[0] || IMG_HERO;
                  const keyParams = pickParams(p.params);
                  return (
                    <div key={p.id} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                      <div className="aspect-[16/10] bg-white flex items-center justify-center overflow-hidden">
                        <img src={img} alt={p.name} loading="lazy" className="w-full h-full object-contain p-4" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-1 leading-snug line-clamp-2 min-h-[44px]">{p.name}</h3>
                        {p.vendor && <p className="text-xs text-[#888] mb-3">{p.vendor}</p>}
                        {keyParams.length > 0 && (
                          <ul className="mb-4 space-y-1.5">
                            {keyParams.map((pr, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
                                <Icon name="Check" size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                                <span className="text-[#444]">
                                  <span className="font-semibold text-[#1A1A1A]">{pr.name}: </span>{pr.value}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <div className="font-bold text-xl mb-3" style={{ color: "var(--orange)" }}>{formatPrice(p.price)}</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openFos(p.name)}
                              className="flex-1 text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all"
                              style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                            >
                              Получить КП
                            </button>
                            {p.url && (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors flex-shrink-0"
                                title="Подробнее"
                              >
                                <Icon name="ExternalLink" size={16} className="text-[#666]" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {catalog.length > catalogShow && (
                <div className="mt-8 text-center">
                  <button onClick={() => setCatalogShow(s => s + 9)} className="btn-outline-orange">
                    <Icon name="ChevronDown" size={18} className="mr-2" />
                    Показать ещё ({catalog.length - catalogShow})
                  </button>
                </div>
              )}

              <div className="mt-10 bg-white rounded-xl border border-gray-100 p-6 text-center">
                <p className="text-[#555] mb-4">Нужна индивидуальная конфигурация или подбор под задачу?</p>
                <button onClick={() => openFos()} className="btn-orange">Подобрать под задачу</button>
              </div>
            </>
          )}
        </div>
      </section>

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

      {/* VIDEO */}
      <section id="video" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Посмотрите как работает наше оборудование</h2>
            <p className="text-[#888] mt-2">Видео с реальной работой вакуумных упаковщиков на производстве</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-[#1A1A1A] aspect-video shadow-xl">
            {videoPlay ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="EV-30"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A3540] via-[#1A1A1A] to-[#3A4555] flex items-center">
                  <div className="px-8 md:px-14 text-white">
                    <p className="text-xs md:text-sm tracking-wider opacity-70 mb-2">НАСТОЛЬНЫЙ</p>
                    <p className="text-2xl md:text-4xl font-bold leading-tight mb-1">ВАКУУМНЫЙ<br />УПАКОВЩИК</p>
                    <p className="text-4xl md:text-6xl font-extrabold" style={{ color: "var(--orange)" }}>EV-30</p>
                  </div>
                </div>
                <button
                  onClick={() => setVideoPlay(true)}
                  className="absolute inset-0 m-auto w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: "var(--orange)" }}
                  aria-label="Воспроизвести видео"
                >
                  <Icon name="Play" size={36} className="text-white ml-1" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center py-2 text-sm">
                  Вакуумная упаковочная машина
                </div>
              </>
            )}
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
            <button onClick={() => { document.getElementById("video")?.scrollIntoView({ behavior: "smooth" }); setVideoPlay(true); }} className="px-6 py-3 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors">
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
      <section id="guarantees" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="section-title text-left mb-6">Гарантии и сертификаты</h2>
            <ul className="space-y-5">
              {GUARANTEES.map((g, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(56,151,255,0.10)" }}>
                    <Icon name={g.icon} fallback="ShieldCheck" size={22} className="text-[#3897FF]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-1">{g.title}</h3>
                    <p className="text-sm text-[#666] leading-relaxed">{g.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#F7F7F7]">
            <img
              src="https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/5c177aea-1d9e-4624-8693-04effc5c2806.png"
              alt="Вакуумные пакеты с продуктами"
              className="w-full h-full object-cover"
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

      {/* QUIZ */}
      <section id="quiz" className="py-20" style={{ background: "linear-gradient(180deg, #E8F0F8 0%, #F4F8FB 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Подберём оборудование</h2>
            <p className="text-[#666] mt-2">Ответьте на 6 вопросов, и мы предложим оптимальное решение под ваши задачи</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#666]">Шаг {quizStep + 1} из {QUIZ_STEPS.length}</p>
              {quizStep > 0 && (
                <button onClick={() => setQuizStep(s => Math.max(0, s - 1))} className="text-sm text-[#888] hover:text-orange-600 flex items-center gap-1">
                  <Icon name="ArrowLeft" size={14} />Назад
                </button>
              )}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[#1A1A1A] transition-all" style={{ width: `${((quizStep + 1) / QUIZ_STEPS.length) * 100}%` }} />
            </div>
            <h3 className="font-bold text-[#1A1A1A] text-xl mb-5">{QUIZ_STEPS[quizStep].title}</h3>

            {quizStep < QUIZ_STEPS.length - 1 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {QUIZ_STEPS[quizStep].options.map((opt, i) => {
                  const selected = quizAnswers[quizStep] === opt.label;
                  return (
                    <button
                      key={i}
                      onClick={() => selectQuizOption(opt.label)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                        selected ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <Icon name={opt.icon} fallback="Circle" size={22} className="text-[#3897FF]" />
                      <span className="text-[13px] font-medium text-[#1A1A1A] leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={quizContact.name}
                  onChange={e => setQuizContact({ ...quizContact, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${quizErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {quizErrors.name && <p className="text-xs text-red-500 -mt-1">{quizErrors.name}</p>}
                <input
                  type="tel"
                  placeholder="Телефон"
                  value={quizContact.phone}
                  onChange={e => setQuizContact({ ...quizContact, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${quizErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {quizErrors.phone && <p className="text-xs text-red-500 -mt-1">{quizErrors.phone}</p>}
                <button onClick={submitQuiz} disabled={quizSubmitting} className="btn-orange w-full text-base py-3.5 disabled:opacity-60">
                  {quizSubmitting ? "Отправляем..." : "Получить подбор оборудования"}
                </button>
                <p className="text-xs text-[#888] text-center">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных</p>
              </div>
            )}
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
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
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

            <button onClick={submitMainForm} disabled={formSubmitting} className="btn-orange w-full text-base py-4 disabled:opacity-60">
              {formSubmitting ? "Отправляем..." : "Отправить заявку"}
            </button>
            <p className="text-xs text-[#888] mt-3 text-center">Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных</p>
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

      {/* FOS MODAL */}
      {fosOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setFosOpen(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFosOpen(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <Icon name="X" size={20} className="text-[#666]" />
            </button>
            <h3 className="text-2xl font-bold mb-2">Оставить заявку</h3>
            {fosOpen.productName && <p className="text-sm text-[#666] mb-4">По модели: <span className="font-semibold">{fosOpen.productName}</span></p>}
            <p className="text-sm text-[#666] mb-5">Менеджер свяжется в течение 15 минут</p>

            <div className="space-y-3">
              <div>
                <input type="text" placeholder="Имя"
                  value={fosData.name}
                  onChange={e => setFosData({ ...fosData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${fosErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {fosErrors.name && <p className="text-xs text-red-500 mt-1">{fosErrors.name}</p>}
              </div>
              <div>
                <input type="tel" placeholder="Телефон"
                  value={fosData.phone}
                  onChange={e => setFosData({ ...fosData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${fosErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {fosErrors.phone && <p className="text-xs text-red-500 mt-1">{fosErrors.phone}</p>}
              </div>
              <div>
                <input type="email" placeholder="E-mail"
                  value={fosData.email}
                  onChange={e => setFosData({ ...fosData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${fosErrors.email ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {fosErrors.email && <p className="text-xs text-red-500 mt-1">{fosErrors.email}</p>}
              </div>
              <button onClick={submitFos} disabled={fosSubmitting} className="btn-orange w-full text-base py-3.5 disabled:opacity-60">
                {fosSubmitting ? "Отправляем..." : "Отправить"}
              </button>
              <p className="text-xs text-[#888] text-center">Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных</p>
            </div>
          </div>
        </div>
      )}

      {/* THANKS MODAL */}
      {thanksOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setThanksOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Заявка отправлена!</h3>
            <p className="text-[#666] mb-6">Менеджер свяжется с вами в течение 15 минут.</p>
            <button onClick={() => setThanksOpen(false)} className="btn-orange w-full">Хорошо</button>
          </div>
        </div>
      )}
    </div>
  );
}