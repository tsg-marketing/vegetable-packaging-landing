type Param = { name: string; value: string };
type Product = { params: Param[] };

export type FilterOption = { id: string; label: string; test: (p: Product) => boolean };
export type FilterGroup = { id: string; label: string; icon: string; options: FilterOption[] };

const norm = (s: string) => (s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

function findValues(p: Product, match: (name: string) => boolean): string[] {
  return p.params.filter(x => match(norm(x.name)) && x.value).map(x => x.value);
}

function parseRange(raw: string): [number, number] | null {
  const v = norm(raw);
  if (/не огр/.test(v) && !/\d/.test(v)) return [0, Infinity];
  const nums = (v.match(/\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(",", ".")));
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (/без огранич|не огр/.test(v) || /^(от|мин)/.test(v)) return [min, Infinity];
  if (/^до/.test(v)) return [0, max];
  if (nums.length === 1) return [min, min];
  return [min, max];
}

function rangeOf(p: Product, match: (name: string) => boolean): [number, number] | null {
  const ranges = findValues(p, match).map(parseRange).filter(Boolean) as [number, number][];
  if (ranges.length === 0) return null;
  return [Math.min(...ranges.map(r => r[0])), Math.max(...ranges.map(r => r[1]))];
}

function rangeGroup(
  id: string,
  label: string,
  icon: string,
  match: (name: string) => boolean,
  unit: string,
  buckets: [number, number][],
): FilterGroup {
  return {
    id,
    label,
    icon,
    options: buckets.map(([from, to]) => ({
      id: `${from}-${to}`,
      label: to === Infinity ? `от ${from} ${unit}` : from === 0 ? `до ${to} ${unit}` : `${from}–${to} ${unit}`,
      test: p => {
        const r = rangeOf(p, match);
        return !!r && r[0] <= to && r[1] >= from;
      },
    })),
  };
}

function textGroup(
  id: string,
  label: string,
  icon: string,
  match: (name: string) => boolean,
  options: { id: string; label: string; re: RegExp }[],
): FilterGroup {
  return {
    id,
    label,
    icon,
    options: options.map(o => ({
      id: o.id,
      label: o.label,
      test: p => findValues(p, match).some(v => o.re.test(norm(v))),
    })),
  };
}

export const FLOWPACK_FILTERS: FilterGroup[] = [
  rangeGroup(
    "speed",
    "Производительность",
    "Gauge",
    n => n.includes("расчетная производительность") && n.includes("/мин"),
    "уп/мин",
    [[0, 60], [60, 120], [120, 180], [180, Infinity]],
  ),
  rangeGroup(
    "length",
    "Длина пакета",
    "MoveHorizontal",
    n => n.includes("длина пакета"),
    "мм",
    [[0, 150], [150, 300], [300, 500], [500, Infinity]],
  ),
  rangeGroup(
    "width",
    "Ширина пакета",
    "MoveVertical",
    n => n.includes("ширина пакета"),
    "мм",
    [[0, 60], [60, 120], [120, 200], [200, Infinity]],
  ),
  textGroup("film", "Подача плёнки", "ArrowDownUp", n => n.includes("тип подачи пленки"), [
    { id: "bottom", label: "Нижняя", re: /^нижн/ },
    { id: "top", label: "Верхняя", re: /^верхн/ },
  ]),
  textGroup("conveyor", "Подающий конвейер", "Rows3", n => n.includes("тип подающего конвейера"), [
    { id: "chain", label: "Цепной с толкателями", re: /цепн.*с толкател/ },
    { id: "belt-push", label: "Ленточный с толкателями", re: /ленточн.*с толкател/ },
    { id: "belt", label: "Ленточный без толкателей", re: /ленточн.*без толкател/ },
  ]),
];

export type FilterState = Record<string, string | undefined>;

export function applyFilters<T extends Product>(list: T[], state: FilterState, skip?: string): T[] {
  const active = FLOWPACK_FILTERS.filter(g => g.id !== skip && state[g.id]);
  if (active.length === 0) return list;
  return list.filter(p =>
    active.every(g => g.options.find(o => o.id === state[g.id])?.test(p) ?? true),
  );
}
