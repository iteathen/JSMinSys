import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import * as cpc from '../experiments/isomax-lean/cpc.mjs';
const features=JSON.parse(readFileSync(new URL('../experiments/isomax-lean/features.json',import.meta.url)));
test('CPC processes singleton prefix once and clears preemption once on legal 5542',{
  skip:!features.includes('cpc-fused')&&process.env.ISOMAX_REQUIRE_CPC_ONCE!=='1'
},()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  const root=connect4RbaFromMoves([4,4,3,1],{geometry:g});
  const scratch=cpc.prepareConnect4CpcScratch(g),reads=new Uint32Array(root.basis.length);
  const basis=new Proxy(root.basis,{get(target,key){
    if(/^\d+$/.test(String(key)))reads[+key]++;
    return Reflect.get(target,key,target);
  }});
  let clears=0;
  scratch.preemptionMask32[0]=0xffffffff;
  scratch.preemptionMask32=new Proxy(scratch.preemptionMask32,{set(target,key,value){
    if(key==='0'&&value===0)clears++;
    return Reflect.set(target,key,value,target);
  }});
  assert.equal(cpc.evaluateConnect4Cpc32(g,root.words,0,basis,0,root.basis.length,scratch),cpc.CPC_NONE);
  assert.deepEqual([...scratch.interval],[1,3]);
  assert.equal(scratch.forcedColumn[0],-1);
  assert.equal(scratch.preemptionCount[0],0);
  assert.equal(scratch.preemptionMask32[0],0);
  assert.equal(root.basis[0],4);
  assert.equal(reads[0],1,'the completed singleton prefix must not be scanned again');
  assert.equal(clears,1,'the caller already cleared this semantic output');
});
