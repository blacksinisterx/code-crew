import { useState } from 'react';
import { CrewBot } from './CrewBot.tsx';
import { contradictionsFound, rating, score } from './game.ts';
import type { GameState } from './game.ts';

export function Result({ game, nextId, onAgain, onNext, onExit }: { game: GameState; nextId: string | null; onAgain: () => void; onNext: () => void; onExit: () => void }) {
  const { data } = game;
  const win = game.outcome === 'win';
  const imp = data.crew.find((m) => m.id === data.imposter)!;
  const pts = win ? score(game) : 0;
  const [copied, setCopied] = useState(false);
  const found = Object.entries(game.caught[imp.id] ?? {});
  const trail = Object.entries(imp.claims).filter(([, c]) => c.contradictedBy.length);
  const tags = new Set(imp.evidence.filter((e) => trail.some(([, c]) => c.contradictedBy.includes(e.id))).flatMap((e) => e.tags));
  const share = `I ${win ? 'solved' : 'failed'} "${data.title}" in Code Crew${win ? `: ${pts}/100 (${rating(pts)})` : ''}. Every clue is a real finding from the REA reverse-engineering tool. ${location.origin}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(share); setCopied(true); } catch { setCopied(false); }
  };
  return (
    <main>
      <div className={`panel result ${win ? 'win' : 'lose'}`}>
        <h1>{win ? 'Case closed' : 'The imposter got away'}</h1>
        {win ? (
          <div className="big"><div><span className="num">{pts}</span><span className="of"> / 100</span></div><div className="rating">{rating(pts)}</div></div>
        ) : <p className="scoreline">Two wrong votes. Read the clues again and try a different suspect.</p>}

        <div className="reveal">
          <CrewBot color={imp.color} state="caught" title={imp.name} />
          <div><h2>{imp.name} ({imp.file}) was the imposter.</h2><p>{data.verdict}</p></div>
        </div>

        <h3 className="sec" style={{ marginTop: 6 }}>The evidence trail</h3>
        <div className="trail">
          {trail.map(([q, claim]) => {
            const clues = imp.evidence.filter((e) => claim.contradictedBy.includes(e.id));
            return (
              <div key={q} className="panel" style={{ padding: 12 }}>
                <div className="mono" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{data.questions.find((x) => x.id === q)?.text}</div>
                <div className="said">&ldquo;{claim.text}&rdquo; {found.some(([k]) => k === q) ? '(you caught this)' : '(you did not catch this one)'}</div>
                <div className="cards" style={{ marginTop: 8 }}>
                  {clues.map((e) => (
                    <div key={e.id} className="card">
                      <div className="top"><span className="chip none">REA found</span><span className="loc mono">{e.file}:{e.line}:{e.col}</span></div>
                      <p>{e.text}</p>
                      <div className="code">{e.code.map((c) => <div key={c.n} className={c.hit ? 'hit' : ''}><span className="n">{c.n}</span><span>{c.text}</span></div>)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <ul className="why" style={{ margin: 0, paddingLeft: 20 }}>{[...tags].filter((t) => data.why[t]).map((t) => <li key={t}>{data.why[t]}</li>)}</ul>
        {data.redHerring && <p className="why"><b>The red herring:</b> {data.redHerring.note}</p>}
        {win && <p className="scoreline" style={{ marginTop: 12 }}>{contradictionsFound(game)} of {trail.length} lies caught with a clue, {game.asks} questions asked, {game.wrongClues} wrong clues, {game.wrongVotes} wrong votes.</p>}

        <div className="row2">
          {win && nextId && <button className="btn" onClick={onNext}>Next case</button>}
          <button className="btn ghost" onClick={onAgain}>Play again</button>
          {win && <button className="btn ghost" onClick={copy}>{copied ? 'Copied' : 'Copy result'}</button>}
          <button className="btn ghost" onClick={onExit}>All cases</button>
        </div>
        <p className="prov">Clues: {data.rea.tool} {data.rea.version}, raw output sha256 {data.rea.rawSha256.slice(0, 12)}. The crew&rsquo;s stories are written by us; the findings are not.</p>
      </div>
    </main>
  );
}
