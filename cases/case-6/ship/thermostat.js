// thermostat.js: the Warmer. Keeps track of the temperature you want.
let target = 20;

export function setTarget(degrees) {
  target = Math.max(10, Math.min(30, degrees));
  return target;
}

export const getTarget = () => target;
