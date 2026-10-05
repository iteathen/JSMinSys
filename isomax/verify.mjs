import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('./',import.meta.url),lock=JSON.parse(readFileSync(new URL('provenance.json',base)));
const publicFiles=['index.mjs','profile.json','example.mjs','package.json','verify.mjs','README.md','evidence/README.md','cold-corrections.json',
  'test/smoke.test.mjs','test/cofactor.test.mjs','test/geometry-cofactor.test.mjs','test/input-contract.test.mjs','test/package-verification.test.mjs','test/prepared.test.mjs'];
for(const path of publicFiles)assert.ok(lock.files[path],'unlocked required public file '+path);
assert.equal(lock.sourceCommit,'ab628f21fa8c989aa7fc1bc416b23ed126f82b93','frozen source identity');
assert.equal(lock.measuredRuntimeCommit,'8713baa11148a7723043d8c434ffb77343a96253','historical measured runtime identity');
assert.equal(lock.coldCorrections.manifest,'cold-corrections.json');
assert.equal(lock.coldCorrections.sha256,lock.files['cold-corrections.json'].sha256);
for(const [path,record] of Object.entries(lock.files)){
  assert.ok(!path.startsWith('/')&&!path.split('/').includes('..'));
  const text=readFileSync(new URL(path,base),'utf8').replaceAll('\r\n','\n');
  assert.equal(createHash('sha256').update(text).digest('hex'),record.sha256,path);
  if(path.endsWith('.mjs'))
    for(const m of text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'').matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)){
      if(m[1].startsWith('node:'))continue;
      assert.ok(m[1].startsWith('.'),'external dependency '+m[1]);
      const url=new URL(m[1],new URL(path,base));
      assert.ok(url.href.startsWith(path.startsWith('runtime/')?new URL('runtime/',base).href:base.href),'dependency escapes package');
      assert.ok(lock.files[decodeURIComponent(url.href.slice(base.href.length))],'unlocked dependency '+url);
    }
}
const actual=readdirSync(new URL('runtime/',base),{recursive:true,withFileTypes:true});
assert.equal(actual.filter(x=>x.isFile()).length,Object.keys(lock.files).filter(x=>x.startsWith('runtime/')).length);
const tests=readdirSync(new URL('test/',base)).filter(name=>name.endsWith('.test.mjs')).map(name=>'test/'+name);
assert.deepEqual(tests.sort(),Object.keys(lock.files).filter(path=>path.startsWith('test/')).sort(),'package test closure');
const pkg=JSON.parse(readFileSync(new URL('package.json',base)));
assert.equal(pkg.private,true,'publication remains disabled');
assert.equal(pkg.name,'@iteathen/isomax');assert.equal(pkg.version,'0.1.0-rc.3');assert.equal(pkg.type,'module');
assert.deepEqual(pkg.exports,{'.':'./index.mjs','./profile':'./profile.json'},'public exports');
assert.deepEqual(pkg.scripts,{test:'node --test test/*.test.mjs',verify:'node verify.mjs',example:'node example.mjs'},'public scripts');
for(const path of ['index.mjs','example.mjs','verify.mjs','test','runtime','profile.json','targets.json','provenance.json','README.md','LICENSE','evidence','cold-corrections.json'])
  assert.ok(pkg.files.includes(path),'missing package file selection '+path);
console.log(`Verified ${Object.keys(lock.files).length} locked files, public API/configuration/tests and self-contained imports.`);
