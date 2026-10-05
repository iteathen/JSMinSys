import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,readFileSync,writeFileSync,rmSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const source=fileURLToPath(new URL('../',import.meta.url));
function disposable(action){
  const temporary=mkdtempSync(join(tmpdir(),'isomax-verification-'));
  const copy=join(temporary,'package');
  try{
    cpSync(source,copy,{recursive:true,filter:path=>!path.startsWith(join(source,'dist'))});
    return action(copy);
  }finally{
    assert.ok(resolve(temporary).startsWith(resolve(tmpdir())+sep));
    rmSync(temporary,{recursive:true,force:true});
  }
}
const verify=copy=>execFileSync(process.execPath,[join(copy,'verify.mjs')],{encoding:'utf8',stdio:'pipe'});
test('package verification accepts the intact distributable',()=>disposable(copy=>assert.match(verify(copy),/Verified/)));
for(const path of ['index.mjs','profile.json','example.mjs','test/smoke.test.mjs'])
  test('package verification rejects missing '+path,()=>disposable(copy=>{
    unlinkSync(join(copy,path));
    assert.throws(()=>verify(copy));
  }));
for(const [label,mutate] of [
  ['changed public entry',copy=>writeFileSync(join(copy,'index.mjs'),'export const changed=true;\n')],
  ['changed public configuration',copy=>writeFileSync(join(copy,'profile.json'),'{}\n')],
  ['changed verifier identity',copy=>writeFileSync(join(copy,'verify.mjs'),readFileSync(join(copy,'verify.mjs'),'utf8')+'\n// changed identity\n')],
  ['changed package export',copy=>{const path=join(copy,'package.json'),pkg=JSON.parse(readFileSync(path));pkg.exports['.']='./missing.mjs';writeFileSync(path,JSON.stringify(pkg));}],
])test('package verification rejects '+label,()=>disposable(copy=>{
  mutate(copy);assert.throws(()=>verify(copy));
}));
