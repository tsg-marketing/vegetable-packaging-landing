import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import useProductHash from "@/hooks/useProductHash";
import { createLeadSender } from "@/lib/lead";
import EquipmentMenu from "@/components/EquipmentMenu";
import { captureUtm } from "@/lib/utm";
import ProductGallery from "@/components/ProductGallery";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import LegalInfo from "@/components/LegalInfo";
import PalletCatalog from "@/components/PalletCatalog";
import PalletVideos from "@/components/PalletVideos";
import PalletQuiz, { PalletQuizPayload } from "@/components/PalletQuiz";
import FilmCalculator, { CalcInputs, CalcRow } from "@/components/FilmCalculator";
import QuizSideTab from "@/components/QuizSideTab";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";
import { useSeo } from "@/lib/seo";
import { getPageMeta } from "@/lib/pageMeta";
import { stripHtml, formatPrice } from "@/lib/shrinkCatalog";
import { PalletProduct } from "@/lib/palletCatalog";
import {
  ADVANTAGES,
  AUDIENCE,
  USE_CASES,
  SERVICES,
  SHOWROOMS,
  DELIVERY_POINTS,
  ABOUT_STATS,
  ABOUT_BLOCKS,
  FAQ,
  OBJECTIONS,
  HERO_BULLETS,
  PROMO,
} from "@/data/palletContent";

const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "/img/pallet-hero.png";
const IMG_LOGO = "/img/technosib-logo.png";
const IMG_FALLBACK = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/54937e2d-7e2e-40fc-bf2c-3abc5b06839c.jpg";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Каталог", href: "#catalog" },
  { label: "Видеообзоры", href: "#video" },
  { label: "Калькулятор", href: "#film-calc" },
  { label: "Сервис", href: "#service" },
  { label: "FAQ", href: "#faq" },
  { label: "Контакты", href: "#contacts" },
];

const sendLead = createLeadSender("Паллетоупаковщики (паллетообмотчики)");

const numFmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

