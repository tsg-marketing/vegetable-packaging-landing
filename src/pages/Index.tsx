import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/98dadd67-336a-47a5-9480-dcbd6c9cfde2.png";
const IMG_TEAM = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/19912d2e-496e-41a2-9268-f7e32bc30cda.jpg";

const CATALOG_API = "https://functions.poehali.dev/57e27975-0947-45d9-bfbb-8fff401b7c60";

// Validation
const PHONE_RE = /^(\+7|7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Sort params: Производительность first, then GUID-out (already filtered on BE)
function sortParams(params: Param[]): Param[] {
  const isPerf = (p: Param) => /производитель/i.test(p.name);
  const perf = params.filter(isPerf);
  const rest = params.filter(p => !isPerf(p));
  return [...perf, ...rest];
}

type Param = { name: string; value: string };
type Product = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  priceText: string;
  currency: string;
  url: string;
  description: string;
  pictures: string[];
  params: Param[];
};

function formatPrice(p: Product): string {
  if (!p.price || p.price <= 0) return "Запросить цену";
  return `${Math.round(p.price).toLocaleString("ru-RU")} ₽`;
}

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

const PROBLEMS = [
  { icon: "Timer", title: "Ручная фасовка не справляется", desc: "Срывы сроков, потери клиентов, переработки персонала" },
  { icon: "ClipboardX", title: "Упаковка не проходит аудит сетей", desc: "Отказы от листинга в федеральных ритейлерах" },
  { icon: "TrendingDown", title: "Высокий расход материалов", desc: "Перерасход сетки и клипс на 20–35% от нормы" },
  { icon: "AlertTriangle", title: "Оборудование простаивает", desc: "Потери 30% рабочего времени из-за поломок и переналадок" },
];

const UTP_EQUIP = [
  { icon: "Layers", text: "Двойная подача сетки — 0 остановок на перезарядку" },
  { icon: "Wind", text: "Работа без компрессора — экономия 80–150 тыс. руб./год" },
  { icon: "Tag", text: "Встроенная маркировка — этикетка прямо при упаковке" },
  { icon: "Heart", text: "Бережная упаковка — бой черри снижается с 8% до 1,5%" },
  { icon: "Zap", text: "Быстрая переналадка — смена формата за 15 минут" },
  { icon: "ShoppingBag", text: "Этикетка wine-glass — соответствие требованиям сетей" },
];

const UTP_COMPANY = [
  "20 лет на рынке упаковочного оборудования",
  "Склад запчастей в РФ — поставка 1–3 рабочих дня",
  "Пусконаладка и обучение персонала в комплекте",
  "Расходники у одного поставщика — без поиска",
  "Линии «под ключ» — от проекта до запуска",
  "Сервисные инженеры по всей РФ, выезд 24–48 ч",
];

const CASES = [
  {
    product: "Картофель 5 кг",
    was: "Ручная фасовка: 2 бригады по 6 человек, 800 уп/смену",
    became: "Автомат КС-800П: 1 оператор, 2 400 уп/смену",
    result: "Выработка ×3, ФОТ −75%, окупаемость 5 мес.",
    icon: "🥔",
  },
  {
    product: "Лук репчатый 1 кг",
    was: "Фасовка в мешки, отказ 3 сетей из-за маркировки",
    became: "Сеточный упаковщик с wine-glass этикеткой",
    result: "Листинг в Магните, Пятёрочке, Ленте за 2 месяца",
    icon: "🧅",
  },
  {
    product: "Черри-томаты 250 г",
    was: "Бой 8%, ручная укладка в лотки, 200 лотков/час",
    became: "Лотковый упаковщик ЛУ-800, бережная подача",
    result: "Бой 1,5%, производительность ×5, экспорт в ОАЭ",
    icon: "🍅",
  },
];

const SUPPLIES = [
  { name: "Сетка-рукав", desc: "Полипропиленовая, Ø60–240 мм, все цвета", icon: "🕸️" },
  { name: "Клипсы", desc: "Алюминиевые, пластиковые, под любой клипсатор", icon: "📎" },
  { name: "Этикетки wine-glass", desc: "Сертифицированы для федеральных сетей", icon: "🏷️" },
  { name: "Плёнка ПВХ/ПОФ", desc: "Термоусадочная, ширина 200–600 мм", icon: "📦" },
  { name: "Лотки", desc: "Вспенённый ПС, БОПП, картон — любые размеры", icon: "🍱" },
];

