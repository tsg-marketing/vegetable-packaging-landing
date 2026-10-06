import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useCompare } from "@/lib/compare";
import { formatPrice } from "@/lib/shrinkCatalog";
import { useSeo } from "@/lib/seo";

const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");

export default function Compare() {
  useSeo({
    title: "Сравнение товаров | Техно-Сиб",
    description: "Сравнение характеристик выбранного оборудования Техно-Сиб.",
  });

  const { items, remove, clear } = useCompare();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const backHref = items[items.length - 1]?.source || "/";

  const rows = useMemo(() => {
    const order: string[] = [];
    const titles: Record<string, string> = {};
    const values: Record<string, Record<string, string>> = {};
    for (const it of items) {
      for (const p of it.params) {
        const k = norm(p.name);
        if (!titles[k]) {
          titles[k] = p.name;
          order.push(k);
          values[k] = {};
        }
        values[k][it.id] = p.value;
      }
    }
    return order.map(k => ({ key: k, title: titles[k], values: values[k] }));
  }, [items]);

  const isDiff = (vals: (string | undefined)[]) => new Set(vals.map(v => norm(v || "—"))).size > 1;

  const baseRows = [
    { key: "__brand", title: "Бренд", values: Object.fromEntries(items.map(i => [i.id, i.brand || ""])) },
    { key: "__price", title: "Цена", values: Object.fromEntries(items.map(i => [i.id, formatPrice(i.price)])) },
  ];
  const allRows = [...baseRows, ...rows];
  const visibleRows = onlyDiff && items.length > 1
    ? allRows.filter(r => isDiff(items.map(i => r.values[i.id])))
    : allRows;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={backHref} className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#444] hover:text-[#1A1A1A]">
            <Icon name="ArrowLeft" size={18} />
            Вернуться в каталог
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Сравнение товаров</h1>
            <p className="text-[#666] mt-1">Выбрано: {items.length}</p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-[14px] text-[#444] cursor-pointer select-none">
                <input type="checkbox" checked={onlyDiff} onChange={e => setOnlyDiff(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                Только различия
              </label>
              <button onClick={clear} className="text-[14px] font-semibold px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#444] hover:border-gray-300 inline-flex items-center gap-2">
                <Icon name="Trash2" size={16} />
                Очистить
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <Icon name="Scale" size={36} className="mx-auto mb-3 text-[#999]" />
            <p className="text-[#1A1A1A] font-semibold mb-1">Список сравнения пуст</p>
            <p className="text-sm text-[#666] mb-5">Отметьте галочкой «Сравнить» товары в каталоге</p>
            <Link to="/pallet#catalog" className="btn-orange">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
            <table className="border-collapse text-[14px]" style={{ minWidth: 220 + items.length * 240 }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-white w-[220px] min-w-[220px] border-b border-r border-gray-100 p-4 text-left align-bottom text-[12px] uppercase tracking-wider font-bold text-[#888]">
                    Характеристика
                  </th>
                  {items.map(it => (
                    <th key={it.id} className="w-[240px] min-w-[240px] border-b border-r border-gray-100 p-4 align-top text-left font-normal relative">
                      <button
                        onClick={() => remove(it.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center text-[#999] hover:text-[#1A1A1A]"
                        aria-label="Убрать из сравнения"
                      >
                        <Icon name="X" size={16} />
                      </button>
                      <div className="aspect-[4/3] bg-white flex items-center justify-center mb-3">
                        {it.picture ? (
                          <img src={it.picture} alt={it.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Icon name="Image" size={32} className="text-gray-300" />
                        )}
                      </div>
                      <div className="font-bold text-[#1A1A1A] leading-snug">{it.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, idx) => {
                  const diff = items.length > 1 && isDiff(items.map(i => r.values[i.id]));
                  const bg = idx % 2 ? "#FAFAFA" : "#FFFFFF";
                  return (
                    <tr key={r.key} style={{ background: bg }}>
                      <td className="sticky left-0 z-10 border-b border-r border-gray-100 px-4 py-3 text-[#666] align-top" style={{ background: bg }}>
                        {r.title}
                      </td>
                      {items.map(it => {
                        const v = r.values[it.id];
                        return (
                          <td
                            key={it.id}
                            className="border-b border-r border-gray-100 px-4 py-3 align-top"
                            style={{
                              color: v ? "#1A1A1A" : "#BBB",
                              fontWeight: r.key === "__price" ? 700 : diff ? 600 : 400,
                              ...(r.key === "__price" && v ? { color: "var(--orange)" } : {}),
                            }}
                          >
                            {v || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
