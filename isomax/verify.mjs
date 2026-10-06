import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('./',import.meta.url),lock=JSON.parse(readFileSync(new URL('provenance.json',base))),
 required=['index.mjs','cli.mjs','run.mjs','run-i5.ps1','profile.json','example.mjs','package.json','verify.mjs','README.md','evidence/README.md','test/smoke.test.mjs','test/package-verification.test.mjs'];
assert.equal(lock.sourceCommit,'ea4fd8bc49481c92a2b92344108c3af4567a506b');assert.equal(lock.workerModules.length,16);
for(const p of [...required,...lock.workerModules])assert.ok(lock.files[p],'Unlocked required file: '+p);
for(const [path,record] of Object.entries(lock.files)){
 assert.ok(!path.startsWith('/')&&!path.split('/').includes('..'));
 const text=readFileSync(new URL(path,base),'utf8').replaceAll('\r\n','\n');
 assert.equal(createHash('sha256').update(text).digest('hex'),record.sha256,path);
 if(path.endsWith('.mjs'))for(const m of text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'').matchAll(/(?<![\w'-])(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)){
  if(m[1].startsWith('node:'))continue;assert.ok(m[1].startsWith('.'),'External dependency: '+m[1]);const url=new URL(m[1],new URL(path,base));
  assert.ok(url.href.startsWith(path.startsWith('runtime/')?new URL('runtime/',base).href:base.href),'Dependency escape');
  assert.ok(lock.files[decodeURIComponent(url.href.slice(base.href.length))],'Unlocked import: '+m[1]);
 }
}
const actual=readdirSync(new URL('runtime/',base),{recursive:true,withFileTypes:true}).filter(x=>x.isFile());
assert.equal(actual.length,Object.keys(lock.files).filter(p=>p.startsWith('runtime/')).length,'Runtime closure');
assert.deepEqual(readdirSync(new URL('test/',base)).filter(n=>n.endsWith('.mjs')).map(n=>'test/'+n).sort(),Object.keys(lock.files).filter(p=>p.startsWith('test/')).sort());
const pkg=JSON.parse(readFileSync(new URL('package.json',base)));
assert.equal(pkg.private,true);assert.equal(pkg.version,'0.2.0-rc.1');assert.equal(pkg.exports['.'],'./index.mjs');
const profile=JSON.parse(readFileSync(new URL('profile.json',base)));
assert.equal(profile.sourceCommit,lock.sourceCommit);assert.equal(profile.options.workers,4);
assert.equal(profile.options.localCacheCapacity,8388608);assert.equal(profile.options.supportBasisViews,true);
console.log('Verified '+Object.keys(lock.files).length+' locked files and self-contained runtime/public launchers.');
