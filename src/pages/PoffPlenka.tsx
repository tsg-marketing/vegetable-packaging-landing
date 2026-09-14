import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { createLeadSender } from "@/lib/lead";
import EquipmentMenu from "@/components/EquipmentMenu";
import { captureUtm } from "@/lib/utm";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import LegalInfo from "@/components/LegalInfo";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import ShrinkCatalog from "@/components/ShrinkCatalog";
import ProductGallery from "@/components/ProductGallery";
import useProductHash from "@/hooks/useProductHash";
import {
  CatalogProduct,
  visibleParams,
  getVideoUrl,
  stripHtml,
  formatPrice,
} from "@/lib/shrinkCatalog";
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
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/ea77bc7e-f6ce-4b89-a17a-1eaa0bbd19fa.png";
const IMG_FALLBACK = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/345dddaf-6da2-4b63-a8da-f379591e7ba5.jpg";
const IMG_LINE = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/aee03e0b-761e-465d-824f-c0e4b733cc0f.jpg";
const IMG_WAREHOUSE = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0283427-6185-4778-a071-851ecf325c4f.jpg";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const CATALOG_CATEGORIES = [{ id: "357", name: "Плёнка ПОФ" }];

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

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", company: "", comment: "" });
  const [formAgree, setFormAgree] = useState(false);
  const [formErrors, setFormErrors] = useState<Errors>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [thanksOpen, setThanksOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ pictures: string[]; idx: number } | null>(null);
  const [hashProducts, setHashProducts] = useState<CatalogProduct[]>([]);

  const collectProducts = useCallback((list: CatalogProduct[]) => {
    setHashProducts(prev => {
      const seen = new Set(prev.map(p => p.id));
      const add = list.filter(p => !seen.has(p.id));
      return add.length ? [...prev, ...add] : prev;
    });
  }, []);

  useProductHash(hashProducts, detailsProduct, setDetailsProduct);

  useSeo(getPageMeta("/poff_plenka"));

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const anyOpen = fosOpen || thanksOpen || detailsProduct || videoModal || lightbox;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [fosOpen, thanksOpen, detailsProduct, videoModal, lightbox]);

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
      <section id="hero" className="pt-16 min-h-[88vh] flex items-center bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-12 lg:py-0">
          <div className="lg:col-span-6 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(26px,4vw,46px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              ПОФ термоусадочная плёнка <span style={{ color: "var(--orange)" }}>в наличии</span>
            </h1>

            <p className="text-[19px] sm:text-[21px] font-semibold text-[#1A1A1A] mb-8 max-w-xl leading-snug">
              5 позиций по толщине и намотке. Подберём под вашу продукцию и рассчитаем <span style={{ color: "var(--orange)" }}>цену за метр</span>.
            </p>

            <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mb-8 max-w-2xl">
              {HERO_BULLETS.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[17px] font-medium text-[#1A1A1A] leading-snug">
                  <Icon name="CheckCircle2" size={24} className="mt-0.5 flex-shrink-0" style={{ color: "var(--orange)" }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => openFos(undefined, "Подбор плёнки ПОФ и расчёт цены за метр")} className="btn-orange text-base px-8 py-3.5">
                Подобрать плёнку
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-8 py-3.5">
                Смотреть каталог
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 fade-up flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Рулоны ПОФ термоусадочной плёнки и упакованная продукция"
              className="w-full h-auto lg:h-[520px] xl:h-[580px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ЭКРАН 2 — СВОЙСТВА ПЛЁНКИ */}
      <section id="properties" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Свойства плёнки ПОФ</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">
              Что даёт полиолефиновая плёнка на производстве и в упаковочном цехе
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_FACTS.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-7 card-hover">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(255,102,0,0.1)" }}>
                  <Icon name={f.icon} fallback="Check" size={28} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[19px] mb-2.5 leading-snug">{f.title}</h3>
                <p className="text-[15px] text-[#666] leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЭКРАН 3 — КАТАЛОГ */}
      <section id="catalog" className="py-16 bg-[#F7F7F7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Каталог плёнки ПОФ</h2>
            <p className="text-[#666] mt-2 max-w-2xl mx-auto">
              Актуальные позиции и наличие по складам обновляются автоматически
            </p>
          </div>

          <ShrinkCatalog
            categories={CATALOG_CATEGORIES}
            fallbackImg={IMG_FALLBACK}
            priorityParams={["Толщина", "Намотка", "Ширина", "Наличие"]}
            onDetails={setDetailsProduct}
            onLoaded={collectProducts}
            onInquiry={name => openFos(name || undefined, "Запрос цены на плёнку ПОФ")}
            onVideo={setVideoModal}
            onImageClick={(pictures, idx) => setLightbox({ pictures, idx })}
          />

          <div className="mt-8 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
            style={{ background: "linear-gradient(135deg, #FF7A00 0%, #FF9500 60%, #FFB020 100%)" }}>
            <div className="p-7 sm:p-9 flex flex-col justify-center text-white">
              <Icon name="MessageSquare" size={32} className="text-white mb-4" />
              <h3 className="font-bold text-[clamp(21px,2.4vw,28px)] mb-3 leading-tight">Не знаете, какая позиция нужна?</h3>
              <p className="text-[16px] text-white/90 leading-relaxed mb-6">
                Опишите продукцию и тип упаковочного аппарата — подберём толщину и намотку,
                посчитаем расход и цену за метр под ваш объём.
              </p>
              <button onClick={() => openFos(undefined, "Подбор позиции плёнки ПОФ")} className="btn-white self-start">
                Получить подбор
              </button>
            </div>
            <div className="min-h-[240px]">
              <img src={IMG_LINE} alt="Упаковочная линия с термоусадочной плёнкой" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ЭКРАН 3.1 — ДЛЯ КАКИХ ЗАДАЧ */}
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
              <div key={i} className="rounded-xl border border-gray-100 bg-white overflow-hidden card-hover flex flex-col">
                <div className="aspect-[4/3] overflow-hidden bg-[#F7F7F7]">
                  <img src={c.img} alt={c.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-[16px] mb-2 leading-snug">{c.title}</h3>
                  <p className="text-[14px] text-[#666] leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЭКРАН 3.2 — ЛИНЕЙКА ПО ТОЛЩИНЕ */}
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

          <div className="mt-6 rounded-2xl border-2 bg-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6"
            style={{ borderColor: "var(--orange)" }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,102,0,0.1)" }}>
              <Icon name="BadgePercent" size={28} style={{ color: "var(--orange)" }} />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "var(--orange)" }}>
                Специальные условия
              </p>
              <h3 className="font-bold text-[clamp(19px,2.1vw,24px)] mb-2 leading-tight">
                Для клиентов из Уральского федерального округа
              </h3>
              <p className="text-[15px] text-[#666] leading-relaxed">
                Действуют специальные условия поставки плёнки ПОФ. Подробности — у менеджера.
              </p>
            </div>
            <button onClick={() => openFos(undefined, "Специальные условия для клиентов из УрФО")} className="btn-orange px-7 py-3.5 flex-shrink-0">
              Узнать условия
            </button>
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
          <img src={IMG_FALLBACK} alt="" aria-hidden className="w-full h-full object-cover" loading="lazy" />
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
                onClick={() => { const name = detailsProduct.name; setDetailsProduct(null); openFos(name, "Получить коммерческое предложение"); }}
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
