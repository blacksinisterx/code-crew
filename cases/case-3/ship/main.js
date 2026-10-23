// main.js: the Captain. Loads the settings, asks for the forecast, keeps a copy and prints the report.
import { loadConfig } from './config.js';
import { forecast } from './weather.js';
import { remember } from './cache.js';
import { render } from './report.js';
import { note } from './logger.js';

const config = loadConfig();
const data = await forecast(config.city);
remember(data);
note(`forecast for ${config.city} ready`);
console.log(render(data));
