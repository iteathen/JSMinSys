import {Worker,isMainThread,parentPort} from 'node:worker_threads';
if(isMainThread){
  const w=new Worker(new URL(import.meta.url),{execArgv:process.execArgv});
  w.on('message',message=>console.log(JSON.stringify({main:process.execArgv,worker:message})));
  w.on('error',error=>{console.error(error);process.exitCode=1;});
}else parentPort.postMessage(process.execArgv);
