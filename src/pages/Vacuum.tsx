import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { captureUtm, readUtm } from "@/lib/utm";

// Страница вакуумного упаковочного оборудования /vacuum

const LEAD_ENDPOINT = "/api/b24-send-lead.php";
const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const IMG_HERO = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/cfe23789-bc80-43d8-9bfa-338b2fa4d337.jpg";

const PHONE_RE = /^(\+7|7|8)?[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/;
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
    return j?.ok !== false;
  } catch {
    return false;
  }
}

const PROBLEMS = [
  { icon: "Timer", title: "Короткий срок годности", desc: "Скоропортящаяся продукция теряет товарный вид и списывается из ассортимента" },
  { icon: "ClipboardX", title: "Не проходит аудит сетей", desc: "Сети требуют вакуум, газонаполнение и герметичный шов под товарный знак" },
  { icon: "TrendingDown", title: "Высокий расход плёнки", desc: "Ручная и плохая запайка даёт развакуум, перерасход материалов до 25%" },
  { icon: "AlertTriangle", title: "Длинная пусконаладка", desc: "Машины без поддержки простаивают неделями из-за нехватки расходников" },
];

const ADVANTAGES = [
  { icon: "Boxes", title: "В наличии", desc: "Для мяса, рыбы, сыра, медицинских, косметических и прочих товаров" },
  { icon: "Layers", title: "Линейка моделей", desc: "Настольные и напольные, 1 или 2 камеры, под любой объём" },
  { icon: "ShieldCheck", title: "Гарантия до 3 лет", desc: "Надёжность и стабильность работы — нержавеющий корпус SUS304" },
  { icon: "Wind", title: "Газонаполнение MAP", desc: "Срок годности продукции увеличивается в 3–5 раз" },
  { icon: "Droplets", title: "Двойной шов 3,5 мм", desc: "100% герметичность даже при выпуске жидкости — исключает развакуум" },
  { icon: "Settings2", title: "Автопрограммы", desc: "Быстрая настройка цикла под продукт — обучение оператора за 1 день" },
  { icon: "Wrench", title: "Оперативный сервис", desc: "Расходники на складе, замена планки и плёнки за 1 рабочий день" },
  { icon: "Award", title: "Сертификаты CE и ТР ТС", desc: "Соответствие требованиям РФ и СНГ, разрешение для пищевых производств" },
];

const MODELS = [
  { name: "HVC-260T", type: "Настольная", chambers: "1 камера", chamber: "260×280×80 мм", pump: "12 м³/ч", seal: "260 мм", price: "от 89 900 ₽" },
  { name: "HVC-410T", type: "Настольная", chambers: "1 камера", chamber: "410×340×100 мм", pump: "20 м³/ч", seal: "410 мм", price: "от 159 900 ₽" },
  { name: "HVC-510S", type: "Настольная", chambers: "1 камера", chamber: "510×365×130 мм", pump: "20 м³/ч", seal: "500 мм", price: "от 259 900 ₽" },
  { name: "HVC-720S/2B", type: "Напольная", chambers: "2 камеры", chamber: "720×550×180 мм", pump: "40 м³/ч", seal: "710 мм", price: "от 399 900 ₽" },
  { name: "HVC-810S/2B", type: "Напольная", chambers: "2 камеры", chamber: "810×550×180 мм", pump: "63 м³/ч", seal: "810 мм", price: "от 499 900 ₽" },
  { name: "DZ-1100/2SB", type: "Напольная", chambers: "2 камеры", chamber: "1100×700×220 мм", pump: "100 м³/ч", seal: "2×1000 мм", price: "от 749 900 ₽" },
];

const STEPS = [
  { num: "01", title: "Заявка", desc: "Оставляете запрос онлайн или звоните" },
  { num: "02", title: "Подбор", desc: "Менеджер подбирает модель за 15 минут" },
  { num: "03", title: "Тест", desc: "Бесплатное тестирование в нашем демозале" },
  { num: "04", title: "Договор", desc: "Согласуем условия, подписываем договор" },
  { num: "05", title: "Доставка", desc: "Отгрузка со склада в РФ за 2–7 дней" },
  { num: "06", title: "Запуск", desc: "Пусконаладка и обучение в вашем цехе" },
];

