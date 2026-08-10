import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { createLeadSender } from "@/lib/lead";
import EquipmentMenu from "@/components/EquipmentMenu";
import { captureUtm } from "@/lib/utm";
import ProductGallery from "@/components/ProductGallery";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import LegalInfo from "@/components/LegalInfo";
import VideoCard from "@/components/VideoCard";
import ShrinkCatalog from "@/components/ShrinkCatalog";
import ShrinkQuiz, { ShrinkQuizPayload } from "@/components/ShrinkQuiz";
import QuizSideTab from "@/components/QuizSideTab";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";
import { useSeo } from "@/lib/seo";
import { getPageMeta } from "@/lib/pageMeta";
import {
  CatalogProduct,
  visibleParams,
  getVideoUrl,
  stripHtml,
  formatPrice,
} from "@/lib/shrinkCatalog";
import {
  ADVANTAGES,
  APPLICATIONS,
  INDUSTRY_BADGES,
  SIGNS,
  SERVICES,
  FAQ_GROUPS,
} from "@/data/termousadkaContent";

const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/fb8efd8b-405d-46d4-8511-ad9d9dedf599.png";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MAIN_CATEGORIES = [
  { id: "343", name: "Для штучной упаковки" },
  { id: "341", name: "Для групповой упаковки" },
  { id: "342", name: "Для длинномерной продукции" },
  { id: "344", name: "Sleeve-этикетки" },
  { id: "340", name: "Термоусадочные тоннели" },
  { id: "295", name: "Термоусадочные танки" },
  { id: "345", name: "Термоформеры" },
];

const CONSUMABLE_CATEGORIES = [
  { id: "354", name: "Плёнка ПВХ" },
  { id: "357", name: "Плёнка ПОФ" },
];

const ACCESSORY_CATEGORIES = [
  { id: "353", name: "Лотки" },
  { id: "355", name: "Плёнка ПВД" },
];

const HERO_BULLETS = [
  "Оборудование под любые размеры и формы от европейских, азиатских и российских производителей",
  "Для штучной и групповой упаковки. Термоусадочные танки и термоформеры",
  "Ровный шов без налипания плёнки",
];

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Каталог", href: "#catalog" },
  { label: "Применение", href: "#application" },
  { label: "Когда покупать", href: "#signs" },
  { label: "Сервис", href: "#service" },
  { label: "Контакты", href: "#contacts" },
];

const sendLead = createLeadSender("Термоусадочное оборудование");

