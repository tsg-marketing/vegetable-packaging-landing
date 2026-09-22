import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import EquipmentMenu from "@/components/EquipmentMenu";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import LegalInfo from "@/components/LegalInfo";
import { createLeadSender } from "@/lib/lead";
import { captureUtm } from "@/lib/utm";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";
import { useSeo } from "@/lib/seo";
import { getPageMeta } from "@/lib/pageMeta";

const LOGO_URL = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/2c1f2adf-4b66-4083-b3f3-ea2916e31297.png";
const HERO_IMG = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/6987fa02-cd88-4e57-944b-bcaecae0723b.png";

const NAV = [
  { label: "Главная", href: "/" },
  { label: "Направления", href: "#directions" },
  { label: "Преимущества", href: "#advantages" },
  { label: "Контакты", href: "#contacts" },
  { label: "Реквизиты", href: "#requisites" },
];

const DIRECTIONS = [
  {
    img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/2f750b53-0c53-4ebe-872d-15f9d47cacfe.jpg",
    title: "Мясо- и рыбопереработка",
    intro: "Полные линии от приёмки сырья до готовой продукции. Поставляем проверенное оборудование для каждого этапа переработки:",
    items: [
      "Измельчение и подготовка сырья — блокорезки, волчки, промышленные мясорубки, куттеры, фаршемешалки",
      "Разделка и обвалка — ленточные пилы, шкуросъёмные машины, филетировочные машины",
      "Массирование и посол — мясомассажёры, инъекторы",
      "Вспомогательное оборудование — льдогенераторы и другое оснащение для поддержания технологических процессов",
    ],
    note: "Подберём комплект оборудования под вашу производительность — от небольшого цеха на 500 кг/смену до крупного завода.",
  },
  {
    img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/ddd3e004-0b3a-4368-94bd-ab1cd92a9562.jpg",
    title: "Фасовка и упаковка",
    intro: "Решения для упаковки пищевых и промышленных товаров любого формата — от штучной единицы до паллеты:",
    items: [
      "Первичная упаковка — вакуумные упаковщики, запайщики лотков (трейсилеры), термоусадочное оборудование",
      "Фасовочные линии — горизонтальные упаковочные машины (Flow-pack), вертикальные фасовочно-упаковочные автоматы",
      "Групповая и транспортная упаковка — формирователи коробов, паллетообмотчики",
    ],
    note: "Автоматизируем участок упаковки целиком: от дозирования до обмотки готовой паллеты.",
  },
  {
    img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/2f4b2395-14a3-4c41-af24-b8a73fc597da.jpg",
    title: "Кондитерское и хлебопекарное производство",
    intro: "Оборудование для выпечки, формовки, глазирования и декорирования — всё для выпуска кондитерских и хлебобулочных изделий стабильно высокого качества.",
    items: [],
    note: "",
  },
  {
    img: "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/c36ed4e6-fb45-4c70-a571-ca070954b1c2.jpg",
    title: "Упаковочные и расходные материалы",
    intro: "Стабильные поставки плёнок, лотков, пакетов и комплектующих. Собственный склад — отгружаем в день заказа без задержек.",
    items: [],
    note: "",
  },
];

const B = "https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/";

const ADVANTAGES = [
  { img: B + "e456e6b6-f0c8-4a71-8cda-2f5e2409b318.jpg", title: "Более 25 лет на рынке", desc: "Сотни успешно реализованных проектов. Нам доверяют как небольшие цеха, так и крупные федеральные производства." },
  { img: B + "a9989c12-1659-4e4b-89e4-2c6ad0e57899.jpg", title: "Комплексное оснащение под ключ", desc: "Не нужно искать десять поставщиков — мы подберём, доставим, установим и запустим всю линию целиком." },
  { img: B + "1d278c08-eb23-4cfb-9ac6-759d1e682a10.jpg", title: "Большой склад запчастей — ремонт без ожидания", desc: "Собственный склад оригинальных запчастей и комплектующих в Москве, Новосибирске и Челябинске. Минимум простоя — максимум прибыли." },
  { img: B + "dade84bf-2be3-4931-9dee-12aa8c24e95a.jpg", title: "Бесплатная консультация специалиста", desc: "Расскажите о задаче — наши эксперты предложат оптимальное решение по оборудованию, компоновке и бюджету." },
  { img: B + "6fcf82e8-721c-467b-a823-a31c0644f64f.jpg", title: "Демонстрация и тестирование на вашем сырье", desc: "Приезжайте в наши демозалы, протестируйте оборудование в реальных условиях и убедитесь в результате до покупки." },
  { img: B + "4937113c-a1df-4068-917f-073116494109.jpg", title: "Оборудование в наличии или кратчайшие сроки", desc: "Широкий ассортимент на собственных складах. Нужной модели нет в наличии? Организуем поставку с завода в минимальные сроки." },
  { img: B + "198a8d95-ac6c-4e47-bd4e-e012a94a1149.jpg", title: "Доставка в любую точку России и СНГ", desc: "Отправим оборудование в ваш город — бесплатно до транспортной компании. Работаем со всеми крупными перевозчиками." },
  { img: B + "b4c71b96-2b82-4235-afce-78e0b08593c0.jpg", title: "Доступные цены", desc: "Прямые контракты с производителями = лучшие цены для вас. Запросите расчёт — сравните сами." },
];

