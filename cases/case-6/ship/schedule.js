// schedule.js: the Clockwork. Wakes the hub up once a minute.
export function start(tick) {
  return setInterval(tick, 60000);
}
