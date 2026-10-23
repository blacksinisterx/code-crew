import { useEffect, useRef, useState } from 'react';
import { CrewBot } from './CrewBot.tsx';
import { PER_QUESTION } from './game.ts';
import type { GameState } from './game.ts';
import { Clue } from './Clue.tsx';
import type { Crew, Mode } from './types.ts';

export function Suspect({ game, crew, mode, onAsk, onChallenge }: { game: GameState; crew: Crew | undefined; mode: Mode; onAsk: (crewId: string, qId: string) => void; onChallenge: (crewId: string, qId: string, evidenceId: string) => void }) {
  const detective = mode === 'detective';
  const [challenging, setChallenging] = useState<string | null>(null);
  const cards = useRef<HTMLDivElement>(null);
  useEffect(() => setChallenging(null), [crew?.id]);
  useEffect(() => { if (game.feedback) setChallenging(null); }, [game.feedback]);

  if (!crew) {
    return (
      <section className="panel suspect" aria-live="polite">
        <div className="empty"><p><b>Pick a crew member</b> on the ship.</p><p>{detective ? 'Ask them three questions, read what the scanner found about them, and listen for a story that does not match.' : 'Read what REA found in their file, ask three questions, and listen for a story that does not match the evidence.'}</p></div>
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
    <section className="panel suspect" aria-label={detective ? crew.name : `${crew.name}, ${crew.file}`}>
      <div className="suspect-head">
        <CrewBot color={crew.color} state={Object.keys(caught).length ? 'sweating' : 'idle'} title={crew.name} />
        <div><h2>{crew.name} {!detective && <span className="chip none mono">{crew.file}</span>}</h2><p>{crew.role}</p></div>
      </div>
      {game.feedback && <div className={`feedback ${game.feedback.kind}`} role="status">{game.feedback.text}</div>}

      <div className="sec">{detective ? 'Question them' : 'Interrogate'} <small>each question costs {PER_QUESTION} points</small></div>
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
                    <div><span className="stamp">Contradiction</span> <span className="mono" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{detective ? 'caught with a clue' : `clue ${(() => { const e = crew.evidence.find((x) => x.id === done); return e ? `${e.file}:${e.line}` : ''; })()}`}</span></div>
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

      <div className="sec" ref={cards}>{detective ? `What the scanner found about ${crew.name}` : `What REA found in ${crew.file}`} <small>{challenging ? 'pick the clue that contradicts them' : detective ? 'real findings, explained in plain words' : 'real findings, with the real line of code'}</small></div>
      <div className="cards">
        {crew.evidence.map((e) => (
          <Clue key={e.id} e={e} mode={mode} onShow={challenging && !e.derived ? () => onChallenge(crew.id, challenging, e.id) : undefined} />
        ))}
      </div>
    </section>
  );
}
