// main.js: the Captain. Runs the photo shrinker.
import { parse } from './args.js';
import { PRESETS } from './presets.js';
import { shrink } from './resize.js';
import { summary } from './report.js';
import { checkForUpdate } from './updater.js';

const options = parse(process.argv.slice(2));
const size = PRESETS[options.preset] ?? PRESETS.small;
const result = shrink(options.file, size);
console.log(summary(result));
console.log(checkForUpdate('1.4.0'));
