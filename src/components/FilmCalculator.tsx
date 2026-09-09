import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";

export type CalcInputs = {
  thickness: number;
  length: number;
  width: number;
  turns: number;
  perDay: number;
  daysPerYear: number;
  pricePerKg: number;
};

export type CalcRow = {
  key: string;
  title: string;
  stretch: number;
  gramsPerPallet: number;
  costPerPallet: number;
  kgPerYear: number;
  costPerYear: number;
};

const DEFAULTS: CalcInputs = {
  thickness: 23,
  length: 1200,
  width: 800,
  turns: 16,
  perDay: 50,
  daysPerYear: 220,
  pricePerKg: 300,
};

const FILM_ROLL_WIDTH_M = 0.5;
const FILM_DENSITY = 920;

const MODES = [
  { key: "manual", title: "Ручная обмотка", stretch: 0, waste: 0 },
  { key: "machine", title: "Машина без предрастяжения", stretch: 50, waste: 40 },
  { key: "prestretch", title: "Машина с предрастяжением", stretch: 250, waste: 10 },
];

export function computeRows(v: CalcInputs): CalcRow[] {
  const perimeter = ((v.length + v.width) * 2) / 1000;
  const thicknessM = v.thickness / 1_000_000;

  return MODES.map(m => {
    const coef = 100 / (100 + m.stretch);
    const volume = perimeter * FILM_ROLL_WIDTH_M * thicknessM * v.turns * coef;
    const grams = volume * FILM_DENSITY * 1000 + m.waste;
    const costPerPallet = (grams / 1000) * v.pricePerKg;
    const kgPerYear = (grams * v.perDay * v.daysPerYear) / 1000;
    return {
      key: m.key,
      title: m.title,
      stretch: m.stretch,
      gramsPerPallet: grams,
      costPerPallet,
      kgPerYear,
      costPerYear: kgPerYear * v.pricePerKg,
    };
  });
}

const num = (n: number, digits = 0) =>
  new Intl.NumberFormat("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

const FIELDS: { key: keyof CalcInputs; label: string; hint?: string }[] = [
  { key: "thickness", label: "Толщина плёнки, мкм" },
  { key: "length", label: "Длина паллеты, мм" },
  { key: "width", label: "Ширина паллеты, мм" },
  { key: "turns", label: "Оборотов плёнки" },
  { key: "perDay", label: "Паллет в сутки" },
  { key: "daysPerYear", label: "Рабочих дней в году" },
  { key: "pricePerKg", label: "Цена плёнки, руб/кг" },
];

type Props = {
  variant?: "compact" | "full";
  onRequestKp?: (summary: { inputs: CalcInputs; rows: CalcRow[] }) => void;
};

export default function FilmCalculator({ variant = "compact", onRequestKp }: Props) {
  const [values, setValues] = useState<CalcInputs>(DEFAULTS);
  const [shown, setShown] = useState(false);

  const rows = useMemo(() => computeRows(values), [values]);
  const manual = rows[0];
  const savings = rows.slice(1).map(r => ({
    title: r.title,
    money: manual.costPerYear - r.costPerYear,
    kg: manual.kgPerYear - r.kgPerYear,
  }));

  const setField = (key: keyof CalcInputs, raw: string) => {
    const n = Number(raw.replace(/[^\d.]/g, ""));
    setValues(v => ({ ...v, [key]: Number.isFinite(n) ? n : 0 }));
  };

  return (
    <div>
      <div className={`grid gap-4 mb-6 ${variant === "full" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-4"}`}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="text-[12px] font-semibold text-[#888] uppercase tracking-wide mb-1.5 block leading-tight">
              {f.label}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={values[f.key]}
              onChange={e => setField(f.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-[#1A1A1A] text-[15px] outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        ))}
      </div>

      <button onClick={() => setShown(true)} className="btn-orange px-7 py-3 inline-flex items-center gap-2">
        <Icon name="Calculator" size={18} />
        Рассчитать
      </button>

      {shown && (
        <div className="mt-8">
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-[14px] min-w-[640px]">
              <thead>
                <tr className="bg-[#FAFAFA]">
                  <th className="text-left font-semibold text-[#666] px-4 py-3">Показатель</th>
                  {rows.map(r => (
                    <th key={r.key} className="text-left font-bold text-[#1A1A1A] px-4 py-3">{r.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-[#666]">Растяжение плёнки</td>
                  {rows.map(r => <td key={r.key} className="px-4 py-3 text-[#1A1A1A]">{r.stretch}%</td>)}
                </tr>
                <tr className="bg-[#FAFAFA]">
                  <td className="px-4 py-3 text-[#666]">Расход на паллету</td>
                  {rows.map(r => <td key={r.key} className="px-4 py-3 text-[#1A1A1A]">{num(r.gramsPerPallet)} г</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#666]">Стоимость упаковки паллеты</td>
                  {rows.map(r => <td key={r.key} className="px-4 py-3 text-[#1A1A1A]">{num(r.costPerPallet, 2)} ₽</td>)}
                </tr>
                <tr className="bg-[#FAFAFA]">
                  <td className="px-4 py-3 text-[#666]">Расход плёнки в год</td>
                  {rows.map(r => <td key={r.key} className="px-4 py-3 text-[#1A1A1A]">{num(r.kgPerYear)} кг</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-[#1A1A1A]">Затраты в год</td>
                  {rows.map(r => (
                    <td key={r.key} className="px-4 py-3 font-bold" style={{ color: "var(--orange)" }}>
                      {num(r.costPerYear)} ₽
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {savings.map(s => (
              <div key={s.title} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,102,0,0.25)", background: "rgba(255,102,0,0.05)" }}>
                <p className="text-[13px] text-[#666] mb-1">Экономия против ручной обмотки</p>
                <p className="font-bold text-[#1A1A1A] text-[15px] mb-2">{s.title}</p>
                <p className="text-[26px] font-bold leading-tight" style={{ color: "var(--orange)" }}>
                  {s.money > 0 ? num(s.money) : 0} ₽ в год
                </p>
                <p className="text-[13px] text-[#666] mt-1">и {s.kg > 0 ? num(s.kg) : 0} кг плёнки</p>
              </div>
            ))}
          </div>

          {onRequestKp && (
            <button
              onClick={() => onRequestKp({ inputs: values, rows })}
              className="btn-orange mt-6 px-7 py-3.5 inline-flex items-center gap-2"
            >
              <Icon name="FileText" size={18} />
              Получить расчёт и КП на почту
            </button>
          )}
        </div>
      )}
    </div>
  );
}
