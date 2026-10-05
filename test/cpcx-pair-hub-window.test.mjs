import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Actual generated search body; synthetic exact leaves isolate window algebra.
// Physical rule/precondition equivalence is checked by separate minimax tests.
for(const center of [false,true])for(const proofs of [false,true])for(const native of [false,true]){
 const name='rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+(proofs?'-proofs':'')+(native?'-local32':'');
 test(name+' keeps early pair-hub wins as exact certificates in every window',()=>{
  const source=readFileSync(new URL('../addons/'+name+'.mjs',import.meta.url),'utf8'),start=source.indexOf('function negamax('),end=source.indexOf('\nconst meta=',start);
  assert.ok(start>=0&&end>start);
  let cases=0;
  for(const mover of [0,1])for(const fork of [false,true])for(const truth of [-1,0,1]){
   if(fork&&truth!==1)continue;
   
   for(const cached of [0,4,5]){
    if(cached===4&&truth<0||cached===5&&truth>0)continue;
   for(const depth of [0,1])for(const alpha of [-2,-1,0,1])for(const beta of [-1,0,1,2])if(alpha<beta){
    const context={Atomics,control:new Int32Array(new SharedArrayBuffer(4)),CONTROL_STOP:0,CANCELLED:-2,LOCAL_LOWER0:4,LOCAL_UPPER0:5,
     forbidden:new Uint32Array(4),forbiddenWords:1,g:{keyWords:14,maxBasis:64,columns:1,rows:1},words:new Uint32Array(64),basis:new Uint32Array(128),localMask:3,
     centerOrder:[0],bestMove:-1,liveWords:3,live:{},moveOrder:new Uint32Array(1),moveOrderMask:7,
     coord:{seen:new Uint32Array(64),map:new Uint32Array(64),inverse:new Uint32Array(64)},basisSize:new Uint32Array(4),profile:{},cpc:{},targetCpc:{},
     mixSpan32Locator32:()=>0,probeCache:()=>cached,
     storeExact:(_src,_hash,_slot,value)=>assert.equal(value,truth===0?2:mover===0?truth+2:2-truth,'no unwarranted exact cache entry'),
     storeBound:(_src,_hash,_slot,value)=>assert.ok(value===4?truth>=0:truth<=0,'sound stored zero bound'),
     evaluatePairHub:()=>fork?0:-1,collectSingletons:()=>-1,evaluateConnect4PreparedCpcResponse32:()=>0,evaluateTargetCpc:()=>false,
     orderLive:()=>1,connect4RbaExposesOpponentWin:()=>false,
     connect4RbaCofactorKnownHeight:()=>{assert.equal(fork,false,'certified pair hub must avoid child construction');return truth===0?2:mover===0?truth+2:2-truth;},
     relativeTerminal:(code,player)=>code===2?0:code===(player?1:3)?1:-1,
     relativeToAbsolute:(value,player)=>value===0?2:player===0?value+2:2-value};
    const fn=runInNewContext('('+source.slice(start,end).trim()+')',context),
     result=center?fn(depth,0,0,0,mover,alpha,beta):fn(depth,0,0,0,mover,0,0,0,alpha,beta);
    if(truth<=alpha)assert.ok(truth<=result&&result<=alpha);
    else if(truth>=beta)assert.ok(beta<=result&&result<=truth);
    else assert.equal(result,truth);
    if(depth===0)assert.equal(context.bestMove,0,'exact root retains a legal ordered witness');
    cases++;
   }
   }
  }
  assert.ok(cases>100);console.log(JSON.stringify({name,cases}));
 });
}


