import type { CaseData } from './types.ts';

// The whole rulebook, with no React in it, so it can be tested on its own.
export const BASE_SCORE = 60;
export const PER_CONTRADICTION = 20;
export const PER_QUESTION = 4;
export const PER_WRONG_CLUE = 10;
export const PER_HINT = 5;
export const PER_WRONG_VOTE = 20;
export const MAX_WRONG_VOTES = 2; // the second wrong vote lets the imposter win

export type Outcome = 'playing' | 'win' | 'lose';
export interface Feedback { kind: 'good' | 'bad' | 'info'; text: string }
export interface GameState {
  data: CaseData;
  selected: string | null;
  asked: Record<string, string[]>;
  caught: Record<string, Record<string, string>>;
  wrongClues: number;
  hints: number;
  asks: number;
  ejected: string[];
  wrongVotes: number;
  outcome: Outcome;
  feedback: Feedback | null;
  lastVote: { crew: string; imposter: boolean } | null;
}

export function start(data: CaseData): GameState {
  return { data, selected: null, asked: {}, caught: {}, wrongClues: 0, hints: 0, asks: 0, ejected: [], wrongVotes: 0, outcome: 'playing', feedback: null, lastVote: null };
}

// Hints go from a nudge to a name, and each one costs points.
export const hint = (s: GameState): GameState => (s.outcome === 'playing' && s.hints < s.data.hints.length ? { ...s, hints: s.hints + 1 } : s);

export const select = (s: GameState, crewId: string): GameState => (s.outcome === 'playing' && !s.ejected.includes(crewId) ? { ...s, selected: crewId, feedback: null } : s);

export function ask(s: GameState, crewId: string, qId: string): GameState {
  if (s.outcome !== 'playing' || s.ejected.includes(crewId) || s.asked[crewId]?.includes(qId)) return s;
  return { ...s, asks: s.asks + 1, asked: { ...s.asked, [crewId]: [...(s.asked[crewId] ?? []), qId] }, feedback: null };
}

// Show one of a suspect's clues against something they said. It only counts if REA's finding really contradicts the claim.
export function challenge(s: GameState, crewId: string, qId: string, evidenceId: string): GameState {
  const m = s.data.crew.find((c) => c.id === crewId);
  const claim = m?.claims[qId];
  if (s.outcome !== 'playing' || !m || !claim || !s.asked[crewId]?.includes(qId) || s.caught[crewId]?.[qId]) return s;
  if (claim.contradictedBy.includes(evidenceId)) {
    const tag = m.evidence.find((e) => e.id === evidenceId)?.tags.find((t) => s.data.why[t]);
    const why = tag ? s.data.why[tag] : 'That clue contradicts what they just said.';
    return { ...s, caught: { ...s.caught, [crewId]: { ...s.caught[crewId], [qId]: evidenceId } }, feedback: { kind: 'good', text: `Contradiction! ${why}` } };
  }
  return { ...s, wrongClues: s.wrongClues + 1, feedback: { kind: 'bad', text: 'That clue does not contradict what they said. -10 points.' } };
}

export function vote(s: GameState, crewId: string): GameState {
  if (s.outcome !== 'playing' || s.ejected.includes(crewId)) return s;
  if (crewId === s.data.imposter) return { ...s, outcome: 'win', lastVote: { crew: crewId, imposter: true }, feedback: null };
  const wrongVotes = s.wrongVotes + 1;
  return { ...s, ejected: [...s.ejected, crewId], wrongVotes, selected: s.selected === crewId ? null : s.selected, outcome: wrongVotes >= MAX_WRONG_VOTES ? 'lose' : 'playing', lastVote: { crew: crewId, imposter: false }, feedback: null };
}

export const contradictionsFound = (s: GameState) => Object.values(s.caught).reduce((n, q) => n + Object.keys(q).length, 0);

export function score(s: GameState): number {
  const raw = BASE_SCORE + PER_CONTRADICTION * contradictionsFound(s) - PER_QUESTION * s.asks - PER_WRONG_CLUE * s.wrongClues - PER_HINT * s.hints - PER_WRONG_VOTE * s.wrongVotes;
  return Math.max(0, Math.min(100, raw));
}

export function rating(points: number): string {
  if (points >= 90) return 'Perfect case';
  if (points >= 70) return 'Sharp detective';
  if (points >= 45) return 'Close call';
  return 'Lucky guess';
}
