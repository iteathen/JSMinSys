import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

for(const views of [false,true])for(const center of [false,true])for(const proofs of [false,true])for(const native of [false,true]){
 const name='rba-connect4-lazy-smp-worker-minimal'+(views?'-views':'')+(center?'-center':'')+(proofs?'-proofs':'')+(native?'-local32':'');
 test(name+' consumes residual frontier tags with sound windows and root exclusion',()=>{
  const source=readFileSync(new URL('../addons/'+name+'.mjs',import.meta.url),'utf8'),start=source.indexOf('function negamax('),end=source.indexOf('\nconst meta=',start);
  assert.ok(start>=0&&end>start);let cases=0;
  for(const mover of [0,1])for(const tag of [0,1,2,3,4,5])for(const truth of [-1,0,1])for(const depth of [0,1]){
   if(depth&&tag&&((tag===1&&truth!==(mover?1:-1))||(tag===2&&truth!==0)||(tag===3&&truth!==(mover?-1:1))||(tag===4&&truth<0)||(tag===5&&truth>0)))continue;
   for(const alpha of [-2,-1,0,1])for(const beta of [-1,0,1,2])if(alpha<beta){
    let queries=0,children=0;
    const context={Atomics,control:new Int32Array(new SharedArrayBuffer(4)),CONTROL_STOP:0,CANCELLED:-2,LOCAL_LOWER0:4,LOCAL_UPPER0:5,
     forbidden:new Uint32Array(4),forbiddenWords:1,g:{keyWords:14,maxBasis:64,columns:1,rows:1},words:new Uint32Array(64),basis:new Uint32Array(128),localMask:3,
     centerOrder:[0],bestMove:-1,liveWords:3,live:{},moveOrder:new Uint32Array(1),moveOrderMask:7,
     coord:{seen:new Uint32Array(64),map:new Uint32Array(64),inverse:new Uint32Array(64)},basisSize:new Uint32Array(4),profile:{},cpc:{},targetCpc:{},
     mixSpan32Locator32:()=>0,probeCache:()=>0,
     frontProbe:(_w,_s,d,p)=>{queries++;assert.equal(d,depth);assert.equal(p,mover);return tag;},frontChild:()=>{},
     storeExact:(_s,_h,_slot,v,d,p)=>{assert.equal(v,truth===0?2:mover===0?truth+2:2-truth);assert.equal(d,depth);assert.equal(p,mover);},
     storeBound:(_s,_h,_slot,v,d,p)=>{assert.ok(v===4?truth>=0:truth<=0);assert.equal(d,depth);assert.equal(p,mover);},
     collectSingletons:()=>-1,evaluatePairHub:()=>-1,evaluateConnect4PreparedCpcResponse32:()=>0,evaluateTargetCpc:()=>false,
     orderLive:()=>1,connect4RbaCofactorKnownHeight:()=>{children++;return truth===0?2:mover===0?truth+2:2-truth;},
     relativeTerminal:(v,p)=>v===2?0:v===(p?1:3)?1:-1,
     relativeToAbsolute:(v,p)=>v===0?2:p===0?v+2:2-v};
    const fn=runInNewContext('('+source.slice(start,end).trim()+')',context),value=center?fn(depth,0,0,0,mover,alpha,beta):fn(depth,0,0,0,mover,0,0,0,alpha,beta);
    assert.equal(queries,depth?1:0,'query only non-root after cache miss');
    if(truth<=alpha)assert.ok(truth<=value&&value<=alpha);
    else if(truth>=beta)assert.ok(beta<=value&&value<=truth);
    else assert.equal(value,truth);
    if(depth===0)assert.equal(context.bestMove,0);
    if(depth&&tag>0&&(tag<=3||tag===4&&beta<=0||tag===5&&alpha>=0))assert.equal(children,0);
    cases++;
   }
  }
  assert.ok(cases>500);console.log(JSON.stringify({name,cases}));
 });
 test(name+' forwards current-run stores and exact draw joins to the same frame',()=>{
  const source=readFileSync(new URL('../addons/'+name+'.mjs',import.meta.url),'utf8'),events=[],words=new Uint32Array(64),localValues=new Uint8Array(4),localKeys=new Uint32Array(32),
   context={words,g:{metaOffset:7},shared:{},sharedSampleBits:0,localValues,localKeys,localKeyMatches:()=>true,
    storeLocalEntry:()=>{},sharedStore:()=>{},frontStore:(w,s,d,v,m)=>{assert.equal(w,words);events.push({s,d,v,m});}};
  function extract(name,next){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction '+next+'(',start);assert.ok(start>=0&&end>start);return runInNewContext('('+source.slice(start,end).trim()+')',context);}
  const exact=extract('storeExact','storeBound'),bound=extract('storeBound','negamax');
  exact(0,1,0,3,2,0);assert.deepEqual(events,[{s:0,d:2,v:3,m:0}]);
  events.length=0;localValues[0]=4;localKeys[0]=4;
  assert.equal(bound(0,1,0,5,2,0),2);
  assert.ok(events.some(e=>e.v===5&&e.d===2&&e.m===0));assert.ok(events.some(e=>e.v===2&&e.d===2&&e.m===0),'joined exact draw enters both frontier lanes');
 });
}
