const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function productAnchor(name: string): string {
  const src = (name || "").trim();
  let out = "";
  let upper = true;
  for (const ch of src) {
    const low = ch.toLowerCase();
    if (MAP[low] !== undefined) {
      const t = MAP[low];
      out += upper ? t.charAt(0).toUpperCase() + t.slice(1) : t;
      upper = false;
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch;
      upper = false;
    } else if (/[-_.]/.test(ch)) {
      out += "-";
      upper = false;
    } else {
      upper = true;
    }
  }
  out = out.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  return out || "product";
}

export function buildAnchorMap<T extends { id: string; name: string }>(products: T[]): Record<string, string> {
  const used = new Set<string>();
  const map: Record<string, string> = {};
  for (const p of products) {
    if (!p || map[p.id]) continue;
    const base = productAnchor(p.name);
    let anchor = base;
    let i = 2;
    while (used.has(anchor.toLowerCase())) {
      anchor = `${base}-${i}`;
      i += 1;
    }
    used.add(anchor.toLowerCase());
    map[p.id] = anchor;
  }
  return map;
}
