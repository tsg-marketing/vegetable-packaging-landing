import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const HERO_IMG = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/98dadd67-336a-47a5-9480-dcbd6c9cfde2.png";
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
};
type Group = {
  id: string;
  name: string;
  total: number;
  products: GroupProduct[];
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

const EQUIPMENT_SUBMENU = [
  { label: "Упаковка овощей", href: "/vegetables" },
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
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

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
    setErrors({});
    setFosOpen({ source, title });
  }, []);

  const submitFos = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: { name?: string; phone?: string } = {};
      if (name.trim().length < 2) errs.name = "Укажите имя";
      if (!PHONE_RE.test(phone.trim())) errs.phone = "Укажите корректный телефон";
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
    [name, phone, fosOpen]
  );

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setEquipmentOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-8 w-auto" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            <div className="relative group">
              <button className="text-[15px] font-medium text-[#1A1A1A] hover:text-[var(--orange)] transition-colors flex items-center gap-1">
                Оборудование
                <Icon name="ChevronDown" size={14} />
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[220px]">
                  {EQUIPMENT_SUBMENU.map(item => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block px-5 py-2.5 text-[15px] text-[#1A1A1A] hover:bg-orange-50 hover:text-[var(--orange)] transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => scrollTo("about")} className="text-[15px] font-medium text-[#1A1A1A] hover:text-[var(--orange)] transition-colors">
              О компании
            </button>
            <button onClick={() => scrollTo("contacts")} className="text-[15px] font-medium text-[#1A1A1A] hover:text-[var(--orange)] transition-colors">
              Контакты
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <a href="tel:88005004054" className="text-[15px] font-semibold text-[#1A1A1A] hover:text-[var(--orange)] flex items-center gap-2">
              <Icon name="Phone" size={16} style={{ color: "var(--orange)" }} />
              8-800-500-40-54
            </a>
            <a href="mailto:info@t-sib.ru" className="hidden xl:flex text-[14px] text-[#555] hover:text-[var(--orange)] items-center gap-2">
              <Icon name="Mail" size={16} style={{ color: "var(--orange)" }} />
              info@t-sib.ru
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
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-8 w-auto" />
            <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center" aria-label="Закрыть">
              <Icon name="X" size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-1">
            <button
              onClick={() => setEquipmentOpen(v => !v)}
              className="w-full flex items-center justify-between py-3 text-[17px] font-medium text-[#1A1A1A]"
            >
              Оборудование
              <Icon name={equipmentOpen ? "ChevronUp" : "ChevronDown"} size={18} />
            </button>
            {equipmentOpen && (
              <div className="pl-4 pb-2 space-y-1">
                {EQUIPMENT_SUBMENU.map(item => (
                  <a key={item.href} href={item.href} className="block py-2.5 text-[16px] text-[#444]">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
            <button onClick={() => scrollTo("about")} className="block w-full text-left py-3 text-[17px] font-medium text-[#1A1A1A]">
              О компании
            </button>
            <button onClick={() => scrollTo("contacts")} className="block w-full text-left py-3 text-[17px] font-medium text-[#1A1A1A]">
              Контакты
            </button>
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

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white fade-up">
            <p className="text-[var(--orange)] font-semibold uppercase tracking-wider text-[13px] mb-4">
              Техно-Сиб · с 2001 года
            </p>
            <h1 className="text-[32px] sm:text-[42px] lg:text-[52px] font-bold leading-[1.1] mb-6">
              Упаковочное оборудование от ведущих производителей Азии, Европы и России
            </h1>
            <p className="text-white/75 text-[17px] mb-8 max-w-xl leading-relaxed">
              Поставляем, монтируем и обслуживаем линии для пищевых производств: от полуавтоматов до автоматических цехов «под ключ».
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => openFos("hero", "Подбор оборудования")} className="btn-orange">
                Подобрать оборудование
              </button>
              <button onClick={() => scrollTo("catalog")} className="btn-outline-orange" style={{ borderColor: "#fff", color: "#fff" }}>
                Каталог
              </button>
            </div>
          </div>
          <div className="relative hidden lg:block fade-up-2">
            <img src={HERO_IMG} alt="Упаковочное оборудование" className="w-full h-auto rounded-2xl shadow-2xl" />
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
            <div className="space-y-14">
              {groups.map(g => (
                <div key={g.id}>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                    <h3 className="text-[22px] sm:text-[26px] font-bold text-[#1A1A1A]">{g.name}</h3>
                    {g.total > g.products.length && (
                      <p className="text-sm text-[#888]">Показано {g.products.length} из {g.total}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {g.products.map(p => {
                      const img = p.pictures[0] || HERO_IMG;
                      return (
                        <div key={p.id} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                          <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                            <img src={img} alt={p.name} loading="lazy" className="w-full h-full object-contain" />
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <h4 className="text-[15px] font-semibold text-[#1A1A1A] mb-3 leading-snug break-words flex-1">
                              {p.name}
                            </h4>
                            <div className="font-bold text-lg mb-3" style={{ color: "var(--orange)" }}>
                              {formatPrice(p)}
                            </div>
                            <button
                              onClick={() => openFos(`catalog_${g.id}`, p.name)}
                              className="w-full py-2 rounded-lg text-[14px] font-semibold transition-colors"
                              style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.2)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
                            >
                              Запросить цену
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => openFos(`catalog_all_${g.id}`, `Весь ассортимент: ${g.name}`)}
                      className="btn-orange"
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
      <section id="about" className="py-16 bg-white border-t border-gray-100">
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

      {/* ── CONTACT FORM ── */}
      <section id="contact-form" className="py-16" style={{ background: "linear-gradient(135deg, #ff6600 0%, #ff8533 100%)" }}>
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

      {/* ── FOOTER ── */}
      <footer id="contacts" className="bg-[#0F0F0F] text-white pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
            <div>
              <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-9 w-auto mb-4 brightness-0 invert" />
              <p className="text-[14px] text-white/55 leading-relaxed">
                Поставка упаковочного и пищевого оборудования. Монтаж, пусконаладка, сервис по всей России.
              </p>
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-white/40 mb-4">Контакты</p>
              <ul className="space-y-3">
                <li>
                  <a href="tel:88005004054" className="text-[15px] text-white/80 hover:text-white flex items-center gap-2">
                    <Icon name="Phone" size={15} style={{ color: "var(--orange)" }} />
                    8-800-500-40-54
                  </a>
                </li>
                <li>
                  <a href="mailto:info@t-sib.ru" className="text-[15px] text-white/80 hover:text-white flex items-center gap-2">
                    <Icon name="Mail" size={15} style={{ color: "var(--orange)" }} />
                    info@t-sib.ru
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-white/40 mb-4">Офисы</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-[14px] text-white/65 leading-relaxed">
                  <Icon name="MapPin" size={14} style={{ color: "var(--orange)" }} className="mt-1 flex-shrink-0" />
                  <span>Москва, ш. Энтузиастов, д. 56, стр. 32, офис 115</span>
                </li>
                <li className="flex items-start gap-2 text-[14px] text-white/65 leading-relaxed">
                  <Icon name="MapPin" size={14} style={{ color: "var(--orange)" }} className="mt-1 flex-shrink-0" />
                  <span>Новосибирск, ул. Электрозаводская, 2 к1, офис 304, 314</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-white/35 mt-6">© 2026 Техно-Сиб. Все права защищены.</p>
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
              <button
                type="submit"
                disabled={sending}
                className="btn-orange w-full py-3 disabled:opacity-60"
              >
                {sending ? "Отправляем…" : "Отправить"}
              </button>
              <p className="text-[12px] text-[#888] leading-relaxed">
                Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных и получением информации о товарах и услугах.
              </p>
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