const STEPS = [
  { num: "01", title: "Заявка", desc: "Оставляете запрос онлайн или звоните" },
  { num: "02", title: "Подбор", desc: "Менеджер подбирает модель за 15 минут" },
  { num: "03", title: "Договор", desc: "Согласуем условия, подписываем договор" },
  { num: "04", title: "Доставка", desc: "Отгрузка со склада, доставка по РФ" },
  { num: "05", title: "Запуск", desc: "Пусконаладка и обучение в вашем цехе" },
];

const FAQS = [
  { q: "Нужен ли компрессор?", a: "Нет. Все наши клипсаторы серии КС работают без компрессора — на электроприводе. Это экономит 80–150 тыс. руб./год на обслуживании." },
  { q: "Встроена ли маркировка?", a: "Да. Начиная с модели КС-500А маркировочный модуль встроен в линию. Этикетка наносится в момент упаковки без остановок." },
  { q: "Подходит для федеральных сетей?", a: "Да. Наше оборудование формирует упаковку с этикеткой wine-glass, которая соответствует требованиям Магнита, Пятёрочки, Ленты и X5." },
  { q: "За какой срок окупится оборудование?", a: "Средний срок окупаемости — 4–8 месяцев. Рассчитаем индивидуально с учётом вашего объёма и текущих затрат на ФОТ и материалы." },
  { q: "Есть ли гарантия и сервис?", a: "Гарантия 12 месяцев на всё оборудование. Сервисные инженеры — во всех федеральных округах. Выезд в течение 24–48 часов." },
  { q: "Можно посмотреть машину в работе?", a: "Да. Проводим видеодемонстрацию онлайн и очные показы на производстве. Запишитесь через форму — согласуем удобное время." },
];

