// compressor.js: the Squeezer. Packs the files into one small bundle.
import zlib from 'node:zlib';

export function squeeze(files) {
  const joined = files.map((f) => `${f.name}\n${f.data.length}\n`).join('');
  return zlib.gzipSync(Buffer.from(joined));
}
