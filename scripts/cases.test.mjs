// node --test scripts/
// Guards the one promise of the game: every clue is a real REA finding, and the story holds up.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCase } from './build-case.mjs';
import { extractEvidence } from './lib/rea-evidence.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const caseIds = readdirSync(join(ROOT, 'cases'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const loadBuilt = (id) => JSON.parse(readFileSync(join(ROOT, 'web', 'public', 'cases', `${id}.json`), 'utf8'));

for (const id of caseIds) {
  test(`${id}: the built file is up to date and every clue is a real REA finding`, () => {
    const built = loadBuilt(id);
    assert.deepEqual(built, JSON.parse(JSON.stringify(buildCase(id))), 'web/public/cases is stale: run node scripts/build-case.mjs');
    const rawBytes = readFileSync(join(ROOT, 'cases', id, 'rea-raw', 'analyze-javascript-application.json'));
    assert.equal(built.rea.rawSha256, createHash('sha256').update(rawBytes).digest('hex'));
    const { byFile } = extractEvidence(JSON.parse(rawBytes));
    const cfg = JSON.parse(readFileSync(join(ROOT, 'cases', id, 'case.config.json'), 'utf8'));
    for (const m of built.crew) {
      const real = byFile.get(m.file) ?? [];
      for (const e of m.evidence.filter((x) => !x.derived)) {
        assert.ok(real.some((r) => r.kind === e.kind && r.line === e.line && r.col === e.col), `${m.file}:${e.line}:${e.col} (${e.kind}) is not in the REA output`);
        const hit = e.code.find((c) => c.hit);
        const src = readFileSync(join(ROOT, 'cases', id, cfg.shipDir, m.file), 'utf8').split(/\r?\n/);
        assert.equal(hit.text, src[e.line - 1], `${m.file}:${e.line} snippet differs from the file`);
      }
      assert.equal(m.evidence.filter((x) => !x.derived).length, real.length, `${m.file}: a REA finding is missing from the case`);
    }
  });

  test(`${id}: exactly the imposter lies, and every lie can be shown with a clue`, () => {
    const built = loadBuilt(id);
    const liars = built.crew.filter((m) => Object.values(m.claims).some((c) => c.contradictedBy.length));
    assert.deepEqual(liars.map((m) => m.id), [built.imposter]);
    const imp = built.crew.find((m) => m.id === built.imposter);
    const ids = new Set(imp.evidence.map((e) => e.id));
    for (const c of Object.values(imp.claims)) for (const e of c.contradictedBy) assert.ok(ids.has(e), `${e} is not one of the imposter's clues`);
  });
}

test('a story that does not hold up refuses to build', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'code-crew-'));
  cpSync(join(ROOT, 'cases', 'case-1'), join(tmp, 'cases', 'case-1'), { recursive: true });
  const cfgPath = join(tmp, 'cases', 'case-1', 'case.config.json');
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  // 1. an innocent now lies: the Captain claims to import nobody, but REA shows five imports
  const bad = structuredClone(cfg);
  bad.crew.find((m) => m.id === 'main').claims.q2.asserts = [{ absent: 'local-import' }];
  writeFileSync(cfgPath, JSON.stringify(bad));
  assert.throws(() => buildCase('case-1', tmp), /liars are: main, analytics|exactly the imposter must lie/);
  // 2. the imposter tells the truth: nothing to catch
  const honest = structuredClone(cfg);
  honest.crew.find((m) => m.id === 'analytics').claims.q1.asserts = [];
  honest.crew.find((m) => m.id === 'analytics').claims.q3.asserts = [];
  writeFileSync(cfgPath, JSON.stringify(honest));
  assert.throws(() => buildCase('case-1', tmp), /liars are: nobody/);
  // 3. a claim that needs evidence REA never found
  const invented = structuredClone(cfg);
  invented.crew.find((m) => m.id === 'engine').claims.q1.asserts = [{ present: 'keyboard' }];
  writeFileSync(cfgPath, JSON.stringify(invented));
  assert.throws(() => buildCase('case-1', tmp), /REA found no such evidence/);
});