const NAV = [
  { label: "Оборудование", href: "#catalog" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Как работаем", href: "#steps" },
  { label: "Контакты", href: "#contacts" },
];

const PACK_TYPES = ["Картофель", "Морковь", "Лук", "Свёкла", "Черри-томаты", "Огурцы", "Зелень", "Другое"];

export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", pack: "", comment: "" });

  // Catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Card picture slider state — index per product
  const [cardSlideIdx, setCardSlideIdx] = useState<Record<string, number>>({});

  // Product modal
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [modalSlideIdx, setModalSlideIdx] = useState(0);

  // Fullscreen lightbox
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);

  // Quick contact form (ФОС) — opened per product or generic
  const [fosOpen, setFosOpen] = useState<{ productName?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [fosSent, setFosSent] = useState(false);

  const openFos = (productName?: string) => {
    setFosOpen({ productName });
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosSent(false);
  };

  const validateFos = () => {
    const errs: { name?: string; phone?: string; email?: string } = {};
    if (!fosData.name.trim()) errs.name = "Введите имя";
    else if (fosData.name.trim().length < 2) errs.name = "Слишком короткое имя";

    const phoneDigits = fosData.phone.replace(/\D/g, "");
    if (!fosData.phone.trim()) errs.phone = "Введите телефон";
    else if (!PHONE_RE.test(fosData.phone) || phoneDigits.length < 10 || phoneDigits.length > 11) {
      errs.phone = "Неверный формат телефона";
    }

    if (!fosData.email.trim()) errs.email = "Введите e-mail";
    else if (!EMAIL_RE.test(fosData.email.trim())) errs.email = "Неверный формат e-mail";

    setFosErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitFos = () => {
    if (!validateFos()) return;
    // TODO: реальная отправка
    setFosSent(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch(CATALOG_API)
      .then(r => r.json())
      .then(d => {
        if (d.products) {
          // Sort by price ascending. Products without price go last.
          const sorted = [...d.products].sort((a: Product, b: Product) => {
            const pa = a.price || Infinity;
            const pb = b.price || Infinity;
            return pa - pb;
          });
          setProducts(sorted);
        }
        else setLoadError(d.error || "Не удалось загрузить каталог");
      })
      .catch(e => setLoadError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox(prev => prev ? { ...prev, idx: (prev.idx + 1) % prev.pictures.length } : prev);
      if (e.key === "ArrowLeft") setLightbox(prev => prev ? { ...prev, idx: (prev.idx - 1 + prev.pictures.length) % prev.pictures.length } : prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (openProduct || lightbox || fosOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openProduct, lightbox, fosOpen]);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const slideCard = useCallback((id: string, total: number, dir: 1 | -1) => {
    setCardSlideIdx(prev => {
      const cur = prev[id] ?? 0;
      const next = (cur + dir + total) % total;
      return { ...prev, [id]: next };
    });
  }, []);

  const openProductCard = (p: Product) => {
    setOpenProduct(p);
    setModalSlideIdx(cardSlideIdx[p.id] ?? 0);
  };

  const modalSlide = (dir: 1 | -1) => {
    if (!openProduct || openProduct.pictures.length === 0) return;
    setModalSlideIdx(i => (i + dir + openProduct.pictures.length) % openProduct.pictures.length);
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.1)]" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 flex-shrink-0 mr-auto">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "var(--orange)" }}>
              <Icon name="Package" size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg leading-tight text-[#1A1A1A]">
              Техно<span style={{ color: "var(--orange)" }}>-Сиб</span>
            </span>
          </a>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-sm font-medium text-[#444] hover:text-orange-600 transition-colors">
                {l.label}
              </button>
            ))}
          </nav>

          {/* Phone + CTA */}
          <div className="hidden md:flex items-center gap-4 ml-4">
            <a href="tel:88005004054" className="text-sm font-semibold text-[#1A1A1A] hover:text-orange-600 transition-colors">
              8-800-500-40-54
            </a>
            <button onClick={() => scrollTo("#contacts")} className="btn-orange text-sm py-2 px-5">
              Оставить заявку
            </button>
          </div>

          {/* Burger */}
          <button className="md:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
            <Icon name={mobileOpen ? "X" : "Menu"} size={24} className="text-[#1A1A1A]" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
            {NAV.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <a href="tel:88005004054" className="text-base font-bold text-[#1A1A1A] py-2">8-800-500-40-54</a>
            <button onClick={() => scrollTo("#contacts")} className="btn-orange w-full mt-1">Оставить заявку</button>
          </div>
        )}
      </header>

      {/* ── БЛОК 1: БАННЕР ── */}
      <section id="hero" className="pt-16 min-h-[88vh] flex items-center bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-0 items-center py-12 lg:py-0">

          {/* Text 60% */}
          <div className="lg:col-span-3 pr-0 lg:pr-12 fade-up">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,102,0,0.08)", color: "var(--orange)" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--orange)" }} />
              Официальный дилер • 20 лет на рынке
            </div>

            <h1 className="text-[clamp(28px,4.5vw,52px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              Оборудование для<br />
              <span style={{ color: "var(--orange)" }}>упаковки овощей</span><br />
              и фруктов
            </h1>

            <p className="text-lg text-[#555] mb-8 max-w-xl leading-relaxed">
              Клипсаторы, упаковщики в сетку, плёнку и лотки — от полуавтоматов до линий.
              Подберём решение за 1 день.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => scrollTo("#contacts")} className="btn-orange text-base px-8 py-3.5">
                Получить КП
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-8 py-3.5">
                Смотреть каталог
              </button>
            </div>

            <ul className="space-y-3">
              {[
                "Производительность до 1 200 упаковок в час",
                "Штучная и крупная фасовка",
                "Подбор оборудования под потребности клиента",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--orange)" }}>
                    <Icon name="Check" size={14} className="text-white" />
                  </div>
                  <span className="text-[17px] text-[#1A1A1A] font-medium leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image 40% — no white frame, larger */}
          <div className="lg:col-span-2 relative fade-up-1 flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Клипсатор для упаковки овощей"
              loading="lazy"
              className="w-full max-w-[640px] lg:max-w-none lg:h-[620px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── БЛОК 2: ПРОБЛЕМЫ ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Знакомые проблемы?</p>
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

      {/* ── БЛОК 3: КАТАЛОГ ── */}
      <section id="catalog" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--orange)" }}>Каталог</p>
              <h2 className="section-title mb-0">Оборудование для упаковки овощей</h2>
            </div>
            <p className="text-sm text-[#888]">
              {loading ? "Загружаем актуальные данные…" : `${products.length} позиций из каталога t-sib.ru`}
            </p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="aspect-[16/10] bg-gray-200 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
                    <div className="h-3 w-full bg-gray-100 animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadError && !loading && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-[#555] mb-2">Не удалось загрузить каталог</p>
              <p className="text-xs text-[#999]">{loadError}</p>
            </div>
          )}

          {!loading && !loadError && products.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-[#555]">В категории пока нет товаров</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(prod => {
                const pics = prod.pictures.length > 0 ? prod.pictures : [IMG_HERO];
                const idx = cardSlideIdx[prod.id] ?? 0;
                const safeIdx = Math.min(idx, pics.length - 1);
                return (
                  <div key={prod.id} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                    {/* Slider */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 group">
                      <img
                        src={pics[safeIdx]}
                        alt={prod.name}
                        loading="lazy"
                        onClick={() => setLightbox({ pictures: pics, idx: safeIdx })}
                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 hover:scale-105"
                      />

                      {pics.length > 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); slideCard(prod.id, pics.length, -1); }}
                            className="absolute top-1/2 left-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Предыдущее фото"
                          >
                            <Icon name="ChevronLeft" size={18} className="text-[#1A1A1A]" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); slideCard(prod.id, pics.length, 1); }}
                            className="absolute top-1/2 right-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Следующее фото"
                          >
                            <Icon name="ChevronRight" size={18} className="text-[#1A1A1A]" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {pics.map((_, i) => (
                              <span key={i}
                                className="w-1.5 h-1.5 rounded-full transition-all"
                                style={{ background: i === safeIdx ? "var(--orange)" : "rgba(255,255,255,0.7)" }} />
                            ))}
                          </div>
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-md">
                            {safeIdx + 1} / {pics.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-3 line-clamp-2 min-h-[3em] leading-snug">
                        {prod.name}
                      </h3>

                      {/* All params, performance first — compact list with check icons */}
                      {prod.params.length > 0 && (
                        <ul className="mb-4 space-y-2">
                          {sortParams(prod.params).map((pr, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] leading-snug">
                              <Icon name="Check" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--orange)" }} />
                              <span className="text-[#444]">
                                <span className="text-[#888]">{pr.name}: </span>
                                <span className="font-semibold text-[#1A1A1A]">{pr.value}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="font-bold text-xl mb-3" style={{ color: "var(--orange)" }}>
                          {formatPrice(prod)}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => openProductCard(prod)}
                            className="text-[15px] font-semibold px-4 py-2.5 rounded-lg transition-all flex-1"
                            style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.2)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
                          >
                            Подробнее
                          </button>
                          <button
                            onClick={() => openFos(prod.name)}
                            className="text-[15px] font-semibold px-4 py-2.5 rounded-lg transition-all flex-1 text-white"
                            style={{ background: "var(--orange)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--orange-light)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--orange)"; }}
                          >
                            Заявка
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── БЛОК 4: УТП ОБОРУДОВАНИЯ ── */}
      <section id="advantages" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Технологии</p>
            <h2 className="section-title">Почему наше оборудование лучше</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {UTP_EQUIP.map((u, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 bg-[#F7F7F7] card-hover">
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "var(--orange)" }}>
                  <Icon name={u.icon} fallback="Check" size={20} className="text-white" />
                </div>
                <p className="text-base text-[#333] font-medium leading-relaxed">{u.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК 5: УТП КОМПАНИИ ── */}
      <section className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Photo */}
            <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              <img src={IMG_TEAM} alt="Команда Техно-Сиб" loading="lazy" className="w-full h-full object-cover" />
            </div>
            {/* List */}
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Компания</p>
              <h2 className="section-title mb-6">Почему выбирают Техно-Сиб</h2>
              <ul className="space-y-4">
                {UTP_COMPANY.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "var(--orange)" }}>
                      <Icon name="Check" size={13} className="text-white" />
                    </div>
                    <span className="text-base text-[#333]">{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => scrollTo("#contacts")} className="btn-orange mt-8">
                Получить консультацию
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── БЛОК 6: CTA-РАЗДЕЛИТЕЛЬ ── */}
      <section className="py-16" style={{ background: "var(--orange)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[clamp(22px,3.5vw,34px)] font-bold text-white mb-4">
            Не знаете, какая машина нужна?
          </h2>
          <p className="text-lg text-white/85 mb-8">
            Расскажите, что упаковываете — подберём решение за 15 минут.
          </p>
          <button onClick={() => scrollTo("#contacts")} className="btn-white text-base px-10 py-3.5">
            Помогите подобрать
          </button>
        </div>
      </section>

      {/* ── БЛОК 7: КЕЙСЫ ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Результаты клиентов</p>
            <h2 className="section-title">Кейсы было → стало</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CASES.map((c, i) => (
              <div key={i} className="card-hover rounded-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 flex items-center gap-3" style={{ background: "var(--orange)" }}>
                  <span className="text-3xl">{c.icon}</span>
                  <h3 className="font-bold text-white text-lg">{c.product}</h3>
                </div>
                <div className="p-6 bg-white space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#999] mb-1">Было</p>
                    <p className="text-sm text-[#555] leading-relaxed">{c.was}</p>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div>
                    <p className="text-xs font-bold uppercase text-[#999] mb-1">Стало</p>
                    <p className="text-sm text-[#555] leading-relaxed">{c.became}</p>
                  </div>
                  <div className="rounded-lg px-4 py-3" style={{ background: "rgba(255,102,0,0.07)" }}>
                    <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--orange)" }}>Результат</p>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{c.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК 8: РАСХОДНИКИ ── */}
      <section className="py-14 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Расходные материалы</p>
            <h2 className="section-title">Расходники у одного поставщика</h2>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {SUPPLIES.map((s, i) => (
              <div key={i} className="card-hover bg-white rounded-xl border border-gray-100 px-6 py-5 flex items-center gap-4 min-w-[200px]">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="font-bold text-[#1A1A1A] text-base">{s.name}</p>
                  <p className="text-xs text-[#888] mt-0.5 max-w-[160px] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК 9: ЭТАПЫ ── */}
      <section id="steps" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Процесс</p>
            <h2 className="section-title">Как мы работаем</h2>
            <p className="text-[#888] mt-2">От заявки до запуска — от 5 рабочих дней</p>
          </div>

          {/* Desktop horizontal */}
          <div className="hidden md:grid grid-cols-5 gap-4">
            {STEPS.map((step, i) => (
              <div key={i} className="relative text-center">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-6 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-0.5" style={{ background: "linear-gradient(90deg, var(--orange), #ffcc99)" }} />
                )}
                {/* Circle */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 font-bold text-white text-sm" style={{ background: "var(--orange)" }}>
                  {step.num}
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-1">{step.title}</h3>
                <p className="text-xs text-[#888] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile vertical */}
          <div className="md:hidden space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm" style={{ background: "var(--orange)" }}>
                  {step.num}
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-[#1A1A1A] mb-0.5">{step.title}</h3>
                  <p className="text-sm text-[#888]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК 10: FAQ ── */}
      <section className="py-16 bg-[#F7F7F7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Вопросы и ответы</p>
            <h2 className="section-title">FAQ</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#1A1A1A] text-base">{faq.q}</span>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200"
                    style={{
                      background: openFaq === i ? "var(--orange)" : "#F0F0F0",
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                    }}>
                    <Icon name="Plus" size={14} style={{ color: openFaq === i ? "#fff" : "#999" }} />
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-[#555] leading-relaxed text-base">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК 11: ФОРМА ── */}
      <section id="contacts" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left text */}
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--orange)" }}>Бесплатно</p>
              <h2 className="section-title mb-4">Получите подбор и расчёт окупаемости</h2>
              <p className="text-lg text-[#555] mb-8 leading-relaxed">
                Опишите, что и в каком объёме упаковываете. Менеджер подберёт оборудование
                и рассчитает окупаемость — в течение 15 минут.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "Phone", label: "8-800-500-40-54", sub: "Бесплатно по РФ" },
                  { icon: "Mail", label: "info@t-sib.ru", sub: "Ответ в течение часа" },
                  { icon: "MapPin", label: "Москва, ш. Энтузиастов, д. 56, стр. 32, офис 115", sub: "Офис в Москве" },
                  { icon: "MapPin", label: "Новосибирск, ул. Электрозаводская, 2 к1, офис 304, 314", sub: "Офис в Новосибирске" },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(255,102,0,0.08)" }}>
                      <Icon name={c.icon} fallback="Circle" size={18} style={{ color: "var(--orange)" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A] text-[16px]">{c.label}</p>
                      <p className="text-[13px] text-[#888]">{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="bg-[#F7F7F7] rounded-2xl p-7 border border-gray-100">
              <h3 className="font-bold text-xl text-[#1A1A1A] mb-6">Отправить заявку</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Ваше имя</label>
                  <input type="text" placeholder="Иван Петров"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] text-base outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Телефон</label>
                  <input type="tel" placeholder="+7 (___) ___-__-__"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] text-base outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Что упаковываете?</label>
                  <select
                    value={formData.pack}
                    onChange={e => setFormData({ ...formData, pack: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-base outline-none focus:border-orange-400 transition-colors"
                    style={{ color: formData.pack ? "#1A1A1A" : "#9CA3AF" }}
                  >
                    <option value="" disabled>Выберите продукт</option>
                    {PACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Комментарий</label>
                  <textarea rows={3} placeholder="Объём, формат упаковки, особые требования..."
                    value={formData.comment}
                    onChange={e => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] text-base outline-none focus:border-orange-400 transition-colors resize-none"
                  />
                </div>
                <button className="btn-orange w-full py-3.5 text-base font-bold">
                  Отправить заявку
                </button>
                <p className="text-center text-xs text-[#AAA]">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ФУТЕР ── */}
      <footer className="py-10 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Col 1: Logo + desc */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--orange)" }}>
                  <Icon name="Package" size={15} className="text-white" />
                </div>
                <span className="font-bold text-lg">Техно<span style={{ color: "var(--orange)" }}>-Сиб</span></span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed max-w-xs">
                Поставка и сервис оборудования для упаковки овощей и фруктов. 20 лет на рынке.
              </p>
            </div>

            {/* Col 2: Nav */}
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

            {/* Col 3: Contacts */}
            <div>
              <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Контакты</p>
              <ul className="space-y-3">
                <li>
                  <a href="tel:88005004054" className="text-sm text-white/65 hover:text-white transition-colors flex items-center gap-2">
                    <Icon name="Phone" size={14} className="text-orange-500" />
                    8-800-500-40-54
                  </a>
                </li>
                <li>
                  <a href="mailto:info@t-sib.ru" className="text-[15px] text-white/65 hover:text-white transition-colors flex items-center gap-2">
                    <Icon name="Mail" size={14} className="text-orange-500" />
                    info@t-sib.ru
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
              <div className="flex gap-3 mt-4">
                {[
                  { icon: "MessageCircle", label: "Telegram" },
                  { icon: "Send", label: "WhatsApp" },
                ].map(s => (
                  <button key={s.label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--orange)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                  >
                    <Icon name={s.icon} size={16} className="text-white" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/35">© 2024 Техно-Сиб. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* ── PRODUCT MODAL ── */}
      {openProduct && (() => {
        const pics = openProduct.pictures.length > 0 ? openProduct.pictures : [IMG_HERO];
        const safeIdx = Math.min(modalSlideIdx, pics.length - 1);
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={() => setOpenProduct(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto relative my-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setOpenProduct(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Закрыть"
              >
                <Icon name="X" size={20} className="text-[#1A1A1A]" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Slider */}
                <div className="bg-[#F7F7F7] relative">
                  <div className="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[460px] relative overflow-hidden">
                    <img
                      src={pics[safeIdx]}
                      alt={openProduct.name}
                      onClick={() => setLightbox({ pictures: pics, idx: safeIdx })}
                      className="w-full h-full object-contain cursor-zoom-in p-4"
                    />

                    {pics.length > 1 && (
                      <>
                        <button
                          onClick={() => modalSlide(-1)}
                          className="absolute top-1/2 left-3 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center"
                          aria-label="Предыдущее фото"
                        >
                          <Icon name="ChevronLeft" size={22} className="text-[#1A1A1A]" />
                        </button>
                        <button
                          onClick={() => modalSlide(1)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center"
                          aria-label="Следующее фото"
                        >
                          <Icon name="ChevronRight" size={22} className="text-[#1A1A1A]" />
                        </button>
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md">
                          {safeIdx + 1} / {pics.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {pics.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-100 bg-white">
                      {pics.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setModalSlideIdx(i)}
                          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                          style={{ borderColor: i === safeIdx ? "var(--orange)" : "transparent" }}
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 md:p-8 flex flex-col">
                  <h3 className="font-bold text-xl md:text-2xl text-[#1A1A1A] mb-3 leading-tight">{openProduct.name}</h3>

                  <div className="mb-5">
                    <div className="font-bold text-2xl md:text-3xl" style={{ color: "var(--orange)" }}>
                      {formatPrice(openProduct)}
                    </div>
                    {openProduct.vendor && (
                      <p className="text-xs text-[#888] mt-1">Производитель: {openProduct.vendor}</p>
                    )}
                  </div>

                  {/* Description */}
                  {openProduct.description && (
                    <div className="mb-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-2">Описание</h4>
                      <p className="text-sm text-[#444] leading-relaxed line-clamp-6">
                        {stripHtml(openProduct.description)}
                      </p>
                    </div>
                  )}

                  {/* Params */}
                  {openProduct.params.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#999] mb-3">Характеристики</h4>
                      <div className="rounded-lg border border-gray-100 divide-y divide-gray-100">
                        {sortParams(openProduct.params).map((pr, i) => (
                          <div key={i} className="flex gap-3 px-4 py-2.5 text-[15px]">
                            <span className="text-[#666] flex-1">{pr.name}</span>
                            <span className="font-semibold text-[#1A1A1A] flex-1 text-right">{pr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => { const name = openProduct.name; setOpenProduct(null); setTimeout(() => openFos(name), 150); }}
                      className="btn-orange flex-1 py-3"
                    >
                      Оставить заявку
                    </button>
                    <a href="tel:88005004054" className="btn-outline-orange flex-1 py-3 text-center">
                      Позвонить
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center"
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

      {/* ── FOS MODAL ── */}
      {fosOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setFosOpen(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 relative my-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFosOpen(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Закрыть"
            >
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>

            {!fosSent ? (
              <>
                <h3 className="font-bold text-2xl text-[#1A1A1A] mb-2 pr-8">Оставить заявку</h3>
                <p className="text-[15px] text-[#666] mb-5 leading-relaxed">
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
                      onChange={e => { setFosData({ ...fosData, phone: e.target.value }); if (fosErrors.phone) setFosErrors({ ...fosErrors, phone: undefined }); }}
                      className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                      style={{ borderColor: fosErrors.phone ? "#E53935" : "#E0E0E0" }}
                    />
                    {fosErrors.phone && <p className="text-[13px] text-red-500 mt-1">{fosErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                      E-mail <span style={{ color: "var(--orange)" }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="ivan@company.ru"
                      value={fosData.email}
                      onChange={e => { setFosData({ ...fosData, email: e.target.value }); if (fosErrors.email) setFosErrors({ ...fosErrors, email: undefined }); }}
                      className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                      style={{ borderColor: fosErrors.email ? "#E53935" : "#E0E0E0" }}
                    />
                    {fosErrors.email && <p className="text-[13px] text-red-500 mt-1">{fosErrors.email}</p>}
                  </div>

                  <button onClick={submitFos} className="btn-orange w-full py-3.5 text-base">
                    Отправить
                  </button>
                  <p className="text-center text-[12px] text-[#AAA]">
                    Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-2xl text-[#1A1A1A] mb-2">Заявка отправлена!</h3>
                <p className="text-[#666] mb-6">Менеджер свяжется с вами в течение 15 минут.</p>
                <button onClick={() => setFosOpen(null)} className="btn-orange px-8">Готово</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}