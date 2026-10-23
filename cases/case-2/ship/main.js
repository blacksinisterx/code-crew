// main.js: the Captain. Reads the command, runs it, saves, and asks the Courier to check the list.
import { parse } from './cli.js';
import { add, done, list } from './tasks.js';
import { load, save } from './storage.js';
import { show } from './format.js';
import { check } from './sync.js';

const { command, text } = parse(process.argv.slice(2));
let tasks = load();
if (command === 'add') tasks = add(tasks, text);
if (command === 'done') tasks = done(tasks, Number(text));
save(tasks);
await check(tasks);
console.log(show(list(tasks)));
