// editor.js: the Scribe. Adds and edits notes in memory.
export function addNote(notes, text) {
  notes.push({ id: notes.length + 1, text, at: new Date().toISOString() });
  return notes;
}

export function editNote(notes, id, text) {
  const note = notes.find((n) => n.id === id);
  if (note) note.text = text;
  return notes;
}

export function listNotes(notes) {
  return notes.map((n) => `${n.id}. ${n.text}`);
}
