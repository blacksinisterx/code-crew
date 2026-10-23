// Turns the raw output of `rea analyze-javascript-application` into clue cards.
// Everything returned here is read from REA's own graph (file, line, column included); nothing is invented.
// Each card gets a `tags` list so a crew member's claim ("I never touch the network") can be checked against it.

const NETWORK = new Set(['https', 'http', 'http2', 'net', 'tls', 'dgram', 'dns', 'ws']);
const COMMANDS = new Set(['child_process', 'worker_threads', 'cluster', 'vm']);
const USER_INFO_READS = new Set(['userInfo', 'hostname', 'homedir', 'networkInterfaces', 'platform']);
const FILE_READS = new Set(['readFileSync', 'readFile', 'readdirSync', 'readdir', 'createReadStream']);
const FILE_WRITES = new Set(['writeFileSync', 'writeFile', 'appendFileSync', 'appendFile', 'createWriteStream']);
const RUNS_COMMAND = new Set(['exec', 'execSync', 'spawn', 'spawnSync', 'execFile', 'fork']);

const loc = (x) => x?.evidence?.location?.value ?? null;
const bare = (s) => String(s).replace(/^node:/, '');

function builtinCard(specifier) {
  const name = bare(specifier).split('/')[0];
  if (NETWORK.has(name)) return { tags: ['network'], text: `Imports the network module "${specifier}"` };
  if (name === 'os') return { tags: ['os-info'], text: `Imports "${specifier}", which can describe this machine and its user` };
  if (name === 'fs') return { tags: ['file-module'], text: `Imports the file module "${specifier}"` };
  if (name === 'readline') return { tags: ['keyboard'], text: `Imports "${specifier}", which reads what the player types` };
  if (COMMANDS.has(name)) return { tags: ['runs-command'], text: `Imports "${specifier}", which can start other programs` };
  if (name === 'path') return { tags: ['neutral'], text: `Imports "${specifier}" (file name helpers)` };
  return { tags: ['neutral'], text: `Imports "${specifier}"` };
}

export function extractEvidence(rea) {
  const n = rea.normalized_result;
  const graph = n.graph;
  const sem = n.semantic_graph;
  const nodeById = new Map(graph.nodes.map((x) => [x.node_id, x]));
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

  // 1. imports (statement level only, so each import shows up once)
  for (const e of graph.edges) {
    if (e.relation !== 'imports' || e.properties?.kind !== 'static-import') continue;
    const l = loc(e);
    const from = label(nodeById.get(e.source_node_id));
    const spec = e.properties.specifier;
    if (!l || !from || !spec) continue;
    if (spec.startsWith('.')) {
      edges.push({ from, to: spec.replace(/^\.\//, ''), line: l.start.line });
      add(from, { kind: 'import-local', key: spec, line: l.start.line, col: l.start.column, tags: ['local-import'], text: `Imports the crew file "${spec}"`, rea: 'graph.edges[imports]' });
    } else {
      const c = builtinCard(spec);
      add(from, { kind: 'import-builtin', key: spec, line: l.start.line, col: l.start.column, tags: c.tags, text: c.text, rea: 'graph.edges[imports]' });
    }
  }

  // 1b. imports whose module name is only worked out while the program runs (REA marks them dynamic-import, unresolved)
  for (const e of graph.edges) {
    if (e.relation !== 'imports' || e.properties?.kind !== 'dynamic-import') continue;
    const l = loc(e);
    const from = label(nodeById.get(e.source_node_id));
    if (!l || !from) continue;
    add(from, { kind: 'dynamic-import', key: e.properties.expression, line: l.start.line, col: l.start.column, tags: ['hidden-code'], text: `Loads a module whose name is only worked out while running: ${e.properties.expression}`, rea: 'graph.edges[imports, dynamic-import]' });
  }

  // 2. network requests built in the code, and the fields they carry
  const semNodes = new Map(sem.nodes.map((x) => [x.node_id, x]));
  for (const r of sem.relations) {
    const l = loc(r);
    if (r.relation === 'constructs-request' && l) {
      add(l.source, { kind: 'request', key: 'request', line: l.start.line, col: l.start.column, tags: ['network'], text: 'Builds an outgoing network request', rea: 'semantic_graph.relations[constructs-request]' });
    }
    if (r.relation === 'supplies-request-field' && l && r.properties?.field === 'path') {
      // the literal route is reported separately as an endpoint node below
    }
  }

  // 3. string literals that look like a server, and routes REA recognised as endpoints
  for (const x of sem.nodes) {
    const v = x.kind === 'literal' ? x.properties?.value : null;
    const l = loc(x);
    if (typeof v === 'string' && l && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v) && !/\.(js|json|txt|md)$/i.test(v)) {
      add(l.source, { kind: 'destination', key: v, line: l.start.line, col: l.start.column, tags: ['network'], text: `Contains the server name "${v}"`, rea: 'semantic_graph.nodes[literal]' });
    }
  }
  // strings that are really base64 text (REA reports the literal; recognising and decoding it is our step, and the card says so)
  for (const x of sem.nodes) {
    const v = x.kind === 'literal' ? x.properties?.value : null;
    const l = loc(x);
    if (typeof v !== 'string' || !l || !/^[A-Za-z0-9+/]{16,}={0,2}$/.test(v) || v.length % 4) continue;
    const decoded = Buffer.from(v, 'base64').toString('utf8');
    if (!/^[\x20-\x7e]{6,}$/.test(decoded)) continue;
    add(l.source, { kind: 'encoded-string', key: v, line: l.start.line, col: l.start.column, tags: ['hidden-code'], text: `Hides a string in base64. REA found the text; decoded here, it reads "${decoded}"`, rea: 'semantic_graph.nodes[literal]' });
  }
  for (const x of graph.nodes) {
    if (x.kind !== 'endpoint') continue;
    for (const o of x.observations ?? []) {
      const l = o.evidence?.location?.value;
      if (l && o.properties?.value) add(l.source, { kind: 'endpoint', key: o.properties.value, line: l.start.line, col: l.start.column, tags: ['network'], text: `Talks to the route "${o.properties.value}"`, rea: 'graph.nodes[endpoint]' });
    }
  }

  // 4. reads of properties that matter: who the user is, which files are touched, which programs are started
  for (const x of sem.nodes) {
    if (x.kind !== 'expression') continue;
    const l = loc(x);
    const m = /^read:\/(.+)$/.exec(x.label ?? '');
    if (!l || !m) continue;
    const prop = m[1];
    const base = { key: prop, line: l.start.line, col: l.start.column, rea: 'semantic_graph.nodes[expression]' };
    if (USER_INFO_READS.has(prop)) add(l.source, { ...base, kind: 'reads-user-info', tags: ['user-info'], text: `Reads "${prop}", which identifies the player or their machine` });
    else if (FILE_READS.has(prop)) add(l.source, { ...base, kind: 'file-read', tags: ['file-read'], text: `Reads a file (${prop})` });
    else if (FILE_WRITES.has(prop)) add(l.source, { ...base, kind: 'file-write', tags: ['file-write'], text: `Writes a file (${prop})` });
    else if (RUNS_COMMAND.has(prop)) add(l.source, { ...base, kind: 'runs-command', tags: ['runs-command'], text: `Starts another program (${prop})` });
    else if (prop === 'env') add(l.source, { ...base, kind: 'reads-env', tags: ['env'], text: 'Reads process.env, the environment variables (where secrets such as API keys often live)' });
  }

  for (const cards of out.values()) cards.sort((a, b) => a.line - b.line || a.col - b.col);
  return { byFile: out, edges };
}
