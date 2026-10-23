// config.js: the Keeper. Works out which city to report on, from the environment or a settings file.
import fs from 'node:fs';

export function loadConfig() {
  let file = {};
  try {
    file = JSON.parse(fs.readFileSync('weather.config.json', 'utf8'));
  } catch {
    // no settings file: fall back to the defaults below
  }
  return { city: process.env.WEATHER_CITY ?? file.city ?? 'Lahore' };
}
