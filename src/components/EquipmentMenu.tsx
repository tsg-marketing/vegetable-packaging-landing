import { useEffect, useState } from "react";

export type EquipmentLink = { label: string; href: string };

export const EQUIPMENT_LINKS: EquipmentLink[] = [
  { label: "Вакуумные упаковщики", href: "/vacuum" },
  { label: "Термоусадочное оборудование", href: "/termousadka" },
  { label: "Запайщики лотков (трейсилеры)", href: "/traysealers" },
  { label: "Упаковка овощей и фруктов", href: "/vegetables" },
  { label: "Картонажное оборудование", href: "/kartonajnoe" },
  { label: "Горизонтальные машины flow-pack", href: "/gorizontalnoe" },
  { label: "Обандероливающие машины", href: "/obanderolivanie" },
];

const GROUPS_API = "https://functions.poehali.dev/ed4e9bba-a8d4-434c-af4e-52809800893d";

type Group = { id: string; name: string };

let groupsCache: Promise<Group[]> | null = null;

function loadGroups(): Promise<Group[]> {
  if (!groupsCache) {
    groupsCache = fetch(GROUPS_API)
      .then(r => r.json())
      .then(j => (Array.isArray(j?.groups) ? j.groups.map((g: Group) => ({ id: g.id, name: g.name })) : []))
      .catch(() => {
        groupsCache = null;
        return [];
      });
  }
  return groupsCache;
}

export function useEquipmentGroups(): Group[] {
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadGroups().then(g => { if (!cancelled) setGroups(g); });
    return () => { cancelled = true; };
  }, []);
  return groups;
}

type Props = { currentHref?: string; variant: "desktop" | "mobile" };

export default function EquipmentMenu({ currentHref, variant }: Props) {
  const groups = useEquipmentGroups();

  if (variant === "mobile") {
    return (
      <>
        {EQUIPMENT_LINKS.map(l => (
          <a
            key={l.href}
            href={l.href}
            className={`block text-base py-1.5 pl-2 ${l.href === currentHref ? "text-orange-600 font-semibold" : "text-[#444]"}`}
          >
            {l.label}
          </a>
        ))}
        {groups.length > 0 && <div className="my-2 border-t border-gray-100" />}
        {groups.map(g => (
          <a key={g.id} href={`/#group-${g.id}`} className="block text-[15px] text-[#666] py-1.5 pl-2">
            {g.name}
          </a>
        ))}
      </>
    );
  }

  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg py-2 min-w-[320px] max-h-[70vh] overflow-auto">
      {EQUIPMENT_LINKS.map(l => (
        <a
          key={l.href}
          href={l.href}
          className={`block px-4 py-2 text-sm transition-colors hover:bg-[#FFF5EE] ${l.href === currentHref ? "text-orange-600 font-semibold" : "text-[#444] hover:text-orange-600"}`}
        >
          {l.label}
        </a>
      ))}
      {groups.length > 0 && <div className="my-2 border-t border-gray-100" />}
      {groups.map(g => (
        <a
          key={g.id}
          href={`/#group-${g.id}`}
          className="block px-4 py-2 text-sm text-[#666] hover:bg-[#FFF5EE] hover:text-orange-600 transition-colors"
        >
          {g.name}
        </a>
      ))}
    </div>
  );
}
