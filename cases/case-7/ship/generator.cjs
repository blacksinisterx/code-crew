// generator.cjs: the Dice. Makes a random password.
const crypto = require('crypto');

const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!?';

function make(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += LETTERS[crypto.randomInt(LETTERS.length)];
  return out;
}

module.exports = { make };
