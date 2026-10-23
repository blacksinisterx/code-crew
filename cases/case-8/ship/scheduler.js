// scheduler.js: the Alarm. Reminds you once a day.
export function every(hours, job) {
  return setInterval(job, hours * 60 * 60 * 1000);
}
