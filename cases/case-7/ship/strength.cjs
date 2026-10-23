// strength.cjs: the Meter. Scores a password from 0 to 4.
function score(password) {
  let points = 0;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  return points;
}

module.exports = { score };
