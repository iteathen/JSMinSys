import {Worker,isMainThread,parentPort} from 'node:worker_threads';
if(isMainThread){
  const w=new Worker(new URL(import.meta.url));
  w.on('message',message=>console.log(JSON.stringify({main:process.execArgv,worker:message})));
  w.on('error',error=>{console.error(error);process.exitCode=1;});
}else{
  function flagProbe(x){return (x+1)|0;}
  let result=0;for(let i=0;i<1000000;i++)result=flagProbe(result);
  parentPort.postMessage({argv:process.execArgv,result});
}
