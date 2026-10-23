// Turns the raw output of `rea analyze-javascript-application` into clue cards.
// Everything returned here is read from REA's own graph (file, line, column included); nothing is invented.
// Each card has:
//   text   the technical wording (Code mode)
//   plain  the same fact in everyday words (Detective mode)
//   tags   so a crew member's claim ("I never touch the network") can be checked against it

const NETWORK = new Set(['https', 'http', 'http2', 'net', 'tls', 'dgram', 'dns', 'ws']);
const COMMANDS = new Set(['child_process', 'worker_threads', 'cluster', 'vm']);
const USER_INFO = {
  userInfo: 'your user name', hostname: "your computer's name", homedir: 'where your personal files live', networkInterfaces: 'your network details',
};
const OS_INFO = new Set(['platform', 'arch', 'release', 'cpus', 'totalmem', 'freemem', 'type', 'uptime']);
const FILE_READS = new Set(['readFileSync', 'readFile', 'createReadStream']);
const FOLDER_LISTS = new Set(['readdirSync', 'readdir', 'opendirSync', 'opendir']);
const FILE_WRITES = new Set(['writeFileSync', 'writeFile', 'appendFileSync', 'appendFile', 'createWriteStream']);
const FILE_DELETES = new Set(['unlinkSync', 'unlink', 'rmSync', 'rm', 'rmdirSync']);

// "vault.bin" looks like a host name but is a file name
const FILE_NAME = /\.(c?js|mjs|json|txt|md|bin|log|db|csv|dat|tmp|cfg|ini|ya?ml|xml|html?|css|png|jpe?g|gif|gz|zip|lock)$/i;
const loc = (x) => x?.evidence?.location?.value ?? null;
const bare = (s) => String(s).replace(/^node:/, '');

function builtinCard(specifier) {
  const name = bare(specifier).split('/')[0];
  if (NETWORK.has(name)) return { tags: ['network'], text: `Imports the network module "${specifier}"`, plain: 'Is able to connect to the internet' };
  if (name === 'os') return { tags: ['os-info'], text: `Imports "${specifier}", which can describe this machine and its user`, plain: 'Is able to look up details about this computer' };
  if (name === 'fs') return { tags: ['file-module'], text: `Imports the file module "${specifier}"`, plain: 'Is able to read and write files' };
  if (name === 'readline') return { tags: ['keyboard'], text: `Imports "${specifier}", which reads what the player types`, plain: 'Listens to what you type' };
  if (COMMANDS.has(name)) return { tags: ['runs-command'], text: `Imports "${specifier}", which can start other programs`, plain: 'Is able to start other programs on your computer' };
  if (name === 'crypto') return { tags: ['neutral'], text: `Imports "${specifier}" (scrambling and random numbers)`, plain: 'Uses tools for scrambling secrets and making random numbers' };
  if (name === 'path') return { tags: ['neutral'], text: `Imports "${specifier}" (file name helpers)`, plain: 'Uses a small helper for working out file names' };
  return { tags: ['neutral'], text: `Imports "${specifier}"`, plain: `Uses a standard helper (${bare(specifier)})` };
}

