import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
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
