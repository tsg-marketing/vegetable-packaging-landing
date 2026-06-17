import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export type CartonQuizPayload = {
  task: string;
  size: string;
  speed: string;
  options: string[];
  name: string;
  phone: string;
  email: string;
};

type Option = { icon: string; label: string; desc?: string };
type SingleStep = {
  kind: "single";
  title: string;
  key: "task" | "size";
  options: Option[];
};

const TASK_OPTIONS: Option[] = [
  { icon: "Hammer", label: "Собрать короб из заготовки", desc: "Формирователь коробов" },
  { icon: "Target", label: "Заклеить уже собранный короб", desc: "Заклейщик коробов" },
  { icon: "RefreshCw", label: "И собрать, и заклеить", desc: "Комбо / линия" },
  { icon: "HelpCircle", label: "Не знаю — нужна помощь инженера" },
];

const SIZE_OPTIONS: Option[] = [
  { icon: "Circle", label: "Малый", desc: "до 300×200 мм — посылки, e-commerce" },
  { icon: "CircleDot", label: "Средний", desc: "до 500×400 мм — стандартная тара" },
  { icon: "Square", label: "Крупный", desc: "до 600 мм и выше" },
  { icon: "Maximize", label: "Разные размеры", desc: "нужна частая переналадка" },
];

const SPEED_OPTIONS = [
  "До 12 коробов/мин — небольшой объём",
  "12–25 коробов/мин — среднее производство",
  "25–50 коробов/мин — высоконагруженный поток",
];

const FUNCTION_OPTIONS = [
  "Полная автоматика без оператора",
  "Работа в составе линии (WMS, конвейеры)",
  "Тяжёлые короба (от 30 кг)",
  "Эко-упаковка (крафт-лента)",
  "Защита от вскрытия (термоклей)",
  "Брендированный скотч с логотипом",
  "Ограниченный бюджет",
];

const SINGLE_STEPS: SingleStep[] = [
  { kind: "single", title: "Что нужно сделать с коробом?", key: "task", options: TASK_OPTIONS },
  { kind: "single", title: "Какой размер короба?", key: "size", options: SIZE_OPTIONS },
];

// Шаги: 0 — задача, 1 — размер, 2 — скорость + опции, 3 — контакты
const TOTAL_STEPS = SINGLE_STEPS.length + 2;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CartonQuizPayload) => Promise<boolean>;
};