export default function Termousadka() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [faqGroup, setFaqGroup] = useState(0);

  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [formAgree, setFormAgree] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [fosOpen, setFosOpen] = useState<{ productName?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);

  const [thanksOpen, setThanksOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);

  useSeo(getPageMeta("/termousadka"));

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

  const openFos = useCallback((productName?: string) => {
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosAgree(false);
    setFosSubmitting(false);
    setFosOpen({ productName });
  }, []);

  const submitFos = useCallback(async () => {
    const errs: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (fosData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!isValidPhoneRu(fosData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (fosData.email.trim() && !EMAIL_RE.test(fosData.email.trim())) errs.email = "Укажите корректный e-mail";
    if (!fosAgree) errs.agree = "Необходимо согласие";
    setFosErrors(errs);
    if (Object.keys(errs).length > 0 || fosSubmitting) return;
    setFosSubmitting(true);
    await sendLead({
      source: "fos",
      product: fosOpen?.productName || "",
      name: fosData.name.trim(),
      phone: fosData.phone.trim(),
      email: fosData.email.trim(),
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  }, [fosData, fosAgree, fosOpen, fosSubmitting]);

  const submitMainForm = async () => {
    const errs: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = "Введите имя";
    if (!isValidPhoneRu(formData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (!formData.email.trim() || !EMAIL_RE.test(formData.email.trim())) errs.email = "Укажите корректный e-mail";
    if (!formAgree) errs.agree = "Необходимо согласие";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0 || formSubmitting) return;
    setFormSubmitting(true);
    await sendLead({
      source: "main_form",
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
    });
    setFormSubmitting(false);
    setFormData({ name: "", phone: "", email: "" });
    setFormAgree(false);
    setThanksOpen(true);
  };

  const submitQuiz = useCallback(async (data: ShrinkQuizPayload): Promise<boolean> => {
    const ok = await sendLead({
      source: "quiz",
      name: data.name,
      phone: data.phone,
      email: data.email,
      quiz: data.answers,
    });
    if (ok) ymGoal("quiz_sent");
    return ok;
  }, []);

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
                  <EquipmentMenu variant="desktop" currentHref="/termousadka" />
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
              Оставить заявку
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
              <EquipmentMenu variant="mobile" currentHref="/termousadka" />
            </div>
            {NAV.slice(1).map(l => (
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
      <section id="hero" className="pt-16 bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center py-12 lg:py-16">
          <div className="lg:col-span-6 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.15] mb-7 text-[#1A1A1A]">
              Термоусадочное оборудование <span style={{ color: "var(--orange)" }}>до 3 600 упаковок в час</span>
            </h1>

            <ul className="space-y-4 mb-9 max-w-xl">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[17px] text-[#333] leading-snug">
                  <Icon name="Check" size={20} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => openFos()} className="btn-orange text-base px-7 py-3.5 inline-flex items-center gap-2">
                  <Icon name="Phone" size={18} />
                  Получить КП
                </button>
                <button onClick={() => scrollTo("#quiz")} className="btn-outline-orange text-base px-7 py-3.5 inline-flex items-center gap-2">
                  <Icon name="ClipboardList" size={18} />
                  Подобрать оборудование
                </button>
              </div>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-7 py-3.5 inline-flex items-center gap-2">
                <Icon name="ArrowDown" size={18} />
                Смотреть каталог
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 fade-up">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-7">
              <img
                src={IMG_HERO}
                alt="Термоусадочное оборудование и продукция в термоусадочной плёнке"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Преимущества термоусадочного оборудования от Техно-Сиб</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="card-hover rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={a.icon} fallback="Star" size={28} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-2 leading-snug">{a.title}</h3>
                <p className="text-[14px] text-[#555] leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Каталог термоусадочного оборудования</h2>
            <p className="text-[#666] mt-2 max-w-xl mx-auto">Подберите машину под ваш продукт и объём производства</p>
          </div>
          <ShrinkCatalog
            categories={MAIN_CATEGORIES}
            fallbackImg={IMG_HERO}
            withSearch
            onDetails={setDetailsProduct}
            onInquiry={openFos}
            onVideo={setVideoModal}
            onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
          />
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Посмотрите как работает наше оборудование</h2>
            <p className="text-[#666] mt-2">Видео с реальной работой термоусадочного оборудования на производстве</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VideoCard embedId="cea7e294490190af4e9d0dd10a018f75" title="Термоусадочная упаковка" />
            <VideoCard embedId="3aa838c3f9ac0f034175ba042f4d88c6" title="Термоусадочный тоннель" />
          </div>
        </div>
      </section>

      {/* APPLICATION */}
      <section id="application" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Применение термоусадочной упаковки</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {APPLICATIONS.map((a, i) => (
              <div key={i} className="card-hover rounded-2xl bg-white border border-gray-100 p-6">
                <div className="text-4xl mb-4">{a.emoji}</div>
                <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-3 leading-snug">{a.title}</h3>
                <ul className="space-y-2">
                  {a.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2 text-[14px] text-[#555] leading-snug">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--orange)" }} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 mt-10">
            {INDUSTRY_BADGES.map(b => (
              <span key={b} className="px-4 py-2 rounded-full text-[14px] font-semibold bg-white border border-gray-200 text-[#444]">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* SIGNS */}
      <section id="signs" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">7 признаков, что вам нужен новый термоусадочный аппарат</h2>
            <p className="text-[#666] mt-2">Узнали хотя бы 2 пункта? Пора действовать.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {SIGNS.map((s, i) => (
              <div key={i} className="card-hover rounded-2xl bg-white border border-gray-100 p-6 relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[14px]" style={{ background: "var(--orange)" }}>{i + 1}</span>
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[16px] mb-3 leading-snug">{s.title}</h3>
                <ul className="space-y-2">
                  {s.items.map((it, j) => {
                    const isSolution = it.startsWith("Решение:");
                    return (
                      <li key={j} className={`flex items-start gap-2 text-[13.5px] leading-snug ${isSolution ? "font-semibold" : "text-[#555]"}`} style={isSolution ? { color: "var(--orange)" } : undefined}>
                        <Icon name={isSolution ? "ArrowRight" : "Minus"} size={14} className="mt-1 flex-shrink-0" style={{ color: isSolution ? "var(--orange)" : "#bbb" }} />
                        <span>{it}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl p-8 sm:p-10 text-center text-white" style={{ background: "linear-gradient(135deg, #FF6600, #FF9040)" }}>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Узнали свою ситуацию?</h3>
            <p className="text-white/90 text-[16px] mb-6 max-w-2xl mx-auto leading-relaxed">
              Оставьте заявку — подберём оптимальный аппарат под ваши задачи и бюджет за 1 рабочий день.
            </p>
            <button onClick={() => openFos()} className="bg-white text-[#1A1A1A] font-semibold px-8 py-3.5 rounded-lg hover:opacity-90 transition-opacity">
              Получить персональный подбор
            </button>
          </div>
        </div>
      </section>

      {/* CONSUMABLES */}
      <section id="consumables" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Расходные материалы</h2>
          </div>
          <ShrinkCatalog
            categories={CONSUMABLE_CATEGORIES}
            fallbackImg={IMG_HERO}
            onDetails={setDetailsProduct}
            onInquiry={openFos}
            onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
          />
        </div>
      </section>

      {/* ACCESSORIES */}
      <section id="accessories" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Сопутствующие товары</h2>
          </div>
          <ShrinkCatalog
            categories={ACCESSORY_CATEGORIES}
            fallbackImg={IMG_HERO}
            onDetails={setDetailsProduct}
            onInquiry={openFos}
            onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
          />
        </div>
      </section>

      {/* SERVICE */}
      <section id="service" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Сервис и доставка</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 card-hover p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={s.icon} fallback="Truck" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-2">{s.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUIZ */}
      <section id="quiz" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Подберём оборудование</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">Ответьте на 6 вопросов, и мы предложим оптимальное решение под ваши задачи</p>
          </div>
          <ShrinkQuiz variant="inline" onSubmit={submitQuiz} />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-3">
            <h2 className="section-title">О компании ТЕХНО-СИБ</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-3" style={{ background: "var(--orange)" }} />
          </div>
          <p className="text-center text-[#888] mb-10">Ваш надёжный партнёр с 2001 года</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[
              { icon: "Calendar", title: "25 лет на рынке", desc: "Опыт работы с 2001 года" },
              { icon: "MapPin", title: "2 города", desc: "Офисы в Москве и Новосибирске" },
              { icon: "Globe", title: "Проверенные партнёры", desc: "Из Европы, России и Китая" },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 text-center card-hover">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                  <Icon name={c.icon} fallback="Circle" size={26} style={{ color: "var(--orange)" }} />
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
              эффективно оснащать производства и склады, предоставляем сервисное обслуживание, а также реализуем
              упаковочные и расходные материалы.
            </p>
            <div className="rounded-lg px-4 py-3 mb-5" style={{ background: "rgba(255,102,0,0.07)", borderLeft: "3px solid var(--orange)" }}>
              <p className="text-[15px] font-medium text-[#333]">
                Мы сотрудничаем с ведущими заводами-производителями Европы, России и Китая, подбирая решения
                под задачи и бюджет клиента.
              </p>
            </div>
            <p className="text-[15px] text-[#555] leading-relaxed mb-6">
              Собственные офисы продаж, склады, сервисная служба и отлаженная логистика в Москве и Новосибирске
              позволяют нам оперативно выполнять поставки и поддерживать оборудование на территории России и стран СНГ.
            </p>
            <div className="border-t border-gray-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { title: "Комплексные решения", desc: "От подбора оборудования до сервисного обслуживания" },
                { title: "Быстрая доставка", desc: "Собственная логистика по всей России и СНГ" },
                { title: "Сервисная поддержка", desc: "Запчасти, ремонт и обслуживание на всём сроке службы" },
                { title: "Экспертная консультация", desc: "Инженеры подберут решение под ваш продукт" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon name="CheckCircle" size={20} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <div>
                    <p className="font-semibold text-[#1A1A1A] text-[15px]">{f.title}</p>
                    <p className="text-[13px] text-[#888] leading-snug">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="section-title">Часто задаваемые вопросы</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {FAQ_GROUPS.map((g, i) => {
              const isActive = i === faqGroup;
              return (
                <button
                  key={g.title}
                  onClick={() => { setFaqGroup(i); setOpenFaq(null); }}
                  className="px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-all border"
                  style={{
                    background: isActive ? "var(--orange)" : "#fff",
                    color: isActive ? "#fff" : "#444",
                    borderColor: isActive ? "var(--orange)" : "#e5e5e5",
                  }}
                >
                  {g.title}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {FAQ_GROUPS[faqGroup].items.map((f, i) => {
              const key = `${faqGroup}-${i}`;
              const isOpen = openFaq === key;
              return (
                <div key={key} className="border border-gray-100 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FFF5EE] transition-colors"
                  >
                    <span className="font-semibold text-[#1A1A1A] text-[16px] leading-snug">{f.q}</span>
                    <Icon name={isOpen ? "Minus" : "Plus"} size={20} className="flex-shrink-0" style={{ color: "var(--orange)" }} />
                  </button>
                  {isOpen && <div className="px-5 pb-5 text-[15px] text-[#555] leading-relaxed whitespace-pre-line">{f.a}</div>}
                </div>
              );
            })}
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
      <section id="contacts" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Получите коммерческое предложение</h2>
            <p className="text-[#666]">Заполните форму — менеджер свяжется в течение 15 минут</p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 text-[#1A1A1A] border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                  placeholder="Ваше имя"
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
                  placeholder="+7 (999) 999-99-99"
                />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${formErrors.email ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                placeholder="your@email.com"
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
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
                <li><a href="/vacuum" className="text-sm text-white/65 hover:text-white transition-colors">Вакуумные упаковщики</a></li>
                <li><a href="/gorizontalnoe" className="text-sm text-white/65 hover:text-white transition-colors">Горизонтальные машины flow-pack</a></li>
                <li><a href="/obanderolivanie" className="text-sm text-white/65 hover:text-white transition-colors">Обандероливающие машины</a></li>
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
      <ShrinkQuiz variant="modal" open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} />

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

            <h3 className="font-bold text-2xl text-[#1A1A1A] mb-2 pr-10">Оставить заявку</h3>
            <p className="text-[15px] text-[#666] mb-5 leading-relaxed break-words">
              {fosOpen.productName
                ? <>По товару: <span className="font-semibold text-[#1A1A1A]">{fosOpen.productName}</span></>
                : "Менеджер свяжется в течение 15 минут."}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Имя <span style={{ color: "var(--orange)" }}>*</span></label>
                <input type="text" placeholder="Иван Петров" value={fosData.name}
                  onChange={e => { setFosData({ ...fosData, name: e.target.value }); if (fosErrors.name) setFosErrors({ ...fosErrors, name: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.name ? "#E53935" : "#E0E0E0" }} />
                {fosErrors.name && <p className="text-[13px] text-red-500 mt-1">{fosErrors.name}</p>}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Телефон <span style={{ color: "var(--orange)" }}>*</span></label>
                <input type="tel" placeholder="+7 (___) ___-__-__" value={fosData.phone}
                  onChange={e => { setFosData({ ...fosData, phone: formatPhoneRu(e.target.value) }); if (fosErrors.phone) setFosErrors({ ...fosErrors, phone: undefined }); }}
                  onFocus={e => { if (!e.target.value) setFosData({ ...fosData, phone: "+7 " }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.phone ? "#E53935" : "#E0E0E0" }} />
                {fosErrors.phone && <p className="text-[13px] text-red-500 mt-1">{fosErrors.phone}</p>}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Email</label>
                <input type="email" placeholder="your@email.com" value={fosData.email}
                  onChange={e => { setFosData({ ...fosData, email: e.target.value }); if (fosErrors.email) setFosErrors({ ...fosErrors, email: undefined }); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: fosErrors.email ? "#E53935" : "#E0E0E0" }} />
                {fosErrors.email && <p className="text-[13px] text-red-500 mt-1">{fosErrors.email}</p>}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={fosAgree}
                  onChange={e => { setFosAgree(e.target.checked); if (fosErrors.agree) setFosErrors({ ...fosErrors, agree: undefined }); }}
                  className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                <PolicyDisclaimer />
              </label>
              {fosErrors.agree && <p className="text-[13px] text-red-500 -mt-2">{fosErrors.agree}</p>}

              <button onClick={submitFos} disabled={fosSubmitting} className="btn-orange w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {fosSubmitting ? "Отправляем…" : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THANKS MODAL */}
      {thanksOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setThanksOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-7 md:p-9 relative text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setThanksOpen(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" aria-label="Закрыть">
              <Icon name="X" size={18} className="text-[#1A1A1A]" />
            </button>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
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