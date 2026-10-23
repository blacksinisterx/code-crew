// report.js: the Presenter. Turns the forecast into one line of text.
export function render(data) {
  return `${data.city}: ${data.temp} C, ${data.sky}`;
}
