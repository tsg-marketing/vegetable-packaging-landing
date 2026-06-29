// UTM-метки: каждая метка хранится в ОТДЕЛЬНОЙ cookie 30 дней
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = typeof UTM_KEYS[number];
export type UtmMap = Partial<Record<UtmKey, string>>;

const DAYS = 30;
// Старая кука с JSON — больше не используется, чистим при наличии
const LEGACY_COOKIE = "tsib_utm";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\+^]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export function captureUtm(): void {
  if (typeof window === "undefined") return;

  // Если когда-то писали в общую куку JSON — удалим её
  if (getCookie(LEGACY_COOKIE)) deleteCookie(LEGACY_COOKIE);

  const params = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(k => {
    const v = params.get(k);
    if (v) {
      // Каждая UTM-метка пишется в отдельную cookie с её именем
      setCookie(k, v, DAYS);
    }
  });
}

export function readUtm(): UtmMap {
  if (typeof window === "undefined") return {};
  const out: UtmMap = {};
  UTM_KEYS.forEach(k => {
    const v = getCookie(k);
    if (v) out[k] = v;
  });
  return out;
}

// Относительный URL текущей страницы лендинга (например "/gorizontalnoe", корень → "/")
export function currentPagePath(): string {
  if (typeof window === "undefined") return "";
  let path = window.location.pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}