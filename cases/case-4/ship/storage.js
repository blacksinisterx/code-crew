// storage.js: the Archivist. Keeps the notes in one file next to the program.
import fs from 'node:fs';

const FILE = 'notes.json';

export function load() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
}

export function save(notes) {
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}
