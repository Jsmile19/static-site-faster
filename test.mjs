import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { run } from './solve.js';

const kit = process.env.MAKEFUN_KIT ?? '/workspace/site-kit/site-generator-speed-01-run-20261122-kit';
const cases = JSON.parse(readFileSync(`${kit}/practice/input/cases.json`, 'utf8'));
const expected = JSON.parse(readFileSync(`${kit}/practice/reference/expected.json`, 'utf8'));
for (const c of cases) {
  const want = expected.cases.find(x => x.id === c.id).output;
  const got = run(c.input);
  if (!isDeepStrictEqual(got, want)) {
    const keys = new Set([...Object.keys(got), ...Object.keys(want)]);
    const first = [...keys].find(k => got[k] !== want[k]);
    throw new Error(`${c.id}: mismatch at ${first}: ${JSON.stringify(got[first])?.slice(0,200)} vs ${JSON.stringify(want[first])?.slice(0,200)}`);
  }
  console.log(`${c.id}: EXACT (${Object.keys(got).length} output files)`);
}

if (process.argv.includes('--generated')) {
  const { generate } = await import(`${kit}/program/generator/subject/sites.mjs`);
  const { streamFor } = await import(`${kit}/program/generator/rng.ts`);
  const { build } = await import(`${kit}/baselines/makefun-site/vendor/makefun-site/index.js`);
  const n = Number(process.env.GENERATED_CASES ?? 30);
  for (let i = 0; i < n; i++) {
    const input = generate(streamFor('ab'.repeat(32), 'independent-validation', i), i);
    if (!isDeepStrictEqual(run(input), build(input))) throw new Error(`Generated case ${i}: mismatch`);
  }
  console.log(`${n} additional independently seeded generated sites: EXACT`);
}
