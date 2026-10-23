// main.js: the Captain. Runs the note pad.
import { addNote, listNotes } from './editor.js';
import { load, save } from './storage.js';
import { find } from './search.js';
import { toText } from './exporter.js';
import { backupNotes } from './backup.js';

const notes = load();
addNote(notes, process.argv[2] ?? 'Buy milk');
save(notes);
console.log(listNotes(notes).join('\n'));
console.log(find(notes, 'milk').length + ' note(s) mention milk');
console.log(toText(notes));
backupNotes();
