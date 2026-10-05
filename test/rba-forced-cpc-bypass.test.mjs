import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Execute the actual generated search body with instrumented boundary calls.
// These counters are test-only: the timed worker has no diagnostic machinery.
for(const center of [false,true])for(const proofs of [false,true])for(const native of [false,true]){
 const name='rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+(proofs?'-proofs':'')+(native?'-local32':'');
 test(name+' skips broad certificates only for a forced response',()=>{
  const source=readFileSync(new URL('../addons/'+name+'.mjs',import.meta.url),'utf8'),
   start=source.indexOf('function negamax('),end=source.indexOf('\nconst meta=',start);
  assert.ok(start>=0&&end>start);
  for(const forced of [-1,2]){
   let whole=0,target=0,children=0,ordered=0;
   const context={Atomics,control:new Int32Array(new SharedArrayBuffer(4)),CONTROL_STOP:0,CANCELLED:99,
    g:{keyWords:14,maxBasis:64,columns:7,rows:6},localMask:3,words:new Uint32Array(64),basis:new Uint32Array(64),
    centerOrder:[3,2,4,1,5,0,6],bestMove:-1,liveWords:3,live:{},moveOrder:new Uint32Array(7).fill(3),moveOrderMask:7,
    coord:{seen:new Uint32Array(64),map:new Uint32Array(64),inverse:new Uint32Array(64)},basisSize:new Uint32Array(4),profile:{},
    cpc:{},targetCpc:{},connect4RbaForcedResponseColumn:()=>forced,
    evaluateConnect4PreparedCpcWin32:()=>{whole++;return false;},evaluateTargetCpc:()=>{target++;return false;},
    orderLive:()=>{ordered++;return 7;},connect4RbaExposesOpponentWin:()=>false,
    connect4RbaCofactorKnownHeight:()=>{children++;return 3;},
    relativeTerminal:(code,mover)=>code===2?0:code===3?(mover?-1:1):(mover?1:-1)};
   const negamax=runInNewContext('('+source.slice(start,end).trim()+')',context),
    value=center?negamax(0,0,0,0,0,-2,2):negamax(0,0,0,0,0,0,0,0,-2,2);
   assert.equal(value,1);assert.equal(children,1);
   assert.equal(whole,forced<0?1:0);assert.equal(target,forced<0?1:0);
   assert.equal(context.bestMove,forced<0?3:forced);
   assert.equal(ordered,!center&&forced<0?1:0);
  }
 });
}
