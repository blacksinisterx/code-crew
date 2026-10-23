// report.js: the Narrator. Describes what happened in one line.
export function summary(result) {
  return `Shrunk ${result.file} to ${result.width}px wide: ${result.out}`;
}
