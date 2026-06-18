import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";
import Quiz, { type QuizPayload } from "@/components/Quiz";
import QuizSideTab from "@/components/QuizSideTab";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { ymGoal } from "@/lib/ym";

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";

async function sendLead(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: typeof window !== "undefined" ? window.location.pathname : "",
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

const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/22bbdae7-6281-4ea3-9e01-c96ce393f30f.png";
const IMG_TEAM = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/758aa06d-2c1a-4f5b-a919-8eb8e70feaff.jpg";

type VideoItem = { title: string; url: string; thumb: string };
const VIDEOS: VideoItem[] = [
  { title: "Комбинационный весовой дозатор для овощей и фруктов DC 143", url: "https://rutube.ru/video/b0b195a66f7a66efbf7ee5b68a6526c7/?playlist=1607970", thumb: "https://rutube.ru/api/video/b0b195a66f7a66efbf7ee5b68a6526c7/thumbnail/?redirect=1" },
  { title: "Автоматическая клипсующая машина для упаковки овощей и фруктов в сетку WX-35", url: "https://rutube.ru/video/bad3214922dcb129fc87bab9ec2b6fa7/?playlist=1607970", thumb: "https://rutube.ru/api/video/bad3214922dcb129fc87bab9ec2b6fa7/thumbnail/?redirect=1" },
  { title: "Автоматическая упаковочная линия для штучной упаковки чеснока или лука в сетку SP-4-1", url: "https://rutube.ru/video/2f785693a880b49d52062367861ca109/?playlist=1607970", thumb: "https://rutube.ru/api/video/2f785693a880b49d52062367861ca109/thumbnail/?redirect=1" },
  { title: "Автоматическая машина для упаковки овощей и фруктов в сетку WD-35", url: "https://rutube.ru/video/dfa2b440a19223aa5db8bf8c11164b8d/?playlist=1607970", thumb: "https://rutube.ru/api/video/dfa2b440a19223aa5db8bf8c11164b8d/thumbnail/?redirect=1" },
  { title: "Автоматическая линия для взвешивания и упаковки продукта в лотки XC-880", url: "https://rutube.ru/video/1ee3806c9c964425bf382479870f6f29/?playlist=1607970", thumb: "https://rutube.ru/api/video/1ee3806c9c964425bf382479870f6f29/thumbnail/?redirect=1" },
  { title: "Автоматическая машина для упаковки овощей в сетку B-15", url: "https://rutube.ru/video/884645b517b3accc805ecf3b68e59a36/?playlist=1607970", thumb: "https://rutube.ru/api/video/884645b517b3accc805ecf3b68e59a36/thumbnail/?redirect=1" },
  { title: "Горизонтальная клипсующая машина для упаковки овощей и фруктов в сетку WW-30", url: "https://rutube.ru/video/477e1d476294f9ffbf390a73b4d5c52d/?playlist=1607970", thumb: "https://rutube.ru/api/video/477e1d476294f9ffbf390a73b4d5c52d/thumbnail/?redirect=1" },
];

function rutubeEmbedUrl(url: string): string {
  const m = url.match(/rutube\.ru\/video\/([a-f0-9]+)/i);
  return m ? `https://rutube.ru/play/embed/${m[1]}` : url;
}

const CATALOG_API = "https://functions.poehali.dev/57e27975-0947-45d9-bfbb-8fff401b7c60";

// Validation
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Sort params: Производительность first, then GUID-out (already filtered on BE)
// Видео-параметр исключаем — показываем отдельной кнопкой
function isVideoParam(p: Param): boolean {
  return /видео/i.test(p.name);
}
function sortParams(params: Param[]): Param[] {
  const cleaned = params.filter(p => !isVideoParam(p));
  const isPerf = (p: Param) => /производитель/i.test(p.name);
  const perf = cleaned.filter(isPerf);
  const rest = cleaned.filter(p => !isPerf(p));
  return [...perf, ...rest];
}
function getVideoUrl(params: Param[]): string | null {
  const v = params.find(isVideoParam);
  if (!v) return null;
  const m = String(v.value).match(/https?:\/\/\S+/i);
  return m ? m[0] : null;
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
  "25 лет на рынке упаковочного оборудования",
  "Склад запчастей в РФ",
  "Пусконаладка и обучение персонала в комплекте",
  "Расходники у одного поставщика — без поиска",
  "Линии «под ключ» — от проекта до запуска",
];

const CASES = [
  {
    product: "Картофель 5 кг",
    was: "Ручная фасовка: 2 бригады по 6 человек, 800 уп/смену",
    became: "Автоматическая машина для упаковки овощей в сетку B-15",
    result: "Выработка ×3, ФОТ −75%, окупаемость 5 мес.",
    icon: "🥔",
  },
  {
    product: "Лук репчатый 1 кг",
    was: "Фасовка в мешки, отказ 3 сетей из-за маркировки",
    became: "Автоматическая клипсующая машина для упаковки овощей и фруктов в сетку WX-35",
    result: "Листинг в Магните, Пятёрочке, Ленте за 2 месяца",
    icon: "🧅",
  },
  {
    product: "Черри-томаты 250 г",
    was: "Бой 8%, ручная укладка в лотки, 200 лотков/час",
    became: "Автоматическая линия для взвешивания и упаковки продукта в лотки XC-880",
    result: "Бой 1,5%, производительность ×5, экспорт в ОАЭ",
    icon: "🍅",
  },
];

const STEPS = [
  { num: "01", title: "Заявка", desc: "Оставляете запрос онлайн или звоните" },
  { num: "02", title: "Подбор", desc: "Менеджер подбирает модель за 15 минут" },
  { num: "03", title: "Договор", desc: "Согласуем условия, подписываем договор" },
  { num: "04", title: "Доставка", desc: "Отгрузка со склада в РФ или Китая" },
  { num: "05", title: "Запуск", desc: "Пусконаладка и обучение в вашем цехе" },
];

const FAQS = [
  { q: "Нужен ли компрессор?", a: "Полуавтоматические клипсаторы в сетку SP-1 и автоматические WX-35 и SP-2-1 не требуют подключение сжатого воздуха. Пневматика входит в комплектацию некоторых автоматических линий." },
  { q: "Встроена ли маркировка?", a: "Все модели клипсаторов могут оснащаться автоматической подачей этикетки «wine-glass» и принтером для печати информации о продукте." },
  { q: "Подходит для федеральных сетей?", a: "Да. Наше оборудование формирует упаковку с этикеткой wine-glass, которая соответствует требованиям Магнита, Пятёрочки, Ленты и X5." },
  { q: "За какой срок окупится оборудование?", a: "Средний срок окупаемости — 4–8 месяцев. Рассчитаем индивидуально с учётом вашего объёма и текущих затрат на ФОТ и материалы." },
  { q: "Есть ли гарантия и сервис?", a: "Гарантия 12 месяцев на всё оборудование. Сервисные инженеры — во всех федеральных округах. Выезд в течение 24–48 часов." },
  { q: "Можно посмотреть машину в работе?", a: "Да. Проводим видеодемонстрацию онлайн и очные показы на производстве. Запишитесь через форму — согласуем удобное время." },
];

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "#catalog" },
  { label: "Видео", href: "#videos" },
  { label: "Преимущества", href: "#advantages" },
  { label: "О компании", href: "#about" },
  { label: "Кейсы", href: "#cases" },
  { label: "Как работаем", href: "#steps" },
  { label: "Вопросы", href: "#faq" },
  { label: "Контакты", href: "#contacts" },
];

