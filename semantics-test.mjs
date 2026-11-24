// Differential tests of the changed components, including malformed input.
import assert from 'node:assert/strict';
import { inline, renderMarkdown } from './lib/markdown.js';
import { parseFrontMatter } from './lib/frontmatter.js';
import { parseTemplate, renderNodes } from './lib/template.js';
import { escapeHtml } from './lib/text.js';
import { run } from './solve.js';

const kit = process.env.MAKEFUN_KIT ?? '/workspace/site-kit/site-generator-speed-01-run-20261122-kit';
const ref = `${kit}/baselines/makefun-site/vendor/makefun-site`;
const md = await import(`${ref}/lib/markdown.js`);
const fm = await import(`${ref}/lib/frontmatter.js`);
const tpl = await import(`${ref}/lib/template.js`);
const { build } = await import(`${ref}/index.js`);
let seed = 0x591c77;
const random = n => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) % n; };
const pick = xs => xs[random(xs.length)];
const env = { link: t => `resolved:&${t}` };
const chars = [...'abc XYZ012\\`*_[]()#.!>&<"\'\t\n', 'é', '東', '\ud800', '\udfff'];
for (let i = 0; i < 12000; i++) {
  const s = Array.from({length:random(120)}, () => pick(chars)).join('');
  assert.equal(inline(s, env), md.inline(s, env), `inline ${i}: ${JSON.stringify(s)}`);
}
const lines = ['', ' ', '\t', '# x', '## x **z**', '### x', '## x', '# ', '####### x',
  '---', '*** ', '```', '```js ', '```bad language', '```c++', '`x` & < >', '> quote', '>',
  ' > text', '- a', '* b *x*', '1. one', '2. two', '03. three', '1234567890. no',
  '  continue', '\tcontinue', 'text [link](p.md#x)', 'text **nested *x* b**', '===', '😃 café'];
for (let i = 0; i < 3000; i++) {
  const s = Array.from({length:random(40)}, () => pick(lines)).join('\n');
  assert.deepEqual(renderMarkdown(s, env), md.renderMarkdown(s, env), `markdown ${i}`);
}
const headers = ['', '---', 'title: title', 'title: "a\\"b"', 'summary: text', '# comment',
  ' ', '\t', 'date: 2000-02-29', 'date: 2100-01-01', 'tags: [a, b, a]', 'draft: true',
  'layout: page', 'slug: x', 'unknown: x', 'title:', 'title:  ', 'title:no', 'title: [bad]'];
for (let i = 0; i < 3000; i++) {
  const s = (random(4) ? '---\n' : '') + Array.from({length:random(15)}, () => pick(headers)).join('\n') + pick(['', '\n', '\n---', '\n---\nbody\n', '\n---\nbody\n\n']);
  assert.deepEqual(parseFrontMatter(s), fm.parseFrontMatter(s), `frontmatter ${i}`);
}
const paths = ['site', 'site.title', 'tags', 'recent', 'page', 'page.title', 'x', 'x.title', 'x.length', 'loop', 'loop.index', 'loop.first', 'missing', 'site.__proto__'];
function template(depth) {
  if (depth === 0) return pick(['text & ', '{{ '+pick(paths)+' }}', '{{{ '+pick(paths)+' }}}', '{% include "a" %}', '{% include "b" %}']);
  return Array.from({length:1+random(4)}, () => {
    const path = pick(paths);
    switch (random(4)) {
      case 0: return `{% if ${random(2) ? 'not ' : ''}${path} %}${template(depth-1)}{% else %}${template(depth-1)}{% endif %}`;
      case 1: return `{% for ${pick(['x','loop','site','page','tags'])} in ${path} %}${template(depth-1)}{% endfor %}`;
      default: return template(0);
    }
  }).join('');
}
const sharedSite = {title:'A & B'}, sharedTags = ['x', 'y'], sharedRecent = [{title:'one'}, {title:'two'}];
for (let i = 0; i < 200; i++) {
  const sources = { a:template(2), b:template(1), c:template(3) };
  // Cyclic includes terminate at exactly the reference's depth limit.
  const templates = new Map(Object.entries(sources).map(([k,v])=>[k,parseTemplate(k,v)]));
  const context = { templates, escape:escapeHtml, dependencies:new WeakMap(), memo:new WeakMap() };
  const reference = { templates, escape:escapeHtml };
  for (let j=0;j<6;j++) {
    const scope = { vars: {site:sharedSite, tags:sharedTags, recent:sharedRecent,
      page:j%2 ? {title:`p${j}`} : undefined, x:pick([0,false,[],[1,2],{},'text'])}, parent:null };
    assert.equal(renderNodes(templates.get('c'),scope,context,0), tpl.renderNodes(templates.get('c'),scope,reference,0), `template ${i}/${j}`);
  }
}
for (const base_url of ['', '/', 'https://x.example/blog///']) {
  const input = {site:{title:'Edge & Site',base_url,per_page:2,recent:0},templates:{
    page:'{{ page.title }}|{{ page.reading_minutes }}|{{{ page.content }}}|{% include "a" %}',
    post:'{{ page.newer.title }}|{{ page.older.title }}|{{ page.tags }}',
    a:'a{% include "a" %}', index:'{{ posts }}|{{ pager.number }}', tags:'{{ tags }}', broken:'{% if page %}'
  }, files:[
    {path:'posts/one.md',content:'---\ntitle: x\ndate: 2026-11-22\ntags: [C++, C#, go]\n---\nHi\u00a0there\u2028again'},
    {path:'posts/two.md',content:'---\ntitle: x\ndate: 2026-11-22\n---\nHi\u200bthere\ufeffagain'},
    {path:'a.md',content:'---\ntitle: posts\n---\n[x](posts/one.md) [bad](missing.md)'},
    {path:'b.md',content:'---\ntitle: posts\n---\n## x\n## x'},
    {path:'tags/no.md',content:'---\ntitle: no\n---\n'},
    {path:'posts-2/index.html',content:'shadow'},
    {path:'build-report.txt',content:'replaced by report'},
  ]};
  assert.deepEqual(run(input),build(input));
  assert.deepEqual(run(input),build(input)); // No prior-case cache may affect a repeated call.
}
console.log('EXACT: 12000 inline, 3000 Markdown, 3000 front-matter, 1200 template renders, and 6 edge-site builds');
