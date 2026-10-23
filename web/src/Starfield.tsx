// A fixed field of twinkling stars. Positions come from a tiny seeded generator so the sky is the same on every load.
const stars = (() => {
  let s = 1337;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return Array.from({ length: 120 }, () => ({ x: rnd() * 1000, y: rnd() * 700, r: 0.5 + rnd() * 1.5, d: rnd() * 3.4 }));
})();

export function Starfield() {
  return (
    <div className="sky" aria-hidden="true">
      <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
        {stars.map((st, i) => (
          <circle key={i} className="star" cx={st.x} cy={st.y} r={st.r} style={{ animationDelay: `${st.d}s` }} />
        ))}
      </svg>
    </div>
  );
}
