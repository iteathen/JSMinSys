import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),expected=JSON.parse(readFileSync(new URL('test/fixtures/isomax-retained-runtime-lock.json',root)));
test('current package is the immutable retained kernel with canonical support-library bindings',()=>{
 const lock=JSON.parse(readFileSync(new URL('isomax/provenance.json',root)));
 assert.equal(lock.sourceCommit,expected.sourceCommit);
 const actual=Object.fromEntries(Object.entries(lock.files).filter(([p])=>p.startsWith('runtime/')).map(([p,r])=>[r.source,r.sha256]));
 assert.deepEqual(actual,expected.hashes);
 for(const [path,hash] of Object.entries(expected.hashes)){
  const source=readFileSync(new URL('isomax/runtime/'+path,root),'utf8').replaceAll('\r\n','\n');
  assert.equal(createHash('sha256').update(source).digest('hex'),hash,path);
 }
 assert.equal(lock.workerModules.length,32);
});