export default function CartonQuiz({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [task, setTask] = useState("");
  const [size, setSize] = useState("");
  const [speed, setSpeed] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [speedError, setSpeedError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0); setTask(""); setSize(""); setSpeed(""); setOptions([]);
      setName(""); setPhone(""); setEmail("");
      setAgree(false); setErrors({}); setSpeedError(false); setSubmitting(false); setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const optionsStep = SINGLE_STEPS.length;
  const isOptionsStep = step === optionsStep;
  const isFinal = step === SINGLE_STEPS.length + 1;
  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  const pickSingle = (key: "task" | "size", value: string) => {
    if (key === "task") setTask(value); else setSize(value);
    setStep(s => s + 1);
  };

  const toggleOption = (value: string) => {
    setOptions(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
  };

  const nextFromOptions = () => {
    if (!speed) { setSpeedError(true); return; }
    setSpeedError(false);
    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const validate = () => {
    const e: { name?: string; phone?: string; email?: string; agree?: string } = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Введите имя";
    if (!isValidPhoneRu(phone)) e.phone = "Введите телефон в формате +7 и 10 цифр";
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = "Неверный e-mail";
    if (!agree) e.agree = "Необходимо согласие";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (submitting || !validate()) return;
    setSubmitting(true);
    const ok = await onSubmit({
      task,
      size,
      speed,
      options,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setSubmitting(false);
    if (ok) setDone(true);
  };

  const currentSingle = !isOptionsStep && !isFinal ? SINGLE_STEPS[step] : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#999] bg-white">
          <Icon name="X" size={20} />
        </button>

        <div className="px-4 sm:px-6 md:px-8 pt-5 sm:pt-6 pb-4 pr-12 sm:pr-14">
          <p className="text-[12px] text-[#888] mb-2">Шаг {Math.min(step + 1, TOTAL_STEPS)} из {TOTAL_STEPS}</p>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--orange)" }} />
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 overflow-y-auto flex-1">
          {done ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,102,0,0.1)" }}>
                <Icon name="Check" size={32} style={{ color: "var(--orange)" }} />
              </div>
              <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-3 leading-tight">Благодарим за обращение в компанию Техно-Сиб</h3>
              <p className="text-[#555] leading-relaxed mb-6">Менеджер свяжется с Вами в ближайшее время в часы работы.</p>
              <button onClick={onClose} className="btn-orange px-10 py-3">Хорошо</button>
            </div>
          ) : isFinal ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-2">Отлично! Осталось оставить контакты</h3>
              <p className="text-[#666] text-[14px] mb-5">Подберём 2–3 модели под ваши параметры и пришлём цены</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                    Имя <span style={{ color: "var(--orange)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    placeholder="Иван Петров"
                    onChange={e => { setName(e.target.value); if (errors.name) setErrors(s => ({ ...s, name: undefined })); }}
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
                    placeholder="+7 (___) ___-__-__"
                    onChange={e => { setPhone(formatPhoneRu(e.target.value)); if (errors.phone) setErrors(s => ({ ...s, phone: undefined })); }}
                    onFocus={e => { if (!e.target.value) setPhone("+7 "); }}
                    className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                    style={{ borderColor: errors.phone ? "#E53935" : "#E0E0E0" }}
                  />
                  {errors.phone && <p className="text-[13px] text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                    Email или мессенджер
                  </label>
                  <input
                    type="text"
                    value={email}
                    placeholder="your@email.com / @telegram"
                    onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(s => ({ ...s, email: undefined })); }}
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
                  className="w-full py-3.5 rounded-lg font-semibold text-white text-base transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  style={{ background: "var(--orange)" }}
                >
                  <Icon name="Send" size={18} />
                  {submitting ? "Отправляем..." : "Получить подбор оборудования"}
                </button>
              </div>
            </div>
          ) : isOptionsStep ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-5 leading-snug">Производительность и требования</h3>

              <p className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-2.5">
                Какая производительность нужна? <span style={{ color: "var(--orange)" }}>*</span>
              </p>
              <div className="grid gap-2.5 grid-cols-1 mb-6">
                {SPEED_OPTIONS.map(opt => {
                  const active = speed === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => { setSpeed(opt); setSpeedError(false); }}
                      className="text-left p-3 rounded-xl border bg-white transition-all flex items-center gap-3"
                      style={{ borderColor: active ? "var(--orange)" : "#e8e8e8", boxShadow: active ? "0 0 0 1px var(--orange)" : "none" }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: active ? "var(--orange)" : "#ccc", background: active ? "var(--orange)" : "transparent" }}>
                        {active && <Icon name="Check" size={14} className="text-white" />}
                      </span>
                      <span className="font-semibold text-[#1A1A1A] text-[14px] leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {speedError && <p className="text-[13px] text-red-500 -mt-4 mb-4">Выберите производительность</p>}

              <p className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-2.5">
                Дополнительные требования <span className="normal-case text-[#aaa] font-normal">(можно несколько)</span>
              </p>
              <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 mb-2">
                {FUNCTION_OPTIONS.map(opt => {
                  const active = options.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      className="text-left p-3 rounded-xl border bg-white transition-all flex items-center gap-3"
                      style={{ borderColor: active ? "var(--orange)" : "#e8e8e8", boxShadow: active ? "0 0 0 1px var(--orange)" : "none" }}
                    >
                      <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border" style={{ borderColor: active ? "var(--orange)" : "#ccc", background: active ? "var(--orange)" : "transparent" }}>
                        {active && <Icon name="Check" size={14} className="text-white" />}
                      </span>
                      <span className="font-semibold text-[#1A1A1A] text-[14px] leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={nextFromOptions}
                className="w-full mt-5 py-3.5 rounded-lg font-semibold text-white text-base inline-flex items-center justify-center gap-2"
                style={{ background: "var(--orange)" }}
              >
                Далее
                <Icon name="ArrowRight" size={18} />
              </button>
            </div>
          ) : currentSingle ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-5 leading-snug">{currentSingle.title}</h3>
              <div className="grid gap-2.5 grid-cols-1">
                {currentSingle.options.map(opt => (
                  <button key={opt.label} onClick={() => pickSingle(currentSingle.key, opt.label)}
                    className="text-left p-3 rounded-xl border bg-white hover:shadow-sm transition-all flex items-start gap-3"
                    style={{ borderColor: "#e8e8e8" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--orange)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e8e8")}>
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,102,0,0.1)" }}>
                      <Icon name={opt.icon} fallback="Package" size={18} style={{ color: "var(--orange)" }} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-[#1A1A1A] text-[14px] leading-snug">{opt.label}</span>
                      {opt.desc && <span className="block text-[12px] text-[#888] mt-0.5 leading-snug">{opt.desc}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {!done && step > 0 && (
          <div className="px-4 sm:px-6 md:px-8 py-3 border-t border-gray-100 bg-[#FAFAFA]">
            <button onClick={back} className="text-sm font-semibold text-[#666] hover:text-[#1A1A1A] flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={16} />Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
