import { workerData } from 'node:worker_threads';

const c=workerData.control;
if(workerData.mode==='done'){
  Atomics.store(c,workerData.doneIndex,1);
  Atomics.add(c,workerData.wakeIndex,1);
  Atomics.notify(c,workerData.wakeIndex);
}else if(workerData.mode==='wait'){
  const observed=Atomics.load(c,workerData.wakeIndex);
  while(!Atomics.load(c,workerData.stopIndex))Atomics.wait(c,workerData.wakeIndex,observed,100);
}else if(workerData.mode==='throw'){
  throw new Error('managed fixture failure');
}
