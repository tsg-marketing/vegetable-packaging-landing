import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";
import ProductGallery from "@/components/ProductGallery";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";

// Страница картонажного упаковочного оборудования /kartonajnoe

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const CATALOG_ENDPOINT = "https://functions.poehali.dev/714167da-e3c6-45bc-9647-de3991debd61";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/3f451a5d-76ce-413b-badc-9014c7813c45.jpg";
const IMG_ECONOMY = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/16cb5e57-202a-4804-ab44-fee5b37c87ff.jpg";
const IMG_ECONOMY2 = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/d0ed6706-0fde-4593-b025-0e2a76f55e33.jpg";

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
  { label: "Контакты", href: "#contacts" },
];

const HERO_BULLETS = [
  { icon: "Zap", text: "Производительность до 50 коробов/мин — под любой объём упаковки" },
  { icon: "Package", text: "Короба от 130×80 мм до 850×600 мм — мелкие посылки и крупная тара" },
  { icon: "Wrench", text: "Быстрая переналадка под новый типоразмер без остановки линии" },
  { icon: "ShieldCheck", text: "Официальная гарантия 12 месяцев + сервис и пусконаладка" },
];

const ADVANTAGES = [
  { icon: "Users", title: "Меньше ручного труда", desc: "Один аппарат заменяет несколько упаковщиков — высвобождаете персонал в пиковые сезоны." },
  { icon: "CheckCircle2", title: "Стабильное качество шва", desc: "Лента ложится ровно, без пузырей и перекосов — упаковка выглядит аккуратно при отгрузке." },
  { icon: "Scissors", title: "Экономный расход скотча", desc: "Автоматическая обрезка ленты и экономный расход скотча — снижение операционных затрат." },
  { icon: "Layers", title: "Работа с любой лентой", desc: "БОПП, ПВХ, крафт, водоактивируемая, брендированный скотч с логотипом." },
  { icon: "Cog", title: "Надёжные комплектующие", desc: "Ресурс выключателей до 100 000 циклов." },
  { icon: "Workflow", title: "Автономно или в линии", desc: "Каждая машина работает отдельно или встраивается в упаковочный конвейер." },
  { icon: "BellRing", title: "Сигнализация расходников", desc: "Оповещение об окончании ленты или заготовок — меньше простоев." },
  { icon: "Move", title: "Мобильность", desc: "Конструкция на колёсах с фиксаторами — легко перемещать по цеху." },
];

export default function Kartonajnoe() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

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

  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);

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

            <p className="text-[18px] sm:text-[20px] font-medium text-[#333] mb-8 max-w-xl leading-snug">
              Оборудование для формирования и заклейки коробов — от <span className="font-bold" style={{ color: "var(--orange)" }}>8 до 50 коробов</span> в минуту. Поставка и сервис по всей России.
            </p>

            <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mb-8 max-w-2xl">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[16px] font-medium text-[#1A1A1A] leading-snug">
                  <Icon name={b.icon} fallback="CheckCircle2" size={24} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => openFos()} className="btn-orange text-base px-8 py-3.5">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
            <div className="rounded-2xl overflow-hidden h-64 sm:h-80">
              <img src={IMG_ECONOMY} alt="Автоматическая упаковка коробов" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden h-64 sm:h-80">
              <img src={IMG_ECONOMY2} alt="Качественный шов заклейки короба" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="card-hover rounded-2xl p-6 bg-white border border-gray-100 shadow-sm flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={a.icon} fallback="CheckCircle2" size={26} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-2 leading-snug">{a.title}</h3>
                <p className="text-[14px] text-[#555] leading-relaxed">{a.desc}</p>
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
                              {keyParams.slice(0, 4).map((pr, i) => (
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

      {/* CONTACTS / CTA */}
      <section id="contacts" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="section-title mb-3">Подберём оборудование под вашу задачу</h2>
          <p className="text-[#666] mb-8 max-w-xl mx-auto">Оставьте заявку — менеджер свяжется в течение 15 минут, рассчитает стоимость и пришлёт КП.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => openFos()} className="btn-orange text-base px-8 py-3.5">
              <Icon name="MessageSquare" size={18} className="mr-2" />
              Получить КП
            </button>
            <a href="tel:88005057831" className="btn-outline-orange text-base px-8 py-3.5 inline-flex items-center">
              <Icon name="Phone" size={18} className="mr-2" />
              8 800 505-78-31
            </a>
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
    </div>
  );
}
