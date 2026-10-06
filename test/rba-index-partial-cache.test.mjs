import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {Worker} from 'node:worker_threads';
import {createConnect4RbaSharedLayoutCache32,prepareSharedCacheAccess} from '../addons/rba-connect4-shared-exact-cache-layout.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
test('exact partial24 preserves omitted-coordinate identity at forced index collisions',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs').catch(()=>({}));
 assert.equal(typeof api.createIndexPartialCache32,'function');
 const cache=api.createIndexPartialCache32({geometry:g,capacity:8,shared:true,kind:'partial24'}),
  q=connect4RbaFromMoves([],{geometry:g}).words;
 assert.equal(cache.entryBytes,24);
 const hash=mixSpan32Locator32(q,0,g.keyWords);
 for(let tag=1;tag<=5;tag++){
  api.storeIndexPartial24Shared32(cache,q,0,tag,hash);
  assert.equal(api.probeIndexPartial24Shared32(cache,q,0,hash),tag);
 }
 let collision;
 for(let value=0;value<1000;value++){
  const other=q.slice();other[12]=value;
  const h=mixSpan32Locator32(other,0,g.keyWords);
  if(h!==hash&&(h&cache.mask)===(hash&cache.mask)){collision={other,h};break;}
 }
 assert.ok(collision);
 assert.equal(api.probeIndexPartial24Shared32(cache,collision.other,0,collision.h),0);
 api.storeIndexPartial24Shared32(cache,collision.other,0,4,collision.h);
 assert.equal(api.probeIndexPartial24Shared32(cache,q,0,hash),0);
 assert.equal(api.probeIndexPartial24Shared32(cache,collision.other,0,collision.h),4);
});
test('dimension-selected TT identities cover every geometry1..10 without solved outcomes',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs');
 let geometries=0,states=0;
 for(let columns=1;columns<=10;columns++)for(let rows=1;rows<=10;rows++){
  const geometry=prepareConnect4RbaGeometry({columns,rows}),partial=columns===7&&rows===6,
   cache=partial?api.createIndexPartialCache32({geometry,capacity:32,shared:true}):createConnect4RbaSharedLayoutCache32({geometry,keyWords:geometry.keyWords,capacity:32}),
   access=partial?{probe:api.probeIndexPartial24Shared32,store:api.storeIndexPartial24Shared32}:prepareSharedCacheAccess(cache),moves=[],heights=new Uint32Array(columns);
  geometries++;
  for(let ply=0;ply<Math.min(columns*rows,24);ply++){
   const q=connect4RbaFromMoves(moves,{geometry}).words;
   if(q[geometry.metaOffset]&3)break;
   const hash=mixSpan32Locator32(q,0,geometry.keyWords),tag=1+(ply%5);
   access.store(cache,q,0,tag,hash);
   assert.equal(access.probe(cache,q,0,hash),tag,`${columns}x${rows} ply${ply}`);
   const mirror=connect4RbaFromMoves(moves.map(c=>columns-1-c),{geometry}).words;
   assert.deepEqual(mirror,q);assert.equal(access.probe(cache,mirror,0,mixSpan32Locator32(mirror,0,geometry.keyWords)),tag);
   states++;
   let c=ply%columns;while(heights[c]===rows)c=(c+1)%columns;
   heights[c]++;moves.push(c);
  }
 }
 assert.equal(geometries,100);assert.ok(states>500);
 console.log(JSON.stringify({geometries,states,solvedOutcomesQueried:false}));
});
test('partial24 busy/wrap/clone publication retains the full32bit sequence contract',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs'),q=connect4RbaFromMoves([],{geometry:g}).words,
  cache=api.createIndexPartialCache32({geometry:g,capacity:8,shared:true}),hash=mixSpan32Locator32(q,0,g.keyWords),record=(hash&7)*6;
 Atomics.store(cache.entries,record,11);const before=Array.from(cache.entries);
 assert.equal(api.probeIndexPartial24Shared32(cache,q,0,hash),0);
 api.storeIndexPartial24Shared32(cache,q,0,3,hash);assert.deepEqual(Array.from(cache.entries),before);
 Atomics.store(cache.entries,record,0xfffffffe);api.storeIndexPartial24Shared32(cache,q,0,3,hash);
 assert.equal(api.probeIndexPartial24Shared32(cache,q,0,hash),0);
 api.storeIndexPartial24Shared32(cache,q,0,4,hash);
 assert.equal(api.probeIndexPartial24Shared32(api.attachIndexPartialCache32(structuredClone(cache)),q,0,hash),4);
 assert.deepEqual(Array.from(cache.stats),[0,0,0]);
});
test('partial24 identity matches physical/current-rank inputs and reversible omitted lanes',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs'),cache=api.createIndexPartialCache32({geometry:g,capacity:64}),
  multiplier=0x7feb352d;
 let inverse=1;for(let i=0;i<5;i++)inverse=Math.imul(inverse,2-Math.imul(multiplier,inverse));
 const unmix=x=>{const t=Math.imul(x,inverse);return(t^(t>>>16))>>>0;};
 let seed=81932;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
 for(let trial=0;trial<10000;trial++){
  const words=new Uint32Array(30),offset=5;
  let rank=0;for(let c=0;c<7;c++){words[offset+c]=rand()%7;rank+=words[offset+c];}
  words[offset+7]=rank<<2;
  for(const lane of [8,9,11,12])words[offset+lane]=rand();
  words[offset+10]=rand()&31;words[offset+13]=rand()&31;
  const hash=mixSpan32Locator32(words,offset,14),prefix=hash>>>cache.indexBits,
   restoredHash=((prefix<<cache.indexBits)|(hash&cache.mask))>>>0;
  let before=0;for(let i=0;i<12;i++){const x=before^words[offset+i];before=Math.imul(x^(x>>>16),multiplier)>>>0;}
  const lane12=(unmix((unmix(restoredHash)^words[offset+13])>>>0)^before)>>>0;
  assert.equal(lane12,words[offset+12]);
  api.storeIndexPartial24Local32(cache,words,offset,5,hash);
  assert.equal(api.probeIndexPartial24Local32(cache,words,offset,hash),5);
  // Rank metadata is implicit in retained heights; inconsistent metadata is
  // not a fast-input contract. Legal changes always update both.
  const changed=words.slice();changed[offset]=(changed[offset]+1)%7;
  changed[offset+7]=(rank-words[offset]+changed[offset])<<2;
  assert.equal(api.probeIndexPartial24Local32(cache,changed,offset,mixSpan32Locator32(changed,offset,14)),0);
 }
});
test('partial24 concurrent colliding writers never lend another key a proof',async()=>{
 const api=await import('../addons/rba-connect4-index-partial-cache.mjs'),cache=api.createIndexPartialCache32({geometry:g,capacity:8,shared:true}),
  a=connect4RbaFromMoves([],{geometry:g}).words,ha=mixSpan32Locator32(a,0,14);
 let b,hb;for(let i=0;i<1000;i++){const q=a.slice();q[12]=i;const h=mixSpan32Locator32(q,0,14);if(h!==ha&&(h&7)===(ha&7)){b=q;hb=h;break;}}
 assert.ok(b);const url=new URL('../addons/rba-connect4-index-partial-cache.mjs',import.meta.url).href,
  source=`const {workerData:d}=require('node:worker_threads');(async()=>{const a=await import(d.url);const c=a.attachIndexPartialCache32(d.cache);for(let i=0;i<40000;i++)a.storeIndexPartial24Shared32(c,d.q,0,d.tag,d.hash);})()`;
 const workers=[new Worker(source,{eval:true,workerData:{url,cache,q:a,tag:1,hash:ha}}),new Worker(source,{eval:true,workerData:{url,cache,q:b,tag:3,hash:hb}})];
 const done=workers.map(w=>new Promise((resolve,reject)=>{w.once('error',reject);w.once('exit',code=>code?reject(Error('worker exit'+code)):resolve());}));
 for(let i=0;i<40000;i++){
  const x=api.probeIndexPartial24Shared32(cache,a,0,ha),y=api.probeIndexPartial24Shared32(cache,b,0,hb);
  assert.ok(x===0||x===1);assert.ok(y===0||y===3);
 }
 await Promise.all(done);
});
test('prepared partial24 integration binds caches before search and preserves generic fallback',async()=>{
 const {prepareLazySmpConnect4Rba32}=await import('../addons/rba-connect4-prepared-session-host.mjs');
 const app=await prepareLazySmpConnect4Rba32({geometry:g,workers:2,sharedCacheCapacity:256,localCacheCapacity:256,
  sharedCacheLayout:'native',localCacheLayout:'native',sharedProofBounds:true,cacheIdentity:'partial24',
  supportBasisViews:true,supportBasisPlanBudgetBytes:2**30,supportClosurePlan:true,supportReflectionPlan:true,initializationTimeoutMs:30000});
 try{assert.equal(app.state().cacheIdentity,'partial24');assert.equal(app.state().readyWorkers,2);assert.equal(app.state().searchStarted,false);}
 finally{await app.close();}
 const small=prepareConnect4RbaGeometry({columns:1,rows:4}),generic=await prepareLazySmpConnect4Rba32({geometry:small,workers:2,
  sharedCacheCapacity:256,localCacheCapacity:256,sharedCacheLayout:'native',cacheIdentity:'partial24'});
 try{assert.equal(generic.state().cacheIdentity,'native32');const r=await generic.solve([]);assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,0);assert.equal(r.cleanup,true);}
 finally{await generic.close();}
});
