import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PolicyDisclaimer from "@/components/PolicyDisclaimer";
import { formatPhoneRu, isValidPhoneRu } from "@/lib/phone";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export type PalletQuizPayload = {
  answers: { question: string; answer: string }[];
  recommendation: string;
  name: string;
  phone: string;
  email: string;
};

type Option = { emoji: string; label: string; desc?: string };
type Step = { title: string; options: Option[] };

const STEPS: Step[] = [
  {
    title: "Какого размера ваши паллеты?",
    options: [
      { emoji: "📏", label: "800 × 1200 мм", desc: "Европаллета — самый распространённый размер" },
      { emoji: "📐", label: "1000 × 1200 мм", desc: "Финская паллета" },
      { emoji: "❓", label: "Другие размеры", desc: "нестандарт или несколько типоразмеров" },
    ],
  },
  {
    title: "Какая высота паллеты с грузом?",
    options: [
      { emoji: "📦", label: "До 2000 мм" },
      { emoji: "🏗️", label: "До 2400 мм" },
      { emoji: "❓", label: "Другая высота" },
    ],
  },
  {
    title: "Какой вес паллеты с грузом?",
    options: [
      { emoji: "🪶", label: "До 800 кг" },
      { emoji: "⚖️", label: "До 2000 кг" },
      { emoji: "🏋️", label: "Более 2000 кг" },
    ],
  },
  {
    title: "Сколько паллет упаковываете в день?",
    options: [
      { emoji: "🔟", label: "До 20 паллет" },
      { emoji: "📈", label: "20–50 паллет" },
      { emoji: "🏭", label: "Более 50 паллет" },
    ],
  },
  {
    title: "Какой тип оборудования рассматриваете?",
    options: [
      { emoji: "🔄", label: "Стационарный", desc: "с поворотным столом, паллета вращается" },
      { emoji: "🤖", label: "Мобильный", desc: "робот ездит вокруг паллеты, место не нужно" },
    ],
  },
];

const TOTAL_STEPS = STEPS.length + 1;

/** Подбор модели по ответам — алгоритм согласован с каталогом ТЕХНОСИБ. */
export function recommendModel(answers: string[]): string {
  const [size, , weight, volume, kind] = answers;

  if (kind && kind.startsWith("Мобильный")) return "ROBO-MS";

  const eShapedTable = (size || "").startsWith("800") || (weight || "").startsWith("До 800");
  const highVolume = (volume || "").startsWith("Более 50");
  const lowVolume = (volume || "").startsWith("До 20");

  const prestretch = highVolume ? "SPS" : lowVolume ? "MR" : "SPS";

  if (eShapedTable) return `TS3000${prestretch}-MT`;
  return `TS3000${prestretch}-H`;
}

type Props = {
  variant?: "inline" | "modal";
  open?: boolean;
  onClose?: () => void;
  onSubmit: (data: PalletQuizPayload) => Promise<boolean>;
};

export default function PalletQuiz({ variant = "modal", open = true, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (variant === "modal" && open) {
      setStep(0); setAnswers([]); setName(""); setPhone(""); setEmail("");
      setAgree(false); setErrors({}); setSubmitting(false); setDone(false);
    }
  }, [open, variant]);

  useEffect(() => {
    if (variant !== "modal" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, variant]);

  if (variant === "modal" && !open) return null;

  const isFinal = step === STEPS.length;
  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  const recommendation = recommendModel(answers);

  const pick = (value: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[step] = value;
      return next;
    });
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
      answers: STEPS.map((s, i) => ({ question: s.title, answer: answers[i] || "—" })),
      recommendation,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setSubmitting(false);
    if (ok) setDone(true);
  };

  const body = (
    <>
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
            <h3 className="font-bold text-[22px] text-[#1A1A1A] mb-3 leading-tight">Спасибо за обращение в нашу компанию</h3>
            <p className="text-[#555] leading-relaxed mb-6">Менеджер свяжется с Вами в ближайшее время в часы работы.</p>
            {onClose && <button onClick={onClose} className="btn-orange px-10 py-3">Хорошо</button>}
          </div>
        ) : isFinal ? (
          <div>
            <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(255,102,0,0.08)" }}>
              <p className="text-[12px] uppercase tracking-wider text-[#666] mb-1">Рекомендуем модель</p>
              <p className="text-2xl font-bold" style={{ color: "var(--orange)" }}>{recommendation}</p>
              <p className="text-[13px] text-[#666] mt-1.5">Подтвердим подбор и пришлём цену с характеристиками</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                  Имя <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <input type="text" value={name} placeholder="Иван Петров"
                  onChange={e => { setName(e.target.value); if (errors.name) setErrors(s => ({ ...s, name: undefined })); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: errors.name ? "#E53935" : "#E0E0E0" }} />
                {errors.name && <p className="text-[13px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">
                  Телефон <span style={{ color: "var(--orange)" }}>*</span>
                </label>
                <input type="tel" value={phone} placeholder="+7 (___) ___-__-__"
                  onChange={e => { setPhone(formatPhoneRu(e.target.value)); if (errors.phone) setErrors(s => ({ ...s, phone: undefined })); }}
                  onFocus={e => { if (!e.target.value) setPhone("+7 "); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: errors.phone ? "#E53935" : "#E0E0E0" }} />
                {errors.phone && <p className="text-[13px] text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block">Email</label>
                <input type="email" value={email} placeholder="your@email.com"
                  onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(s => ({ ...s, email: undefined })); }}
                  className="w-full px-4 py-3 rounded-lg border bg-white text-[#1A1A1A] text-base outline-none transition-colors"
                  style={{ borderColor: errors.email ? "#E53935" : "#E0E0E0" }} />
                {errors.email && <p className="text-[13px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agree}
                  onChange={e => { setAgree(e.target.checked); if (errors.agree) setErrors(s => ({ ...s, agree: undefined })); }}
                  className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                <PolicyDisclaimer />
              </label>
              {errors.agree && <p className="text-[13px] text-red-500 -mt-2">{errors.agree}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={back} className="btn-outline-orange px-5 py-3">Назад</button>
                <button onClick={submit} disabled={submitting} className="btn-orange flex-1 py-3 disabled:opacity-60">
                  {submitting ? "Отправляем..." : "Получить подбор"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-5">{STEPS[step].title}</h3>
            <div className="space-y-2.5">
              {STEPS[step].options.map(o => (
                <button key={o.label} onClick={() => pick(o.label)}
                  className="w-full text-left px-4 py-3.5 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-[#FFF8F3] transition-all flex items-start gap-3">
                  <span className="text-[22px] leading-none flex-shrink-0">{o.emoji}</span>
                  <span>
                    <span className="block font-semibold text-[#1A1A1A] text-[15px]">{o.label}</span>
                    {o.desc && <span className="block text-[13px] text-[#777] mt-0.5">{o.desc}</span>}
                  </span>
                </button>
              ))}
            </div>
            {step > 0 && (
              <button onClick={back} className="mt-5 text-[14px] text-[#666] hover:text-orange-600 inline-flex items-center gap-1.5">
                <Icon name="ChevronLeft" size={16} />
                Назад
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (variant === "inline") {
    return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg relative my-auto flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10" aria-label="Закрыть">
          <Icon name="X" size={18} className="text-[#1A1A1A]" />
        </button>
        {body}
      </div>
    </div>
  );
}
