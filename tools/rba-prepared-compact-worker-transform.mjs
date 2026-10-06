// COLD source transform: only already admitted native32 complete-plan workers.
import assert from 'node:assert/strict';
export function transformPreparedCompactWorker(source){
 let s=source;
 function once(a,b){assert.equal(s.split(a).length,2,a);s=s.replace(a,b);}
 s="import {localPreparedCompactKeyMatches32,storeLocalPreparedCompactEntry32,probeSharedPreparedCompact32,storeSharedPreparedCompact32} from './rba-connect4-prepared-compact-cache.mjs';\n"+s;
 s=s.replace('createLocalNativeProofCache32,localNativeProofKeyMatches32,storeLocalNativeProofEntry32','createLocalNativeProofCache32');
 once('sharedProbe=sharedAccess===null?probeConnect4RbaSharedExactCacheUncounted32:sharedAccess.probe,',
  "sharedPrepared=shared.layout?.kind==='compact32',\n  sharedProbe=sharedPrepared?probeSharedPreparedCompact32:sharedAccess===null?probeConnect4RbaSharedExactCacheUncounted32:sharedAccess.probe,");
 once('sharedStore=sharedAccess===null?storeConnect4RbaSharedExactCacheUncounted32:sharedAccess.store,',
  'sharedStore=sharedPrepared?storeSharedPreparedCompact32:sharedAccess===null?storeConnect4RbaSharedExactCacheUncounted32:sharedAccess.store,');
 // Existing cold prepare/attach calls retain validation, including the proof domain.
 once('function localKeyMatches(slot,src){','function localKeyMatches(slot,src,support,tail){');
 once('localNativeProofKeyMatches32(localCache,words,src,slot)','localPreparedCompactKeyMatches32(localCache,words,src,slot,support,tail)');
 once('function storeLocalEntry(slot,src,value){','function storeLocalEntry(slot,src,value,support,tail){');
 once('storeLocalNativeProofEntry32(localCache,words,src,slot,value)','storeLocalPreparedCompactEntry32(localCache,words,src,slot,value,support,tail)');
 s=s.replaceAll('localKeyMatches(slot,src)','localKeyMatches(slot,src,support,tail)')
  .replaceAll('storeLocalEntry(slot,src,value)','storeLocalEntry(slot,src,value,support,tail)')
  .replaceAll('storeLocalEntry(slot,src,2)','storeLocalEntry(slot,src,2,support,tail)')
  .replaceAll('sharedProbe(shared,words,src,hash)','sharedProbe(shared,words,src,hash,support,tail)');
 // Include nested relativeToAbsolute calls without changing their arguments.
 const matches=[...s.matchAll(/\b(?:probeCache|storeExact|storeBound)\(/g)];
 for(const match of matches.reverse()){
  let end=match.index+match[0].length-1,balance=1;
  while(balance){end++;if(s[end]==='(')balance++;if(s[end]===')')balance--;assert.ok(end<s.length);}
  s=s.slice(0,end)+',support,tail'+s.slice(end);
 }
 s=s.replaceAll('sharedStore(shared,words,src,value,hash)','sharedStore(shared,words,src,value,hash,support,tail)')
  .replaceAll('sharedStore(shared,words,src,transportConnect4ZeroBound32(value,(words[src+g.metaOffset]>>>2)&1),hash)',
   'sharedStore(shared,words,src,transportConnect4ZeroBound32(value,(words[src+g.metaOffset]>>>2)&1),hash,support,tail)');
 once('slot=depth?(hash&localMask):0;','slot=depth?(hash&localMask):0,\n    support=depth?compactSupportProfile8(words,src):0,\n    tail=depth?compactTailProfile8(words,src):0;');
 return s;
}
