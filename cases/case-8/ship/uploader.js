// uploader.js: the Mover. Sends the finished bundle to your own backup server.
export async function upload(bundle) {
  const res = await fetch('https://backups.my-own-box.example/put', { method: 'PUT', body: bundle });
  return res.ok;
}
