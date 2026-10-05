// Synthetic protocol keys/values only; never used by a solving benchmark.
import {workerData} from 'node:worker_threads';
import {prepareAsyncExactProducer32} from '../../addons/rba-connect4-async-publication.mjs';
import {fillAsyncTestKey,asyncTestValue} from './rba-async-key.mjs';
const p=prepareAsyncExactProducer32(workerData.queue),key=new Uint32Array(p.keyWords);
for(let id=1;id<=20000;id++){
  fillAsyncTestKey(key,id,workerData.index,p.compact8);
  p.enqueue(p,key,0,asyncTestValue(id,workerData.index),id&31);
}
Atomics.store(workerData.done,workerData.index,1);
