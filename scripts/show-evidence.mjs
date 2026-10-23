// Prints the clue cards REA gives for a case's ship, so a story can be written against real findings.
//   node scripts/show-evidence.mjs case-4
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractEvidence } from './lib/rea-evidence.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const id of process.argv.slice(2)) {
  const { byFile, edges } = extractEvidence(JSON.parse(readFileSync(join(ROOT, 'cases', id, 'rea-raw', 'analyze-javascript-application.json'), 'utf8')));
  console.log(`# ${id}`);
  for (const [file, cards] of [...byFile].sort()) {
    console.log(`## ${file}`);
    for (const c of cards) console.log(`  ${c.line}:${c.col}`.padEnd(8), c.kind.padEnd(15), `[${c.tags}]`.padEnd(32), c.plain.slice(0, 80));
  }
  console.log(`  edges: ${edges.map((e) => `${e.from}->${e.to}`).join(', ')}`);
}
