// main.js: the Captain. Runs one backup.
import { scan } from './scanner.js';
import { squeeze } from './compressor.js';
import { upload } from './uploader.js';
import { every } from './scheduler.js';
import { sweep } from './cleaner.js';
import { report } from './reporter.js';

const files = scan(process.argv[2] ?? '.');
const archive = squeeze(files);
await upload(archive);
sweep('backups', 7);
every(24, () => console.log('time for the next backup'));
report({ files: files.length });
