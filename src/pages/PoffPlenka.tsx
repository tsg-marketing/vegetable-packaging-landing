import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { createLeadSender } from "@/lib/lead";
import EquipmentMenu from "@/components/EquipmentMenu";
import { captureUtm } from "@/lib/utm";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import LegalInfo from "@/components/LegalInfo";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { useSeo } from "@/lib/seo";
import { getPageMeta } from "@/lib/pageMeta";
import {
  HERO_BULLETS,
  USE_CASES,
  POFF_LINE,
  THICKNESS_SCALE,
  CHOICE_POINTS,
  COMPANY_ADVANTAGES,
  PRODUCT_FACTS,
  APPLICATIONS,
  FAQ,
  NAV,
} from "@/data/poffContent";

const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/345dddaf-6da2-4b63-a8da-f379591e7ba5.jpg";
const IMG_LINE = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/aee03e0b-761e-465d-824f-c0e4b733cc0f.jpg";
const IMG_WAREHOUSE = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0283427-6185-4778-a071-851ecf325c4f.jpg";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const sendLead = createLeadSender("Плёнка ПОФ термоусадочная");

type Errors = { name?: string; phone?: string; email?: string; agree?: string };

export default function PoffPlenka() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [fosOpen, setFosOpen] = useState<{ productName?: string; title?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<Errors>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);

  const [heroData, setHeroData] = useState({ name: "", phone: "" });
  const [heroAgree, setHeroAgree] = useState(false);
  const [heroErrors, setHeroErrors] = useState<Errors>({});
  const [heroSubmitting, setHeroSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", company: "", comment: "" });
  const [formAgree, setFormAgree] = useState(false);
  const [formErrors, setFormErrors] = useState<Errors>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [thanksOpen, setThanksOpen] = useState(false);

  useSeo(getPageMeta("/poff_plenka"));

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const anyOpen = fosOpen || thanksOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [fosOpen, thanksOpen]);

  const scrollTo = (href: string) => {
    if (href.startsWith("/")) { window.location.href = href; return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
    setEquipmentOpen(false);
  };

  const openFos = useCallback((productName?: string, title?: string) => {
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosAgree(false);
    setFosSubmitting(false);
    setFosOpen({ productName, title });
  }, []);

  const submitFos = useCallback(async () => {
    const errs: Errors = {};
    if (fosData.name.trim() && fosData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(fosData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (fosData.email.trim() && !EMAIL_RE.test(fosData.email.trim())) errs.email = "Укажите корректный e-mail";
    if (!fosAgree) errs.agree = "Необходимо согласие";
    setFosErrors(errs);
    if (Object.keys(errs).length > 0 || fosSubmitting) return;
    setFosSubmitting(true);
    await sendLead({
      source: "fos",
      product: fosOpen?.productName || "",
      comment: fosOpen?.title || "",
      name: fosData.name.trim(),
      phone: fosData.phone.trim(),
      email: fosData.email.trim(),
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  }, [fosData, fosAgree, fosOpen, fosSubmitting]);

  const submitHero = async () => {
    const errs: Errors = {};
    if (heroData.name.trim() && heroData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(heroData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (!heroAgree) errs.agree = "Необходимо согласие";
    setHeroErrors(errs);
    if (Object.keys(errs).length > 0 || heroSubmitting) return;
    setHeroSubmitting(true);
    await sendLead({
      source: "hero_form",
      comment: "Заявка на подбор плёнки ПОФ и расчёт цены за метр",
      name: heroData.name.trim(),
      phone: heroData.phone.trim(),
    });
    setHeroSubmitting(false);
    setHeroData({ name: "", phone: "" });
    setHeroAgree(false);
    setThanksOpen(true);
  };

  const submitMainForm = async () => {
    const errs: Errors = {};
    if (formData.name.trim() && formData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(formData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) errs.email = "Укажите корректный e-mail";
    if (!formAgree) errs.agree = "Необходимо согласие";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0 || formSubmitting) return;
    setFormSubmitting(true);
    await sendLead({
      source: "main_form",
      company: formData.company.trim(),
      comment: formData.comment.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    });
    setFormSubmitting(false);
    setFormData({ name: "", phone: "", email: "", company: "", comment: "" });
    setFormAgree(false);
    setThanksOpen(true);
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
            {NAV.slice(0, 1).map(l => (
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
                  <EquipmentMenu variant="desktop" currentHref="/poff_plenka" showGroups={false} />
                </div>
              )}
            </div>
            {NAV.slice(1).map(l => (
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
            <button onClick={() => openFos(undefined, "Заказать звонок")} className="btn-orange text-sm py-2 px-5 whitespace-nowrap">
              Заказать звонок
            </button>
          </div>

          <button className="lg:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Меню">
            <Icon name={mobileOpen ? "X" : "Menu"} size={24} className="text-[#1A1A1A]" />
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
            {NAV.slice(0, 1).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <div className="border-b border-gray-100 pb-2">
              <p className="text-xs font-semibold text-[#999] uppercase mb-2">Оборудование</p>
              <EquipmentMenu variant="mobile" currentHref="/poff_plenka" showGroups={false} />
            </div>
            {NAV.slice(1).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <a href="tel:88005057831" className="text-base font-bold text-[#1A1A1A] py-2">8 800 505-78-31</a>
            <button onClick={() => { setMobileOpen(false); openFos(undefined, "Заказать звонок"); }} className="btn-orange w-full mt-1">Заказать звонок</button>
          </div>
        )}
      </header>

      {/* ЭКРАН 1 — HERO */}
      <section id="hero" className="pt-16 bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center py-12 lg:py-16">
          <div className="lg:col-span-7 fade-up">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: "var(--orange)" }}>
              Расходные материалы для термоусадочной упаковки
            </p>
            <h1 className="text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.15] mb-4 text-[#1A1A1A]">
              ПОФ термоусадочная плёнка <span style={{ color: "var(--orange)" }}>в наличии</span>
            </h1>
            <p className="text-[18px] text-[#555] mb-7 max-w-2xl leading-relaxed">
              Полиолефиновая плёнка для штучной и групповой упаковки. Подберём толщину под вашу продукцию,
              рассчитаем цену за метр и расход под ваш объём.
            </p>

            <ul className="space-y-3.5 mb-8 max-w-2xl">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[16px] text-[#333] leading-snug">
                  <Icon name="Check" size={20} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => openFos(undefined, "Подбор плёнки ПОФ и расчёт цены за метр")} className="btn-orange text-base px-7 py-3.5 inline-flex items-center gap-2">
                <Icon name="Calculator" size={18} />
                Рассчитать цену за метр
              </button>
              <button onClick={() => scrollTo("#line")} className="btn-outline-orange text-base px-7 py-3.5 inline-flex items-center gap-2">
                <Icon name="ArrowDown" size={18} />
                Смотреть линейку
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 fade-up space-y-5">
            <div className="bg-white rounded-2xl shadow-xl p-4 overflow-hidden">
              <img
                src={IMG_HERO}
                alt="Рулоны ПОФ термоусадочной плёнки"
                className="w-full h-auto object-cover rounded-xl"
                loading="eager"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 border border-gray-100">
              <h2 className="font-bold text-[19px] mb-1.5 leading-tight">Подберём плёнку под вашу продукцию</h2>
              <p className="text-[14px] text-[#777] mb-4 leading-snug">Оставьте телефон — уточним задачу и пришлём цену за метр</p>

              <div className="space-y-3">
                <div>
                  <input type="tel" placeholder="+7 (___) ___-__-__" value={heroData.phone}
                    onChange={e => { setHeroData({ ...heroData, phone: formatPhoneRu(e.target.value) }); if (heroErrors.phone) setHeroErrors({ ...heroErrors, phone: undefined }); }}
                    onFocus={e => { if (!e.target.value) setHeroData({ ...heroData, phone: "+7 " }); }}
                    className={`w-full px-4 py-3 rounded-lg border ${heroErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                  {heroErrors.phone && <p className="text-xs text-red-500 mt-1">{heroErrors.phone}</p>}
                </div>
                <div>
                  <input type="text" placeholder="Ваше имя" value={heroData.name}
                    onChange={e => { setHeroData({ ...heroData, name: e.target.value }); if (heroErrors.name) setHeroErrors({ ...heroErrors, name: undefined }); }}
                    className={`w-full px-4 py-3 rounded-lg border ${heroErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                  {heroErrors.name && <p className="text-xs text-red-500 mt-1">{heroErrors.name}</p>}
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={heroAgree}
                    onChange={e => { setHeroAgree(e.target.checked); if (heroErrors.agree) setHeroErrors({ ...heroErrors, agree: undefined }); }}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                  <PolicyDisclaimer />
                </label>
                {heroErrors.agree && <p className="text-xs text-red-500">{heroErrors.agree}</p>}
                <button onClick={submitHero} disabled={heroSubmitting} className="btn-orange w-full py-3.5 disabled:opacity-60">
                  {heroSubmitting ? "Отправляем..." : "Получить подбор и цену"}
                </button>
                <p className="text-[12px] text-[#999] text-center">Или позвоните: <a href="tel:88005057831" className="font-semibold text-[#1A1A1A] hover:text-orange-600">8 800 505-78-31</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 2 — ДЛЯ КАКИХ ЗАДАЧ */}
      <section id="use-cases" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Для каких задач подходит плёнка ПОФ</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">
              Плёнка применяется на пищевых производствах, в упаковочных цехах и при упаковке непищевых товаров
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {USE_CASES.map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 card-hover">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={c.icon} fallback="Package" size={22} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[16px] mb-2 leading-snug">{c.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 rounded-2xl p-6 sm:p-7" style={{ background: "#F7F7F7" }}>
            <h3 className="font-bold text-[18px] mb-4">Свойства плёнки ПОФ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {PRODUCT_FACTS.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[15px] text-[#333] leading-snug">
                  <Icon name="Check" size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 3 — ЛИНЕЙКА */}
      <section id="line" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Линейка плёнки по толщине и намотке</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">
              Пять позиций под разные задачи: от лёгкой серийной фасовки до упаковки тяжёлых и крупногабаритных товаров
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {POFF_LINE.map(p => (
              <div key={p.id} className="rounded-xl bg-white border border-gray-100 p-6 card-hover flex flex-col">
                <span className="self-start text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md mb-4"
                  style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}>
                  {p.tag}
                </span>

                <h3 className="font-bold text-[18px] mb-4 leading-snug">{p.name}</h3>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: "#F7F7F7" }}>
                    <p className="text-[11px] text-[#999] uppercase tracking-wide font-semibold">Толщина</p>
                    <p className="font-bold text-[17px] text-[#1A1A1A]">{p.thickness}</p>
                  </div>
                  <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: "#F7F7F7" }}>
                    <p className="text-[11px] text-[#999] uppercase tracking-wide font-semibold">Намотка</p>
                    <p className="font-bold text-[17px] text-[#1A1A1A]">{p.winding}</p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5 flex-1">
                  <div className="flex items-start gap-2.5">
                    <Icon name="Target" size={17} className="mt-0.5 flex-shrink-0 text-[#999]" />
                    <p className="text-[14px] text-[#555] leading-snug">{p.purpose}</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Icon name="Check" size={17} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                    <p className="text-[14px] text-[#333] leading-snug font-medium">{p.benefit}</p>
                  </div>
                </div>

                <button onClick={() => openFos(p.name, "Запрос цены на плёнку ПОФ")} className="btn-orange w-full py-3">
                  Запросить цену
                </button>
              </div>
            ))}

            <div className="rounded-xl p-6 flex flex-col justify-center text-white"
              style={{ background: "linear-gradient(135deg, #FF7A00 0%, #FF9500 60%, #FFB020 100%)" }}>
              <Icon name="MessageSquare" size={30} className="text-white mb-3" />
              <h3 className="font-bold text-[20px] mb-2 leading-tight">Не знаете, какая позиция нужна?</h3>
              <p className="text-[15px] text-white/90 mb-5 leading-relaxed">
                Опишите продукцию и тип упаковочного аппарата — подберём толщину и намотку, посчитаем расход и цену за метр.
              </p>
              <button onClick={() => openFos(undefined, "Подбор позиции плёнки ПОФ")} className="btn-white w-full">
                Получить подбор
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 4 — КАК ВЫБРАТЬ ТОЛЩИНУ */}
      <section id="thickness" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div>
              <h2 className="section-title mb-4">Как выбрать толщину</h2>
              <p className="text-[#666] text-[16px] leading-relaxed mb-6">
                Толщина подбирается под конкретный товар и упаковочное оборудование. Чем тяжелее, крупнее
                и сложнее по форме продукция, тем плотнее нужна плёнка.
              </p>

              <p className="font-bold text-[16px] mb-3">На что смотрим при подборе</p>
              <ul className="space-y-3 mb-7">
                {CHOICE_POINTS.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-[#333] leading-snug">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                      style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}>
                      {i + 1}
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => openFos(undefined, "Подбор толщины плёнки ПОФ под продукцию")} className="btn-orange px-7 py-3.5 inline-flex items-center gap-2">
                <Icon name="ClipboardList" size={18} />
                Подобрать толщину под продукцию
              </button>
            </div>

            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#F7F7F7" }}>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#999] mb-5">Шкала толщин</p>
              <div className="space-y-6">
                {THICKNESS_SCALE.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span className="font-bold text-[20px] text-[#1A1A1A]">{s.value}</span>
                      <span className="text-[13px] font-semibold text-right" style={{ color: "var(--orange)" }}>{s.label}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${s.width}%`, background: "linear-gradient(90deg, #FF7A00, #FFB020)" }} />
                    </div>
                    <p className="text-[14px] text-[#666] leading-snug">{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-gray-200 flex items-start gap-2.5">
                <Icon name="Info" size={17} className="mt-0.5 flex-shrink-0 text-[#999]" />
                <p className="text-[13px] text-[#777] leading-snug">
                  Намотка выбирается отдельно: чем больше метраж рулона, тем реже остановки линии на замену.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 5 — ПРЕИМУЩЕСТВА КОМПАНИИ */}
      <section id="advantages" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Условия работы</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">
              Поставляем плёнку ПОФ производствам и упаковочным цехам: со склада, с документами и на согласованных условиях
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-9">
            {COMPANY_ADVANTAGES.map((a, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 p-5 card-hover">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={a.icon} fallback="Check" size={22} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[16px] mb-2 leading-snug">{a.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white border border-gray-100">
            <div className="p-7 sm:p-9 flex flex-col justify-center">
              <h3 className="font-bold text-[clamp(20px,2.2vw,26px)] mb-3 leading-tight">Плёнка в наличии на трёх складах</h3>
              <p className="text-[#666] text-[15px] leading-relaxed mb-5">
                Москва, Новосибирск и Челябинск. По этим городам действует бесплатная адресная доставка.
                Уточним остатки по нужной толщине и намотке под ваш объём.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Москва", "Новосибирск", "Челябинск"].map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 text-[14px] font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,102,0,0.1)", color: "#B34700" }}>
                    <Icon name="MapPin" size={15} />
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => openFos(undefined, "Запрос наличия плёнки ПОФ на складе")} className="btn-orange px-7 py-3.5">
                  Уточнить наличие
                </button>
                <a href="tel:88005057831" className="btn-outline-orange px-7 py-3.5 inline-flex items-center gap-2">
                  <Icon name="Phone" size={18} />
                  8 800 505-78-31
                </a>
              </div>
            </div>
            <div className="min-h-[260px]">
              <img src={IMG_WAREHOUSE} alt="Склад с рулонами термоусадочной плёнки" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 6 — ГДЕ ИСПОЛЬЗУЕТСЯ */}
      <section id="applications" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Что упаковывают в плёнку ПОФ</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">
              Пищевая и непищевая продукция — штучно и группой, на ручных аппаратах и автоматических линиях
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-5 rounded-2xl overflow-hidden min-h-[280px]">
              <img src={IMG_LINE} alt="Упаковочная линия с термоусадочной плёнкой" loading="lazy" className="w-full h-full object-cover" />
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {APPLICATIONS.map((a, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 px-4 py-4 flex items-center gap-3 card-hover bg-white">
                    <Icon name={a.icon} fallback="Package" size={20} className="flex-shrink-0" style={{ color: "var(--orange)" }} />
                    <span className="text-[14px] font-medium text-[#333] leading-snug">{a.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-[#777] mt-5 leading-relaxed">
                Вашей продукции нет в списке? Опишите товар — подберём толщину и намотку под задачу.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 7 — КОММЕРЧЕСКИЙ CTA */}
      <section id="cta" className="py-16 scroll-mt-16" style={{ background: "linear-gradient(135deg, #FF7A00 0%, #FF9500 50%, #FFB020 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-[clamp(24px,3vw,34px)] font-bold leading-tight mb-4">
                Рассчитаем расход плёнки и цену за метр под ваш объём
              </h2>
              <p className="text-[16px] text-white/90 leading-relaxed mb-6">
                Подберём толщину под вашу продукцию, предложим подходящую намотку и посчитаем стоимость
                под планируемый объём закупки.
              </p>
              <ul className="space-y-3">
                {[
                  "Подбор толщины под тип продукции и оборудование",
                  "Расчёт цены за метр и расхода на упаковку",
                  "Индивидуальные условия на объём и отсрочка платежа",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-white/95 leading-snug">
                    <Icon name="Check" size={19} className="mt-0.5 flex-shrink-0 text-white" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl">
              <h3 className="font-bold text-[20px] mb-1.5">Запросить расчёт</h3>
              <p className="text-[14px] text-[#777] mb-5 leading-snug">Менеджер уточнит задачу и пришлёт цену</p>
              <button onClick={() => openFos(undefined, "Расчёт расхода и цены за метр плёнки ПОФ")} className="btn-orange w-full py-3.5 mb-3">
                Оставить заявку на расчёт
              </button>
              <a href="tel:88005057831" className="btn-outline-orange w-full py-3.5 inline-flex items-center justify-center gap-2">
                <Icon name="Phone" size={18} />
                8 800 505-78-31
              </a>
              <p className="text-[12px] text-[#999] text-center mt-4 leading-snug">
                Отвечаем в рабочее время. Для расчёта пригодятся тип продукции, объём и модель упаковочного аппарата.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 8 — FAQ */}
      <section id="faq" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Частые вопросы</h2>
            <p className="text-[#666] mt-2">Коротко о подборе, наличии, доставке и условиях оплаты</p>
          </div>

          <div className="space-y-3">
            {FAQ.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border border-gray-100 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FFF5EE] transition-colors"
                  >
                    <span className="font-semibold text-[#1A1A1A] text-[16px] leading-snug">{f.q}</span>
                    <Icon name={isOpen ? "Minus" : "Plus"} size={20} className="flex-shrink-0" style={{ color: "var(--orange)" }} />
                  </button>
                  {isOpen && <div className="px-5 pb-5 text-[15px] text-[#555] leading-relaxed">{f.a}</div>}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button onClick={() => openFos(undefined, "Вопрос по плёнке ПОФ")} className="btn-outline-orange">
              <Icon name="HelpCircle" size={18} className="mr-2" />
              Задать свой вопрос
            </button>
          </div>
        </div>
      </section>

      {/* ЭКРАН 9 — ФИНАЛЬНАЯ ФОРМА */}
      <section id="contacts" className="py-16 scroll-mt-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG_HERO} alt="" aria-hidden className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ background: "rgba(26,26,26,0.88)" }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-9 text-white">
            <h2 className="text-[clamp(26px,3.8vw,40px)] font-bold mb-3 leading-tight">Оставьте заявку на плёнку ПОФ</h2>
            <p className="text-white/75 text-[16px] leading-relaxed">
              Подберём толщину и намотку, уточним наличие на складе и пришлём цену за метр под ваш объём
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                <input type="tel" value={formData.phone} placeholder="+7 (___) ___-__-__"
                  onChange={e => { setFormData({ ...formData, phone: formatPhoneRu(e.target.value) }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setFormData({ ...formData, phone: "+7 " }); }}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя</label>
                <input type="text" value={formData.name} placeholder="Ваше имя"
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: undefined }); }}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={formData.email} placeholder="your@email.com"
                  onChange={e => { setFormData({ ...formData, email: e.target.value }); if (formErrors.email) setFormErrors({ ...formErrors, email: undefined }); }}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.email ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Компания</label>
                <input type="text" value={formData.company} placeholder="Название компании"
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">Что упаковываете и в каком объёме</label>
              <textarea rows={3} value={formData.comment} placeholder="Например: лотки с полуфабрикатами, полуавтомат, около 40 000 упаковок в месяц"
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 resize-none" />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none mb-4">
              <input type="checkbox" checked={formAgree}
                onChange={e => { setFormAgree(e.target.checked); if (formErrors.agree) setFormErrors({ ...formErrors, agree: undefined }); }}
                className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
              <PolicyDisclaimer />
            </label>
            {formErrors.agree && <p className="text-xs text-red-500 mb-2">{formErrors.agree}</p>}

            <button onClick={submitMainForm} disabled={formSubmitting} className="btn-orange w-full text-base py-4 disabled:opacity-60">
              {formSubmitting ? "Отправляем..." : "Отправить заявку"}
            </button>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 pt-5 border-t border-gray-100">
              <a href="tel:88005057831" className="text-[15px] font-semibold text-[#1A1A1A] hover:text-orange-600 transition-colors inline-flex items-center gap-2">
                <Icon name="Phone" size={16} style={{ color: "var(--orange)" }} />
                8 800 505-78-31
              </a>
              <a href="mailto:pack@t-sib.ru" className="text-[15px] font-semibold text-[#1A1A1A] hover:text-orange-600 transition-colors inline-flex items-center gap-2">
                <Icon name="Mail" size={16} style={{ color: "var(--orange)" }} />
                pack@t-sib.ru
              </a>
            </div>
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
                Поставка упаковочного оборудования и расходных материалов для пищевой и непищевой промышленности
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Оборудование</p>
              <ul className="space-y-2">
                <li><a href="/termousadka" className="text-sm text-white/65 hover:text-white transition-colors">Термоусадочное оборудование</a></li>
                <li><a href="/pallet" className="text-sm text-white/65 hover:text-white transition-colors">Паллетоупаковщики</a></li>
                <li><a href="/traysealers" className="text-sm text-white/65 hover:text-white transition-colors">Запайщики лотков</a></li>
                <li><a href="/vacuum" className="text-sm text-white/65 hover:text-white transition-colors">Вакуумные упаковщики</a></li>
                <li><a href="/gorizontalnoe" className="text-sm text-white/65 hover:text-white transition-colors">Горизонтальные машины flow-pack</a></li>
                <li><a href="/obanderolivanie" className="text-sm text-white/65 hover:text-white transition-colors">Машины для обандероливания и картонной обечайки</a></li>
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

          <div className="border-t border-white/10 pt-6 text-center space-y-3">
            <LegalInfo className="max-w-3xl mx-auto" />
            <p className="text-xs text-white/35">© {new Date().getFullYear()} Техно-Сиб. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* FOS MODAL */}
      {fosOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setFosOpen(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 md:p-8 relative my-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFosOpen(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10" aria-label="Закрыть">
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>

            <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-1.5 pr-10 leading-tight">
              {fosOpen.title || "Получить коммерческое предложение"}
            </h3>
            <p className="text-[15px] text-[#8A8F98] mb-5 leading-snug">
              Заполните форму и мы отправим КП на указанный номер
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-semibold text-[#1A1A1A] mb-1.5 block">Телефон <span style={{ color: "var(--orange)" }}>*</span></label>
                <input type="tel" autoFocus placeholder="+7 (___) ___-__-__" value={fosData.phone}
                  onChange={e => { setFosData({ ...fosData, phone: formatPhoneRu(e.target.value) }); if (fosErrors.phone) setFosErrors({ ...fosErrors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setFosData({ ...fosData, phone: "+7 " }); }}
                  className="w-full px-4 py-3 rounded-lg border-2 bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.phone ? "#E53935" : "#1A1A1A" }} />
                {fosErrors.phone && <p className="text-[13px] text-red-500 mt-1">{fosErrors.phone}</p>}
              </div>

              <div>
                <label className="text-[14px] font-semibold text-[#1A1A1A] mb-1.5 block">Имя</label>
                <input type="text" placeholder="Ваше имя" value={fosData.name}
                  onChange={e => { setFosData({ ...fosData, name: e.target.value }); if (fosErrors.name) setFosErrors({ ...fosErrors, name: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.name ? "#E53935" : "#E0E0E0" }} />
                {fosErrors.name && <p className="text-[13px] text-red-500 mt-1">{fosErrors.name}</p>}
              </div>

              <div>
                <label className="text-[14px] font-semibold text-[#1A1A1A] mb-1.5 block">Email</label>
                <input type="email" placeholder="your@email.com" value={fosData.email}
                  onChange={e => { setFosData({ ...fosData, email: e.target.value }); if (fosErrors.email) setFosErrors({ ...fosErrors, email: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.email ? "#E53935" : "#E0E0E0" }} />
                {fosErrors.email && <p className="text-[13px] text-red-500 mt-1">{fosErrors.email}</p>}
              </div>

              {fosOpen.productName && (
                <p className="text-[14px] text-[#666] leading-snug break-words">
                  Позиция: <span className="font-semibold" style={{ color: "var(--orange)" }}>{fosOpen.productName}</span>
                </p>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={fosAgree}
                  onChange={e => { setFosAgree(e.target.checked); if (fosErrors.agree) setFosErrors({ ...fosErrors, agree: undefined }); }}
                  className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                <PolicyDisclaimer />
              </label>
              {fosErrors.agree && <p className="text-[13px] text-red-500 -mt-2">{fosErrors.agree}</p>}

              <button onClick={submitFos} disabled={fosSubmitting} className="btn-orange w-full text-base py-3.5 disabled:opacity-60">
                {fosSubmitting ? "Отправляем..." : "Отправить заявку"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THANKS MODAL */}
      {thanksOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setThanksOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center relative" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
              <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
            </div>
            <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-3 leading-tight">Спасибо за обращение в нашу компанию</h3>
            <p className="text-[#555] leading-relaxed mb-6">Менеджер свяжется с Вами в ближайшее время в часы работы.</p>
            <button onClick={() => setThanksOpen(false)} className="btn-orange px-10 py-3">Хорошо</button>
          </div>
        </div>
      )}
    </div>
  );
}
