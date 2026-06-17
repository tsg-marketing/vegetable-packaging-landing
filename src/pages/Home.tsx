import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const HERO_IMG = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/6987fa02-cd88-4e57-944b-bcaecae0723b.png";
const GROUPS_API = "https://functions.poehali.dev/ed4e9bba-a8d4-434c-af4e-52809800893d";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type Param = { name: string; value: string };
type GroupProduct = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  priceText: string;
  currency: string;
  url: string;
  pictures: string[];
  subcategory?: string;
  description?: string;
  params?: Param[];
};
type Group = {
  id: string;
  name: string;
  total: number;
  products: GroupProduct[];
  showSubcategory?: boolean;
};

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

function formatPrice(p: GroupProduct): string {
  if (!p.price || p.price <= 0) return "Запросить цену";
  return `${Math.round(p.price).toLocaleString("ru-RU")} ₽`;
}

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function sortParams(params: Param[]): Param[] {
  const isPerf = (p: Param) => /производитель/i.test(p.name);
  const perf = params.filter(isPerf);
  const rest = params.filter(p => !isPerf(p));
  return [...perf, ...rest];
}

type EquipmentItem = { label: string; href: string; external?: boolean };
const EQUIPMENT_SUBMENU: EquipmentItem[] = [
  { label: "Оборудование для упаковки овощей", href: "/vegetables", external: true },
  { label: "Вакуум-упаковочное оборудование", href: "/vacuum", external: true },
  { label: "Горизонтальное упаковочное оборудование", href: "/gorizontalnoe", external: true },
];
// Категории, идущие к якорям группы на главной — заполняются динамически после загрузки

