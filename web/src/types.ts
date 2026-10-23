export interface CodeLine { n: number; text: string; hit: boolean }
export interface Evidence {
  id: string; file: string; kind: string; line: number; col: number; tags: string[]; text: string;
  code: CodeLine[]; derived?: boolean; rea?: string;
}
export interface Claim { text: string; contradictedBy: string[] }
export interface Crew {
  id: string; file: string; name: string; color: ColorName; role: string; quiet: boolean;
  evidence: Evidence[]; claims: Record<string, Claim>;
}
export type ColorName = 'red' | 'blue' | 'green' | 'pink' | 'orange' | 'yellow' | 'cyan' | 'purple' | 'lime' | 'white';
export interface CaseData {
  schema: number; id: string; title: string; difficulty: string; briefing: string; shipName: string;
  rea: { tool: string; version: string; command: string; rawSha256: string };
  questions: { id: string; text: string }[];
  crew: Crew[]; edges: { from: string; to: string; line: number }[];
  imposter: string; verdict: string; why: Record<string, string>;
  redHerring: { crew: string; note: string } | null;
}
export interface CaseIndexEntry { id: string; title: string; difficulty: string; crew: number }