export default function Pallet() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", company: "", comment: "" });
  const [formAgree, setFormAgree] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [fosOpen, setFosOpen] = useState<{ productName?: string; title?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);

  const [promoData, setPromoData] = useState({ name: "", phone: "" });
  const [promoAgree, setPromoAgree] = useState(false);
  const [promoErrors, setPromoErrors] = useState<{ name?: string; phone?: string; agree?: string }>({});
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoDone, setPromoDone] = useState(false);

  const [thanksOpen, setThanksOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [role, setRole] = useState(OBJECTIONS[0].key);
  const [detailsProduct, setDetailsProduct] = useState<PalletProduct | null>(null);
  const [hashProducts, setHashProducts] = useState<PalletProduct[]>([]);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);
  const [calcSummary, setCalcSummary] = useState<{ inputs: CalcInputs; rows: CalcRow[] } | null>(null);

  const collectProducts = useCallback((list: PalletProduct[]) => {
    setHashProducts(prev => (prev.length ? prev : list));
  }, []);

  useProductHash(hashProducts, detailsProduct, setDetailsProduct);
  useSeo(getPageMeta("/pallet"));

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const anyOpen = detailsProduct || videoModal || lightbox || fosOpen || thanksOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailsProduct, videoModal, lightbox, fosOpen, thanksOpen]);

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

  const inquiryFromCatalog = useCallback((productName: string) => {
    openFos(productName || undefined, "Получить коммерческое предложение");
  }, [openFos]);

  const calcExtra = calcSummary
    ? {
        "Толщина плёнки, мкм": String(calcSummary.inputs.thickness),
        "Размер паллеты, мм": `${calcSummary.inputs.length} × ${calcSummary.inputs.width}`,
        "Оборотов плёнки": String(calcSummary.inputs.turns),
        "Паллет в сутки": String(calcSummary.inputs.perDay),
        "Рабочих дней в году": String(calcSummary.inputs.daysPerYear),
        "Цена плёнки, руб/кг": String(calcSummary.inputs.pricePerKg),
        "Затраты в год — ручная обмотка": `${numFmt(calcSummary.rows[0].costPerYear)} ₽`,
        "Затраты в год — с предрастяжением": `${numFmt(calcSummary.rows[2].costPerYear)} ₽`,
        "Годовая экономия": `${numFmt(calcSummary.rows[0].costPerYear - calcSummary.rows[2].costPerYear)} ₽`,
      }
    : undefined;

  const submitFos = useCallback(async () => {
    const errs: { name?: string; phone?: string; email?: string; agree?: string } = {};
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
      extra: calcExtra,
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setCalcSummary(null);
    setThanksOpen(true);
  }, [fosData, fosAgree, fosOpen, fosSubmitting, calcExtra]);

  const submitMainForm = async () => {
    const errs: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = "Введите имя";
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
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
    });
    setFormSubmitting(false);
    setFormData({ name: "", phone: "", email: "", company: "", comment: "" });
    setFormAgree(false);
    setThanksOpen(true);
  };

  const submitPromo = async () => {
    const errs: { name?: string; phone?: string; agree?: string } = {};
    if (!promoData.name.trim() || promoData.name.trim().length < 2) errs.name = "Введите имя";
    if (!isValidPhoneRu(promoData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (!promoAgree) errs.agree = "Необходимо согласие";
    setPromoErrors(errs);
    if (Object.keys(errs).length > 0 || promoSubmitting) return;
    setPromoSubmitting(true);
    await sendLead({
      source: "promo",
      comment: "Заявка из блока Акция",
      name: promoData.name.trim(),
      phone: promoData.phone.trim(),
    });
    setPromoSubmitting(false);
    setPromoData({ name: "", phone: "" });
    setPromoAgree(false);
    setPromoDone(true);
  };

  const submitQuiz = useCallback(async (data: PalletQuizPayload): Promise<boolean> => {
    const ok = await sendLead({
      source: "quiz",
      name: data.name,
      phone: data.phone,
      email: data.email,
      quiz: data.answers,
      extra: { "Рекомендованная модель": data.recommendation },
    });
    if (ok) ymGoal("quiz_pallet_sent");
    return ok;
  }, []);

  const requestCalcKp = useCallback((summary: { inputs: CalcInputs; rows: CalcRow[] }) => {
    setCalcSummary(summary);
    openFos(undefined, "Запрос КП по расчёту экономии плёнки");
  }, [openFos]);

  const activeRole = OBJECTIONS.find(o => o.key === role) || OBJECTIONS[0];

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
                  <EquipmentMenu variant="desktop" currentHref="/pallet" showGroups={false} />
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
            <button onClick={() => openFos()} className="btn-orange text-sm py-2 px-5 whitespace-nowrap">
              Заказать звонок
            </button>
          </div>

          <button className="lg:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
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
              <EquipmentMenu variant="mobile" currentHref="/pallet" showGroups={false} />
            </div>
            {NAV.slice(1).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <a href="tel:88005057831" className="text-base font-bold text-[#1A1A1A] py-2">8 800 505-78-31</a>
            <button onClick={() => { setMobileOpen(false); openFos(); }} className="btn-orange w-full mt-1">Заказать звонок</button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="pt-16 bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center py-12 lg:py-16">
          <div className="lg:col-span-6 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(30px,3.5vw,48px)] font-bold leading-[1.12] mb-3 text-[#1A1A1A] whitespace-nowrap">
              Паллетообмотчики <span className="text-[#555] font-bold">от</span>
            </h1>
            <img
              src={IMG_LOGO}
              alt="ТЕХНОСИБ"
              width={1579}
              height={160}
              className="h-[clamp(30px,3.3vw,46px)] w-auto mb-5"
            />
            <p className="text-[clamp(18px,1.7vw,24px)] font-semibold text-[#374151] mb-8">
              Надежное оборудование по доступной цене
            </p>

            <ul className="space-y-3.5 mb-9 max-w-xl">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[clamp(17px,1.4vw,21px)] text-[#333] leading-snug">
                  <Icon name="Check" size={22} className="mt-1 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => openFos()} className="btn-orange text-[17px] px-8 py-4 inline-flex items-center gap-2">
                <Icon name="Phone" size={18} />
                Получить предложение
              </button>
              <button onClick={() => scrollTo("#film-calc")} className="btn-teal text-[17px] px-8 py-4 inline-flex items-center gap-2">
                <Icon name="BarChart3" size={18} />
                Рассчитать экономию стреч-пленки
              </button>
              <button onClick={() => scrollTo("#promo")} className="btn-peach text-[17px] px-8 py-4 inline-flex items-center gap-2 animate-pulse">
                <Icon name="Gift" size={18} />
                Акция
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-neutral text-[17px] px-8 py-4 inline-flex items-center gap-2">
                Посмотреть модели
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Паллетоупаковщик ТЕХНОСИБ"
              width={680}
              height={800}
              className="w-full max-w-[460px] h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Преимущества наших паллетоупаковщиков</h2>
            <p className="text-[#666] mt-2">Что вы получаете вместе с машинной обмоткой паллет</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 card-hover p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={a.icon} fallback="Check" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-2">{a.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Каталог паллетоупаковщиков</h2>
            <p className="text-[#666] mt-2">Актуальные модели и цены обновляются автоматически три раза в сутки</p>
          </div>
          <PalletCatalog
            fallbackImg={IMG_FALLBACK}
            onDetails={setDetailsProduct}
            onLoaded={collectProducts}
            onInquiry={inquiryFromCatalog}
            onVideo={setVideoModal}
            onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
          />
        </div>
      </section>

      {/* VIDEO REVIEWS */}
      <section id="video" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Видеообзоры оборудования</h2>
            <p className="text-[#666] mt-2">Посмотрите, как машины работают вживую — перед тем как выбрать</p>
          </div>
          <PalletVideos
            fallbackImg={IMG_FALLBACK}
            onVideo={setVideoModal}
            onDetails={setDetailsProduct}
            onInquiry={inquiryFromCatalog}
          />
        </div>
      </section>

      {/* FILM CALCULATOR */}
      <section id="film-calc" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Калькулятор расхода стрейч-плёнки</h2>
            <p className="text-[#666] mt-2">Сравните ручную обмотку с машинной и увидите годовую экономию</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <FilmCalculator onRequestKp={requestCalcKp} />
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Для кого предназначены</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AUDIENCE.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 card-hover p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={a.icon} fallback="Users" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-2">{a.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section id="promo" className="py-14 sm:py-16 scroll-mt-16" style={{ background: "linear-gradient(135deg, #FF7A00 0%, #FF9500 45%, #FFC01E 100%)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-4 px-6 py-5" style={{ background: "rgba(255,255,255,0.16)" }}>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon name="Gift" size={24} className="text-white" />
              </div>
              <div className="text-white">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/85 leading-tight">{PROMO.badge}</p>
                <p className="font-bold text-[clamp(18px,2vw,24px)] leading-tight mt-0.5">{PROMO.title}</p>
              </div>
            </div>

            <div className="bg-white px-6 sm:px-8 py-7">
              {promoDone ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
                    <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
                  </div>
                  <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-2">Спасибо за обращение</h3>
                  <p className="text-[#666] text-[15px]">Менеджер свяжется с вами в ближайшее время и расскажет об условиях акции.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-[clamp(21px,2.4vw,28px)] text-[#1A1A1A] mb-5">{PROMO.title}</h3>

                  <div className="space-y-3 mb-6">
                    {PROMO.items.map((it, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border-l-[3px] px-4 py-3.5"
                        style={{ borderColor: "var(--orange)", background: "#FFF6EF" }}>
                        <Icon name={it.icon} fallback="Gift" size={20} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                        <p className="text-[15px] text-[#333] leading-snug">
                          {it.accentFirst ? (
                            <>
                              <span className="font-bold" style={{ color: "var(--orange)" }}>{it.accent}</span>
                              {it.text}
                            </>
                          ) : (
                            <>
                              {it.text}
                              <span className="font-bold" style={{ color: "var(--orange)" }}>{it.accent}</span>
                            </>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="font-bold text-[16px] text-[#1A1A1A] mb-5">{PROMO.note}</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Имя *</label>
                      <input type="text" value={promoData.name} placeholder="Ваше имя"
                        onChange={e => { setPromoData({ ...promoData, name: e.target.value }); if (promoErrors.name) setPromoErrors({ ...promoErrors, name: undefined }); }}
                        className={`w-full px-4 py-3 rounded-lg border ${promoErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                      {promoErrors.name && <p className="text-xs text-red-500 mt-1">{promoErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                      <input type="tel" value={promoData.phone} placeholder="+7 (___) ___-__-__"
                        onChange={e => { setPromoData({ ...promoData, phone: formatPhoneRu(e.target.value) }); if (promoErrors.phone) setPromoErrors({ ...promoErrors, phone: undefined }); }}
                        onFocus={e => { if (!e.target.value) setPromoData({ ...promoData, phone: "+7 " }); }}
                        className={`w-full px-4 py-3 rounded-lg border ${promoErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                      {promoErrors.phone && <p className="text-xs text-red-500 mt-1">{promoErrors.phone}</p>}
                    </div>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={promoAgree}
                        onChange={e => { setPromoAgree(e.target.checked); if (promoErrors.agree) setPromoErrors({ ...promoErrors, agree: undefined }); }}
                        className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                      <PolicyDisclaimer />
                    </label>
                    {promoErrors.agree && <p className="text-xs text-red-500">{promoErrors.agree}</p>}
                    <button onClick={submitPromo} disabled={promoSubmitting} className="btn-orange w-full py-3.5 disabled:opacity-60">
                      {promoSubmitting ? "Отправляем..." : PROMO.submitLabel}
                    </button>
                    <p className="text-[12px] italic text-[#999]">{PROMO.footnote}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Где применяются</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {USE_CASES.map((u, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-6 text-center card-hover">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={u.icon} fallback="Box" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-2">{u.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE */}
      <section id="service" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Сервис и поддержка</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {SERVICES.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 card-hover p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={s.icon} fallback="Wrench" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-2">{s.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div id="delivery" className="grid grid-cols-1 md:grid-cols-2 gap-5 scroll-mt-16">
            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#1A1A1A]">
                <Icon name="MapPin" size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-[20px] mb-4">Самовывоз со склада</h3>
              <div className="space-y-4">
                {SHOWROOMS.map(s => (
                  <div key={s.city}>
                    <p className="font-bold text-[#1A1A1A] text-[15px]">{s.city}</p>
                    <p className="text-[14px] text-[#666] mb-2">{s.address}</p>
                    <div className="flex flex-wrap gap-2.5">
                      <a href={`https://yandex.ru/maps/?text=${encodeURIComponent(`${s.city}, ${s.address}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn-outline-orange text-[13px] px-3.5 py-2 inline-flex items-center gap-2">
                        <Icon name="Map" size={15} />
                        На карте
                      </a>
                      <button onClick={() => openFos(undefined, `Запрос на просмотр в демозале — ${s.city}`)} className="btn-orange text-[13px] px-3.5 py-2 inline-flex items-center gap-2">
                        <Icon name="Calendar" size={15} />
                        Посмотреть в демозале
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-7" style={{ borderColor: "rgba(255,102,0,0.25)", background: "rgba(255,102,0,0.04)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--orange)" }}>
                <Icon name="Truck" size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-[20px] mb-3">Доставка по России</h3>
              <ul className="space-y-3">
                {DELIVERY_POINTS.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#555] leading-snug">
                    <Icon name={d.icon} fallback="Check" size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                    <span>{d.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OBJECTIONS */}
      <section id="objections" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">А что если...</h2>
            <p className="text-[#666] mt-2">Честные ответы на вопросы, которые возникают перед покупкой</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {OBJECTIONS.map(o => {
              const isActive = o.key === role;
              return (
                <button key={o.key} onClick={() => setRole(o.key)}
                  className="px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-all border inline-flex items-center gap-2"
                  style={{
                    background: isActive ? "var(--orange)" : "#fff",
                    color: isActive ? "#fff" : "#444",
                    borderColor: isActive ? "var(--orange)" : "#e5e5e5",
                  }}>
                  <Icon name={o.icon} fallback="User" size={16} />
                  {o.role}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRole.items.map((it, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-5 bg-[#FAFAFA]">
                <p className="font-bold text-[#1A1A1A] text-[15px] mb-2 flex items-start gap-2">
                  <Icon name="HelpCircle" size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  {it.q}
                </p>
                <p className="text-[14px] text-[#555] leading-relaxed">{it.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">О нас</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {ABOUT_STATS.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-[32px] font-bold leading-none mb-2" style={{ color: "var(--orange)" }}>{s.value}</p>
                <p className="text-[14px] text-[#666]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ABOUT_BLOCKS.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 card-hover p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={b.icon} fallback="Star" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-2">{b.title}</h3>
                <p className="text-[14px] text-[#666] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Часто задаваемые вопросы</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-[#FAFAFA] transition-colors">
                  <span className="font-semibold text-[#1A1A1A] text-[15px] leading-snug">{f.q}</span>
                  <Icon name="ChevronDown" size={20} className={`flex-shrink-0 mt-0.5 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} style={{ color: "var(--orange)" }} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-[14.5px] text-[#555] leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-16 scroll-mt-16" style={{ background: "#0B3C6E" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-9 text-white">
            <h2 className="text-[clamp(24px,3vw,34px)] font-bold mb-3">Получить коммерческое предложение</h2>
            <p className="text-white/75">Подберём модель под ваш груз и объём, пришлём цену и характеристики</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <a href="tel:88005057831" className="bg-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/15 transition-colors">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--orange)" }}>
                <Icon name="Phone" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[13px]">Позвоните нам</p>
                <p className="text-white font-bold text-[17px]">8 800 505-78-31</p>
              </div>
            </a>
            <a href="mailto:pack@t-sib.ru" className="bg-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/15 transition-colors">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--orange)" }}>
                <Icon name="Mail" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[13px]">Напишите нам</p>
                <p className="text-white font-bold text-[17px]">pack@t-sib.ru</p>
              </div>
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя *</label>
                <input type="text" value={formData.name} placeholder="Ваше имя"
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: undefined }); }}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                <input type="tel" value={formData.phone} placeholder="+7 (999) 999-99-99"
                  onChange={e => { setFormData({ ...formData, phone: formatPhoneRu(e.target.value) }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setFormData({ ...formData, phone: "+7 " }); }}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`} />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
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
              <label className="block text-sm font-medium mb-1.5">Комментарий</label>
              <textarea value={formData.comment} rows={3}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Размер и вес паллеты, объём в сутки, нужные опции..." />
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
                <li><a href="/pallet" className="text-sm text-white/65 hover:text-white transition-colors">Паллетоупаковщики</a></li>
                <li><a href="/traysealers" className="text-sm text-white/65 hover:text-white transition-colors">Запайщики лотков</a></li>
                <li><a href="/vacuum" className="text-sm text-white/65 hover:text-white transition-colors">Вакуумные упаковщики</a></li>
                <li><a href="/termousadka" className="text-sm text-white/65 hover:text-white transition-colors">Термоусадочное оборудование</a></li>
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

      <QuizSideTab onClick={() => setQuizOpen(true)} />
      <PalletQuiz variant="modal" open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} />

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
                  fallback={IMG_FALLBACK}
                  className="bg-[#F7F7F7] rounded-xl aspect-square flex items-center justify-center overflow-hidden"
                  imgClassName="w-full h-full object-contain p-4"
                />
                <div>
                  <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                    <p className="text-xs uppercase tracking-wider text-[#666] mb-1">Цена</p>
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--orange)" }}>{formatPrice(detailsProduct.price)}</p>
                  </div>
                  <p className="text-sm text-[#666] mb-2"><span className="text-[#999]">Бренд: </span><span className="text-[#1A1A1A] font-semibold">{detailsProduct.brand}</span></p>
                  {detailsProduct.video && (
                    <button onClick={() => setVideoModal(detailsProduct.video)}
                      className="mt-2 w-full text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-all border border-gray-200 hover:border-orange-300 text-[#1A1A1A] inline-flex items-center justify-center gap-2">
                      <Icon name="Play" size={16} style={{ color: "var(--orange)" }} />
                      Посмотреть видео
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

              {detailsProduct.params.length > 0 && (
                <div>
                  <h4 className="font-bold text-[13px] uppercase tracking-wider mb-3" style={{ color: "var(--orange)" }}>Характеристики</h4>
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
                    {detailsProduct.params.map((pr, i) => (
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
              <button onClick={() => { const name = detailsProduct.name; setDetailsProduct(null); openFos(name); }}
                className="btn-orange w-full text-base py-3.5 inline-flex items-center justify-center gap-2">
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
                if (ytMatch) return <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`} title="Видео" allow="autoplay; encrypted-media" allowFullScreen />;
                if (rtMatch) return <iframe className="absolute inset-0 w-full h-full" src={`https://rutube.ru/play/embed/${rtMatch[1]}`} title="Видео" allow="autoplay" allowFullScreen />;
                if (/rutube\.ru\/play\/embed/i.test(videoModal)) return <iframe className="absolute inset-0 w-full h-full" src={videoModal} title="Видео" allow="autoplay" allowFullScreen />;
                return (
                  <video src={videoModal} controls autoPlay playsInline className="absolute inset-0 w-full h-full">
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
        <div className="fixed inset-0 z-[115] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Закрыть">
            <Icon name="X" size={22} />
          </button>
          <div className="absolute top-5 left-5 text-white/80 text-sm font-medium">{lightbox.idx + 1} / {lightbox.pictures.length}</div>
          {lightbox.pictures.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: (lb.idx - 1 + lb.pictures.length) % lb.pictures.length } : lb); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Предыдущее">
                <Icon name="ChevronLeft" size={26} />
              </button>
              <button onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: (lb.idx + 1) % lb.pictures.length } : lb); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label="Следующее">
                <Icon name="ChevronRight" size={26} />
              </button>
            </>
          )}
          <img src={lightbox.pictures[lightbox.idx]} alt="" onClick={e => e.stopPropagation()} className="max-w-[92vw] max-h-[88vh] object-contain" />
        </div>
      )}

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
                  Модель: <span className="font-semibold" style={{ color: "var(--orange)" }}>{fosOpen.productName}</span>
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