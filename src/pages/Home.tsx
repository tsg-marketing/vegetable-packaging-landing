import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const HERO_IMG = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/6987fa02-cd88-4e57-944b-bcaecae0723b.png";
const GROUPS_API = "https://functions.poehali.dev/ed4e9bba-a8d4-434c-af4e-52809800893d";

const PHONE_RE = /^(\+7|7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/;

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
    return j?.ok !== false;
  } catch {
    return false;
  }
}

function formatPrice(p: GroupProduct): string {
  if (!p.price || p.price <= 0) return "Запросить цену";
  return `${Math.round(p.price).toLocaleString("ru-RU")} ₽`;
}

type EquipmentItem = { label: string; href: string; external?: boolean };
const EQUIPMENT_SUBMENU: EquipmentItem[] = [
  { label: "Оборудование для упаковки овощей", href: "/vegetables", external: true },
];
// Категории, идущие к якорям группы на главной — заполняются динамически после загрузки

const NAV = [
  { label: "О компании", href: "#about" },
  { label: "Наши преимущества", href: "#advantages" },
  { label: "Сервис", href: "#service" },
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

  // Lead modal
  const [fosOpen, setFosOpen] = useState<null | { source: string; title: string }>(null);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; agree?: string }>({});

  useEffect(() => {
    captureUtm();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(GROUPS_API);
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
    if (fosOpen || thanksOpen || menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fosOpen, thanksOpen, menuOpen]);

  const openFos = useCallback((source: string, title: string) => {
    setName("");
    setPhone("");
    setAgree(false);
    setErrors({});
    setFosOpen({ source, title });
  }, []);

  const submitFos = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: { name?: string; phone?: string; agree?: string } = {};
      if (name.trim().length < 2) errs.name = "Укажите имя";
      if (!PHONE_RE.test(phone.trim())) errs.phone = "Укажите корректный телефон";
      if (!agree) errs.agree = "Подтвердите согласие на обработку персональных данных";
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setSending(true);
      const ok = await sendLead({
        name: name.trim(),
        phone: phone.trim(),
        source: fosOpen?.source || "main_form",
        product: fosOpen?.title || "",
      });
      setSending(false);
      if (ok) {
        setFosOpen(null);
        setThanksOpen(true);
      } else {
        setErrors({ name: "Ошибка отправки. Попробуйте позже" });
      }
    },
    [name, phone, agree, fosOpen]
  );

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
            <a href="mailto:info@t-sib.ru" className="text-[13px] text-[#555] hover:text-[var(--orange)] flex items-center gap-1.5">
              <Icon name="Mail" size={14} style={{ color: "var(--orange)" }} />
              info@t-sib.ru
            </a>
            <a href="tel:88005004054" className="text-[15px] font-semibold text-[#1A1A1A] hover:text-[var(--orange)] flex items-center gap-1.5">
              <Icon name="Phone" size={15} style={{ color: "var(--orange)" }} />
              8-800-500-40-54
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
            <a href="tel:88005004054" className="flex items-center gap-2 text-[16px] font-semibold text-[#1A1A1A]">
              <Icon name="Phone" size={18} style={{ color: "var(--orange)" }} />
              8-800-500-40-54
            </a>
            <a href="mailto:info@t-sib.ru" className="flex items-center gap-2 text-[15px] text-[#555]">
              <Icon name="Mail" size={18} style={{ color: "var(--orange)" }} />
              info@t-sib.ru
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
                      const img = p.pictures[0] || HERO_IMG;
                      const isMaterials = g.id === "pack-materials" || g.showSubcategory === true;
                      const title = isMaterials ? (p.subcategory || p.name) : p.name;
                      return (
                        <div key={p.id} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                          <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                            <img src={img} alt={title} loading="lazy" className="w-full h-full object-contain" />
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
                            <button
                              onClick={() => openFos(`catalog_${g.id}`, title)}
                              className="btn-orange w-full py-3.5 text-[15px]"
                            >
                              {isMaterials ? "Уточнить цену" : "Получить предложение"}
                            </button>
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

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 bg-white border-t border-gray-100 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="section-title">О компании</h2>
          <p className="text-[17px] text-[#555] leading-relaxed mt-5 max-w-3xl mx-auto">
            Техно-Сиб — поставщик упаковочного и пищевого оборудования с 2001 года. Подбираем линии под задачу заказчика, обеспечиваем доставку, монтаж, пусконаладку и сервисное сопровождение по всей России.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { num: "25 лет", text: "на рынке оборудования" },
              { num: "1500+", text: "реализованных проектов" },
              { num: "8 стран", text: "поставщиков-партнёров" },
              { num: "24-48 ч", text: "выезд сервиса" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-5 bg-[#F7F7F7]">
                <div className="text-[26px] font-bold" style={{ color: "var(--orange)" }}>{s.num}</div>
                <div className="text-[14px] text-[#555] mt-1">{s.text}</div>
              </div>
            ))}
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

      {/* ── СЕРВИС ── */}
      <section id="service" className="py-20 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Сервис</h2>
            <p className="text-[#888] mt-2">Полное сопровождение после поставки</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "PackageCheck", title: "Поставка", text: "Доставка со складов в РФ и из-за рубежа" },
              { icon: "Wrench", title: "Монтаж", text: "Сборка и подключение в вашем цехе" },
              { icon: "Play", title: "Пусконаладка", text: "Запуск линии в рабочих режимах" },
              { icon: "LifeBuoy", title: "Сервис 24/7", text: "Гарантийное и постгарантийное обслуживание" },
            ].map(s => (
              <div key={s.title} className="rounded-xl p-6 bg-[#F7F7F7] card-hover">
                <Icon name={s.icon} size={28} style={{ color: "var(--orange)" }} />
                <h3 className="text-[17px] font-bold mt-4 mb-2 text-[#1A1A1A]">{s.title}</h3>
                <p className="text-[14.5px] text-[#666] leading-relaxed">{s.text}</p>
              </div>
            ))}
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
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/35">© 2026 Техно-Сиб. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* ── LEAD MODAL ── */}
      {fosOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setFosOpen(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setFosOpen(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              aria-label="Закрыть"
            >
              <Icon name="X" size={20} />
            </button>
            <h3 className="text-[22px] font-bold mb-1">Оставить заявку</h3>
            {fosOpen.title && <p className="text-sm text-[#888] mb-5">{fosOpen.title}</p>}

            <form onSubmit={submitFos} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className={`w-full px-4 py-3 rounded-lg border bg-white outline-none focus:border-[var(--orange)] ${errors.name ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className={`w-full px-4 py-3 rounded-lg border bg-white outline-none focus:border-[var(--orange)] ${errors.phone ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 accent-[var(--orange)] flex-shrink-0"
                />
                <span className="text-[12.5px] text-[#666] leading-relaxed">
                  Я согласен на обработку персональных данных и получение информации о товарах и услугах.
                </span>
              </label>
              {errors.agree && <p className="text-xs text-red-500">{errors.agree}</p>}

              <button
                type="submit"
                disabled={sending}
                className="btn-orange w-full py-3 disabled:opacity-60"
              >
                {sending ? "Отправляем…" : "Отправить"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── THANKS MODAL ── */}
      {thanksOpen && (
        <div
          className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setThanksOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-8 text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(255,102,0,0.12)" }}>
              <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
            </div>
            <h3 className="text-[22px] font-bold mb-2">Заявка принята</h3>
            <p className="text-[15px] text-[#555] mb-6">Менеджер свяжется с вами в рабочее время. Спасибо!</p>
            <button onClick={() => setThanksOpen(false)} className="btn-orange w-full py-3">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}