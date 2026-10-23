// Builds the playable case files for the game.
//   node scripts/build-case.mjs     (builds every folder in cases/, so the index is always complete)
// Reads cases/<id>/case.config.json (the story we wrote) and cases/<id>/rea-raw/*.json (what REA found),
// checks every claim against the REA evidence, and writes web/public/cases/<id>.json plus index.json.
// It refuses to build a case whose story does not hold up: the imposter must lie about something REA can show,
// and nobody else may.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractEvidence } from './lib/rea-evidence.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCARY = ['network', 'user-info', 'runs-command', 'env'];
export const RANK = { Rookie: 0, Detective: 1, 'Chief Inspector': 2, Master: 3 };
export const QUESTIONS = [
  { id: 'q1', text: 'What is your job on the ship?' },
  { id: 'q2', text: 'What do you read or write?' },
  { id: 'q3', text: 'Do you ever leave the ship?' },
];

// A claim is a list of assertions about the evidence of one file: {absent: tag} or {present: tag}.
export function checkClaim(claim, cards) {
  const has = (tag) => cards.filter((c) => c.tags.includes(tag));
  const contradictedBy = [];
  const broken = [];
  for (const a of claim.asserts) {
    if (a.absent && has(a.absent).length) contradictedBy.push(...has(a.absent).map((c) => c.id));
    if (a.present && !has(a.present).length) broken.push(a.present);
  }
  return { contradictedBy: [...new Set(contradictedBy)], broken };
}

export function buildCase(id, root = ROOT) {
  const dir = join(root, 'cases', id);
  const cfg = JSON.parse(readFileSync(join(dir, 'case.config.json'), 'utf8'));
  const rawPath = join(dir, 'rea-raw', 'analyze-javascript-application.json');
  const rawText = readFileSync(rawPath);
  const meta = JSON.parse(readFileSync(join(dir, 'rea-raw', 'meta.json'), 'utf8'));
  const { byFile, edges } = extractEvidence(JSON.parse(rawText));
  const problems = [];

  const crew = cfg.crew.map((m) => {
    const src = readFileSync(join(dir, cfg.shipDir, m.file), 'utf8').split(/\r?\n/);
    const found = (byFile.get(m.file) ?? []).map((c) => {
      const id2 = `${m.id}:${c.kind}:${c.line}:${c.col}`;
      const code = [c.line - 1, c.line, c.line + 1].filter((n) => n >= 1 && n <= src.length).map((n) => ({ n, text: src[n - 1], hit: n === c.line }));
      return { ...c, id: id2, code };
    });
    const quiet = found.length === 0;
    const evidence = quiet
      ? [{ id: `${m.id}:quiet`, file: m.file, kind: 'quiet', line: 0, col: 0, tags: [], derived: true, text: 'REA found no imports, requests, file access or user-info reads in this file.', plain: 'The scanner found nothing worth noting here. This part just does its small job quietly.', code: [] }]
      : found;
    const claims = {};
    for (const q of QUESTIONS) {
      const claim = m.claims[q.id];
      if (!claim) { problems.push(`${m.id}: missing claim ${q.id}`); continue; }
      const r = checkClaim(claim, found);
      if (r.broken.length) problems.push(`${m.id}.${q.id}: claims "${r.broken.join(', ')}" but REA found no such evidence`);
      claims[q.id] = { text: claim.text, contradictedBy: r.contradictedBy };
    }
    return { id: m.id, file: m.file, name: m.name, color: m.color, role: m.role, quiet, evidence, claims };
  });

  const liars = crew.filter((m) => Object.values(m.claims).some((c) => c.contradictedBy.length));
  if (!crew.find((m) => m.id === cfg.imposter)) problems.push(`imposter "${cfg.imposter}" is not in the crew`);
  if (liars.length !== 1 || liars[0].id !== cfg.imposter) problems.push(`exactly the imposter must lie, but the liars are: ${liars.map((m) => m.id).join(', ') || 'nobody'}`);
  if (cfg.redHerring) {
    const rh = crew.find((m) => m.id === cfg.redHerring.crew);
    if (!rh || rh.id === cfg.imposter) problems.push('the red herring must be a crew member other than the imposter');
    else if (!rh.evidence.some((e) => SCARY.some((t) => e.tags.includes(t)))) problems.push(`${rh.id} looks harmless, so it is not a red herring`);
  }
  // the three hints go from a nudge to a name; only the last one may point at the imposter
  const imp = crew.find((m) => m.id === cfg.imposter);
  if (!Array.isArray(cfg.hints) || cfg.hints.length !== 3) problems.push('a case needs exactly three hints');
  else for (const h of cfg.hints.slice(0, 2)) {
    for (const word of [imp?.id, imp?.name, imp?.file?.replace(/\.c?js$/, '')]) if (word && h.toLowerCase().includes(word.toLowerCase())) problems.push(`hint "${h}" gives the imposter away by saying "${word}"`);
  }
  for (const f of ['plainBriefing', 'realLife']) if (typeof cfg[f] !== 'string' || !cfg[f].trim()) problems.push(`missing ${f}`);
  const ids = crew.map((m) => m.id);
  const badEdges = edges.filter((e) => !crew.find((m) => m.file === e.to) || !crew.find((m) => m.file === e.from));
  if (badEdges.length) problems.push(`import edges point outside the crew: ${badEdges.map((e) => `${e.from}->${e.to}`).join(', ')}`);
  if (problems.length) throw new Error(`Case ${id} does not hold up:\n - ${problems.join('\n - ')}`);

  return {
    schema: 1, id: cfg.id, title: cfg.title, difficulty: cfg.difficulty, briefing: cfg.briefing, plainBriefing: cfg.plainBriefing, hints: cfg.hints, realLife: cfg.realLife, shipName: cfg.shipName,
    rea: { tool: 'rea-agents', version: meta.version, command: meta.command, rawSha256: createHash('sha256').update(rawText).digest('hex') },
    questions: QUESTIONS, crew,
    edges: edges.map((e) => ({ from: crew.find((m) => m.file === e.from).id, to: crew.find((m) => m.file === e.to).id, line: e.line })),
    imposter: cfg.imposter, verdict: cfg.verdict, why: cfg.why, redHerring: cfg.redHerring ?? null,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ids = readdirSync(join(ROOT, 'cases'), { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(ROOT, 'cases', d.name, 'case.config.json'))).map((d) => d.name).sort();
  const out = join(ROOT, 'web', 'public', 'cases');
  mkdirSync(out, { recursive: true });
  const index = [];
  for (const id of ids) {
    const c = buildCase(id);
    if (!(c.difficulty in RANK)) throw new Error(`${id}: unknown difficulty "${c.difficulty}"`);
    writeFileSync(join(out, `${id}.json`), JSON.stringify(c, null, 1));
    index.push({ id: c.id, title: c.title, difficulty: c.difficulty, crew: c.crew.length });
    console.log(`built ${id}: ${c.crew.length} crew, ${c.crew.reduce((n, m) => n + m.evidence.filter((e) => !e.derived).length, 0)} REA clues, imposter = ${c.imposter}`);
  }
  index.sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.id.localeCompare(b.id, 'en', { numeric: true }));
  writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1));
}
