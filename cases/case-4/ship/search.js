// search.js: the Finder. Looks through the notes for a word.
export function find(notes, word) {
  const needle = word.toLowerCase();
  return notes.filter((n) => n.text.toLowerCase().includes(needle));
}
