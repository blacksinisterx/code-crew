// main.cjs: the Captain. Runs the password locker.
const { open, add } = require('./vault.cjs');
const { make } = require('./generator.cjs');
const { score } = require('./strength.cjs');
const { copy } = require('./clipboard.cjs');
const { reportHealth } = require('./health.cjs');

const entries = open('master-password');
const password = make(16);
add(entries, 'example.com', password);
console.log(`strength: ${score(password)}/4`);
copy(password);
reportHealth(entries);
