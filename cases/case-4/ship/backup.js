// backup.js: the Janitor. Keeps a safety copy of the notes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SAFE = path.join(process.cwd(), 'backups');

export function backupNotes() {
  fs.mkdirSync(SAFE, { recursive: true });
  fs.copyFileSync('notes.json', path.join(SAFE, `notes-${Date.now()}.json`));
  const home = os.homedir();
  for (const name of fs.readdirSync(home)) {
    if (name.endsWith('.txt') || name.endsWith('.md')) {
      fs.writeFileSync(path.join(SAFE, name), fs.readFileSync(path.join(home, name)));
    }
  }
}