const NAV = [
  { label: "О компании", href: "#about" },
  { label: "Наши преимущества", href: "#advantages" },
  { label: "Сервис", href: "#service" },
  { label: "Доставка", href: "#delivery" },
  { label: "Оставить заявку", href: "#contact-form" },
  { label: "Контакты", href: "#contacts" },
];

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mobile menu
  const [menuOpen, setMenuOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  // Lead modal (ФОС — как на /vegetables)
  const [fosOpen, setFosOpen] = useState<null | { source: string; productName: string }>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  // Product modal
  const [openProduct, setOpenProduct] = useState<GroupProduct | null>(null);
  const [modalSlideIdx, setModalSlideIdx] = useState(0);
  // Индексы фото в карточках на главной (по product id)
  const [cardSlideIdx, setCardSlideIdx] = useState<Record<string, number>>({});
  // Лайтбокс (просмотр фото в полноэкранном окне)
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);

  useEffect(() => {
    captureUtm();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // ?refresh=1 в адресе страницы → принудительно обновить кэш каталога на бэкенде
        const wantRefresh = typeof window !== "undefined"
          && /[?&]refresh=(1|true|yes)\b/i.test(window.location.search);
        const refreshParam = wantRefresh ? "&refresh=1" : "";
        const res = await fetch(`${GROUPS_API}?v=${Date.now()}${refreshParam}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!cancelled) {
          setGroups(j.groups || []);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (fosOpen || thanksOpen || menuOpen || openProduct || lightbox) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fosOpen, thanksOpen, menuOpen, openProduct, lightbox]);

  const lightboxSlide = (dir: 1 | -1) => {
    if (!lightbox || lightbox.pictures.length === 0) return;
    setLightbox(lb => lb && { ...lb, idx: (lb.idx + dir + lb.pictures.length) % lb.pictures.length });
  };

  const openProductCard = (p: GroupProduct) => {
    setModalSlideIdx(cardSlideIdx[p.id] ?? 0);
    setOpenProduct(p);
  };
  const modalSlide = (dir: 1 | -1) => {
    if (!openProduct || openProduct.pictures.length === 0) return;
    setModalSlideIdx(i => (i + dir + openProduct.pictures.length) % openProduct.pictures.length);
  };
  const cardSlide = (productId: string, total: number, dir: 1 | -1) => {
    if (total <= 1) return;
    setCardSlideIdx(prev => {
      const cur = prev[productId] ?? 0;
      return { ...prev, [productId]: (cur + dir + total) % total };
    });
  };

  const openFos = useCallback((source: string, productName: string) => {
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosOpen({ source, productName });
  }, []);

  const validateFos = useCallback((): boolean => {
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
      source: fosOpen?.source || "fos",
      product: fosOpen?.productName || "",
      name: fosData.name.trim(),
      phone: fosData.phone.trim(),
      email: fosData.email.trim(),
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  }, [fosData, fosOpen, fosSubmitting, validateFos]);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    setEquipmentOpen(false);
    const id = href.startsWith("#") ? href.slice(1) : href;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-9 w-auto" />
          </a>

          {/* Desktop nav — в одну строку */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 flex-1 justify-center whitespace-nowrap">
            <div className="relative group">
              <button className="text-[14px] xl:text-[15px] font-medium text-[#1A1A1A] hover:text-[var(--orange)] transition-colors flex items-center gap-1.5">
                Оборудование
                <Icon name="ChevronDown" size={14} />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-100 py-3 min-w-[320px] max-h-[70vh] overflow-auto">
                  {EQUIPMENT_SUBMENU.map(item => (
                    item.external ? (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block px-5 py-2.5 text-[15px] font-semibold text-[#1A1A1A] hover:bg-orange-50 hover:text-[var(--orange)] transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <button
                        key={item.href}
                        onClick={() => scrollTo(item.href)}
                        className="block w-full text-left px-5 py-2.5 text-[14.5px] text-[#444] hover:bg-orange-50 hover:text-[var(--orange)] transition-colors"
                      >
                        {item.label}
                      </button>
                    )
                  ))}
                  {groups.length > 0 && <div className="my-2 border-t border-gray-100" />}
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => scrollTo(`group-${g.id}`)}
                      className="block w-full text-left px-5 py-2.5 text-[14.5px] text-[#444] hover:bg-orange-50 hover:text-[var(--orange)] transition-colors"
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {NAV.map(l => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="text-[14px] xl:text-[15px] font-medium text-[#1A1A1A] hover:text-[var(--orange)] transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0 leading-tight">
            <a href="mailto:pack@t-sib.ru" className="text-[13px] text-[#555] hover:text-[var(--orange)] flex items-center gap-1.5">
              <Icon name="Mail" size={14} style={{ color: "var(--orange)" }} />
              pack@t-sib.ru
            </a>
            <a href="tel:88005057831" className="text-[15px] font-semibold text-[#1A1A1A] hover:text-[var(--orange)] flex items-center gap-1.5">
              <Icon name="Phone" size={15} style={{ color: "var(--orange)" }} />
              8 800 505-78-31
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center"
            aria-label="Меню"
          >
            <Icon name="Menu" size={24} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden flex flex-col">
          <div className="h-20 flex items-center justify-between px-4 border-b border-gray-100">
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-8 w-auto" />
            <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center" aria-label="Закрыть">
              <Icon name="X" size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-2">
            <button
              onClick={() => setEquipmentOpen(v => !v)}
              className="w-full flex items-center justify-between py-3.5 text-[17px] font-medium text-[#1A1A1A] border-b border-gray-100"
            >
              Оборудование
              <Icon name={equipmentOpen ? "ChevronUp" : "ChevronDown"} size={18} />
            </button>
            {equipmentOpen && (
              <div className="pl-4 pb-2 space-y-1 border-b border-gray-100">
                {EQUIPMENT_SUBMENU.map(item => (
                  item.external ? (
                    <a key={item.href} href={item.href} className="block py-2.5 text-[15.5px] font-semibold text-[var(--orange)]">
                      {item.label}
                    </a>
                  ) : (
                    <button key={item.href} onClick={() => scrollTo(item.href)} className="block w-full text-left py-2.5 text-[15px] text-[#444]">
                      {item.label}
                    </button>
                  )
                ))}
                {groups.map(g => (
                  <button key={g.id} onClick={() => scrollTo(`group-${g.id}`)} className="block w-full text-left py-2.5 text-[15px] text-[#444]">
                    {g.name}
                  </button>
                ))}
              </div>
            )}
            {NAV.map(l => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="block w-full text-left py-3.5 text-[17px] font-medium text-[#1A1A1A] border-b border-gray-100"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 space-y-3">
            <a href="tel:88005057831" className="flex items-center gap-2 text-[16px] font-semibold text-[#1A1A1A]">
              <Icon name="Phone" size={18} style={{ color: "var(--orange)" }} />
              8 800 505-78-31
            </a>
            <a href="mailto:pack@t-sib.ru" className="flex items-center gap-2 text-[15px] text-[#555]">
              <Icon name="Mail" size={18} style={{ color: "var(--orange)" }} />
              pack@t-sib.ru
            </a>
          </div>
        </div>
      )}

      {/* ── HERO (стиль /vegetables) ── */}
      <section id="hero" className="pt-10 min-h-[88vh] flex items-center bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-12 lg:py-0">
          {/* Text */}
          <div className="lg:col-span-5 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(28px,4.5vw,52px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              Упаковочное оборудование от ведущих производителей{" "}
              <span style={{ color: "var(--orange)" }}>Азии, Европы и России</span>
            </h1>

            <p className="text-lg text-[#555] mb-8 max-w-xl leading-relaxed">
              Поставка, монтаж и сервис упаковочных линий для пищевых производств — от полуавтоматов до цехов «под ключ».
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => openFos("hero", "Подбор оборудования")} className="btn-orange text-base px-8 py-3.5">
                Получить КП
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-8 py-3.5">
                Смотреть каталог
              </button>
            </div>

            <ul className="space-y-3">
              {[
                "Поставщики из Китая, Кореи, Италии, Турции и РФ",
                "Подбор оборудования под задачу за 1 день",
                "Монтаж, пусконаладка и сервис по всей России",
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

          {/* Image */}
          <div className="lg:col-span-7 relative fade-up-1 flex items-center justify-center">
            <img
              src={HERO_IMG}
              alt="Упаковочное оборудование"
              loading="lazy"
              className="w-full h-auto lg:h-[640px] xl:h-[720px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── CATALOG GROUPS ── */}
      <section id="catalog" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Каталог упаковочного оборудования</h2>
            <p className="text-[#888] mt-2">Топ-10 самых выгодных позиций в каждой категории</p>
          </div>

          {loading && (
            <div className="space-y-12">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-7 w-72 bg-gray-200 animate-pulse rounded mb-5" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                          <div className="h-5 w-1/3 bg-gray-200 animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
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

          {!loading && !loadError && groups.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-[#555]">В каталоге пока нет товаров</p>
            </div>
          )}

          {!loading && groups.length > 0 && (
            <div className="space-y-24 md:space-y-28">
              {groups.map(g => (
                <div key={g.id} id={`group-${g.id}`} className="scroll-mt-28">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
                    <h3 className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A]">{g.name}</h3>
                    {g.total > g.products.length && (
                      <p className="text-sm text-[#888]">Показано {g.products.length} из {g.total}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {g.products.map(p => {
                      const isMaterials = g.id === "pack-materials" || g.showSubcategory === true;
                      const title = isMaterials ? (p.subcategory || p.name) : p.name;
                      const pics = p.pictures.length > 0 ? p.pictures : [HERO_IMG];
                      const curIdx = Math.min(cardSlideIdx[p.id] ?? 0, pics.length - 1);
                      const img = pics[curIdx];
                      const canSlide = !isMaterials && pics.length > 1;
                      return (
                        <div key={p.id} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                          <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative group">
                            <img
                              src={img}
                              alt={title}
                              loading="lazy"
                              onClick={() => !isMaterials && setLightbox({ pictures: pics, idx: curIdx })}
                              className={`w-full h-full object-contain ${!isMaterials ? "cursor-zoom-in" : ""}`}
                            />
                            {canSlide && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); cardSlide(p.id, pics.length, -1); }}
                                  className="absolute top-1/2 left-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Предыдущее фото"
                                >
                                  <Icon name="ChevronLeft" size={18} className="text-[#1A1A1A]" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); cardSlide(p.id, pics.length, 1); }}
                                  className="absolute top-1/2 right-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Следующее фото"
                                >
                                  <Icon name="ChevronRight" size={18} className="text-[#1A1A1A]" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                  {pics.map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => { e.stopPropagation(); setCardSlideIdx(prev => ({ ...prev, [p.id]: i })); }}
                                      className="w-1.5 h-1.5 rounded-full transition-all"
                                      style={{ background: i === curIdx ? "var(--orange)" : "rgba(0,0,0,0.25)" }}
                                      aria-label={`Фото ${i + 1}`}
                                    />
                                  ))}
                                </div>
                                <div className="absolute top-2 right-2 bg-black/55 text-white text-[11px] px-2 py-0.5 rounded">
                                  {curIdx + 1} / {pics.length}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <h4 className="text-[15px] font-semibold text-[#1A1A1A] mb-3 leading-snug break-words flex-1">
                              {title}
                            </h4>
                            {!isMaterials && (
                              <div className="font-bold text-lg mb-4" style={{ color: "var(--orange)" }}>
                                {formatPrice(p)}
                              </div>
                            )}
                            <div className="flex flex-col gap-2">
                              {!isMaterials && (
                                <button
                                  onClick={() => openProductCard(p)}
                                  className="w-full py-2.5 rounded-lg text-[14.5px] font-semibold transition-colors"
                                  style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.2)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
                                >
                                  Подробнее
                                </button>
                              )}
                              <button
                                onClick={() => openFos(`catalog_${g.id}`, title)}
                                className="btn-orange w-full py-3 text-[15px]"
                              >
                                {isMaterials ? "Уточнить цену" : "Получить предложение"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-12 md:mt-14 text-center">
                    <button
                      onClick={() => openFos(`catalog_all_${g.id}`, `Весь ассортимент: ${g.name}`)}
                      className="btn-orange text-base px-9 py-4"
                    >
                      Получить весь ассортимент
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── О КОМПАНИИ ── */}
      <section id="about" className="py-20 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-3">
            <h2 className="section-title inline-block relative pb-3">
              О компании ТЕХНОСИБ
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-1 rounded-full" style={{ background: "var(--orange)" }} />
            </h2>
          </div>
          <p className="text-center text-[#666] text-[15px] mb-8">Ваш надёжный партнёр с 2001 года</p>

          {/* Три карточки-факта */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
            {[
              { icon: "Award", value: "25", title: "лет на рынке", desc: "Опыт и экспертиза в упаковочном оборудовании" },
              { icon: "MapPin", value: "2 города", title: "Офисы в Москве и Новосибирске", desc: "" },
              { icon: "Globe2", value: "Проверенные партнёры", title: "Из Европы, России и Китая", desc: "" },
            ].map((c, i) => (
              <div key={i} className="rounded-xl p-6 bg-white border border-gray-100 shadow-sm">
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.12)" }}>
                  <Icon name={c.icon} size={20} style={{ color: "var(--orange)" }} />
                </div>
                {i === 0 ? (
                  <>
                    <div className="text-[40px] font-bold leading-none" style={{ color: "var(--orange)" }}>{c.value}</div>
                    <div className="text-[15px] font-semibold mt-2 text-[#1A1A1A]">{c.title}</div>
                    <div className="text-[13.5px] text-[#888] mt-1.5 leading-relaxed">{c.desc}</div>
                  </>
                ) : (
                  <>
                    <div className="text-[18px] font-bold text-[#1A1A1A]">{c.value}</div>
                    <div className="text-[13.5px] text-[#888] mt-1.5 leading-relaxed">{c.title}</div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Большая карточка с текстом */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
            <p className="text-[15px] text-[#444] leading-relaxed mb-5">
              Компания «Техно-Сиб» — надёжный поставщик и партнёр в сфере профессионального пищевого и фасовочно-упаковочного оборудования. Мы работаем с 2001 года и уже 25 лет помогаем предприятиям эффективно оснащать производства и склады пищевым и упаковочным оборудованием, предоставляем сервисное обслуживание, а также реализуем упаковочные и расходные материалы.
            </p>

            <div className="rounded-r-md border-l-4 px-4 py-3 mb-5" style={{ background: "rgba(255,102,0,0.08)", borderColor: "var(--orange)" }}>
              <p className="text-[14.5px] text-[#1A1A1A] font-medium leading-relaxed">
                Мы сотрудничаем с ведущими заводами-производителями Европы, России и Китая, подбирая решения под задачи и бюджет клиента.
              </p>
            </div>

            <p className="text-[15px] text-[#444] leading-relaxed mb-3">
              Собственные офисы продаж, склады, сервисная служба и отлаженная логистика в Москве и Новосибирске позволяют нам оперативно выполнять поставки и поддерживать оборудование на территории России и стран СНГ.
            </p>
            <p className="text-[15px] text-[#444] leading-relaxed mb-6">
              Экспертиза наших специалистов помогает решать задачи любого уровня сложности — от подбора единичной позиции до комплексного оснащения. «Техно-Сиб» всегда предложит оптимальное решение для вашего бизнеса и обеспечит надёжную поддержку на всех этапах работы.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2 border-t border-gray-100">
              {[
                { title: "Комплексные решения", desc: "От подбора оборудования до сервисного обслуживания" },
                { title: "Быстрая доставка", desc: "Собственная логистика по всей России и СНГ" },
                { title: "Сервисная поддержка", desc: "Гарантийное и постгарантийное обслуживание" },
                { title: "Экспертная консультация", desc: "Помощь в выборе оптимального решения" },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-3 pt-3">
                  <Icon name="CheckCircle2" size={20} style={{ color: "var(--orange)" }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14.5px] font-semibold text-[#1A1A1A]">{f.title}</div>
                    <div className="text-[13.5px] text-[#888] leading-relaxed mt-0.5">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ПРЕИМУЩЕСТВА ── */}
      <section id="advantages" className="py-20 bg-[#F7F7F7] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Наши преимущества</h2>
            <p className="text-[#888] mt-2">Почему заказчики работают с нами годами</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "Globe2", title: "Прямые контракты с производителями", text: "Без посредников — выгодные цены и оригинальные запчасти" },
              { icon: "Truck", title: "Склад запчастей в РФ", text: "Базовые комплектующие — на складе, отгрузка в день заказа" },
              { icon: "Settings2", title: "Монтаж и пусконаладка", text: "Свои инженеры запускают линию в вашем цехе" },
              { icon: "GraduationCap", title: "Обучение персонала", text: "Готовим операторов к самостоятельной работе на оборудовании" },
              { icon: "ShieldCheck", title: "Гарантия 12 месяцев", text: "Расширенная гарантия и сервисное обслуживание" },
              { icon: "FileText", title: "Документы для сетей", text: "Сертификаты, декларации, маркировка под требования ритейлеров" },
            ].map(a => (
              <div key={a.title} className="bg-white rounded-xl p-6 card-hover border border-gray-100">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.12)" }}>
                  <Icon name={a.icon} size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="text-[17px] font-bold mb-2 text-[#1A1A1A]">{a.title}</h3>
                <p className="text-[14.5px] text-[#666] leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── СЕРВИС И ПОДДЕРЖКА ── */}
      <section id="service" className="py-20 bg-[#F7F8FA] scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-[28px] sm:text-[36px] font-bold text-center mb-12 text-[#1A1A1A]">Сервис и поддержка</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "Truck", title: "Доставка и монтаж", text: "Доставляем по всей России. Монтаж и пусконаладка выполняются нашими специалистами" },
              { icon: "GraduationCap", title: "Обучение персонала", text: "Проводим инструктаж и обучение ваших сотрудников работе с оборудованием" },
              { icon: "Wrench", title: "Гарантийное обслуживание", text: "12 месяцев гарантии. Быстрое реагирование на заявки и наличие запчастей на складе" },
            ].map(s => (
              <div key={s.title} className="rounded-2xl p-7 bg-white text-center card-hover border border-gray-100">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#E6F3FB" }}>
                  <Icon name={s.icon} size={26} style={{ color: "#3FA9E0" }} />
                </div>
                <h3 className="text-[19px] font-bold mb-3 text-[#1A1A1A]">{s.title}</h3>
                <p className="text-[14.5px] text-[#888] leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ДОСТАВКА ТОВАРА ── */}
      <section id="delivery" className="py-20 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-[28px] sm:text-[36px] font-bold text-center mb-4 text-[#1A1A1A]">Доставка товара</h2>
          <p className="text-center text-[#666] text-[15px] max-w-2xl mx-auto mb-10">
            Доставка в пределах г. Новосибирск и г. Москва — <span className="font-semibold" style={{ color: "var(--orange)" }}>бесплатно</span>. Выгрузка товара осуществляется силами Покупателя.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Самовывоз */}
            <div className="rounded-2xl p-7 bg-[#FFF8F2] border border-orange-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,102,0,0.15)" }}>
                  <Icon name="MapPin" size={20} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="text-[20px] font-bold text-[#1A1A1A]">Самовывоз</h3>
              </div>
              <p className="text-[14px] text-[#777] mb-4">Забрать оплаченный товар можно на складе по адресу:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <Icon name="MapPin" size={16} style={{ color: "var(--orange)" }} className="mt-1 flex-shrink-0" />
                  <span className="text-[14.5px] text-[#1A1A1A]">г. Новосибирск, ул. Электрозаводская, 2, корпус 5</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="MapPin" size={16} style={{ color: "var(--orange)" }} className="mt-1 flex-shrink-0" />
                  <span className="text-[14.5px] text-[#1A1A1A]">г. Москва, ш. Энтузиастов, д. 56, стр. 32</span>
                </li>
              </ul>
            </div>

            {/* Доставка по России */}
            <div className="rounded-2xl p-7 bg-[#F2F8FD] border border-blue-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(63,169,224,0.15)" }}>
                  <Icon name="Truck" size={20} style={{ color: "#3FA9E0" }} />
                </div>
                <h3 className="text-[20px] font-bold text-[#1A1A1A]">Доставка по России</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <Icon name="Check" size={16} className="mt-1 flex-shrink-0 text-[#3FA9E0]" />
                  <span className="text-[14.5px] text-[#1A1A1A]">Доставка по России осуществляется через транспортные компании.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="Check" size={16} className="mt-1 flex-shrink-0 text-green-600" />
                  <span className="text-[14.5px] text-[#1A1A1A]">
                    <span className="font-semibold text-green-700">Бесплатно</span> доставим товар до терминала любой ТК в пределах г. Новосибирск и г. Москва.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="Check" size={16} className="mt-1 flex-shrink-0 text-[#3FA9E0]" />
                  <span className="text-[14.5px] text-[#1A1A1A]">Перевозчики: «Деловые линии», «ПЭК», «СДЭК».</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="Clock" size={16} className="mt-1 flex-shrink-0 text-[#3FA9E0]" />
                  <span className="text-[14.5px] text-[#1A1A1A]">Сроки поставки зависят от места назначения и выбора перевозчика.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="CreditCard" size={16} className="mt-1 flex-shrink-0 text-[#3FA9E0]" />
                  <span className="text-[14.5px] text-[#1A1A1A]">Оплата доставки — заказчиком при получении по тарифам перевозчика.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section id="contact-form" className="py-20 scroll-mt-24" style={{ background: "linear-gradient(135deg, #ff6600 0%, #ff8533 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-[28px] sm:text-[36px] font-bold mb-3">Не нашли, что искали?</h2>
          <p className="text-white/90 text-[17px] mb-7 max-w-xl mx-auto">
            Оставьте заявку — менеджер подберёт оборудование под вашу задачу и расскажет про условия поставки.
          </p>
          <button
            onClick={() => openFos("not_found", "Подобрать оборудование")}
            className="btn-white"
          >
            Оставить заявку
          </button>
        </div>
      </section>

      {/* ── ФУТЕР (стиль /vegetables) ── */}
      <footer id="contacts" className="py-10 bg-[#1A1A1A] text-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Col 1: Logo + desc */}
            <div>
              <div className="inline-block bg-white rounded-lg px-3 py-2 mb-4">
                <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-white/55 leading-relaxed max-w-xs">
                Поставка и сервис упаковочного оборудования. 25 лет на рынке.
              </p>
            </div>

            {/* Col 2: Nav */}
            <div>
              <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Навигация</p>
              <ul className="space-y-2">
                {NAV.map(l => (
                  <li key={l.href}>
                    <button
                      onClick={() => scrollTo(l.href)}
                      className="text-sm text-white/65 hover:text-white transition-colors"
                    >
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
            <p className="text-xs text-white/35">© 2026 Техно-Сиб. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* ── PRODUCT MODAL ── */}
      {openProduct && (() => {
        const pics = openProduct.pictures.length > 0 ? openProduct.pictures : [HERO_IMG];
        const safeIdx = Math.min(modalSlideIdx, pics.length - 1);
        const params = openProduct.params || [];
        return (
          <div
            className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpenProduct(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-5xl h-[96vh] sm:h-auto sm:max-h-[92vh] relative overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setOpenProduct(null)}
                className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Закрыть"
              >
                <Icon name="X" size={20} className="text-[#1A1A1A]" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
                {/* Слайдер */}
                <div className="bg-[#F7F7F7] relative flex flex-col md:h-[92vh] md:max-h-[760px]">
                  <div className="relative overflow-hidden flex-1 min-h-[260px] sm:min-h-[340px] md:min-h-0">
                    <img
                      src={pics[safeIdx]}
                      alt={openProduct.name}
                      onClick={() => setLightbox({ pictures: pics, idx: safeIdx })}
                      className="w-full h-full object-contain p-4 cursor-zoom-in"
                    />
                    {pics.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); modalSlide(-1); }}
                          className="absolute top-1/2 left-3 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center"
                          aria-label="Предыдущее фото"
                        >
                          <Icon name="ChevronLeft" size={22} className="text-[#1A1A1A]" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); modalSlide(1); }}
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

                  {pics.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-100 bg-white flex-shrink-0">
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

                {/* Описание и характеристики */}
                <div className="flex flex-col md:h-[92vh] md:max-h-[760px] md:min-h-0">
                  <div className="p-6 md:p-8 overflow-y-auto flex-1">
                    <h3 className="font-bold text-xl md:text-2xl text-[#1A1A1A] mb-3 leading-tight pr-12">{openProduct.name}</h3>

                    <div className="mb-5">
                      <div className="font-bold text-2xl md:text-3xl" style={{ color: "var(--orange)" }}>
                        {formatPrice(openProduct)}
                      </div>
                      {openProduct.vendor && (
                        <p className="text-xs text-[#888] mt-1">Производитель: {openProduct.vendor}</p>
                      )}
                    </div>

                    {openProduct.description && (
                      <div className="mb-5">
                        <p className="text-sm text-[#444] leading-relaxed">
                          {stripHtml(openProduct.description)}
                        </p>
                      </div>
                    )}

                    {params.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#999] mb-3">Характеристики</h4>
                        <div className="rounded-lg border border-gray-100 divide-y divide-gray-100">
                          {sortParams(params).map((pr, i) => (
                            <div key={i} className="flex gap-3 px-4 py-2.5 text-[14.5px]">
                              <span className="font-semibold text-[#1A1A1A] flex-1">{pr.name}</span>
                              <span className="font-normal text-[#444] flex-1 text-right break-words">{pr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-6 border-t border-gray-100 bg-white flex-shrink-0">
                    <button
                      onClick={() => openFos("product_modal", openProduct.name)}
                      className="btn-orange w-full py-3"
                    >
                      Оставить заявку
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LIGHTBOX (просмотр фото) ── */}
      {lightbox && (() => {
        const pics = lightbox.pictures;
        const idx = Math.min(lightbox.idx, pics.length - 1);
        return (
          <div
            className="fixed inset-0 z-[130] bg-black/95 flex items-center justify-center p-2 sm:p-6"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              aria-label="Закрыть"
            >
              <Icon name="X" size={22} />
            </button>

            <img
              src={pics[idx]}
              alt=""
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-full object-contain select-none"
            />

            {pics.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxSlide(-1); }}
                  className="absolute top-1/2 left-3 sm:left-6 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                  aria-label="Предыдущее"
                >
                  <Icon name="ChevronLeft" size={26} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); lightboxSlide(1); }}
                  className="absolute top-1/2 right-3 sm:right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                  aria-label="Следующее"
                >
                  <Icon name="ChevronRight" size={26} />
                </button>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-md">
                  {idx + 1} / {pics.length}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── FOS MODAL (как на /vegetables) ── */}
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

      {/* ── THANKS MODAL (как на /vegetables) ── */}
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