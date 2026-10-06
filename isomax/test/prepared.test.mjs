import {discoverWorkerPlan} from '../index.mjs';
import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import * as api from '../index.mjs';

const detected=await discoverWorkerPlan(),workers=Math.min(4,detected.workers),canRun=workers>=2;
const test=(name,body)=>nodeTest(name,{skip:!canRun},body);
const options=geometry=>({geometry,workers,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:10000});
test('prepared package starts search only after every worker is ready',async()=>{
  assert.equal(typeof api.prepareLazySmpConnect4Rba32,'function');
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:1,rows:1})));
  try{
    assert.equal(app.state().closed,false);assert.equal(app.state().readyWorkers,workers);
    assert.equal(app.state().searchStarted,false);
    const result=await app.solve([]);
    assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
    assert.equal(result.readyWorkers,workers);assert.equal(result.workersExited,workers);assert.equal(result.cleanup,true);
    assert.ok(result.preparedTiming.initializationMs>=0);assert.ok(result.preparedTiming.cleanupMs>=0);
    await assert.rejects(()=>app.solve([]),/one-shot/);
  }finally{await app.close();}
});
test('prepared package closes idle workers without starting search',async()=>{
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:1,rows:1})));
  await app.close();assert.equal(app.state().closed,true);assert.equal(app.state().searchStarted,false);
  assert.equal(app.state().cleanup,true);assert.equal(app.state().workersExited,workers);
});
for(const [columns,rows,moves] of [[7,6,[...'1320461024522311'].map(Number)],[7,5,[...'1320461024522311'].map(Number)]])
  test(`prepared ${columns}x${rows} transports a reflected nonempty root`,async()=>{
    for(const history of [moves,moves.map(column=>columns-1-column)]){
      const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns,rows})));
      const result=await app.solve(history);
      assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,-1);assert.equal(result.cleanup,true);
      assert.ok(result.move>=0&&result.move<columns);
    }
  });
test('abort after preparation returns interrupted result and cleans every worker',async()=>{
  const abort=new AbortController();
  const app=await api.prepareLazySmpConnect4Rba32({...options(api.prepareConnect4RbaGeometry({columns:1,rows:1})),signal:abort.signal});
  abort.abort();const result=await app.solve([]);
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);assert.equal(result.workersExited,workers);
});
test('aborting READY owns cleanup without a subsequent solve or close',async()=>{
  const abort=new AbortController();
  const app=await api.prepareLazySmpConnect4Rba32({...options(api.prepareConnect4RbaGeometry({columns:1,rows:1})),signal:abort.signal});
  try{
    const ownership=getEventListeners(abort.signal,'abort').length;
    abort.abort();
    const deadline=Date.now()+1000;
    while(!app.state().cleanup&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,2));
    assert.equal(app.state().closed,true);assert.equal(app.state().cleanup,true);
    assert.equal(ownership,1);
    assert.equal(app.state().workersExited,workers);assert.equal(app.state().searchStarted,false);
    assert.equal(getEventListeners(abort.signal,'abort').length,0);
    const result=await app.solve([]);
    assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);
    const closedResult=await app.solve([]);
    assert.equal(closedResult.status,'INTERRUPTED');assert.equal(app.state().searchStarted,false);
  }finally{await app.close();}
});
test('abort at terminal cleanup preserves the exact result and removes ownership',async()=>{
  const abort=new AbortController(),remove=abort.signal.removeEventListener.bind(abort.signal);
  let app,duringSolve=false,observedDone=false;
  abort.signal.removeEventListener=(type,listener,...rest)=>{
    if(type==='abort'&&duringSolve&&app.state().done&&!abort.signal.aborted){observedDone=true;abort.abort();}
    return remove(type,listener,...rest);
  };
  app=await api.prepareLazySmpConnect4Rba32({...options(api.prepareConnect4RbaGeometry({columns:1,rows:1})),signal:abort.signal});
  try{
    duringSolve=true;const result=await app.solve([]);
    assert.equal(observedDone,true);assert.equal(result.status,'EXACT');assert.equal(result.errorCode,0);
    assert.equal(result.cleanup,true);assert.equal(getEventListeners(abort.signal,'abort').length,0);
  }finally{await app.close();}
});
test('closing an active prepared solve interrupts and cleans workers',async()=>{
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:7,rows:6})));
  const pending=app.solve([]);await app.close();const result=await pending;
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);assert.equal(result.workersExited,workers);
});
test('invalid supplied root closes the prepared application',async()=>{
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:1,rows:1})));
  await assert.rejects(()=>app.solve([1]),RangeError);
  assert.equal(app.state().closed,true);assert.equal(app.state().cleanup,true);assert.equal(app.state().workersExited,workers);
});
test('pre-aborted initialization rejects without leaving an application',async()=>{
  const abort=new AbortController();abort.abort();
  await assert.rejects(()=>api.prepareLazySmpConnect4Rba32({...options(api.prepareConnect4RbaGeometry({columns:1,rows:1})),signal:abort.signal}),/aborted/);
});
test('pre-aborted historical profile never allocates shared geometry or TT pages',async()=>{
  const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6}),abort=new AbortController();abort.abort();
  const Native=globalThis.SharedArrayBuffer,NativeMemory=WebAssembly.Memory,allocations=[];
  globalThis.SharedArrayBuffer=class {constructor(bytes){allocations.push({kind:'shared',bytes});throw Error('allocation attempted before abort');}};
  WebAssembly.Memory=class {constructor(descriptor){allocations.push({kind:'behavior',descriptor});throw Error('allocation attempted before abort');}};
  try{
    await assert.rejects(()=>api.prepareLazySmpConnect4Rba32({...options(geometry),sharedCacheCapacity:134217728,localCacheCapacity:16777216,signal:abort.signal}),/aborted/);
    assert.deepEqual(allocations,[]);
  }finally{globalThis.SharedArrayBuffer=Native;WebAssembly.Memory=NativeMemory;}
});
test('a supported long solve deadline does not overflow the Node timer',async()=>{
  const warnings=[],listener=warning=>warnings.push(warning);
  process.on('warning',listener);
  try{
    const result=await api.runLazySmpConnect4Rba32([],{...options(api.prepareConnect4RbaGeometry({columns:1,rows:1})),timeoutMs:2147483648});
    assert.equal(result.status,'EXACT');assert.equal(result.cleanup,true);
    assert.equal(warnings.filter(w=>w.name==='TimeoutOverflowWarning').length,0);
  }finally{process.off('warning',listener);}
});

