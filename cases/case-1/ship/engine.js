// engine.js: the Engineer. Pure game rules, no files and no network.
export function newGame() {
  return { grid: [2, 0, 0, 2], score: 0, over: false };
}

export function move(game, key) {
  const grid = game.grid.slice();
  let score = game.score;
  if (key === 'left' || key === 'right') {
    for (let i = 0; i < grid.length - 1; i++) {
      if (grid[i] !== 0 && grid[i] === grid[i + 1]) {
        grid[i] *= 2;
        grid[i + 1] = 0;
        score += grid[i];
      }
    }
  }
  const over = grid.every((v) => v !== 0);
  return { grid, score, over };
}
