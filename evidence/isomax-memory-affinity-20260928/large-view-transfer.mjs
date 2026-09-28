import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {writeFileSync} from 'node:fs';
if(isMainThread){
 const rows=[];
 for(const bytes of [2147483648,4294967296,8589934592]){
  const view=new Uint32Array(new SharedArrayBuffer(bytes));
  const worker=new Worker(new URL(import.meta.url),{workerData:view});
  const row=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);});
  await worker.terminate();rows.push({parentBytes:bytes,parentLength:view.length,...row});
 }
 writeFileSync(new URL('./large-view-transfer.json',import.meta.url),JSON.stringify({node:process.version,rows},null,2)+'\n');console.log(rows);
}else{
 const restored=new Uint32Array(workerData.buffer);
 let originalError=null,restoredError=null;
 try{Atomics.store(workerData,0,3);}catch(e){originalError=String(e);}
 try{Atomics.store(restored,restored.length-1,7);}catch(e){restoredError=String(e);}
 parentPort.postMessage({childBytes:workerData.byteLength,childLength:workerData.length,bufferBytes:workerData.buffer.byteLength,restoredLength:restored.length,originalError,restoredError});
}
