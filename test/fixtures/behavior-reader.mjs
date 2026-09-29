import {parentPort,workerData} from 'node:worker_threads';
import {BehaviorWorker} from '../../addons/worker-behavior.mjs';
class Reader extends BehaviorWorker {
  run(){
    let accepted=0,deferred=0,mismatches=0;
    do{
      const primary=this.readBehavior32();
      if(primary===-1){deferred++;continue;}
      if(!(primary&0x80000000)){mismatches++;continue;}
      const n=primary&0x7fffffff;
      if((this.behaviorExtensions[0]&0x7fffffff)!==n*3 ||
         (this.behaviorExtensions[1]&0x7fffffff)!==(n^0x11111111) ||
         this.behaviorExtensions[2]!==(n^0x22222222))mismatches++;
      accepted++;
    }while(!Atomics.load(workerData.control,0));
    return {accepted,deferred,mismatches};
  }
}
const reader=new Reader(0,workerData.words,0);
parentPort.postMessage('ready');
parentPort.postMessage(reader.run());
