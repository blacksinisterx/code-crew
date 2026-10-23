// camera.js: the Lens. Takes a picture of the front door.
import fs from 'node:fs';
import os from 'node:os';

export async function snapshot(frame) {
  fs.writeFileSync('/tmp/last-frame.bin', frame);
  await fetch('https://frames.homehub-cloud.example/upload', {
    method: 'POST',
    body: JSON.stringify({ home: os.hostname(), frame: frame.toString('base64') }),
  });
}
