import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveConnect4RbaResourceFlags32,wrapConnect4ResourceCofactor32} from '../addons/rba-connect4-resource-bounds.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('zero-channel resource flags are owner-specific and never reinterpret terminals',()=>{
 for(const count of [0,1,2,3,7]){
  const g={metaOffset:2,p0Offset:3,p1Offset:3+count,coordWords:count},offset=5,words=new Uint32Array(offset+3+2*count);
  assert.equal(deriveConnect4RbaResourceFlags32(g,words,offset),12);
  if(count){
   words[offset+g.p0Offset+count-1]=0x80000000;
   assert.equal(deriveConnect4RbaResourceFlags32(g,words,offset),8);
   words[offset+g.p1Offset]=1;
   assert.equal(deriveConnect4RbaResourceFlags32(g,words,offset),0);
   words[offset+g.p0Offset+count-1]=0;
   assert.equal(deriveConnect4RbaResourceFlags32(g,words,offset),4);
  }
  for(const terminal of [1,2,3]){
   words[offset+g.metaOffset]=terminal;
   assert.equal(deriveConnect4RbaResourceFlags32(g,words,offset),0,'already-terminal guard');
  }
 }
});

test('cold fallback wrapper preserves physical terminal code and metadata',()=>{
 const g={metaOffset:0,p0Offset:1,p1Offset:2,coordWords:1},out=new Uint32Array(3);
 for(const terminal of [0,1,2,3]){
  const fn=wrapConnect4ResourceCofactor32((...args)=>{assert.equal(args[0],g);out[0]=(7<<2)|terminal;return terminal;});
  const result=fn(g,null,null,0,null,0,0,0,0,out,0,null,0,null,null,0,null,null);
  assert.equal(result,terminal||12);assert.equal(out[0],(7<<2)|terminal);
 }
});

test('resource option is explicit, validated, and works with four generic workers',async()=>{
 const geometry=prepareConnect4RbaGeometry({columns:3,rows:3});
 for(const resourceBounds of [false,true]){
  const r=await runLazySmpConnect4Rba32([],{geometry,workerMode:'minimal',workers:4,resourceBounds,localCacheCapacity:256,sharedCacheCapacity:256,timeoutMs:5000});
  assert.equal(r.resourceBounds,resourceBounds);assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,0);
  assert.ok(r.move>=0&&r.move<3);assert.equal(r.readyWorkers,4);assert.equal(r.workersExited,4);assert.equal(r.cleanup,true);
 }
 await assert.rejects(runLazySmpConnect4Rba32([],{geometry,workerMode:'minimal',resourceBounds:'true'}),/resource/i);
 await assert.rejects(runLazySmpConnect4Rba32([],{geometry,workerMode:'legacy',resourceBounds:true}),/resource/i);
});
