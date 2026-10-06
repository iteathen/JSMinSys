// COLD generation: protocol/equality authority remains the native cache libraries.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const cases=[
 ['rba-connect4-local-native-proof-cache.mjs','localNativeProofKeyMatches32','localPreparedCompactKeyMatches32'],
 ['rba-connect4-local-native-proof-cache.mjs','storeLocalNativeProofEntry32','storeLocalPreparedCompactEntry32'],
 ['rba-connect4-shared-exact-cache-layout.mjs','probeCompactSharedCache32','probeSharedPreparedCompact32'],
 ['rba-connect4-shared-exact-cache-layout.mjs','storeCompactSharedCache32','storeSharedPreparedCompact32'],
];
let out='// GENERATED: unchanged compact32 key/protocol with caller-prepared support/tail.\n// Precondition: scalars are computed from the same immutable words/offset.\n';
for(const [file,name,replacement] of cases){
 const src=readFileSync(new URL('../addons/'+file,import.meta.url),'utf8').replaceAll('\r\n','\n');
 const start=src.indexOf('export function '+name+'(');assert.ok(start>=0);
 let end=src.indexOf('{',start),balance=1;while(balance){end++;if(src[end]==='{')balance++;if(src[end]==='}')balance--;}
 let fn=src.slice(start,end+1).replace(name,replacement).replace('){',',support,tail){');
 fn=fn.replaceAll('compactSupportProfile8(words,offset)','support').replaceAll('compactLayoutSupportProfile8(words,offset)','support')
  .replaceAll('compactTailProfile8(words,offset)','tail').replaceAll('compactLayoutTailProfile8(words,offset)','tail');
 assert.ok(!fn.includes('Profile8'));out+=fn+'\n';
}
const target=new URL('../addons/rba-connect4-prepared-compact-cache.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(target,'utf8').replaceAll('\r\n','\n'),out);else writeFileSync(target,out);
