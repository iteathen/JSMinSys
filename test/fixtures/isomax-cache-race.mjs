// Test-only stress instrumentation; never imported by solver workers.
import {parentPort,workerData} from 'node:worker_threads';
import * as tt from '../../experiments/isomax-lean/shared-cache.mjs';
const cache=tt.attachConnect4RbaSharedExactCache32(workerData.cache),words=new Uint32Array(14);
let hits=0,mismatches=0;
for(let i=0;i<40000;i++){
  words[0]=workerData.index;words[1]=i;words[2]=i%7;words[3]=(i>>>3)%7;
  words[7]=i<<2;words[8]=(i^0xabc73461)>>>0;words[9]=Math.imul(i,0x9e3779b1)>>>0;
  words[10]=i&31;words[11]=~words[8]>>>0;words[12]=~words[9]>>>0;words[13]=(i>>>4)&31;
  const value=(workerData.index+i)%3+1,hash=i&15;
  tt.storeConnect4RbaSharedExactCache32(cache,words,0,value,hash);
  const actual=tt.probeConnect4RbaSharedExactCache32(cache,words,0,hash);
  if(actual){hits++;if(actual!==value)mismatches++;}
}
parentPort.postMessage({hits,mismatches});
