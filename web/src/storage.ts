// Best score per case, kept in this browser only. Everything is wrapped: private windows and blocked storage must not break the game.
const KEY = 'code-crew-best';

export function getBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export function saveBest(caseId: string, points: number): void {
  try {
    const all = getBest();
    if (points > (all[caseId] ?? -1)) localStorage.setItem(KEY, JSON.stringify({ ...all, [caseId]: points }));
  } catch {
    // storage is unavailable: the score just is not remembered
  }
}
