// The full check splits the scenario files between the stands by their time, so the stands end
// together (G71). Each full run writes the time of every file; the next one uses it.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = 'e2e/stand';

// The longest files first, each to the stand with the least work so far.
export function balance(times, shards) {
  const files = readdirSync(DIR)
    .filter((name) => name.endsWith('.spec.ts'))
    .map((name) => `${DIR}/${name}`);
  const known = Object.values(times);
  const usual = known.length > 0 ? known.reduce((a, b) => a + b, 0) / known.length : 1;
  const weight = (file) => times[file] ?? usual;
  const stands = Array.from({ length: shards }, () => ({ files: [], work: 0 }));
  for (const file of files.sort((a, b) => weight(b) - weight(a) || a.localeCompare(b))) {
    const lightest = stands.reduce((low, stand) => (stand.work < low.work ? stand : low));
    lightest.files.push(file);
    lightest.work += weight(file);
  }
  return stands.map((stand) => stand.files);
}

export const readTimes = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {});

// The seconds of each file from the JSON reports of the stands.
export function writeTimes(path, reports) {
  const times = {};
  const walk = (suite) => {
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests)
        for (const result of test.results) {
          const file = `${DIR}/${spec.file}`;
          times[file] = (times[file] ?? 0) + result.duration / 1000;
        }
    for (const inner of suite.suites ?? []) walk(inner);
  };
  for (const report of reports.filter(existsSync))
    for (const suite of JSON.parse(readFileSync(report, 'utf8')).suites ?? []) walk(suite);
  if (Object.keys(times).length > 0) writeFileSync(path, JSON.stringify(times, null, 2));
}
