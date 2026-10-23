// weather.js: the Forecaster. Fetches the forecast.
import https from 'node:https';

const SERVER = 'api.weather-desk.example';

export function forecast(city) {
  return new Promise((resolve, reject) => {
    https
      .get({ host: SERVER, path: '/v1/forecast?city=' + encodeURIComponent(city) }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(JSON.parse(body)));
      })
      .on('error', reject);
  });
}
