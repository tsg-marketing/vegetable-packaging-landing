import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useCompare } from "@/lib/compare";

export default function CompareBar() {
  const { items, clear } = useCompare();
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl">
      <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          {items.slice(0, 4).map(i => (
            <div key={i.id} className="w-10 h-10 rounded-lg bg-white border-2 border-[#1A1A1A] overflow-hidden">
              {i.picture && <img src={i.picture} alt="" className="w-full h-full object-contain" />}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 text-[14px] leading-tight">
          <div className="font-semibold">К сравнению: {items.length}</div>
          {items.length < 2 && <div className="text-white/60 text-[12px]">Выберите ещё хотя бы один товар</div>}
        </div>
        <button onClick={clear} className="text-white/60 hover:text-white p-2" aria-label="Очистить сравнение">
          <Icon name="Trash2" size={18} />
        </button>
        <Link
          to="/compare"
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] text-white inline-flex items-center gap-2 shrink-0"
          style={{ background: "var(--orange)", opacity: items.length < 2 ? 0.6 : 1, pointerEvents: items.length < 2 ? "none" : "auto" }}
        >
          <Icon name="Scale" size={16} />
          Сравнить
        </Link>
      </div>
    </div>
  );
}
