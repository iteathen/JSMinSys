import {workerData} from 'node:worker_threads';
import {attachConnect4RbaSharedExactCache32} from './rba-connect4-shared-exact-cache.mjs';
import {prepareAsyncExactConsumer32,runAsyncExactPublisher32} from './rba-connect4-async-publication.mjs';

const cache=attachConnect4RbaSharedExactCache32(workerData.sharedExactCache),consumers=[];
for(const queue of workerData.publication.queues)consumers.push(prepareAsyncExactConsumer32(queue,cache));
Atomics.store(workerData.publication.ready,0,1);
if(workerData.readyGate)
  while(!Atomics.load(workerData.readyGate,1))Atomics.wait(workerData.readyGate,1,0);
runAsyncExactPublisher32(consumers,workerData.control,workerData.publicationMode==='idle');
