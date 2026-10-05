import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Execute actual generated search bodies, with independent exact leaf values.
for(const center of [false,true])for(const proofs of [false,true])for(const native of [false,true]){
 const name='rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+(proofs?'-proofs':'')+(native?'-local32':'');
 test(name+' intersects CPC response bounds soundly with every original window',()=>{
  const source=readFileSync(new URL('../addons/'+name+'.mjs',import.meta.url),'utf8'),start=source.indexOf('function negamax('),end=source.indexOf('\nconst meta=',start);
  assert.ok(start>=0&&end>start);let cases=0;
  for(const mover of [0,1])for(const response of [0,1,2])for(const truth of [-1,0,1])for(const target of [false,true]){
    if(response===1&&truth!==-1||response===2&&truth>0)continue;
    if(target&&truth!==-1)continue;
   for(const cached of [0,4,5]){
    if(cached===4&&truth<0||cached===5&&truth>0)continue;
    for(const depth of [0,1])for(const alpha of [-2,-1,0,1])for(const beta of [-1,0,1,2])if(alpha<beta){
     let constructed=0,targetCalls=0,pairCalls=0;
     const context={Atomics,control:new Int32Array(new SharedArrayBuffer(4)),CONTROL_STOP:0,CANCELLED:-2,LOCAL_LOWER0:4,LOCAL_UPPER0:5,
      forbidden:new Uint32Array(4),forbiddenWords:1,g:{keyWords:14,maxBasis:64,columns:1,rows:1},words:new Uint32Array(64),basis:new Uint32Array(128),localMask:3,
      centerOrder:[0],bestMove:-1,liveWords:3,live:{},moveOrder:new Uint32Array(1),moveOrderMask:7,
      coord:{seen:new Uint32Array(64),map:new Uint32Array(64),inverse:new Uint32Array(64)},basisSize:new Uint32Array(4),profile:{},cpc:{},targetCpc:{},
      mixSpan32Locator32:()=>0,probeCache:()=>cached,
      frontProbe:()=>0,frontChild:()=>{},
      storeExact:(_s,_h,_slot,v)=>assert.equal(v,truth===0?2:mover===0?truth+2:2-truth),
      storeBound:(_s,_h,_slot,v)=>assert.ok(v===4?truth>=0:truth<=0),
      collectSingletons:()=>-1,evaluatePairHub:()=>{pairCalls++;return -1;},evaluateConnect4PreparedCpcResponse32:()=>response,evaluateTargetCpc:()=>{targetCalls++;return target;},
      orderLive:()=>1,
      connect4RbaCofactorKnownHeight:()=>{constructed++;return truth===0?2:mover===0?truth+2:2-truth;},
      relativeTerminal:(v,p)=>v===2?0:v===(p?1:3)?1:-1,
      relativeToAbsolute:(v,p)=>v===0?2:p===0?v+2:2-v};
     const fn=runInNewContext('('+source.slice(start,end).trim()+')',context),value=center?fn(depth,0,0,0,mover,alpha,beta):fn(depth,0,0,0,mover,0,0,0,alpha,beta);
     if(truth<=alpha)assert.ok(truth<=value&&value<=alpha);
     else if(truth>=beta)assert.ok(beta<=value&&value<=truth);
     else assert.equal(value,truth);
     if(depth===0)assert.equal(context.bestMove,0,'root must produce a legal witness');
     if(response===1||response===2&&depth&&alpha>=0)assert.equal(constructed,0,'certified cutoff must not construct a child');
     if(response)assert.equal(pairCalls,0,'previous NONLOSS or WIN excludes current pair WIN');
     if(response===0&&cached===0)assert.equal(pairCalls,1,'failed response route must fall through to independent pair route');
     if(response===2&&depth&&alpha>=0&&cached===0)assert.equal(targetCalls,0,'nested sufficient-bound cutoff skips deeper target proof');
     cases++;
    }
   }
  }
  console.log(JSON.stringify({name,cases}));assert.ok(cases>400);
 });
}
