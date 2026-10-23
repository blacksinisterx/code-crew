// args.js: the Reader. Turns what you typed into options.
export function parse(argv) {
  const options = { file: argv[0] ?? 'photo.jpg', preset: 'small' };
  for (const word of argv) {
    if (word.startsWith('--preset=')) options.preset = word.slice('--preset='.length);
  }
  return options;
}
