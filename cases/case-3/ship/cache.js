// cache.js: the Pantry. Keeps a copy of the last forecast in the temp folder.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FILE = path.join(os.tmpdir(), 'weather-desk-cache.json');

export function remember(data) {
  fs.writeFileSync(FILE, JSON.stringify(data));
}
