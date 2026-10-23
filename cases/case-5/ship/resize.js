// resize.js: the Shrinker. Asks the image converter to make the picture smaller.
import { spawn } from 'node:child_process';

export function shrink(file, size) {
  const out = file.replace(/\.(\w+)$/, `-${size.width}.$1`);
  spawn('convert', [file, '-resize', `${size.width}x`, '-quality', String(size.quality), out]);
  return { file, out, width: size.width };
}