const FAQS = [
  { q: "Насколько надёжен двойной шов?", a: "Двойная запайка состоит из двух 3,5 мм выпуклых струн. Это позволяет быть уверенным, что остатки продукта или жидкости будут вытеснены с зоны шва во время запаечного цикла. Обеспечивает максимальную герметичность и исключает развакуум пакета при транспортировке." },
  { q: "Какие пакеты подходят и как выбрать размер?", a: "Используются специальные вакуумные пакеты с рифлением или гладкие плёнки. Размер выбирается исходя из габаритов продукта + 5–7 см запаса на запайку. Наши специалисты помогут подобрать оптимальный тип." },
  { q: "Сроки поставки и условия гарантии?", a: "Оборудование в наличии на складе — отгрузка в день оплаты. Доставка по РФ 2–7 дней. Гарантия до 3 лет на оборудование, консультация по подключению и эксплуатации." },
  { q: "Как организована пусконаладка и обучение?", a: "Инженер проводит установку, настройку оборудования и обучение персонала на объекте клиента в течение 1 дня. Услуга включена в стоимость, за исключением командировочных расходов сервисного инженера." },
  { q: "Как обслуживать насос и планку запайки?", a: "Регламент обслуживания включает: проверку уровня масла в насосе раз в месяц, очистку планки запайки после смены, замену тефлоновой ленты раз в 3–6 месяцев. Обучение включено, сервис по договору." },
  { q: "Какие есть сертификаты?", a: "Все модели имеют сертификаты CE (европейский стандарт безопасности), ISO 9001 (система менеджмента качества), декларацию соответствия ТР ТС для работы в РФ и СНГ." },
  { q: "Есть ли лизинг и рассрочка?", a: "Да, работаем с ведущими лизинговыми компаниями. Возможна рассрочка на индивидуальных условиях. Оформление от 1 дня." },
  { q: "Сколько стоит оборудование?", a: "Стоимость нашего оборудования от 50 тыс. руб. Точная цена зависит от характеристик модели, условий доставки, наличия товара на складе. Оставьте заявку, менеджер свяжется и предоставит детальную информацию." },
  { q: "Какую модель выбрать?", a: "Выбор зависит от ваших задач: объёма упаковки, типа продукции, размеров продукта. Наш менеджер поможет подобрать оптимальное оборудование под ваши потребности." },
];

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Каталог", href: "#catalog" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Как работаем", href: "#steps" },
  { label: "Вопросы", href: "#faq" },
  { label: "Контакты", href: "#contacts" },
];

const PACK_TYPES = ["Мясо и мясопродукты", "Рыба и морепродукты", "Сыры и молочка", "Колбасные изделия", "Полуфабрикаты", "Медицина и косметика", "Промышленные товары", "Другое"];

