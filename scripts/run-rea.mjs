// Runs REA on a case's ship and saves the raw output under cases/<id>/rea-raw/.
//   <Node 22.19+> scripts/run-rea.mjs case-1
// REA needs Node 22.19+, 24.11+ or 26+. The game itself never needs REA: it reads the saved raw output.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [maj, min] = process.versions.node.split('.').map(Number);
if (!(maj > 22 && maj !== 23) && !(maj === 22 && min >= 19)) {
  console.error(`REA needs Node 22.19+ (this is ${process.versions.node}). Use the portable copy, e.g. D:\\tools\\node-v22.23.4-win-x64\\node.exe`);
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(join(ROOT, 'tools', 'node_modules', 'rea-agents', 'package.json'), 'utf8'));
const cli = join(ROOT, 'tools', 'node_modules', 'rea-agents', 'scripts', 'rea.mjs');
for (const id of process.argv.slice(2)) {
  const ship = join(ROOT, 'cases', id, 'ship');
  const raw = join(ROOT, 'cases', id, 'rea-raw');
  mkdirSync(raw, { recursive: true });
  const args = ['analyze-javascript-application', ship, '--json'];
  const out = execFileSync(process.execPath, [cli, ...args], { maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  writeFileSync(join(raw, 'analyze-javascript-application.json'), out);
  writeFileSync(join(raw, 'meta.json'), JSON.stringify({ version: pkg.version, node: process.versions.node, command: `rea ${args[0]} <ship> --json`, analyzedAt: new Date().toISOString() }, null, 1));
  console.log(`${id}: saved ${(out.length / 1024).toFixed(0)} KB from rea-agents ${pkg.version}`);
}
