import type { Evidence, Mode } from './types.ts';

// The most telling tag decides the chip colour and label on a clue card.
const TAG_ORDER = ['network', 'user-info', 'hidden-code', 'env', 'runs-command', 'file-delete', 'file-write', 'background-timer', 'file-read', 'file-module', 'os-info', 'keyboard', 'local-import', 'neutral'];
const LABEL: Record<Mode, Record<string, string>> = {
  code: {
    network: 'Network', 'user-info': 'User info', 'hidden-code': 'Hidden', env: 'Environment', 'file-write': 'File write', 'file-read': 'File read', 'file-delete': 'File delete',
    'file-module': 'Files', 'os-info': 'OS info', 'runs-command': 'Runs programs', 'background-timer': 'Timer', keyboard: 'Keyboard', 'local-import': 'Import', neutral: 'Import', none: 'Nothing found',
  },
  detective: {
    network: 'Internet', 'user-info': 'Your details', 'hidden-code': 'Hidden', env: 'Private settings', 'file-write': 'Writes files', 'file-read': 'Reads files', 'file-delete': 'Deletes files',
    'file-module': 'Files', 'os-info': 'Your computer', 'runs-command': 'Starts programs', 'background-timer': 'Runs on its own', keyboard: 'Keyboard', 'local-import': 'Teamwork', neutral: 'Helper', none: 'Nothing found',
  },
};
const mainTag = (e: Evidence) => TAG_ORDER.find((t) => e.tags.includes(t)) ?? 'none';

function Code({ e }: { e: Evidence }) {
  return (
    <div className="code" role="group" aria-label={`Code around line ${e.line}`}>
      {e.code.map((c) => (
        <div key={c.n} className={c.hit ? 'hit' : ''}><span className="n">{c.n}</span><span>{c.text}</span></div>
      ))}
    </div>
  );
}

// One finding from the scanner. Code mode shows the technical wording and the real lines; Detective mode shows plain words and keeps the code one click away.
export function Clue({ e, mode, onShow }: { e: Evidence; mode: Mode; onShow?: () => void }) {
  const tag = mainTag(e);
  const detective = mode === 'detective';
  return (
    <div className={`card${e.derived ? ' derived' : ''}`}>
      <div className="top">
        <span className={`chip ${tag}`}>{LABEL[mode][tag]}</span>
        <span className="chip none">{e.derived ? (detective ? 'Scanner: nothing here' : 'REA: nothing here') : detective ? 'Found by the scanner' : 'REA found'}</span>
        {!detective && !e.derived && <span className="loc mono">{e.file}:{e.line}:{e.col}</span>}
      </div>
      <p>{detective ? e.plain : e.text}</p>
      {e.code.length > 0 && (detective ? (
        <details className="codebox">
          <summary>Show the code behind this ({e.file}, line {e.line})</summary>
          <p className="codenote">{e.text}</p>
          <Code e={e} />
        </details>
      ) : <Code e={e} />)}
      {onShow && <button className="btn small show" onClick={onShow}>Show this clue</button>}
    </div>
  );
}

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="mode-switch" role="radiogroup" aria-label="Play mode">
      <button role="radio" aria-checked={mode === 'detective'} className={mode === 'detective' ? 'on' : ''} onClick={() => onChange('detective')}>
        <b>Detective</b><small>plain words, no coding needed</small>
      </button>
      <button role="radio" aria-checked={mode === 'code'} className={mode === 'code' ? 'on' : ''} onClick={() => onChange('code')}>
        <b>Code</b><small>technical wording and real lines</small>
      </button>
    </div>
  );
}
