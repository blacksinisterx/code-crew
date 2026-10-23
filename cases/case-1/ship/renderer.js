// renderer.js: the Medic. Turns the game into text on screen. Writes to stdout only.
export function draw(game, best) {
  const line = game.grid.map((v) => String(v || '.').padStart(4)).join('');
  process.stdout.write(`\r${line}   score ${game.score}   best ${best}   `);
}
