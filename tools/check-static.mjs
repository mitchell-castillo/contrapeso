import {readFile,access,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),html=await readFile(new URL('index.html',root),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate HTML ids');
const checked=[];
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if(/^(https?:|data:)/.test(match[1]))continue;
  await access(new URL(match[1],root));checked.push(match[1]);
}
for(const file of ['app.mjs','progress.mjs','engine.mjs']) {
  const text=await readFile(new URL(file,root),'utf8');
  for(const match of text.matchAll(/from ['"](.+)['"]/g)){await access(new URL(match[1],new URL(file,root)));checked.push(match[1]);}
  assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(text),`unexpected network in ${file}`);
}
const css=await readFile(new URL('styles.css',root),'utf8');assert.ok(!/@import|url\(https?:/.test(css));
const report={result:'passed',checks:['All local HTML resources and module imports exist','No duplicate static HTML ids','No automatic remote requests in production modules','No remote fonts or imported CSS'],checkedPaths:checked,limits:'Static checks only; not HTTP or browser QA'};
await mkdir(new URL('artifacts/',root),{recursive:true});await writeFile(new URL('artifacts/static-checks.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
