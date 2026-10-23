// exporter.js: the Printer. Turns the notes into plain text and saves one export file.
import fs from 'node:fs';

export function toText(notes) {
  const text = notes.map((n) => `- ${n.text} (${n.at})`).join('\n');
  fs.writeFileSync('notes-export.txt', text);
  return text;
}