export default function Vacuum() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", pack: "", comment: "" });

  const [fosOpen, setFosOpen] = useState<{ productName?: string } | null>(null);
  const [fosData, setFosData] = useState({ name: "", phone: "", email: "" });
  const [fosErrors, setFosErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [fosSubmitting, setFosSubmitting] = useState(false);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [thanksOpen, setThanksOpen] = useState(false);

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (fosOpen || thanksOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [fosOpen, thanksOpen]);

  const openFos = useCallback((productName?: string) => {
    setFosData({ name: "", phone: "", email: "" });
    setFosErrors({});
    setFosOpen({ productName });
  }, []);

  const validateFos = useCallback(() => {
    const errs: { name?: string; phone?: string; email?: string } = {};
    if (fosData.name.trim().length < 2) errs.name = "Укажите имя";
    if (!PHONE_RE.test(fosData.phone.trim())) errs.phone = "Укажите корректный телефон";
    if (!EMAIL_RE.test(fosData.email.trim())) errs.email = "Укажите корректный e-mail";
    setFosErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fosData]);

  const submitFos = useCallback(async () => {
    if (!validateFos() || fosSubmitting) return;
    setFosSubmitting(true);
    await sendLead({
      source: "fos",
      product: fosOpen?.productName || "",
      page: "vacuum",
      name: fosData.name.trim(),
      phone: fosData.phone.trim(),
      email: fosData.email.trim(),
    });
    setFosSubmitting(false);
    setFosOpen(null);
    setThanksOpen(true);
  }, [fosData, fosOpen, fosSubmitting, validateFos]);

  const submitMainForm = async () => {
    const errs: { name?: string; phone?: string } = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errs.name = "Введите имя";
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || !PHONE_RE.test(formData.phone) || phoneDigits.length < 10 || phoneDigits.length > 11) {
      errs.phone = "Неверный телефон";
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0 || formSubmitting) return;
    setFormSubmitting(true);
    await sendLead({
      source: "main_form",
      page: "vacuum",
      name: formData.name,
      phone: formData.phone,
      pack: formData.pack,
      comment: formData.comment,
    });
    setFormSubmitting(false);
    setFormData({ name: "", phone: "", pack: "", comment: "" });
    setThanksOpen(true);
  };

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
            <div className="relative" onMouseEnter={() => setEquipmentOpen(true)} onMouseLeave={() => setEquipmentOpen(false)}>
              <button className="text-[13px] xl:text-sm font-medium text-[#444] hover:text-orange-600 transition-colors whitespace-nowrap flex items-center gap-1">
                Оборудование
                <Icon name="ChevronDown" size={14} className={`transition-transform ${equipmentOpen ? "rotate-180" : ""}`} />
              </button>
              {equipmentOpen && (
                <div className="absolute left-0 top-full pt-2 z-50">
                  <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 min-w-[260px]">
                    <a href="/vegetables" className="block px-4 py-2 text-sm text-[#444] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors">Упаковка овощей и фруктов</a>
                    <a href="/vacuum" className="block px-4 py-2 text-sm text-orange-600 font-semibold bg-[#FFF5EE]">Вакуумные упаковщики</a>
                  </div>
                </div>
              )}
            </div>
            {NAV.map(l => (
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
            <div className="border-b border-gray-100 pb-2">
              <p className="text-xs font-semibold text-[#999] uppercase mb-2">Оборудование</p>
              <a href="/vegetables" className="block text-base text-[#444] py-1.5 pl-2">Упаковка овощей и фруктов</a>
              <a href="/vacuum" className="block text-base text-orange-600 font-semibold py-1.5 pl-2">Вакуумные упаковщики</a>
            </div>
            {NAV.map(l => (
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
          <div className="lg:col-span-5 pr-0 lg:pr-4 fade-up">
            <h1 className="text-[clamp(28px,4.5vw,52px)] font-bold leading-[1.15] mb-5 text-[#1A1A1A]">
              Промышленные<br />
              <span style={{ color: "var(--orange)" }}>вакуумные упаковщики</span><br />
              по доступным ценам
            </h1>

            <p className="text-lg text-[#555] mb-8 max-w-xl leading-relaxed">
              Гарантия до 3 лет. Мощные насосы. Двойной шов. Газонаполнение.
              Настольные и напольные модели. Бесплатное тестирование в демозале.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => openFos()} className="btn-orange text-base px-8 py-3.5">
                Получить КП
              </button>
              <button onClick={() => scrollTo("#catalog")} className="btn-outline-orange text-base px-8 py-3.5">
                Смотреть модели
              </button>
            </div>

            <ul className="space-y-3">
              {[
                "1, 2 камеры — настольные и напольные",
                "Корпус из нержавеющей стали SUS304",
                "Подбор модели за 15 минут",
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

          <div className="lg:col-span-7 relative fade-up-1 flex items-center justify-center">
            <img
              src={IMG_HERO}
              alt="Промышленный вакуумный упаковщик"
              loading="lazy"
              className="w-full h-auto lg:h-[640px] xl:h-[720px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
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

      {/* CATALOG STUB */}
      <section id="catalog" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <h2 className="section-title mb-0">Линейка моделей</h2>
            <p className="text-sm text-[#888]">Полный каталог обновляется. Цены — стартовые.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODELS.map(m => (
              <div key={m.name} className="card-hover bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col">
                <div className="aspect-[16/10] bg-[#F7F7F7] flex items-center justify-center">
                  <img src={IMG_HERO} alt={m.name} loading="lazy" className="w-full h-full object-contain p-4" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-[#1A1A1A] text-[17px] mb-1">{m.name}</h3>
                  <p className="text-xs text-[#888] mb-3">{m.type} · {m.chambers}</p>
                  <ul className="mb-4 space-y-2">
                    {[
                      { k: "Камера", v: m.chamber },
                      { k: "Производительность насоса", v: m.pump },
                      { k: "Длина запайки", v: m.seal },
                    ].map((pr, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] leading-snug">
                        <Icon name="Check" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--orange)" }} />
                        <span className="text-[#444]">
                          <span className="font-semibold text-[#1A1A1A]">{pr.k}: </span>{pr.v}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="font-bold text-xl mb-3" style={{ color: "var(--orange)" }}>{m.price}</div>
                    <button
                      onClick={() => openFos(m.name)}
                      className="text-[15px] font-semibold px-4 py-2.5 rounded-lg transition-all w-full"
                      style={{ background: "rgba(255,102,0,0.1)", color: "var(--orange)" }}
                    >
                      Получить КП
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white rounded-xl border border-gray-100 p-6 text-center">
            <p className="text-[#555] mb-4">Нужна другая модель или индивидуальная конфигурация?</p>
            <button onClick={() => openFos()} className="btn-orange">Подобрать под задачу</button>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Почему выбирают наше оборудование</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="card-hover rounded-xl border border-gray-100 p-6 bg-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,102,0,0.08)" }}>
                  <Icon name={a.icon} fallback="CheckCircle" size={24} style={{ color: "var(--orange)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-base mb-2">{a.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section id="steps" className="py-16 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Как мы работаем</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STEPS.map(s => (
              <div key={s.num} className="bg-white rounded-xl border border-gray-100 p-5 text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: "var(--orange)" }}>{s.num}</div>
                <h3 className="font-bold text-[#1A1A1A] mb-2 text-base">{s.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-title">Частые вопросы</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="border border-gray-100 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FFF5EE] transition-colors"
                >
                  <span className="font-semibold text-[#1A1A1A] text-[16px] leading-snug">{f.q}</span>
                  <Icon name={openFaq === i ? "Minus" : "Plus"} size={20} className="flex-shrink-0" style={{ color: "var(--orange)" }} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-[15px] text-[#555] leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
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
      <section id="contacts" className="py-16 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-[clamp(26px,3.8vw,40px)] font-bold mb-3">Получить коммерческое предложение</h2>
            <p className="text-white/70">Заполните форму — менеджер свяжется в течение 15 минут</p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 text-[#1A1A1A]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Имя *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                  placeholder="Иван"
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                  placeholder="+7 (___) ___-__-__"
                />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Что упаковываете?</label>
              <select
                value={formData.pack}
                onChange={e => setFormData({ ...formData, pack: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 bg-white"
              >
                <option value="">— выберите —</option>
                {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">Комментарий</label>
              <textarea
                value={formData.comment}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Объём, особенности упаковки, требования..."
              />
            </div>

            <button onClick={submitMainForm} disabled={formSubmitting} className="btn-orange w-full text-base py-4 disabled:opacity-60">
              {formSubmitting ? "Отправляем..." : "Отправить заявку"}
            </button>
            <p className="text-xs text-[#888] mt-3 text-center">Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] text-white/70 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <img src={LOGO_URL} alt="ТЕХНОСИБ" className="h-9 w-auto mb-4 brightness-0 invert" />
            <p>Промышленное упаковочное оборудование.<br />Поставка, пусконаладка, сервис под ключ.</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Контакты</p>
            <p><a href="tel:88005057831" className="hover:text-orange-500 transition-colors">8 800 505-78-31</a></p>
            <p><a href="mailto:pack@t-sib.ru" className="hover:text-orange-500 transition-colors">pack@t-sib.ru</a></p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Оборудование</p>
            <p><a href="/vegetables" className="hover:text-orange-500 transition-colors">Упаковка овощей и фруктов</a></p>
            <p><a href="/vacuum" className="hover:text-orange-500 transition-colors">Вакуумные упаковщики</a></p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-6 border-t border-white/10 text-xs text-white/50">
          © {new Date().getFullYear()} ТЕХНОСИБ. Все права защищены.
        </div>
      </footer>

      {/* FOS MODAL */}
      {fosOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setFosOpen(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setFosOpen(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <Icon name="X" size={20} className="text-[#666]" />
            </button>
            <h3 className="text-2xl font-bold mb-2">Оставить заявку</h3>
            {fosOpen.productName && <p className="text-sm text-[#666] mb-4">По модели: <span className="font-semibold">{fosOpen.productName}</span></p>}
            <p className="text-sm text-[#666] mb-5">Менеджер свяжется в течение 15 минут</p>

            <div className="space-y-3">
              <div>
                <input type="text" placeholder="Имя"
                  value={fosData.name}
                  onChange={e => setFosData({ ...fosData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${fosErrors.name ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {fosErrors.name && <p className="text-xs text-red-500 mt-1">{fosErrors.name}</p>}
              </div>
              <div>
                <input type="tel" placeholder="Телефон"
                  value={fosData.phone}
                  onChange={e => setFosData({ ...fosData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${fosErrors.phone ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {fosErrors.phone && <p className="text-xs text-red-500 mt-1">{fosErrors.phone}</p>}
              </div>
              <div>
                <input type="email" placeholder="E-mail"
                  value={fosData.email}
                  onChange={e => setFosData({ ...fosData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${fosErrors.email ? "border-red-400" : "border-gray-200"} focus:outline-none focus:border-orange-500`}
                />
                {fosErrors.email && <p className="text-xs text-red-500 mt-1">{fosErrors.email}</p>}
              </div>
              <button onClick={submitFos} disabled={fosSubmitting} className="btn-orange w-full text-base py-3.5 disabled:opacity-60">
                {fosSubmitting ? "Отправляем..." : "Отправить"}
              </button>
              <p className="text-xs text-[#888] text-center">Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных</p>
            </div>
          </div>
        </div>
      )}

      {/* THANKS MODAL */}
      {thanksOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setThanksOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Заявка отправлена!</h3>
            <p className="text-[#666] mb-6">Менеджер свяжется с вами в течение 15 минут.</p>
            <button onClick={() => setThanksOpen(false)} className="btn-orange w-full">Хорошо</button>
          </div>
        </div>
      )}
    </div>
  );
}