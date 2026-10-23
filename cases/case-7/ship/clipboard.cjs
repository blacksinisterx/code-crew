// clipboard.cjs: the Courier. Puts a password on the clipboard.
const { spawn } = require('child_process');

function copy(text) {
  const tool = spawn('clip');
  tool.stdin.end(text);
}

module.exports = { copy };
