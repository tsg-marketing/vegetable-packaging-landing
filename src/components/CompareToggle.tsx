import Icon from "@/components/ui/icon";
import { useCompare } from "@/lib/compare";

type Props = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  picture?: string;
  url?: string;
  params?: { name: string; value: string }[];
  source: string;
  className?: string;
};

const HIDDEN = /налич|видео|guid|картинки товара|фид/i;

export default function CompareToggle({ id, name, brand, price, picture, url, params, source, className }: Props) {
  const { has, toggle } = useCompare();
  const active = has(id);

  const onChange = () =>
    toggle({
      id,
      name,
      brand,
      price,
      picture: picture || "",
      url,
      params: (params || []).filter(p => p.name && p.value && !HIDDEN.test(p.name)),
      source,
    });

  return (
    <label
      title={active ? "Убрать из сравнения" : "Добавить к сравнению"}
      aria-label="Сравнить"
      onClick={e => e.stopPropagation()}
      className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer select-none border shadow-sm ${className || ""}`}
      style={active
        ? { background: "var(--orange)", color: "#fff", borderColor: "var(--orange)" }
        : { background: "rgba(255,255,255,0.95)", color: "#444", borderColor: "#e5e5e5" }}
    >
      <input type="checkbox" checked={active} onChange={onChange} className="w-3.5 h-3.5 accent-white" />
      <Icon name="Scale" size={16} />
    </label>
  );
}
