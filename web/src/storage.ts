import type { Mode } from './types.ts';

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

// Detective mode (plain words) is the default; Code mode shows the technical wording and the real lines.
const MODE_KEY = 'code-crew-mode';

export function getMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'code' ? 'code' : 'detective';
  } catch {
    return 'detective';
  }
}

export function saveMode(mode: Mode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // storage is unavailable: the choice just is not remembered
  }
}
