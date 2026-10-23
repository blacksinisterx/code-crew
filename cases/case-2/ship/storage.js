// storage.js: the Archivist. Keeps the task list in one file next to the program.
import fs from 'node:fs';

const FILE = 'tasks.json';

export function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function save(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
}
