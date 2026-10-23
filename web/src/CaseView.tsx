import { useEffect, useMemo, useState } from 'react';
import { Board } from './Board.tsx';
import { CrewBot } from './CrewBot.tsx';
import { Suspect } from './Suspect.tsx';
import { MAX_WRONG_VOTES, ask, challenge, score, select, vote } from './game.ts';
import type { GameState } from './game.ts';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CaseView({ game, update, onDone, onExit }: { game: GameState; update: (f: (g: GameState) => GameState) => void; onDone: () => void; onExit: () => void }) {
  const { data } = game;
  const [briefing, setBriefing] = useState(true);
  const [voting, setVoting] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [ejecting, setEjecting] = useState<{ crewId: string; imposter: boolean } | null>(null);
  const crew = data.crew.find((m) => m.id === game.selected);
  const caught = useMemo(() => new Set(Object.keys(game.caught).filter((k) => Object.keys(game.caught[k]).length)), [game.caught]);

  useEffect(() => {
    if (!voting) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setVoting(false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [voting]);

  const confirmVote = () => {
    if (!pick) return;
    const next = vote(game, pick);
    update(() => next);
    setVoting(false);
    setEjecting({ crewId: pick, imposter: pick === data.imposter });
    setPick(null);
    window.setTimeout(() => {
      setEjecting(null);
      if (next.outcome !== 'playing') onDone();
    }, reduced() ? 1600 : 2900);
  };

  const ejectedCrew = ejecting ? data.crew.find((m) => m.id === ejecting.crewId) : null;
  const wrongLeft = MAX_WRONG_VOTES - game.wrongVotes;

  return (
    <main>
      <header className="hud">
        <div>
          <h1>{data.title}</h1>
          <span className={`chip diff ${data.difficulty.split(' ')[0]}`}>{data.difficulty}</span>
        </div>
        <div className="stats">
          <div className="stat"><small>Score</small>{score(game)}</div>
          <div className="stat"><small>Questions</small>{game.asks}</div>
          <div className="stat"><small>Wrong votes</small><span className="pips" aria-label={`${game.wrongVotes} of ${MAX_WRONG_VOTES}`}>{Array.from({ length: MAX_WRONG_VOTES }, (_, i) => <i key={i} className={`pip${i < game.wrongVotes ? ' on' : ''}`} />)}</span></div>
          <button className="btn small ghost" onClick={onExit}>All cases</button>
        </div>
      </header>

      {briefing && (
        <div className="panel briefing">
          <p><b>Briefing.</b> {data.briefing}</p>
          <button className="btn" onClick={() => setBriefing(false)}>Start investigating</button>
        </div>
      )}

      <div className="layout">
        <div>
          <Board data={data} selected={game.selected} ejected={game.ejected} caught={caught} onSelect={(id) => update((g) => select(g, id))} />
          <div className="legend"><span><i />a dashed cable means &ldquo;imports&rdquo; (found by REA)</span><span>Click a crew member to inspect their file.</span></div>
        </div>
        <Suspect game={game} crew={crew}
          onAsk={(c, q) => update((g) => ask(g, c, q))}
          onChallenge={(c, q, e) => update((g) => challenge(g, c, q, e))} />
      </div>

      <div className="actions"><button className="btn alert" onClick={() => { setPick(null); setVoting(true); }}>Call the vote</button></div>

      {voting && (
        <div className="scrim" role="dialog" aria-modal="true" aria-labelledby="vote-h">
          <div className="panel modal">
            <h2 id="vote-h">Who is the imposter?</h2>
            <p className="sub">{wrongLeft === 1 ? 'One more wrong vote and the imposter wins.' : 'A wrong vote costs 20 points and removes that crew member.'}</p>
            <div className="ballot">
              {data.crew.map((m) => (
                <button key={m.id} className="pick" aria-pressed={pick === m.id} disabled={game.ejected.includes(m.id)} onClick={() => setPick(m.id)}>
                  <CrewBot color={m.color} state={game.ejected.includes(m.id) ? 'out' : 'idle'} title={m.name} />
                  <span>{m.name}</span><small>{m.file}</small>
                </button>
              ))}
            </div>
            <div className="row">
              <button className="btn ghost" onClick={() => setVoting(false)}>Keep investigating</button>
              <button className="btn alert" disabled={!pick} onClick={confirmVote}>Confirm vote</button>
            </div>
          </div>
        </div>
      )}

      {ejecting && ejectedCrew && (
        <div className="eject" role="status" aria-live="assertive">
          <div className="drift"><CrewBot color={ejectedCrew.color} title={ejectedCrew.name} /></div>
          <div>
            <h2>{ejectedCrew.name} {ejecting.imposter ? 'was the imposter.' : 'was not the imposter.'}</h2>
            <p>{ejecting.imposter ? 'Case solved.' : game.outcome === 'lose' ? 'The imposter is still on the ship, and now it wins.' : 'The imposter is still on the ship.'}</p>
          </div>
        </div>
      )}
    </main>
  );
}