const PACK_TYPES = ["Картофель", "Морковь", "Лук", "Свёкла", "Черри-томаты", "Огурцы", "Зелень", "Другое"];

export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", pack: "", comment: "" });
  const [formAgree, setFormAgree] = useState(false);

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

  // Video modal
  const [videoOpen, setVideoOpen] = useState<VideoItem | null>(null);

  // Quick contact form (ФОС) — opened per product or generic
  const [fosOpen, setFosOpen] = useState<{ productName?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosAgree, setFosAgree] = useState(false);
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [fosSent, setFosSent] = useState(false);
  const [fosSubmitting, setFosSubmitting] = useState(false);

  // Main form state
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; agree?: string }>({});
  const [thanksOpen, setThanksOpen] = useState(false);

  // Quiz
  const [quizOpen, setQuizOpen] = useState(false);

  // Авто-открытие квиза: 1 раз за сессию, через 30 секунд после начала
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("quizAutoShown") === "1") return;
    } catch { /* sessionStorage может быть недоступен */ }
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem("quizAutoShown", "1"); } catch { /* ignore */ }
      setQuizOpen(true);
    }, 30000);
    return () => window.clearTimeout(t);
  }, []);

  const submitQuiz = useCallback(async (data: QuizPayload): Promise<boolean> => {
    return sendLead({
      source: "quiz",
      name: data.name,
      phone: data.phone,
      email: data.email,
      contact: data.contact,
      product: data.product,
      packaging: data.packaging,
      volume: data.volume,
      automation: data.automation,
      quizAnswers: {
        product: data.product,
        packaging: data.packaging,
        volume: data.volume,
        automation: data.automation,
      },
    });
  }, []);

  const openFos = (productName?: string) => {
    setFosOpen({ productName });
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosSent(false);
    setFosSubmitting(false);
  };

  const validateFos = () => {
    const errs: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (!fosData.name.trim()) errs.name = "Введите имя";
    else if (fosData.name.trim().length < 2) errs.name = "Слишком короткое имя";

    if (!fosData.phone.trim()) errs.phone = "Введите телефон";
    else if (!isValidPhoneRu(fosData.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";

    if (fosData.email.trim() && !EMAIL_RE.test(fosData.email.trim())) {
      errs.email = "Неверный формат e-mail";
    }

    if (!fosAgree) errs.agree = "Необходимо согласие";

    setFosErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitFos = async () => {
    if (!validateFos() || fosSubmitting) return;
    setFosSubmitting(true);
    await sendLead({
      source: "fos",
      product: fosOpen?.productName || "",
      name: fosData.name,
      phone: fosData.phone,
      email: fosData.email,
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  };

  const submitMainForm = async () => {
    const errs: { name?: string; phone?: string; agree?: string } = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = "Введите имя";
    if (!formData.phone.trim() || !isValidPhoneRu(formData.phone)) {
      errs.phone = "Введите телефон в формате +7 и 10 цифр";
    }
    if (!formAgree) errs.agree = "Необходимо согласие";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0 || formSubmitting) return;

    setFormSubmitting(true);
    await sendLead({
      source: "main_form",
      name: formData.name,
      phone: formData.phone,
      pack: formData.pack,
      comment: formData.comment,
    });
    setFormSubmitting(false);
    setFormData({ name: "", phone: "", pack: "", comment: "" });
    setThanksOpen(true);
  };

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // ?refresh=1 в адресе страницы → принудительно обновить кэш каталога на бэкенде
    const wantRefresh = typeof window !== "undefined"
      && /[?&]refresh=(1|true|yes)\b/i.test(window.location.search);
    const url = wantRefresh ? `${CATALOG_API}?refresh=1` : CATALOG_API;
    fetch(url, { cache: "no-store" })
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
    if (openProduct || lightbox || fosOpen || videoOpen || thanksOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openProduct, lightbox, fosOpen, videoOpen, thanksOpen]);

  const scrollTo = (href: string) => {
    if (href.startsWith("/")) {
      window.location.href = href;
      return;
    }
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
          <a href="#" className="flex items-center flex-shrink-0 mr-auto">
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-9 md:h-10 w-auto" />
          </a>

          {/* Nav desktop */}
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
                  <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 min-w-[260px]">
                    <a href="/vacuum" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Вакуумные упаковщики</a>
                    <a href="/gorizontalnoe" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Горизонтальные машины flow-pack</a>
                    <a href="/kartonajnoe" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Картонажное оборудование</a>
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

          {/* Phone + CTA */}
          <div className="hidden md:flex items-center gap-4 ml-4">
            <a href="tel:88005057831" className="text-sm font-semibold text-[#1A1A1A] hover:text-orange-600 transition-colors whitespace-nowrap">
              8 800 505-78-31
            </a>
            <button onClick={() => openFos()} className="btn-orange text-sm py-2 px-5 whitespace-nowrap">
              Оставить заявку
            </button>
          </div>

          {/* Burger */}
          <button className="lg:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
            <Icon name={mobileOpen ? "X" : "Menu"} size={24} className="text-[#1A1A1A]" />
          </button>
        </div>

        {/* Mobile menu */}
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
              <a href="/vacuum" className="block text-base text-[#444] py-1.5 pl-2">Вакуумные упаковщики</a>
              <a href="/gorizontalnoe" className="block text-base text-[#444] py-1.5 pl-2">Горизонтальные машины flow-pack</a>
              <a href="/kartonajnoe" className="block text-base text-[#444] py-1.5 pl-2">Картонажное оборудование</a>
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

      {/* ── БЛОК 1: БАННЕР ── */}
      <section id="hero" className="pt-16 min-h-[88vh] flex items-center bg-[#F7F7F7] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-12 lg:py-0">

          {/* Text */}
          <div className="lg:col-span-5 pr-0 lg:pr-4 fade-up">
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
              <button onClick={() => openFos()} className="btn-orange text-base px-8 py-3.5">
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

          {/* Image — большой, без рамки */}
          <div className="lg:col-span-7 relative fade-up-1 flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Клипсатор для упаковки овощей"
              loading="lazy"
              className="w-full h-auto lg:h-[640px] xl:h-[720px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── БЛОК 2: ПРОБЛЕМЫ ── */}
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

      {/* ── БЛОК 3: КАТАЛОГ ── */}
      <section id="catalog" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
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
                      <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-3 min-h-[3em] leading-snug break-words">
                        {prod.name}
                      </h3>

                      {/* All params, performance first — compact list with check icons */}
                      {prod.params.length > 0 && (
                        <ul className="mb-4 space-y-2">
                          {sortParams(prod.params).map((pr, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] leading-snug">
                              <Icon name="Check" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--orange)" }} />
                              <span className="text-[#444]">
                                <span className="font-semibold text-[#1A1A1A]">{pr.name}: </span>
                                <span className="font-normal text-[#444]">{pr.value}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="font-bold text-xl mb-3" style={{ color: "var(--orange)" }}>
                          {formatPrice(prod)}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openProductCard(prod)}
                            className="text-[15px] font-semibold px-4 py-2.5 rounded-lg transition-all w-full"
                            style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.2)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.1)"; }}
                          >
                            Подробнее
                          </button>
                          {getVideoUrl(prod.params) && (
                            <button
                              onClick={() => setVideoOpen({ title: prod.name, url: getVideoUrl(prod.params) as string, thumb: "" })}
                              className="text-[15px] font-semibold px-4 py-2.5 rounded-lg transition-all w-full flex items-center justify-center gap-2 border"
                              style={{ borderColor: "var(--orange)", color: "var(--orange)", background: "#fff" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,102,0,0.08)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                            >
                              <Icon name="Play" size={16} />
                              Смотреть видео
                            </button>
                          )}
                          <button
                            onClick={() => openFos(prod.name)}
                            className="text-[15px] font-semibold px-4 py-2.5 rounded-lg transition-all w-full text-white"
                            style={{ background: "var(--orange)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--orange-light)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--orange)"; }}
                          >
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
        </div>
      </section>

      {/* ── ВИДЕО ── */}
      <section id="videos" className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Видео работы оборудования</h2>
            <p className="text-[#888] mt-2">Смотрите машины в действии</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VIDEOS.map((v, i) => (
              <button
                key={i}
                onClick={() => setVideoOpen(v)}
                className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 text-left flex flex-col group"
              >
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={v.thumb}
                    alt={v.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform group-hover:scale-110" style={{ background: "var(--orange)" }}>
                      <Icon name="Play" size={26} className="text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <p className="font-semibold text-[#1A1A1A] text-[15px] leading-snug line-clamp-3">{v.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК 4: УТП ОБОРУДОВАНИЯ ── */}
      <section id="advantages" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
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

          {/* CTA: Подобрать оборудование (квиз) */}
          <div className="mt-12">
            <div
              className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-6"
              style={{ background: "linear-gradient(135deg, rgba(255,102,0,0.08), rgba(255,102,0,0.02))", border: "1px solid rgba(255,102,0,0.18)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "var(--orange)" }}
              >
                <Icon name="ListChecks" size={26} className="text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-1">
                  Подобрать оборудование
                </h3>
                <p className="text-[#555] text-[15px] leading-relaxed">
                  Ответьте на 4 коротких вопроса — пришлём персональную подборку с ценами и видео работы машин.
                </p>
              </div>
              <button
                onClick={() => setQuizOpen(true)}
                className="px-6 py-3.5 rounded-lg font-semibold text-white text-base transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: "var(--orange)" }}
              >
                Пройти квиз
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── БЛОК 5: УТП КОМПАНИИ ── */}
      <section id="about" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Photo */}
            <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              <img src={IMG_TEAM} alt="Овощи в упаковочной сетке" loading="lazy" className="w-full h-full object-cover" />
            </div>
            {/* List */}
            <div>
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
              <button onClick={() => openFos()} className="btn-orange mt-8">
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
          <button onClick={() => openFos()} className="btn-white text-base px-10 py-3.5">
            Помогите подобрать
          </button>
        </div>
      </section>

      {/* ── БЛОК 7: КЕЙСЫ ── */}
      <section id="cases" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
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

      {/* ── БЛОК 9: ЭТАПЫ ── */}
      <section id="steps" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
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
      <section id="faq" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Вопросы</h2>
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
              <h2 className="section-title mb-4">Получите подбор и расчёт окупаемости</h2>
              <p className="text-lg text-[#555] mb-8 leading-relaxed">
                Опишите, что и в каком объёме упаковываете. Менеджер подберёт оборудование
                и рассчитает окупаемость — в течение 15 минут.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "Phone", label: "8 800 505-78-31", sub: "Бесплатно по РФ" },
                  { icon: "Mail", label: "pack@t-sib.ru", sub: "Ответ в течение часа" },
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
                    onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: undefined }); }}
                    className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none focus:border-orange-400 transition-colors"
                    style={{ borderColor: formErrors.name ? "#E53935" : "#E5E7EB" }}
                  />
                  {formErrors.name && <p className="text-[13px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Телефон</label>
                  <input type="tel" placeholder="+7 (___) ___-__-__"
                    value={formData.phone}
                    onChange={e => { setFormData({ ...formData, phone: formatPhoneRu(e.target.value) }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined }); }}
                    onFocus={e => { if (!e.target.value) setFormData({ ...formData, phone: "+7 " }); }}
                    className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none focus:border-orange-400 transition-colors"
                    style={{ borderColor: formErrors.phone ? "#E53935" : "#E5E7EB" }}
                  />
                  {formErrors.phone && <p className="text-[13px] text-red-500 mt-1">{formErrors.phone}</p>}
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
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formAgree}
                    onChange={e => { setFormAgree(e.target.checked); if (formErrors.agree) setFormErrors({ ...formErrors, agree: undefined }); }}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                  />
                  <PolicyDisclaimer />
                </label>
                {formErrors.agree && <p className="text-[13px] text-red-500">{formErrors.agree}</p>}
                <button
                  onClick={submitMainForm}
                  disabled={formSubmitting}
                  className="btn-orange w-full py-3.5 text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formSubmitting ? "Отправляем…" : "Отправить заявку"}
                </button>
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
              <div className="inline-block bg-white rounded-lg px-3 py-2 mb-4">
                <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-white/55 leading-relaxed max-w-xs">
                Поставка и сервис оборудования для упаковки овощей и фруктов. 25 лет на рынке.
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
                            <span className="font-semibold text-[#1A1A1A] flex-1">{pr.name}</span>
                            <span className="font-normal text-[#444] flex-1 text-right">{pr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-2">
                    {getVideoUrl(openProduct.params) && (
                      <button
                        onClick={() => {
                          const url = getVideoUrl(openProduct.params) as string;
                          const name = openProduct.name;
                          setOpenProduct(null);
                          setTimeout(() => setVideoOpen({ title: name, url, thumb: "" }), 150);
                        }}
                        className="w-full py-3 rounded-lg font-semibold border flex items-center justify-center gap-2 transition-colors"
                        style={{ borderColor: "var(--orange)", color: "var(--orange)", background: "#fff" }}
                      >
                        <Icon name="Play" size={16} />
                        Смотреть видео
                      </button>
                    )}
                    <button
                      onClick={() => { const name = openProduct.name; setOpenProduct(null); setTimeout(() => openFos(name), 150); }}
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

            {!fosSent ? (
              <>
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

      {/* ── VIDEO MODAL ── */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setVideoOpen(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Закрыть"
            >
              <Icon name="X" size={20} />
            </button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={rutubeEmbedUrl(videoOpen.url)}
                title={videoOpen.title}
                allow="clipboard-write; autoplay"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-white text-center text-sm mt-3 px-4">{videoOpen.title}</p>
          </div>
        </div>
      )}

      {/* ── THANKS MODAL ── */}
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

      {/* ── QUIZ ── */}
      <QuizSideTab onClick={() => setQuizOpen(true)} />
      <Quiz open={quizOpen} onClose={() => setQuizOpen(false)} onSubmit={submitQuiz} />
    </div>
  );
}