type Office = { city: string; tag: string; address: string; warehouseOnly?: boolean };

const OFFICES: Office[] = [
  {
    city: "Москва",
    tag: "Офис и склад",
    address: "ш. Энтузиастов, д. 56, стр. 32, офис 115",
  },
  {
    city: "Новосибирск",
    tag: "Офис и склад",
    address: "ул. Электрозаводская, 2 к1, офис 304, 314",
  },
  {
    city: "Челябинск",
    tag: "Склад",
    address: "Отгрузка со склада — адрес уточняйте у менеджера",
    warehouseOnly: true,
  },
];

const REQUISITES = [
  { label: "Полное наименование организации", value: "Общество с ограниченной ответственностью «Техно-Сиб Групп»" },
  { label: "ИНН", value: "5406804844" },
  { label: "ОГРН", value: "1205400012146" },
  { label: "КПП", value: "540601001" },
];

const BANK = [
  { label: "Р/СЧ", value: "40702810523000011974" },
  { label: "Банк", value: 'ФИЛИАЛ "НОВОСИБИРСКИЙ" АО "АЛЬФА-БАНК"' },
  { label: "БИК", value: "045004774" },
  { label: "Кор/счет", value: "30101810600000000774" },
];

const sendLead = createLeadSender("О компании");

export default function AboutUs() {
  const meta = getPageMeta("/about_us");
  useSeo({ title: meta.title, description: meta.description, image: meta.image });

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", comment: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; agree?: string }>({});
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    captureUtm();
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    if (href.startsWith("/")) { window.location.href = href; return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
    setEquipmentOpen(false);
  };

  const submit = useCallback(async () => {
    const errs: { name?: string; phone?: string; agree?: string } = {};
    if (form.name.trim().length < 2) errs.name = "Введите имя";
    if (!isValidPhoneRu(form.phone)) errs.phone = "Введите телефон в формате +7 и 10 цифр";
    if (!agree) errs.agree = "Необходимо согласие";
    setErrors(errs);
    if (Object.keys(errs).length > 0 || sending) return;
    setSending(true);
    const ok = await sendLead({
      source: "about_us",
      name: form.name.trim(),
      phone: form.phone.trim(),
      comment: form.comment.trim() || "Заявка со страницы «О компании»",
    });
    setSending(false);
    if (ok) {
      setDone(true);
      setForm({ name: "", phone: "", comment: "" });
      setAgree(false);
    }
  }, [form, agree, sending]);

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.1)]" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-6">
          <a href="/" className="flex items-center flex-shrink-0 mr-auto">
            <img src={LOGO_URL} alt="Техно-Сиб" className="h-9 md:h-10 w-auto" />
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
                  <EquipmentMenu variant="desktop" currentHref="/about_us" showGroups={false} />
                </div>
              )}
            </div>
            <span className="text-[13px] xl:text-sm font-semibold text-orange-600 whitespace-nowrap">О компании</span>
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
            <button onClick={() => scrollTo("#contact-form")} className="btn-orange text-sm py-2 px-5 whitespace-nowrap">
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
              <EquipmentMenu variant="mobile" currentHref="/about_us" showGroups={false} />
            </div>
            {NAV.slice(1).map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-left text-base font-medium text-[#444] py-2 border-b border-gray-100">
                {l.label}
              </button>
            ))}
            <a href="tel:88005057831" className="text-base font-bold text-[#1A1A1A] py-2">8 800 505-78-31</a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-28 pb-14 md:pt-36 md:pb-20 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600 mb-4">О компании</p>
            <h1 className="text-[30px] sm:text-[40px] lg:text-[46px] font-bold leading-tight mb-5">
              «Техно-Сиб» — ваш надёжный партнёр в оснащении пищевых производств с 2001 года
            </h1>
            <p className="text-[19px] text-[#555] leading-relaxed mb-4">
              Более 25 лет мы помогаем пищевым предприятиям по всей России выходить на новый уровень производительности.
              Поставляем профессиональное оборудование, обеспечиваем сервис и снабжаем упаковочными материалами — всё,
              чтобы ваше производство работало без простоев.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button onClick={() => scrollTo("#contact-form")} className="btn-orange">Получить консультацию</button>
              <a href="/" className="btn-outline-orange">Каталог оборудования</a>
            </div>
          </div>
          <div className="relative">
            <img src={HERO_IMG} alt="Упаковочное оборудование Техно-Сиб" className="w-full rounded-2xl shadow-lg object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ЦИФРЫ */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { v: "25+", l: "лет на рынке" },
            { v: "3", l: "склада — Москва, Новосибирск, Челябинск" },
            { v: "4", l: "направления оснащения производств" },
            { v: "РФ и СНГ", l: "география поставок" },
          ].map(s => (
            <div key={s.l} className="text-center">
              <p className="text-[28px] sm:text-[34px] font-bold text-orange-600 leading-none mb-2">{s.v}</p>
              <p className="text-[15.5px] text-[#666] leading-snug">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* НАПРАВЛЕНИЯ */}
      <section id="directions" className="py-16 md:py-20 bg-[#F7F7F7] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-[26px] sm:text-[34px] font-bold mb-3">Четыре направления — одно комплексное решение</h2>
          <p className="text-[19px] text-[#555] mb-10">Мы закрываем ключевые потребности пищевых и промышленных предприятий:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DIRECTIONS.map(d => (
              <div key={d.title} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
                <img src={d.img} alt={d.title} loading="lazy" className="w-full h-52 sm:h-60 object-cover" />
                <div className="p-7 flex-1">
                  <h3 className="text-[22px] font-bold mb-3">{d.title}</h3>
                  <p className="text-[17px] text-[#555] leading-relaxed mb-4">{d.intro}</p>
                  {d.items.length > 0 && (
                    <ul className="space-y-2.5 mb-4">
                      {d.items.map(i => (
                        <li key={i} className="flex gap-2.5 text-[16.5px] text-[#444] leading-relaxed">
                          <Icon name="Check" size={19} className="text-orange-600 flex-shrink-0 mt-1" />
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {d.note && <p className="text-[16.5px] text-[#1A1A1A] font-medium bg-orange-50 rounded-lg px-4 py-3 leading-relaxed">{d.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА */}
      <section id="advantages" className="py-16 md:py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-[26px] sm:text-[34px] font-bold mb-3">Почему производства по всей России выбирают «Техно-Сиб»</h2>
          <p className="text-[19px] text-[#555] mb-10 max-w-3xl">
            Мы работаем напрямую с ведущими заводами Европы, России и Китая — без посредников. Это значит конкурентные цены
            и гарантия подлинности каждой единицы оборудования.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADVANTAGES.map(a => (
              <div key={a.title} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
                <img src={a.img} alt={a.title} loading="lazy" className="w-full h-44 object-cover" />
                <div className="p-5 flex-1">
                  <h3 className="text-[18px] font-bold mb-2 leading-snug">{a.title}</h3>
                  <p className="text-[16px] text-[#666] leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* КОНТАКТЫ / ОФИСЫ */}
      <section id="contacts" className="py-16 md:py-20 bg-[#F7F7F7] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-[26px] sm:text-[34px] font-bold mb-3">Контакты</h2>
          <p className="text-[19px] text-[#555] mb-10 max-w-3xl">
            Собственные офисы в Москве и Новосибирске, склады в трёх городах — включая Челябинск — сервисные центры
            и выстроенная логистика позволяют оперативно обслуживать клиентов от Калининграда до Владивостока.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {OFFICES.map(o => (
              <div key={o.city} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="text-[24px] font-bold">{o.city}</h3>
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-50 rounded-full px-2.5 py-1">{o.tag}</span>
                </div>
                <p className="text-[16.5px] text-[#666] mb-6">{o.address}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center flex-shrink-0">
                        <Icon name="Phone" size={16} className="text-[#444]" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#999] leading-none mb-1.5">Телефон</p>
                        <a href="tel:88005057831" className="text-[16.5px] font-semibold hover:text-orange-600 transition-colors">8 800 505-78-31</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center flex-shrink-0">
                        <Icon name="Mail" size={16} className="text-[#444]" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#999] leading-none mb-1.5">Почта</p>
                        <a href="mailto:pack@t-sib.ru" className="text-[16.5px] text-orange-600 hover:underline">pack@t-sib.ru</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center flex-shrink-0">
                        <Icon name="Wrench" size={16} className="text-[#444]" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#999] leading-none mb-1.5">Сервис</p>
                        <a href="mailto:service@t-sib.ru" className="text-[16.5px] text-orange-600 hover:underline">service@t-sib.ru</a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!o.warehouseOnly && (
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center flex-shrink-0">
                          <Icon name="Clock" size={16} className="text-[#444]" />
                        </div>
                        <div>
                          <p className="text-[13px] text-[#999] leading-none mb-1.5">График работы офиса</p>
                          <p className="text-[16.5px]">Пн–Пт <span className="font-semibold">09:00–18:00</span></p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center flex-shrink-0">
                        <Icon name="Clock" size={16} className="text-[#444]" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#999] leading-none mb-1.5">График работы склада</p>
                        <p className="text-[16.5px]">Пн–Пт <span className="font-semibold">09:00–17:00</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* РЕКВИЗИТЫ */}
      <section id="requisites" className="py-16 md:py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-[24px] font-bold mb-5">Реквизиты</h2>
            <ul className="space-y-2.5">
              {REQUISITES.map(r => (
                <li key={r.label} className="text-[16.5px] text-[#555] leading-relaxed">
                  <span className="text-[#999]">{r.label} — </span>
                  <span className="text-[#1A1A1A]">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[24px] font-bold mb-5">Банковские реквизиты</h2>
            <ul className="space-y-2.5">
              {BANK.map(r => (
                <li key={r.label} className="text-[16.5px] text-[#555] leading-relaxed">
                  <span className="text-[#999]">{r.label} — </span>
                  <span className="text-[#1A1A1A]">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ФОРМА */}
      <section id="contact-form" className="py-16 md:py-20 bg-[#1A1A1A] text-white scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[26px] sm:text-[34px] font-bold mb-3">Расскажите о задаче — предложим решение</h2>
          <p className="text-[18px] text-white/60 mb-8">
            Бесплатная консультация специалиста: подберём оборудование, компоновку линии и бюджет под вашу производительность.
          </p>

          {done ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <Icon name="CircleCheck" size={44} className="text-orange-500 mx-auto mb-4" />
              <p className="text-[19px] font-semibold mb-1">Заявка отправлена</p>
              <p className="text-[15px] text-white/60">Свяжемся с вами в рабочее время — Пн–Пт с 09:00 до 18:00.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-left text-[#1A1A1A]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ваше имя"
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 text-[15px] focus:outline-none focus:border-orange-500"
                  />
                  {errors.name && <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: formatPhoneRu(e.target.value) }))}
                    placeholder="+7 (___) ___-__-__"
                    inputMode="tel"
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 text-[15px] focus:outline-none focus:border-orange-500"
                  />
                  {errors.phone && <p className="text-[12px] text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>
              <textarea
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Коротко о задаче: продукт, объём, нужное оборудование"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-[15px] focus:outline-none focus:border-orange-500 mb-4"
              />
              <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 accent-orange-600 w-4 h-4" />
                <PolicyDisclaimer />
              </label>
              {errors.agree && <p className="text-[12px] text-red-600 mb-3">{errors.agree}</p>}
              <button onClick={submit} disabled={sending} className="btn-orange w-full disabled:opacity-60">
                {sending ? "Отправляем…" : "Получить консультацию"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="py-10 bg-[#111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="inline-block bg-white rounded-lg px-3 py-2 mb-4">
                <img src={LOGO_URL} alt="Техно-Сиб" className="h-8 w-auto" />
              </div>
              <p className="text-[15px] text-white/55 leading-relaxed max-w-xs">
                Поставка и сервис оборудования для пищевых производств. 25 лет на рынке.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Навигация</p>
              <ul className="space-y-2">
                {NAV.map(l => (
                  <li key={l.href}>
                    <button onClick={() => scrollTo(l.href)} className="text-sm text-white/65 hover:text-white transition-colors">
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
                {OFFICES.map(o => (
                  <li key={o.city} className="flex items-start gap-2">
                    <Icon name="MapPin" size={14} className="text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-[15px] text-white/65 leading-relaxed">{o.city} — {o.tag.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center space-y-3">
            <LegalInfo className="max-w-3xl mx-auto" />
            <p className="text-xs text-white/35">© 2026 Техно-Сиб. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
