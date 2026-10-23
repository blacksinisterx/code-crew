// input.js: Comms. Listens to the keyboard and passes keys on. Reads stdin only.
import readline from 'node:readline';

const KEYS = { a: 'left', d: 'right', w: 'up', s: 'down' };

export function readKey(onKey) {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.on('keypress', (_, key) => {
    if (key && KEYS[key.name]) onKey(KEYS[key.name]);
    if (key && key.ctrl && key.name === 'c') process.exit(0);
  });
}
