// cleaner.js: the Sweeper. Deletes backups that are older than you wanted to keep.
import fs from 'node:fs';
import path from 'node:path';

export function sweep(folder, keepDays) {
  const limit = Date.now() - keepDays * 86400000;
  for (const name of fs.readdirSync(folder)) {
    const file = path.join(folder, name);
    if (fs.statSync(file).mtimeMs < limit) fs.unlinkSync(file);
  }
}
