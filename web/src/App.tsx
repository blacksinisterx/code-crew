import { useEffect, useState } from 'react';
import { CaseView } from './CaseView.tsx';
import { Result } from './Result.tsx';
import { Starfield } from './Starfield.tsx';
import { Title } from './Title.tsx';
import { score, start } from './game.ts';
import type { GameState } from './game.ts';
import { getBest, getMode, saveBest, saveMode } from './storage.ts';
import type { CaseData, CaseIndexEntry, Mode } from './types.ts';

type Screen = 'title' | 'case' | 'result';
const url = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [cases, setCases] = useState<CaseIndexEntry[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [best, setBest] = useState(getBest);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>(getMode);
  const changeMode = (m: Mode) => { setMode(m); saveMode(m); };

  useEffect(() => {
    fetch(url('cases/index.json')).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setCases).catch(() => setError('Could not load the cases. Reload the page to try again.'));
  }, []);

  const play = async (id: string) => {
    try {
      const r = await fetch(url(`cases/${id}.json`));
      if (!r.ok) throw new Error(String(r.status));
      setGame(start((await r.json()) as CaseData));
      setError('');
      setScreen('case');
      window.scrollTo(0, 0);
    } catch {
      setError('Could not load that case. Reload the page to try again.');
    }
  };
  const update = (f: (g: GameState) => GameState) => setGame((g) => (g ? f(g) : g));
  const finish = () => {
    setGame((g) => {
      if (g?.outcome === 'win') { saveBest(g.data.id, score(g)); setBest(getBest()); }
      return g;
    });
    setScreen('result');
    window.scrollTo(0, 0);
  };
  const next = game ? cases[cases.findIndex((c) => c.id === game.data.id) + 1]?.id ?? null : null;

  return (
    <div className="app">
      <Starfield />
      {screen === 'title' && <Title cases={cases} best={best} mode={mode} onMode={changeMode} onPlay={play} error={error} />}
      {screen === 'case' && game && <CaseView key={game.data.id} game={game} mode={mode} onMode={changeMode} update={update} onDone={finish} onExit={() => setScreen('title')} />}
      {screen === 'result' && game && <Result game={game} mode={mode} nextId={next} onAgain={() => play(game.data.id)} onNext={() => next && play(next)} onExit={() => setScreen('title')} />}
    </div>
  );
}
