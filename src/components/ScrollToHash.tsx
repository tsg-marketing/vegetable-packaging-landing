import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GROUP_LANDINGS } from "@/components/EquipmentMenu";

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const groupMatch = pathname === "/" && hash.match(/^#group-(.+)$/);
    if (groupMatch && GROUP_LANDINGS[groupMatch[1]]) {
      window.location.replace(GROUP_LANDINGS[groupMatch[1]]);
      return;
    }
    if (hash !== "#catalog") return;
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById("catalog");
      tries += 1;
      if (el) {
        el.scrollIntoView();
        if (tries > 3) clearInterval(timer);
      } else if (tries > 30) {
        clearInterval(timer);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [pathname, hash]);

  return null;
}
