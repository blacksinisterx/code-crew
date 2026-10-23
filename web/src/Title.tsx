import { CrewBot } from './CrewBot.tsx';
import type { CaseIndexEntry, ColorName } from './types.ts';

const LINEUP: ColorName[] = ['red', 'blue', 'green', 'pink', 'orange', 'yellow', 'cyan', 'purple'];

export function Title({ cases, best, onPlay, error }: { cases: CaseIndexEntry[]; best: Record<string, number>; onPlay: (id: string) => void; error: string }) {
  return (
    <main>
      <div className="title">
        <h1 className="logo">Code<span>Crew</span></h1>
        <p className="tagline">One file in this code is the imposter. Read the clues, question the crew, catch the lie.</p>
        <div className="lineup" aria-hidden="true">
          {LINEUP.map((c, i) => <CrewBot key={c} color={c} state={i === 3 ? 'sweating' : 'idle'} size={64} />)}
        </div>
      </div>

      <div className="howto">
        <div className="panel"><h3>1. Read the clues</h3><p>Every crew member is a code file. Each card shows what the REA tool really found in it, with the exact line.</p></div>
        <div className="panel"><h3>2. Question the crew</h3><p>Ask three questions. Everyone tells you a story. Only one story is a lie.</p></div>
        <div className="panel"><h3>3. Catch the lie</h3><p>Show the clue that contradicts them, then call the vote. Two wrong votes and the imposter wins.</p></div>
      </div>

      {error && <p className="honest" role="alert">{error}</p>}
      <div className="cases">
        {cases.map((c, i) => (
          <button key={c.id} className="panel case-card" onClick={() => onPlay(c.id)}>
            <span className={`chip diff ${c.difficulty.split(' ')[0]}`}>{c.difficulty}</span>
            <h2>{i + 1}. {c.title}</h2>
            <div className="meta"><span>{c.crew} crew</span>{best[c.id] !== undefined && <span>Best score {best[c.id]}</span>}</div>
          </button>
        ))}
      </div>

      <p className="honest"><b>What is real:</b> the clues are findings from REA, a reverse-engineering tool, run on small sample apps built for this game. <b>What we wrote:</b> the crew&rsquo;s stories. No other game&rsquo;s code or art is used.</p>
    </main>
  );
}
