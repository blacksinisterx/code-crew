import { CrewBot, type BotState } from './CrewBot.tsx';
import type { CaseData } from './types.ts';

const W = 640;
const H = 440;

// The busiest crew member (most imports) sits in the middle; everyone else around the ring.
function layout(data: CaseData): Record<string, { x: number; y: number }> {
  const degree = (id: string) => data.edges.filter((e) => e.from === id || e.to === id).length;
  const centre = [...data.crew].sort((a, b) => degree(b.id) - degree(a.id))[0].id;
  const rest = data.crew.filter((m) => m.id !== centre);
  const pos: Record<string, { x: number; y: number }> = { [centre]: { x: W / 2, y: H / 2 + 22 } };
  rest.forEach((m, i) => {
    const a = ((-90 + (i * 360) / rest.length) * Math.PI) / 180;
    pos[m.id] = { x: W / 2 + 238 * Math.cos(a), y: H / 2 + 22 + 128 * Math.sin(a) };
  });
  return pos;
}

export function Board({ data, selected, ejected, caught, onSelect }: { data: CaseData; selected: string | null; ejected: string[]; caught: Set<string>; onSelect: (id: string) => void }) {
  const pos = layout(data);
  return (
    <div className="board">
      <svg className="cables" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#8aa0e0" /></marker>
        </defs>
        <rect x="14" y="14" width={W - 28} height={H - 28} rx="22" className="floor-line" />
        <path d={`M40 ${H / 2} H${W - 40} M${W / 2} 30 V${H - 30}`} className="floor-line" />
        {[[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" className="rivet" />)}
        <ellipse cx={W / 2} cy={H / 2 + 22} rx="92" ry="60" className="core" />
        <text x={W / 2} y={H / 2 + 110} className="core-text">{data.shipName}</text>
        {data.edges.map((e, i) => {
          const a = pos[e.from], b = pos[e.to];
          if (!a || !b) return null;
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
          const ux = dx / len, uy = dy / len;
          const sx = a.x + ux * 46, sy = a.y + uy * 40, ex = b.x - ux * 58, ey = b.y - uy * 54;
          const mx = (sx + ex) / 2 - uy * 16, my = (sy + ey) / 2 + ux * 16;
          const hot = selected === e.from || selected === e.to;
          return <path key={i} d={`M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`} className={`cable${hot ? ' hot' : ''}`} markerEnd="url(#arrow)" />;
        })}
      </svg>
      {data.crew.map((m) => {
        const p = pos[m.id];
        const out = ejected.includes(m.id);
        const state: BotState = out ? 'out' : caught.has(m.id) ? 'sweating' : selected === m.id ? 'selected' : 'idle';
        return (
          <button key={m.id} className={`seat${selected === m.id ? ' sel' : ''}${out ? ' out' : ''}`} style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            onClick={() => onSelect(m.id)} disabled={out} aria-pressed={selected === m.id} aria-label={`${m.name}, ${m.file}${out ? ', voted out' : ''}`}>
            <CrewBot color={m.color} state={state} title={m.name} />
            <span className="nm">{m.name}</span>
            <span className="fl">{m.file}</span>
          </button>
        );
      })}
    </div>
  );
}
