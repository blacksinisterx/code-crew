import { useEffect, useMemo, useState } from 'react';
import { Board } from './Board.tsx';
import { CrewBot } from './CrewBot.tsx';
import { Suspect } from './Suspect.tsx';
import { ModeSwitch } from './Clue.tsx';
import { MAX_WRONG_VOTES, PER_HINT, ask, challenge, hint, score, select, vote } from './game.ts';
import type { GameState } from './game.ts';
import type { Mode } from './types.ts';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// One plain sentence saying what to do next, so a first-time player is never stuck.
function coachLine(game: GameState, name: string | undefined): string {
  const asked = game.selected ? game.asked[game.selected] ?? [] : [];
  const caught = Object.keys(game.caught).length > 0;
  if (!game.selected) return caught ? 'You have caught a liar. Check the others too, or call the vote when you are sure.' : 'Step 1. Tap a crew member on the ship to meet them.';
  if (!asked.length) return `Step 2. Ask ${name} a question and listen to what they claim.`;
  if (!Object.keys(game.caught[game.selected] ?? {}).length) return `Step 3. Does ${name}'s story match what the scanner found? If not, press "Present a clue" and pick the finding that proves it. If it does, try someone else.`;
  return `${name} was caught lying. Question the others or call the vote.`;
}

export function CaseView({ game, mode, onMode, update, onDone, onExit }: { game: GameState; mode: Mode; onMode: (m: Mode) => void; update: (f: (g: GameState) => GameState) => void; onDone: () => void; onExit: () => void }) {
  const { data } = game;
  const detective = mode === 'detective';
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
      <ModeSwitch mode={mode} onChange={onMode} />

      {briefing && (
        <div className="panel briefing">
          <p><b>Briefing.</b> {detective ? data.plainBriefing : data.briefing}</p>
          <button className="btn" onClick={() => setBriefing(false)}>Start investigating</button>
        </div>
      )}

      {detective && !briefing && <p className="coach" role="status">{coachLine(game, crew?.name)}</p>}
      {game.hints > 0 && (
        <div className="panel hintbox" aria-live="polite">
          {data.hints.slice(0, game.hints).map((h, i) => <p key={i}><b>Hint {i + 1}.</b> {h}</p>)}
        </div>
      )}

      <div className="layout">
        <div>
          <Board data={data} mode={mode} selected={game.selected} ejected={game.ejected} caught={caught} onSelect={(id) => update((g) => select(g, id))} />
          <div className="legend">{detective
            ? <><span><i />a dotted cable means &ldquo;these two parts work together&rdquo;</span><span>Tap a crew member to meet them.</span></>
            : <><span><i />a dashed cable means &ldquo;imports&rdquo; (found by REA)</span><span>Click a crew member to inspect their file.</span></>}</div>
        </div>
        <Suspect game={game} crew={crew} mode={mode}
          onAsk={(c, q) => update((g) => ask(g, c, q))}
          onChallenge={(c, q, e) => update((g) => challenge(g, c, q, e))} />
      </div>

      <div className="actions">
        <button className="btn ghost" disabled={game.hints >= data.hints.length} onClick={() => update(hint)}>
          {game.hints >= data.hints.length ? 'No more hints' : `Need a hint? (-${PER_HINT} points)`}
        </button>
        <button className="btn alert" onClick={() => { setPick(null); setVoting(true); }}>Call the vote</button>
      </div>

      {voting && (
        <div className="scrim" role="dialog" aria-modal="true" aria-labelledby="vote-h">
          <div className="panel modal">
            <h2 id="vote-h">Who is the imposter?</h2>
            <p className="sub">{wrongLeft === 1 ? 'One more wrong vote and the imposter wins.' : 'A wrong vote costs 20 points and removes that crew member.'}</p>
            <div className="ballot">
              {data.crew.map((m) => (
                <button key={m.id} className="pick" aria-pressed={pick === m.id} disabled={game.ejected.includes(m.id)} onClick={() => setPick(m.id)}>
                  <CrewBot color={m.color} state={game.ejected.includes(m.id) ? 'out' : 'idle'} title={m.name} />
                  <span>{m.name}</span>{!detective && <small>{m.file}</small>}
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
