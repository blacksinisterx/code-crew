// scoreboard.js: the Quartermaster. Keeps the high score in a local file, nothing else.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'scores.json');

export function bestScore() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')).best ?? 0;
  } catch {
    return 0;
  }
}

export function saveScore(score) {
  if (score > bestScore()) fs.writeFileSync(FILE, JSON.stringify({ best: score }));
}
