import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../index.mjs';

const options=geometry=>({geometry,workers:4,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:10000});
test('prepared package starts search only after every worker is ready',async()=>{
  assert.equal(typeof api.prepareLazySmpConnect4Rba32,'function');
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:1,rows:1})));
  try{
    assert.equal(app.state().phase,'READY');assert.equal(app.state().readyWorkers,4);
    assert.equal(app.state().searchStarted,false);
    const result=await app.solve([]);
    assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,0);
    assert.equal(result.readyWorkers,4);assert.equal(result.workersExited,4);assert.equal(result.cleanup,true);
    assert.ok(result.initializationMs>=0);assert.ok(result.cleanupMs>=0);
    await assert.rejects(()=>app.solve([]),/one-shot/);
  }finally{await app.close();}
});
test('prepared package closes idle workers without starting search',async()=>{
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:1,rows:1})));
  await app.close();assert.equal(app.state().phase,'CLOSED');assert.equal(app.state().searchStarted,false);
  assert.equal(app.state().cleanup,true);assert.equal(app.state().workersExited,4);
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
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);assert.equal(result.workersExited,4);
});
test('closing an active prepared solve interrupts and cleans workers',async()=>{
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:7,rows:6})));
  const pending=app.solve([]);await app.close();const result=await pending;
  assert.equal(result.status,'INTERRUPTED');assert.equal(result.cleanup,true);assert.equal(result.workersExited,4);
});
test('invalid supplied root closes the prepared application',async()=>{
  const app=await api.prepareLazySmpConnect4Rba32(options(api.prepareConnect4RbaGeometry({columns:1,rows:1})));
  await assert.rejects(()=>app.solve([1]),RangeError);
  assert.equal(app.state().phase,'CLOSED');assert.equal(app.state().cleanup,true);assert.equal(app.state().workersExited,4);
});
test('pre-aborted initialization rejects without leaving an application',async()=>{
  const abort=new AbortController();abort.abort();
  await assert.rejects(()=>api.prepareLazySmpConnect4Rba32({...options(api.prepareConnect4RbaGeometry({columns:1,rows:1})),signal:abort.signal}),/aborted/);
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
