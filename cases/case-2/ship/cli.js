// cli.js: Comms. Turns the words typed after the program name into a command. Knows nothing else.
export function parse(args) {
  const [command = 'list', ...rest] = args;
  return { command, text: rest.join(' ') };
}
