// Run with Node 22.18+ (it strips the types itself):  node --test web/src/game.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, challenge, contradictionsFound, rating, score, select, start, vote } from './game.ts';
import type { CaseData } from './types.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'cases');
const cases: CaseData[] = readdirSync(dir).filter((f) => /^case-\d+\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

for (const data of cases) {
  test(`${data.id}: the ideal detective catches both lies and wins with a top score`, () => {
    let s = start(data);
    const imp = data.crew.find((m) => m.id === data.imposter)!;
    s = select(s, imp.id);
    const lies = Object.entries(imp.claims).filter(([, c]) => c.contradictedBy.length);
    assert.ok(lies.length >= 2, 'a case needs at least two ways to catch the imposter');
    for (const [q, claim] of lies) {
      s = ask(s, imp.id, q);
      s = challenge(s, imp.id, q, claim.contradictedBy[0]);
      assert.equal(s.feedback?.kind, 'good');
    }
    assert.equal(contradictionsFound(s), lies.length);
    s = vote(s, imp.id);
    assert.equal(s.outcome, 'win');
    assert.ok(score(s) >= 90, `ideal play should rate "Perfect case", got ${score(s)}`);
  });

  test(`${data.id}: no innocent can be caught out, whatever clue you show`, () => {
    let s = start(data);
    for (const m of data.crew.filter((c) => c.id !== data.imposter)) {
      for (const q of data.questions) {
        s = ask(s, m.id, q.id);
        for (const e of m.evidence) {
          const before = s.wrongClues;
          s = challenge(s, m.id, q.id, e.id);
          assert.equal(s.wrongClues, before + 1, `${m.id}.${q.id} was contradicted by ${e.id}, but ${m.id} is innocent`);
        }
      }
    }
    assert.equal(contradictionsFound(s), 0);
  });
}

test('rules: questions cost once, wrong clues and votes cost points, two wrong votes lose', () => {
  const data = cases[0];
  let s = start(data);
  const innocent = data.crew.filter((m) => m.id !== data.imposter);
  s = ask(select(s, innocent[0].id), innocent[0].id, 'q1');
  s = ask(s, innocent[0].id, 'q1');
  assert.equal(s.asks, 1);
  s = challenge(s, innocent[0].id, 'q1', innocent[0].evidence[0].id);
  assert.equal(score(s), 60 - 4 - 10);
  s = vote(s, innocent[0].id);
  assert.equal(s.outcome, 'playing');
  assert.equal(s.ejected.length, 1);
  assert.equal(select(s, innocent[0].id).selected, null, 'an ejected crew member can no longer be selected');
  s = vote(s, innocent[1].id);
  assert.equal(s.outcome, 'lose');
  assert.equal(vote(s, data.imposter).outcome, 'lose', 'a finished game stays finished');
  assert.equal(score(start(data)), 60);
  assert.equal(rating(95), 'Perfect case');
  assert.equal(rating(10), 'Lucky guess');
});

test('a clue cannot be shown before the question was asked, or twice for the same lie', () => {
  const data = cases[0];
  const imp = data.crew.find((m) => m.id === data.imposter)!;
  const [q, claim] = Object.entries(imp.claims).find(([, c]) => c.contradictedBy.length)!;
  let s = challenge(start(data), imp.id, q, claim.contradictedBy[0]);
  assert.equal(contradictionsFound(s), 0);
  s = ask(s, imp.id, q);
  s = challenge(s, imp.id, q, claim.contradictedBy[0]);
  const once = score(s);
  s = challenge(s, imp.id, q, claim.contradictedBy[0]);
  assert.equal(score(s), once);
});
