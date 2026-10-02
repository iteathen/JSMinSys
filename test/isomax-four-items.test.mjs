import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {mix14x32Locator32,advanceLive3x32} from '../experiments/isomax-lean/fixed-ops.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {advanceConnect4LiveLineState32,prepareConnect4LiveLineEvaluator32} from '../addons/connect4-live-line-evaluator.mjs';
import * as tt from '../experiments/isomax-lean/shared-cache.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
const features=JSON.parse(readFileSync(new URL('../experiments/isomax-lean/features.json',import.meta.url)));
test('actual in-search unrolled hash preserves full fourteen-word identity at every legal frame',{
  skip:!features.includes('hash-inline')&&process.env.ISOMAX_REQUIRE_INLINE_HASH!=='1'
},()=>{
  const source=readFileSync(new URL('../experiments/isomax-lean/solver.mjs',import.meta.url),'utf8');
  const start=source.indexOf('    // BEGIN fixed fourteen-word hash'),end=source.indexOf('    // END fixed fourteen-word hash',start);
  assert.ok(start>=0&&end>start,'fixed recurrence must reside at the actual recursive search site');
  const hash=new Function('words','keyOffset',source.slice(start,end)+'\nreturn cacheHash;');
  const words=new Uint32Array(14*43);let seed=792561;
  for(let sample=0;sample<250;sample++){
    for(let i=0;i<words.length;i++)words[i]=seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    for(let depth=0;depth<43;depth++)assert.equal(hash(words,depth*14),mixSpan32Locator32(words,depth*14,14));
  }
});
test('fixed fourteen-word hash preserves every output bit and ignores surrounding words',()=>{
  let seed=89277;const words=new Uint32Array(20);
  for(let i=0;i<10000;i++){
    for(let j=0;j<words.length;j++)words[j]=seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    assert.equal(mix14x32Locator32(words,3),mixSpan32Locator32(words,3,14));
  }
});
test('three-word live update preserves in-place and disjoint frame semantics',()=>{
  const live=prepareConnect4LiveLineEvaluator32(g);
  for(let cell=0;cell<42;cell++)for(let mover=0;mover<2;mover++)for(const dest of [0,6]){
    const a=Uint32Array.from({length:12},(_,i)=>(0xafe18237^(i*0xabcdef))>>>0),b=a.slice();
    advanceConnect4LiveLineState32(live,a,0,mover,cell,a,dest);
    advanceLive3x32(live,b,0,mover,cell,b,dest);
    assert.deepEqual(b,a);
  }
});
test('gray-owner swap with live residuals retains hash, exact identity and TT reuse',()=>{
  const roots=['3243567476322262135343274516','3243657476322262135343274516']
    .map(s=>connect4RbaFromMoves([...s].map(c=>+c-1),{geometry:g,positionCode:false}));
  assert.deepEqual(roots[0].words,roots[1].words);
  assert.ok(roots[0].words.slice(g.p0Offset).some(v=>v));
  const cache=tt.createConnect4RbaSharedExactCache32({capacity:16,keyWords:14,geometry:g});
  const hashes=roots.map(r=>mix14x32Locator32(r.words,0));assert.equal(hashes[0],hashes[1]);
  tt.storeConnect4RbaSharedExactCache32(cache,roots[0].words,0,2,hashes[0]);
  assert.equal(tt.probeConnect4RbaSharedExactCache32(cache,roots[1].words,0,hashes[1]),2);
});
test('shared TT rejects torn mixed keys during concurrent collision stress',async()=>{
  const cache=tt.createConnect4RbaSharedExactCache32({capacity:16,keyWords:14,geometry:g});
  const workers=[];
  try{
    const results=await Promise.all(Array.from({length:4},(_,index)=>new Promise((resolve,reject)=>{
      const w=new Worker(new URL('./fixtures/isomax-cache-race.mjs',import.meta.url),{workerData:{cache,index}});workers.push(w);
      w.once('message',resolve);w.once('error',reject);w.once('exit',code=>{if(code)reject(Error('worker exit '+code));});
    })));
    assert.ok(results.reduce((n,r)=>n+r.hits,0)>1000);
    assert.ok(results.every(r=>r.mismatches===0));
  }finally{await Promise.all(workers.map(w=>w.terminate()));}
});
