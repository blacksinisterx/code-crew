import { useEffect, useRef, useState } from 'react';
import { CrewBot } from './CrewBot.tsx';
import { PER_QUESTION } from './game.ts';
import type { GameState } from './game.ts';
import type { Crew, Evidence } from './types.ts';

const TAG_ORDER = ['network', 'user-info', 'hidden-code', 'env', 'runs-command', 'file-write', 'file-read', 'file-module', 'os-info', 'keyboard', 'local-import', 'neutral'];
const TAG_LABEL: Record<string, string> = {
  network: 'Network', 'user-info': 'User info', 'hidden-code': 'Hidden', env: 'Environment', 'file-write': 'File write', 'file-read': 'File read',
  'file-module': 'Files', 'os-info': 'OS info', 'runs-command': 'Runs programs', keyboard: 'Keyboard', 'local-import': 'Import', neutral: 'Import', none: 'Nothing found',
};
const mainTag = (e: Evidence) => TAG_ORDER.find((t) => e.tags.includes(t)) ?? 'none';

function Card({ e, onShow }: { e: Evidence; onShow?: () => void }) {
  const tag = mainTag(e);
  return (
    <div className={`card${e.derived ? ' derived' : ''}`}>
      <div className="top">
        <span className={`chip ${tag}`}>{TAG_LABEL[tag]}</span>
        <span className="chip none">{e.derived ? 'REA: nothing here' : 'REA found'}</span>
        {!e.derived && <span className="loc mono">{e.file}:{e.line}:{e.col}</span>}
      </div>
      <p>{e.text}</p>
      {e.code.length > 0 && (
        <div className="code" role="group" aria-label={`Code around line ${e.line}`}>
          {e.code.map((c) => (
            <div key={c.n} className={c.hit ? 'hit' : ''}><span className="n">{c.n}</span><span>{c.text}</span></div>
          ))}
        </div>
      )}
      {onShow && <button className="btn small show" onClick={onShow}>Show this clue</button>}
    </div>
  );
}

export function Suspect({ game, crew, onAsk, onChallenge }: { game: GameState; crew: Crew | undefined; onAsk: (crewId: string, qId: string) => void; onChallenge: (crewId: string, qId: string, evidenceId: string) => void }) {
  const [challenging, setChallenging] = useState<string | null>(null);
  const cards = useRef<HTMLDivElement>(null);
  useEffect(() => setChallenging(null), [crew?.id]);
  useEffect(() => { if (game.feedback) setChallenging(null); }, [game.feedback]);

  if (!crew) {
    return (
      <section className="panel suspect" aria-live="polite">
        <div className="empty"><p><b>Pick a crew member</b> on the ship.</p><p>Read what REA found in their file, ask three questions, and listen for a story that does not match the evidence.</p></div>
      </section>
    );
  }
  const asked = game.asked[crew.id] ?? [];
  const caught = game.caught[crew.id] ?? {};
  const startChallenge = (q: string) => {
    setChallenging(q);
    requestAnimationFrame(() => cards.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };
  return (
    <section className="panel suspect" aria-label={`${crew.name}, ${crew.file}`}>
      <div className="suspect-head">
        <CrewBot color={crew.color} state={Object.keys(caught).length ? 'sweating' : 'idle'} title={crew.name} />
        <div><h2>{crew.name} <span className="chip none mono">{crew.file}</span></h2><p>{crew.role}</p></div>
      </div>
      {game.feedback && <div className={`feedback ${game.feedback.kind}`} role="status">{game.feedback.text}</div>}

      <div className="sec">Interrogate <small>each question costs {PER_QUESTION} points</small></div>
      <div className="qs">
        {game.data.questions.map((q) => {
          const claim = crew.claims[q.id];
          const done = caught[q.id];
          return (
            <div className="q" key={q.id}>
              {!asked.includes(q.id) ? (
                <button className="btn small ghost ask" onClick={() => onAsk(crew.id, q.id)}>Ask: {q.text}</button>
              ) : (
                <>
                  <div className="mono" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{q.text}</div>
                  <div className={`bubble${done ? ' lie' : ''}`}>&ldquo;{claim.text}&rdquo;</div>
                  {done ? (
                    <div><span className="stamp">Contradiction</span> <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>clue {(() => { const e = crew.evidence.find((x) => x.id === done); return e ? `${e.file}:${e.line}` : ''; })()}</span></div>
                  ) : (
                    <button className="btn small" aria-expanded={challenging === q.id} onClick={() => (challenging === q.id ? setChallenging(null) : startChallenge(q.id))}>
                      {challenging === q.id ? 'Cancel' : 'Present a clue'}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="sec" ref={cards}>What REA found in {crew.file} <small>{challenging ? 'pick the clue that contradicts them' : 'real findings, with the real line of code'}</small></div>
      <div className="cards">
        {crew.evidence.map((e) => (
          <Card key={e.id} e={e} onShow={challenging && !e.derived ? () => onChallenge(crew.id, challenging, e.id) : undefined} />
        ))}
      </div>
    </section>
  );
}
