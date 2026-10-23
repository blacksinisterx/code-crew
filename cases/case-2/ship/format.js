// format.js: the Printer. Turns a task list into lines of text.
export function show(items) {
  return items.map((t) => `${t.number}. [${t.done ? 'x' : ' '}] ${t.title}`).join('\n');
}
