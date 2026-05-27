import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export type QuizPayload = {
  product: string;
  packaging: string;
  volume: string;
  automation: string;
  name: string;
  phone: string;
  email: string;
  /** legacy совместимость: phone или email одной строкой */
  contact: string;
};

type Step = {
  title: string;
  options: string[];
  key: keyof Omit<QuizPayload, "name" | "contact">;
};

const STEPS: Step[] = [
  {
    title: "Какую продукцию вы упаковываете?",
    key: "product",
    options: [
      "Картофель, лук, морковь (корнеплоды)",
      "Цитрусовые, яблоки, фрукты",
      "Зелень, салат, огурцы",
      "Томаты черри, ягоды, деликатные продукты",
      "Чеснок (штучная упаковка)",
      "Несколько видов продукции",
    ],
  },
  {
    title: "В какой тип упаковки вы фасуете (или планируете)?",
    key: "packaging",
    options: [
      "Сетка-рукав под клипсу (стандарт для розничных сетей)",
      "Сетка на лотке (премиальный вид)",
      "Сетка-мешок 15–25 кг (опт, HoReCa)",
      "Плёнка (стрейч или flow-pack)",
      "Лотки с крышкой",
      "Пока не определились — нужна консультация",
    ],
  },
  {
    title: "Какой объём упаковки вам нужен?",
    key: "volume",
    options: [
      "До 20 упаковок/мин (малый участок, ручная подача)",
      "20–40 упаковок/мин (средняя линия)",
      "40–70 упаковок/мин (высокая производительность)",
      "Более 70 упаковок/мин (крупное производство, ритейл)",
    ],
  },
  {
    title: "Какой уровень автоматизации вас интересует?",
    key: "automation",
    options: [
      "Полуавтомат (оператор загружает продукт вручную)",
      "Автомат (встраивается в линию с дозатором)",
      "Полная линия «под ключ» (от подачи продукта до готовой упаковки)",
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuizPayload) => Promise<boolean>;
};

export default function Quiz({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
      setName("");
      setPhone("");
      setEmail("");
      setAgree(false);
      setErrors({});
      setSubmitting(false);
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const isFinal = step === STEPS.length;
  const totalProgress = isFinal ? 100 : Math.round((step / STEPS.length) * 100);

  const pick = (value: string) => {
    const current = STEPS[step];
    setAnswers(prev => ({ ...prev, [current.key]: value }));
    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const validate = () => {
    const e: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Введите имя";
    if (!isValidPhoneRu(phone)) e.phone = "Введите телефон в формате +7 и 10 цифр";
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = "Неверный формат e-mail";
    if (!agree) e.agree = "Необходимо согласие";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    const ok = await onSubmit({
      product: answers.product || "",
      packaging: answers.packaging || "",
      volume: answers.volume || "",
      automation: answers.automation || "",
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      contact: phone.trim() || email.trim(),
    });
    setSubmitting(false);
    if (ok) setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--orange)" }}>
                Подбор оборудования
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-tight">
                {done
                  ? "Спасибо! Заявка принята"
                  : isFinal
                    ? "Готово! Подобрали варианты под ваши задачи"
                    : `Вопрос ${step + 1} из ${STEPS.length}`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#999] flex-shrink-0"
              aria-label="Закрыть"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          {!done && (
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${totalProgress}%`, background: "var(--orange)" }}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 overflow-y-auto flex-1">
          {done ? (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(255,102,0,0.1)" }}
              >
                <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
              </div>
              <p className="text-[#555] leading-relaxed">
                Менеджер свяжется с вами в ближайшее время и пришлёт персональную подборку с ценами и видео работы машин.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 rounded-lg font-semibold text-white"
                style={{ background: "var(--orange)" }}
              >
                Закрыть
              </button>
            </div>
          ) : isFinal ? (
            <div>
              <p className="text-[#555] mb-5 leading-relaxed">
                Оставьте контакты — отправим персональную подборку оборудования с ценами и видео работы машин.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                    Имя <span style={{ color: "var(--orange)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(s => ({ ...s, name: undefined })); }}
                    placeholder="Иван Петров"
                    className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                    style={{ borderColor: errors.name ? "#E53935" : "#E0E0E0" }}
                  />
                  {errors.name && <p className="text-[13px] text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                    Телефон <span style={{ color: "var(--orange)" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(formatPhoneRu(e.target.value)); if (errors.phone) setErrors(s => ({ ...s, phone: undefined })); }}
                    onFocus={(e) => { if (!e.target.value) setPhone("+7 "); }}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                    style={{ borderColor: errors.phone ? "#E53935" : "#E0E0E0" }}
                  />
                  {errors.phone && <p className="text-[13px] text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(s => ({ ...s, email: undefined })); }}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                    style={{ borderColor: errors.email ? "#E53935" : "#E0E0E0" }}
                  />
                  {errors.email && <p className="text-[13px] text-red-500 mt-1">{errors.email}</p>}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={e => { setAgree(e.target.checked); if (errors.agree) setErrors(s => ({ ...s, agree: undefined })); }}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                  />
                  <PolicyDisclaimer />
                </label>
                {errors.agree && <p className="text-[13px] text-red-500 -mt-2">{errors.agree}</p>}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-lg font-semibold text-white text-base transition-opacity disabled:opacity-60"
                  style={{ background: "var(--orange)" }}
                >
                  {submitting ? "Отправляем..." : "Получить подборку"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg sm:text-xl font-semibold text-[#1A1A1A] mb-5 leading-snug">
                {STEPS[step].title}
              </p>
              <div className="space-y-2.5">
                {STEPS[step].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    className="w-full text-left px-4 py-3 rounded-lg border bg-white hover:bg-[#FFF6EF] transition-colors text-[#333] text-[15px] leading-snug"
                    style={{ borderColor: "#e5e5e5" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--orange)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (isFinal || step > 0) && (
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-[#FAFAFA] flex items-center justify-between">
            <button
              onClick={back}
              className="text-sm font-semibold text-[#666] hover:text-[#1A1A1A] flex items-center gap-1.5"
            >
              <Icon name="ChevronLeft" size={16} />
              Назад
            </button>
            <span className="text-xs text-[#999]">{totalProgress}% заполнено</span>
          </div>
        )}
      </div>
    </div>
  );
}