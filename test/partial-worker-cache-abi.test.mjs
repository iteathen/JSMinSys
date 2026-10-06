import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('partial worker cache wrappers preserve exact arguments without unused slot/tail',()=>{
 const names=readdirSync(new URL('../addons/',import.meta.url)).filter(p=>/worker-minimal.*-partial(?:24|Mixed)\.mjs$/.test(p));
 assert.equal(names.length,8);
 for(const p of names){
  const source=readFileSync(new URL('../addons/'+p,import.meta.url),'utf8'),calls=[],words={},cache={},shared={},
   context={words,localCache:cache,shared,sharedSampleBits:0,LOCAL_LOWER0:4,LOCAL_UPPER0:5,
    localProbe:()=>0,localStore:(...a)=>calls.push(['local',...a]),sharedProbe:()=>0,
    sharedStore:(...a)=>calls.push(['shared',...a]),frontStore:()=>{},transportConnect4ZeroBound32:v=>v};
  runInNewContext(source.slice(source.indexOf('function probeCache('),source.indexOf('function negamax(')),context);
  const hash=0xfedcba98,support=12345;
  context.storeExact(7,hash,3,4,0,support);
  assert.deepEqual(calls,[['local',cache,words,7,3,hash,support],['shared',shared,words,7,3,hash,support]],p);
  calls.length=0;
  assert.equal(context.storeBound(7,hash,4,4,0,support),4);
  const boundCalls=[['local',cache,words,7,4,hash,support]];
  if(p.includes('-proofs-'))boundCalls.push(['shared',shared,words,7,4,hash,support]);
  assert.deepEqual(calls,boundCalls,p);
  assert.doesNotMatch(source,/\bslot\b|\btail\s*=\s*0|\blocalMask\b/,p);
 }
});
