// tasks.js: the Clerk. Adds, completes and lists tasks in memory. No files, no network.
export function add(tasks, title) {
  return [...tasks, { title, done: false }];
}

export function done(tasks, index) {
  return tasks.map((t, i) => (i === index - 1 ? { ...t, done: true } : t));
}

export function list(tasks) {
  return tasks.map((t, i) => ({ number: i + 1, ...t }));
}
