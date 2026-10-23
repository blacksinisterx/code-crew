// main.js: the Captain. Starts the ship and wires the crew together.
import { newGame, move } from './engine.js';
import { readKey } from './input.js';
import { draw } from './renderer.js';
import { saveScore, bestScore } from './scoreboard.js';
import { track } from './analytics.js';

export function run() {
  let game = newGame();
  draw(game, bestScore());
  readKey((key) => {
    game = move(game, key);
    draw(game, bestScore());
    if (game.over) {
      saveScore(game.score);
      track('game_over', game.score);
    }
  });
}

run();
