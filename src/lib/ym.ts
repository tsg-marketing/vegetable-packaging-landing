type YmFn = (counterId: number, method: string, ...args: unknown[]) => void;

const COUNTER_ID = 109467448;

function getYm(): YmFn | null {
  if (typeof window === "undefined") return null;
  const ym = (window as unknown as { ym?: YmFn }).ym;
  return typeof ym === "function" ? ym : null;
}

export function ymGoal(goal: string): void {
  const ym = getYm();
  if (ym) ym(COUNTER_ID, "reachGoal", goal);
}

/**
 * ClientID Яндекс.Метрики через официальный API с резервом из cookie _ym_uid.
 * Никогда не блокирует отправку заявки: при недоступности Метрики резолвится
 * значением из cookie или пустой строкой (таймаут 600 мс).
 */
export function getYaClientId(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve("");
    const fromCookie = (): string => {
      const m = document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : "";
    };
    const ym = getYm();
    if (!ym) return resolve(fromCookie());
    let done = false;
    const finish = (v?: string) => {
      if (done) return;
      done = true;
      resolve(v || fromCookie());
    };
    try {
      ym(COUNTER_ID, "getClientID", (id: string) => finish(String(id)));
    } catch {
      finish("");
    }
    setTimeout(() => finish(""), 600);
  });
}