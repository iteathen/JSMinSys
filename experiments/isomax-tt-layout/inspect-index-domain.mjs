// Diagnostic only. Use --allow-natives-syntax --trace-gc, never in benchmark workers.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
const library=resolve(process.argv[2]),high=process.argv[3]==='high';
const tt=await import(pathToFileURL(resolve(library,'experiments/isomax-lean/shared-cache.mjs')));
const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),capacity=134217728;
const cache=tt.createConnect4RbaSharedExactCache32({capacity,keyWords:14,geometry});
const words=Uint32Array.from([3,4,2,5,1,6,0,84,11,12,17,13,14,9]);
const hash=high?capacity-1:3,iterations=200000;
const isSmi=new Function('n','return %IsSmi(n);');
const indices={word40:hash*10+9,word32:hash*8+7,half32:hash*16+15,byte32:hash*32+27};
console.log(JSON.stringify({phase:'start',library,high,iterations,indices,
  smi:Object.fromEntries(Object.entries(indices).map(([k,v])=>[k,isSmi(v)])),
  node:process.version,v8:process.versions.v8}));
let checksum=0;
for(let i=0;i<iterations;i++){
  tt.storeConnect4RbaSharedExactCache32(cache,words,0,2,hash);
  checksum+=tt.probeConnect4RbaSharedExactCache32(cache,words,0,hash);
}
assert.equal(checksum,iterations*2);
console.log(JSON.stringify({phase:'done',checksum}));