export function extractEvidence(rea) {
  const n = rea.normalized_result;
  const graph = n.graph;
  const sem = n.semantic_graph;
  const nodeById = new Map(graph.nodes.map((x) => [x.node_id, x]));
  const semById = new Map(sem.nodes.map((x) => [x.node_id, x]));
  const label = (x) => x?.observations?.[0]?.label ?? x?.identity?.key ?? '';
  const out = new Map(); // file -> cards
  const seen = new Set();
  const add = (file, card) => {
    const key = [file, card.kind, card.line, card.col, card.key].join('|');
    if (!file || seen.has(key)) return;
    seen.add(key);
    if (!out.has(file)) out.set(file, []);
    out.get(file).push({ id: '', file, ...card });
  };
  const edges = [];

  // 1. imports: ES module statements and CommonJS require() calls (each shows up once)
  for (const e of graph.edges) {
    if (e.relation !== 'imports') continue;
    const kind = e.properties?.kind;
    const l = loc(e);
    const from = label(nodeById.get(e.source_node_id));
    if (!l || !from) continue;
    if (kind === 'static-import' || kind === 'require') {
      const spec = e.properties.specifier;
      if (!spec) continue;
      if (spec.startsWith('.')) {
        edges.push({ from, to: spec.replace(/^\.\//, ''), line: l.start.line });
        add(from, { kind: 'import-local', key: spec, line: l.start.line, col: l.start.column, tags: ['local-import'], text: `Imports the crew file "${spec}"`, plain: `Works together with another crew member (${spec.replace(/^\.\//, '').replace(/\.c?js$/, '')})`, spec, rea: 'graph.edges[imports]' });
      } else {
        const c = builtinCard(spec);
        add(from, { kind: 'import-builtin', key: spec, line: l.start.line, col: l.start.column, tags: c.tags, text: c.text, plain: c.plain, rea: 'graph.edges[imports]' });
      }
    } else if (kind === 'dynamic-import') {
      add(from, { kind: 'dynamic-import', key: e.properties.expression, line: l.start.line, col: l.start.column, tags: ['hidden-code'], text: `Loads a module whose name is only worked out while running: ${e.properties.expression}`, plain: 'Quietly loads a helper whose name is only worked out while the app is running', rea: 'graph.edges[imports, dynamic-import]' });
    }
  }

  // 2. what REA says the code does: builds requests, opens connections, starts programs, sets timers
  for (const r of sem.relations) {
    const l = loc(r);
    if (!l) continue;
    if (r.relation === 'constructs-request') {
      add(l.source, { kind: 'request', key: 'request', line: l.start.line, col: l.start.column, tags: ['network'], text: 'Builds an outgoing network request', plain: 'Sends a message out over the internet', rea: 'semantic_graph.relations[constructs-request]' });
    } else if (r.relation === 'acquires' && semById.get(r.target_node_id)?.properties?.method === 'connect') {
      add(l.source, { kind: 'socket', key: 'connect', line: l.start.line, col: l.start.column, tags: ['network'], text: 'Opens a direct network connection (connect)', plain: 'Opens a direct line to another computer', rea: 'semantic_graph.relations[acquires]' });
    } else if (r.relation === 'spawns') {
      const p = semById.get(r.target_node_id)?.properties ?? {};
      if (p.command) add(l.source, { kind: 'spawns', key: p.command, line: l.start.line, col: l.start.column, tags: ['runs-command'], text: `Starts another program (${p.method}): "${p.command}"`, plain: `Starts another program on your computer: "${p.command}"`, rea: 'semantic_graph.relations[spawns]' });
    } else if (r.relation === 'schedules-timer') {
      const p = semById.get(r.target_node_id)?.properties ?? {};
      const secs = p.delay_milliseconds ? Math.round(p.delay_milliseconds / 1000) : null;
      if (p.method === 'setInterval') add(l.source, { kind: 'timer', key: 'setInterval', line: l.start.line, col: l.start.column, tags: ['background-timer'], text: `Sets a repeating timer (setInterval${secs ? `, every ${secs} s` : ''})`, plain: `Keeps running something in the background${secs ? `, every ${secs} seconds` : ''}`, rea: 'semantic_graph.relations[schedules-timer]' });
    }
  }

  // 3. strings that look like a server name, base64 text, and routes REA recognised as endpoints
  for (const x of sem.nodes) {
    const v = x.kind === 'literal' ? x.properties?.value : null;
    const l = loc(x);
    if (typeof v !== 'string' || !l) continue;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v) && !FILE_NAME.test(v)) {
      add(l.source, { kind: 'destination', key: v, line: l.start.line, col: l.start.column, tags: ['network'], text: `Contains the server name "${v}"`, plain: `Knows the address of a server: ${v}`, rea: 'semantic_graph.nodes[literal]' });
    } else if (/^[A-Za-z0-9+/]{16,}={0,2}$/.test(v) && v.length % 4 === 0) {
      // REA reports the literal; recognising and decoding base64 is our step, and the card says so
      const decoded = Buffer.from(v, 'base64').toString('utf8');
      if (/^[\x20-\x7e]{6,}$/.test(decoded)) add(l.source, { kind: 'encoded-string', key: v, line: l.start.line, col: l.start.column, tags: ['hidden-code'], text: `Hides a string in base64. REA found the text; decoded here, it reads "${decoded}"`, plain: `Hides an address in scrambled text (it unscrambles to "${decoded}")`, rea: 'semantic_graph.nodes[literal]' });
    }
  }
  for (const x of graph.nodes) {
    if (x.kind !== 'endpoint') continue;
    for (const o of x.observations ?? []) {
      const l = o.evidence?.location?.value;
      const v = o.properties?.value;
      if (l && v) add(l.source, { kind: 'endpoint', key: v, line: l.start.line, col: l.start.column, tags: ['network'], text: `Talks to the route "${v}"`, plain: `Talks to a specific page on a server: ${v}`, rea: 'graph.nodes[endpoint]' });
    }
  }

  // 4. reads of properties that matter: who the user is, which files are touched, which secrets are read
  for (const x of sem.nodes) {
    if (x.kind !== 'expression') continue;
    const l = loc(x);
    const m = /^read:\/(.+)$/.exec(x.label ?? '');
    if (!l || !m) continue;
    const prop = m[1];
    const base = { key: prop, line: l.start.line, col: l.start.column, rea: 'semantic_graph.nodes[expression]' };
    const envName = /^env\/(.+)$/.exec(prop)?.[1];
    if (Object.hasOwn(USER_INFO, prop)) add(l.source, { ...base, kind: 'reads-user-info', tags: ['user-info'], text: `Reads "${prop}", which identifies the player or their machine`, plain: `Looks up ${USER_INFO[prop]}` });
    else if (OS_INFO.has(prop)) add(l.source, { ...base, kind: 'reads-os-info', tags: ['os-info'], text: `Reads "${prop}" (details about the machine)`, plain: 'Looks up what kind of computer this is' });
    else if (FILE_READS.has(prop)) add(l.source, { ...base, kind: 'file-read', tags: ['file-read'], text: `Reads a file (${prop})`, plain: 'Reads a file on your computer' });
    else if (FOLDER_LISTS.has(prop)) add(l.source, { ...base, kind: 'folder-list', tags: ['file-read', 'folder-list'], text: `Lists the contents of a folder (${prop})`, plain: 'Looks through the files in a folder on your computer' });
    else if (FILE_WRITES.has(prop)) add(l.source, { ...base, kind: 'file-write', tags: ['file-write'], text: `Writes a file (${prop})`, plain: 'Writes to a file on your computer' });
    else if (FILE_DELETES.has(prop)) add(l.source, { ...base, kind: 'file-delete', tags: ['file-delete'], text: `Deletes a file (${prop})`, plain: 'Deletes a file from your computer' });
    else if (envName) add(l.source, { ...base, kind: 'reads-env', key: envName, tags: ['env'], text: `Reads the environment variable "${envName}"`, plain: `Reads a private setting stored on your computer called "${envName}"` });
    else if (prop === 'env') add(l.source, { ...base, kind: 'reads-env', tags: ['env'], text: 'Reads process.env, the environment variables (where secrets such as API keys often live)', plain: 'Reads the private settings stored on your computer' });
  }

  for (const cards of out.values()) cards.sort((a, b) => a.line - b.line || a.col - b.col);
  return { byFile: out, edges };
}
