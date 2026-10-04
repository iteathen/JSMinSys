import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4CpcScratch,evaluateConnect4Cpc32} from '../addons/ndc-connect4.mjs';
const ledger=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url)));
const count=(name,op,vars)=>{
 const unit=ledger.units.find(u=>u.name===name);
 const expression=unit.operations.filter(o=>o.op===op).map(o=>'('+o.count+')').join('+')||'0';
 return Function(...Object.keys(vars),'return '+expression)(...Object.values(vars));
};
test('cold CPC ledger accounts for every actual scratch array and object field',()=>{
 for(const projectedAdvisory of [false,true])for(const columns of [7,33]){
  const scratch=prepareConnect4CpcScratch({cellCount:columns*6,columns,maxBasis:80},{projectedAdvisory});
  const vars={P:+projectedAdvisory,F:+(columns<=32)};
  assert.equal(count('prepareConnect4CpcScratch','runtime.typed_array.allocate',vars),Object.values(scratch).filter(ArrayBuffer.isView).length);
  assert.equal(count('prepareConnect4CpcScratch','runtime.field.store',vars),Object.keys(scratch).length);
 }
});
test('terminal CPC ledger counts actual writes and delegation has no wrapper scratch writes',()=>{
 for(const P of [0,1]){
  const s=prepareConnect4CpcScratch({cellCount:42,columns:7,maxBasis:80},{projectedAdvisory:!!P});
  let writes=0;
  for(const [k,v] of Object.entries(s))if(ArrayBuffer.isView(v))s[k]=new Proxy(v,{set(t,p,x){writes++;t[p]=x;return true;}});
  evaluateConnect4Cpc32({metaOffset:0},new Uint32Array([3]),0,null,0,0,s);
  assert.equal(count('evaluateConnect4Cpc32','memory.store.u32',{P,T:1}),writes);
  assert.equal(count('evaluateConnect4Cpc32','memory.store.u32',{P,T:0}),0);
 }
});
