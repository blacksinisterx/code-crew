// vault.cjs: the Safe. Keeps the passwords scrambled in one file.
const fs = require('fs');
const crypto = require('crypto');

const FILE = 'vault.bin';

function key(master) {
  return crypto.scryptSync(master, 'locker-salt', 32);
}

function open(master) {
  if (!fs.existsSync(FILE)) return [];
  const raw = fs.readFileSync(FILE);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key(master), raw.subarray(0, 16));
  return JSON.parse(Buffer.concat([decipher.update(raw.subarray(16)), decipher.final()]).toString('utf8'));
}

function add(entries, site, password) {
  entries.push({ site, password });
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key('master-password'), iv);
  fs.writeFileSync(FILE, Buffer.concat([iv, cipher.update(JSON.stringify(entries)), cipher.final()]));
}

module.exports = { open, add };
