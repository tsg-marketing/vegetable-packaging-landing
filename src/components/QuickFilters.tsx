import { useState } from "react";
import Icon from "@/components/ui/icon";
import { FilterGroup, FilterState, applyFilters } from "@/lib/flowpackFilters";

type Props<T extends { params: { name: string; value: string }[] }> = {
  groups: FilterGroup[];
  products: T[];
  value: FilterState;
  onChange: (v: FilterState) => void;
};

export default function QuickFilters<T extends { params: { name: string; value: string }[] }>({
  groups,
  products,
  value,
  onChange,
}: Props<T>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const activeCount = Object.values(value).filter(Boolean).length;
  const openGroup = groups.find(g => g.id === openId) || null;

  const btn = (active: boolean) =>
    active
      ? { background: "var(--orange)", color: "#fff", borderColor: "var(--orange)" }
      : { background: "#fff", color: "#1A1A1A", borderColor: "#E5E5E5" };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap justify-center gap-2">
        {groups.map(g => {
          const selected = g.options.find(o => o.id === value[g.id]);
          const isOpen = openId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setOpenId(isOpen ? null : g.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-[14px] font-semibold transition-all hover:shadow-sm"
              style={selected ? btn(true) : isOpen ? { ...btn(false), borderColor: "var(--orange)", color: "var(--orange)" } : btn(false)}
            >
              <Icon name={g.icon} size={16} fallback="SlidersHorizontal" />
              {selected ? `${g.label}: ${selected.label}` : g.label}
              <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} />
            </button>
          );
        })}
        <button
          onClick={() => {
            onChange({});
            setOpenId(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-[14px] font-semibold transition-all hover:shadow-sm"
          style={btn(activeCount === 0)}
        >
          <Icon name="LayoutGrid" size={16} />
          Все машины
        </button>
      </div>

      {openGroup && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {openGroup.options.map(o => {
            const active = value[openGroup.id] === o.id;
            const count = applyFilters(products, { ...value, [openGroup.id]: o.id }).length;
            const disabled = count === 0 && !active;
            return (
              <button
                key={o.id}
                disabled={disabled}
                onClick={() => {
                  onChange({ ...value, [openGroup.id]: active ? undefined : o.id });
                  setOpenId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={active ? btn(true) : { background: "rgba(255,102,0,0.06)", color: "#1A1A1A", borderColor: "rgba(255,102,0,0.25)" }}
              >
                {o.label}
                <span className={active ? "text-white/80" : "text-[#999]"}>({count})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
