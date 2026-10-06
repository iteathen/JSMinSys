// Cold candidate generation from the retained authority. No search redesign.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
for(const kind of ['partial24','partial16'])for(const center of [false,true])for(const proofs of [false,true]){
 const base='addons/rba-connect4-lazy-smp-worker-minimal-views-compiled'+(center?'-center':'')+(proofs?'-proofs':'')+'-local32',
  target=base+'-'+kind+'.mjs';
 let s=readFileSync(base+'.mjs','utf8').replaceAll('\r\n','\n');
 function once(a,b){assert.equal(s.split(a).length,2,a);s=s.replace(a,b);}
 s="import {createIndexPartialCache32,attachIndexPartialCache32,packIndexPartial24Support32,probeIndexPartial24Local32,storeIndexPartial24Local32,probeIndexPartial24Shared32,storeIndexPartial24Shared32} from './rba-connect4-index-partial-cache.mjs';\n"+s;
 if(kind==='partial16')s="import {packIndexPartial16Heights32,probeIndexPartial16Local32,storeIndexPartial16Local32,probeIndexPartial16Shared32,storeIndexPartial16Shared32} from './rba-connect4-index-partial-cache.mjs';\n"+s;
 const a=s.indexOf('  shared=workerData.sharedExactCache.layout?'),b=s.indexOf('  sharedSampleBits=',a);assert.ok(a>0&&b>a);
 s=s.slice(0,a)+`  shared=attachIndexPartialCache32(workerData.sharedExactCache),
  sharedProbe=probeIndexPartial24Shared32,sharedStore=storeIndexPartial24Shared32,
  localProbe=probeIndexPartial24Local32,localStore=storeIndexPartial24Local32,
`+s.slice(b);
 once('localCache=createLocalNativeProofCache32(g,workerData.localCacheCapacity),',"localCache=createIndexPartialCache32({geometry:g,capacity:workerData.localCacheCapacity}),");
 const x=s.indexOf('function localKeyMatches('),y=s.indexOf('function probeCache(',x);assert.ok(x>0&&y>x);
 s=s.slice(0,x)+s.slice(y);
 once('  const local=localKeys[slot*8];\n  if(local&&localKeyMatches(slot,src,support,tail)){return local;}',
  '  const local=localProbe(localCache,words,src,hash,support);\n  if(local)return local;');
 s=s.replaceAll('storeLocalEntry(slot,src,value,support,tail)','localStore(localCache,words,src,value,hash,support)')
  .replaceAll('storeLocalEntry(slot,src,2,support,tail)','localStore(localCache,words,src,2,hash,support)');
 once('  const prior=localKeys[slot*8];\n  if(prior&&localKeyMatches(slot,src,support,tail)){',
  '  const prior=localProbe(localCache,words,src,hash,support);\n  if(prior){');
 once('support=depth?compactSupportProfile8(words,src):0,\n    tail=depth?compactTailProfile8(words,src):0;',
  'support=depth?packIndexPartial24Support32(words,src):0,\n    tail=0;');
 if(kind==='partial16'){
  s=s.replaceAll('=probeIndexPartial24','=probeIndexPartial16').replaceAll('=storeIndexPartial24','=storeIndexPartial16');
  once('localCache=createIndexPartialCache32({geometry:g,capacity:workerData.localCacheCapacity}),',"localCache=createIndexPartialCache32({geometry:g,capacity:workerData.localCacheCapacity,kind:'partial16'}),");
  once('hash=depth?mixSpan32Locator32(words,src,g.keyWords):0,','cacheAdmitted=depth&&n<=32,\n    hash=cacheAdmitted?mixSpan32Locator32(words,src,g.keyWords):0,');
  once('support=depth?packIndexPartial24Support32(words,src):0,','support=cacheAdmitted?packIndexPartial16Heights32(words,src):-1,');
 }
 s='// GENERATED exact index-'+kind+' candidate; full32bit sequence unchanged.\n'+s;
 if(process.argv.includes('--check'))assert.equal(readFileSync(target,'utf8').replaceAll('\r\n','\n'),s);else writeFileSync(target,s);
}
