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
