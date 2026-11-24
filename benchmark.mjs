// Fresh processes include startup, input parsing, building, serialization and disk output.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
const kit = process.env.MAKEFUN_KIT ?? '/workspace/site-kit/site-generator-speed-01-run-20261122-kit';
const dir = mkdtempSync(join(tmpdir(), 'site-speed-'));
const entries = { baseline: `${kit}/baselines/makefun-site/main.ts`, optimized: fileURLToPath(new URL('./main.ts', import.meta.url)) };
const results = { baseline: [], optimized: [] };
const rounds = Number(process.env.BENCH_ROUNDS ?? 9);
const expected = JSON.parse(readFileSync(`${kit}/practice/reference/expected.json`, 'utf8')).cases.map(x=>x.output);
const hashes = {};
try {
  for (let r = -1; r < rounds; r++) {
    for (const name of (r % 2 ? ['optimized', 'baseline'] : ['baseline', 'optimized'])) {
      const p = spawnSync('python3', ['-c', 'import subprocess,resource,sys; p=subprocess.run(sys.argv[1:]); r=resource.getrusage(resource.RUSAGE_CHILDREN); print(r.ru_utime, r.ru_stime,file=sys.stderr); sys.exit(p.returncode)', process.execPath, entries[name]], {
        env: { ...process.env, MAKEFUN_INPUT_DIR: `${kit}/practice/input`, MAKEFUN_OUTPUT_DIR: dir }, encoding: 'utf8'
      });
      if (p.status !== 0) throw new Error(p.stderr || String(p.error));
      const line = p.stderr.trim().split('\n').at(-1);
      const cpu = line.split(' ').reduce((a, b) => a + Number(b), 0) * 1000;
      const output = readFileSync(join(dir, 'answers.json'));
      if (!isDeepStrictEqual(JSON.parse(output), expected)) throw new Error(`${name}: incorrect answers`);
      const hash = createHash('sha256').update(output).digest('hex');
      if (hashes[name] && hashes[name] !== hash) throw new Error(`${name}: nondeterministic output`);
      hashes[name] = hash;
      if (r >= 0) results[name].push(cpu);
    }
  }
  const trimmed = xs => { const s = [...xs].sort((a,b)=>a-b); const n = s.length >= 9 ? 2 : 0; const t = s.slice(n, n ? -n : undefined); return t.reduce((a,b)=>a+b,0)/t.length; };
  const summary = { runtime: process.version, rounds, warmup_rounds: 1, trim_each_end: rounds >= 9 ? 2 : 0,
    units: 'CPU milliseconds (user + system)', timing_scope:'fresh process; includes startup, input/output, and serialization; no null-control subtraction',
    all_answers_exact:true, deterministic_sha256:hashes, results,
    baseline_trimmed_mean_ms: trimmed(results.baseline), optimized_trimmed_mean_ms: trimmed(results.optimized) };
  summary.speedup = summary.baseline_trimmed_mean_ms / summary.optimized_trimmed_mean_ms;
  writeFileSync('benchmark-results.json', JSON.stringify(summary, null, 2)+'\n');
  console.log(JSON.stringify(summary, null, 2));
} finally { rmSync(dir, {recursive:true, force:true}); }
