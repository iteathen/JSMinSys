import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {createIndexPartialCache32,createBankedIndexPartialCache32,storeIndexPartial24Local32,probeIndexPartial24Local32,
 storeBankedIndexPartial24Shared32,probeBankedIndexPartial24Shared32} from '../addons/rba-connect4-index-partial-cache.mjs';

test('actual partial worker preambles carry every locator bit in signed integer ABI',()=>{
 const names=readdirSync(new URL('../addons/',import.meta.url)).filter(p=>/worker-minimal.*-partial(?:24|Mixed)\.mjs$/.test(p));
 for(const p of names){
  const s=readFileSync(new URL('../addons/'+p,import.meta.url),'utf8'),start=s.indexOf('function negamax('),
   body=s.slice(s.indexOf('{',start)+1,s.indexOf('\n  if(depth){',start));
  for(const hash of [0,0x7fffffff,0x80000000,0xfedcba98,0xffffffff]){
   const context={g:{maxBasis:128,keyWords:14,columns:7},words:[],control:[],CONTROL_STOP:0,CANCELLED:-2,
    liveOffset:0,orderRow:0,liveWords:6,
    Atomics:{load:()=>0},mixSpan32Locator32:()=>hash,packIndexPartial24Support32:()=>0,packIndexPartial16Heights32:()=>0};
   runInNewContext('function carrier(depth,src,supportHandle,n,mover,alpha,beta){'+body+'return hash;}',context);
   const actual=context.carrier(1,0,0,69,0,-2,2);
   assert.equal(actual,hash|0,p);assert.equal(actual>>>0,hash,p+' must preserve all32bits');
  }
 }
});

test('signed and unsigned locators produce byte-identical private and banked shared rows',()=>{
 const g=prepareConnect4RbaGeometry({columns:7,rows:6}),words=connect4RbaFromMoves([],{geometry:g}).words;
 for(const hash of [0,0x7fffffff,0x80000000,0xfedcba98,0xffffffff])for(const value of [1,2,3,4,5]){
  const a=createIndexPartialCache32({geometry:g,capacity:8}),b=createIndexPartialCache32({geometry:g,capacity:8});
  storeIndexPartial24Local32(a,words,0,value,hash);storeIndexPartial24Local32(b,words,0,value,hash|0);
  assert.deepEqual(a.entries,b.entries);assert.equal(probeIndexPartial24Local32(a,words,0,hash|0),value);
  assert.equal(probeIndexPartial24Local32(b,words,0,hash),value);
  const sa=createBankedIndexPartialCache32({geometry:g,capacity:32,bankCapacity:8}),
   sb=createBankedIndexPartialCache32({geometry:g,capacity:32,bankCapacity:8});
  storeBankedIndexPartial24Shared32(sa,words,0,value,hash);storeBankedIndexPartial24Shared32(sb,words,0,value,hash|0);
  for(let i=0;i<4;i++)assert.deepEqual(sa.banks[i].entries,sb.banks[i].entries);
  assert.equal(probeBankedIndexPartial24Shared32(sa,words,0,hash|0),value);
  assert.equal(probeBankedIndexPartial24Shared32(sb,words,0,hash),value);
 }
});
