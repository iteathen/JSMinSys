// Execute the actual generated worker's storeBound body with one-slot support
// stubs; tests never enter a solving process or supply expected game values.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transportConnect4ZeroBound32} from '../addons/rba-connect4-shared-proof-cache.mjs';
function extract(source,name){
 const start=source.indexOf('function '+name+'('),open=source.indexOf('){',start)+1;
 assert.ok(start>=0&&open>start);let end=open+1,depth=1;
 for(;depth;end++){assert.ok(end<source.length);if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
 return source.slice(start,end);
}
test('proof workers publish same-key opposite zero-bound joins as exact draw in both owner gauges',()=>{
 for(const center of [false,true])for(const mover of [0,1])for(const [prior,incoming] of [[4,5],[5,4],[4,4],[5,5],[1,5],[3,4]]){
  const filename='rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+'-proofs.mjs',
   source=readFileSync(new URL('../addons/'+filename,import.meta.url),'utf8'),
   localValues=new Uint8Array([prior]),published=[],words=new Uint32Array(14);
  words[7]=mover<<2;
  const context={localValues,words,g:{metaOffset:7},shared:{},sharedSampleBits:0,
   transportConnect4ZeroBound32,localKeyMatches:()=>true,
   storeLocalEntry:(_slot,_src,tag)=>{localValues[0]=tag;},
   sharedStore:(_shared,_words,_src,tag,hash)=>published.push({tag,hash})};
  const bound=runInNewContext(extract(source,'storeBound')+';storeBound',context),tag=bound(0,123,0,incoming),
   joins=prior>3&&incoming!==prior;
  assert.equal(tag,joins?2:prior);assert.equal(localValues[0],joins?2:prior);
  assert.deepEqual(published,joins?[{tag:2,hash:123}]:[],filename+' gauge'+mover);
 }
});

test('proof joins respect shared sampling and key mismatch never becomes an exact join',()=>{
 const source=readFileSync(new URL('../addons/rba-connect4-lazy-smp-worker-minimal-proofs.mjs',import.meta.url),'utf8');
 for(const match of [true,false])for(const sampled of [true,false]){
  const localValues=new Uint8Array([4]),published=[],words=new Uint32Array(14);
  const context={localValues,words,g:{metaOffset:7},shared:{},sharedSampleBits:sampled?0:0x01000000,
   transportConnect4ZeroBound32,localKeyMatches:()=>match,
   storeLocalEntry:(_slot,_src,tag)=>{localValues[0]=tag;},sharedStore:(_s,_w,_src,tag)=>published.push(tag)};
  const fn=runInNewContext(extract(source,'storeBound')+';storeBound',context);
  assert.equal(fn(0,0x01000000,0,5),match?2:5);
  assert.deepEqual(published,sampled?[match?2:5]:[]);
 }
});
