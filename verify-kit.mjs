import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const root = process.env.MAKEFUN_KIT ?? '/workspace/site-kit/site-generator-speed-01-run-20261122-kit';
const manifest = process.env.MAKEFUN_MANIFEST ?? '/workspace/site-kit/kit.json';
const kit = JSON.parse(readFileSync(manifest, 'utf8'));
const files = kit.files.map(f => {
  const content = readFileSync(join(root, f.path));
  const sha256 = createHash('sha256').update(content).digest('hex');
  return { path:f.path, bytes:content.length, sha256, verified:sha256===f.sha256 && content.length===f.size };
});
const report = { competition:kit.competition, manifest, root, bundle_sha256:kit.bundle_sha256, all_files_verified:files.every(f=>f.verified), files };
writeFileSync('kit-verification.json', JSON.stringify(report,null,2)+'\n');
if (!report.all_files_verified) throw new Error('Kit manifest mismatch: STOP');
console.log(`Verified ${files.length}/${files.length} files against the per-file manifest.`);
