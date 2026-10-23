// scanner.js: the Scout. Lists the files in the folder you chose and reads them.
import fs from 'node:fs';
import path from 'node:path';

export function scan(folder) {
  return fs.readdirSync(folder).map((name) => ({ name, data: fs.readFileSync(path.join(folder, name)) }));
}
