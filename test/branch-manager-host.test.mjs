import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterFileWorkerExecArgv32,
  createMetricViews32,
  createManagedThreadSession32,
  failManagedThreadSession32,
  spawnManagedFileWorker32,
  waitManagedThreadSession32,
  closeManagedThreadSession32,
  managedThreadSessionState32,
  sumMetricViews32,
  sharedViewBytes32,
} from '../addons/branch-manager-host.mjs';

function session(codes={died:5,deadline:6,cancelled:7}) {
  const control=new Int32Array(new SharedArrayBuffer(8*4));
  return createManagedThreadSession32({
    control,stopIndex:0,doneIndex:1,errorIndex:2,wakeIndex:3,
    workerDiedCode:codes.died,deadlineCode:codes.deadline,cancelledCode:codes.cancelled,
    execArgv:['--trace-warnings','--input-type=module','--no-warnings'],
  });
}

test('file-worker argv filter removes only input-type mode',()=>{
  assert.deepEqual(filterFileWorkerExecArgv32(['--trace-warnings','--input-type=module','--no-warnings']),['--trace-warnings','--no-warnings']);
  assert.deepEqual(filterFileWorkerExecArgv32(['--input-type','module','--trace-warnings']),['--trace-warnings']);
  assert.equal(filterFileWorkerExecArgv32(['--trace-warnings']),undefined);
});

test('managed host completes, joins, and reports cleanup',async()=>{
  const s=session();
  const url=new URL('./fixtures/managed-host-worker.mjs',import.meta.url);
  spawnManagedFileWorker32(s,url,{control:s.control,mode:'done',doneIndex:1,wakeIndex:3,stopIndex:0});
  assert.equal(await waitManagedThreadSession32(s,{timeoutMs:2000}),0);
  assert.equal(Atomics.load(s.control,1),1);
  assert.equal(await closeManagedThreadSession32(s),1);
  const state=managedThreadSessionState32(s);
  assert.equal(state.cleanup,true);assert.equal(state.workersExited,1);assert.deepEqual(state.errors,[]);
});

test('managed host deadline fails closed and wakes a waiting worker',async()=>{
  const s=session();
  const url=new URL('./fixtures/managed-host-worker.mjs',import.meta.url);
  spawnManagedFileWorker32(s,url,{control:s.control,mode:'wait',doneIndex:1,wakeIndex:3,stopIndex:0});
  assert.equal(await waitManagedThreadSession32(s,{timeoutMs:30,pollMs:2}),6);
  assert.equal(Atomics.load(s.control,0),1);
  await closeManagedThreadSession32(s);
  assert.equal(managedThreadSessionState32(s).cleanup,true);
});

test('managed host cancellation and explicit failure preserve first error',async()=>{
  const s=session();
  const aborter=new AbortController();
  const waiting=waitManagedThreadSession32(s,{timeoutMs:2000,signal:aborter.signal});
  aborter.abort();
  assert.equal(await waiting,7);
  failManagedThreadSession32(s,5);
  assert.equal(Atomics.load(s.control,2),7);
  await closeManagedThreadSession32(s);
});

test('unexpected worker exit fails the session',async()=>{
  const s=session();
  const url=new URL('./fixtures/managed-host-worker.mjs',import.meta.url);
  spawnManagedFileWorker32(s,url,{control:s.control,mode:'idle',doneIndex:1,wakeIndex:3,stopIndex:0});
  const code=await waitManagedThreadSession32(s,{timeoutMs:2000});
  assert.equal(code,5);
  await closeManagedThreadSession32(s);
  assert.ok(managedThreadSessionState32(s).errors.length>=1);
});

test('metric and shared-byte helpers stay numeric and caller-owned',()=>{
  const views=createMetricViews32(2,3);
  views[0].set([1,2,3]);views[1].set([4,5,6]);
  const out=new Float64Array(3);
  assert.deepEqual([...sumMetricViews32(views,3,out)],[5,7,9]);
  const record={a:new Uint32Array(new SharedArrayBuffer(16)),b:new Int32Array(new SharedArrayBuffer(8)),cold:{x:1}};
  assert.equal(sharedViewBytes32(record),24);
});

test('managed wait preserves completion published before waiting',async()=>{
  const s=session();
  Atomics.store(s.control,1,1);
  try{
    assert.equal(await s.wait({timeoutMs:1,pollMs:100}),0);
    assert.equal(Atomics.load(s.control,0),0);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
  }finally{await s.close();}
});

test('managed deadline observes completion published between polls',async(t)=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval']});
  const s=session();
  try{
    const waiting=s.wait({timeoutMs:30,pollMs:100});
    Atomics.store(s.control,1,1);
    t.mock.timers.tick(30);
    assert.equal(await waiting,0);
    assert.equal(Atomics.load(s.control,0),0);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
  }finally{await s.close();}
});

test('managed wait supports deadlines beyond the Node timer limit',async()=>{
  for(const timeoutMs of [2147483648,Number.MAX_VALUE]){
    const s=session();
    const completion=setTimeout(()=>Atomics.store(s.control,1,1),20);
    try{
      assert.equal(await s.wait({timeoutMs}),0);
      assert.equal(Atomics.load(s.control,0),0);
      assert.equal(s.timer,null);assert.equal(s.poll,null);
    }finally{clearTimeout(completion);await s.close();}
  }
});

test('managed long deadline uses elapsed time after a delayed chunk',async(t)=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval']});
  let elapsed=0;
  t.mock.method(performance,'now',()=>elapsed);
  const s=session();
  try{
    const waiting=s.wait({timeoutMs:2147483697,pollMs:2147483647});
    elapsed=2147483700;
    t.mock.timers.tick(2147483647);
    assert.equal(Atomics.load(s.control,2),6);
    assert.equal(await waiting,6);
    assert.equal(Atomics.load(s.control,0),1);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
  }finally{await s.close();}
});

test('managed long deadline waits for the remaining chunk before failing',async(t)=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval']});
  let elapsed=0;
  t.mock.method(performance,'now',()=>elapsed);
  const s=session();
  try{
    const waiting=s.wait({timeoutMs:2147483697,pollMs:2147483647});
    elapsed=2147483647;
    t.mock.timers.tick(2147483647);
    assert.equal(Atomics.load(s.control,2),0);
    elapsed=2147483696;
    t.mock.timers.tick(49);
    assert.equal(Atomics.load(s.control,2),0);
    elapsed=2147483697;
    t.mock.timers.tick(1);
    assert.equal(await waiting,6);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
  }finally{await s.close();}
});

test('managed wait rejects poll intervals beyond the Node timer limit',async()=>{
  const s=session();
  try{
    await assert.rejects(s.wait({timeoutMs:1,pollMs:2147483648}),
      {name:'RangeError',message:/pollMs.*2147483647/});
    assert.equal(Atomics.load(s.control,2),0);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
  }finally{await s.close();}
});

test('managed long deadline cancellation clears the rearmed chunk',async(t)=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval']});
  let elapsed=0;
  t.mock.method(performance,'now',()=>elapsed);
  const s=session();
  const aborter=new AbortController();
  try{
    const waiting=s.wait({timeoutMs:4294967344,pollMs:2147483647,signal:aborter.signal});
    elapsed=2147483647;
    t.mock.timers.tick(2147483647);
    assert.equal(Atomics.load(s.control,2),0);
    aborter.abort();
    elapsed=4294967294;
    t.mock.timers.tick(2147483647);
    assert.equal(await waiting,7);
    assert.equal(Atomics.load(s.control,0),1);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
    assert.equal(s.abortSignal,null);assert.equal(s.abortHandler,null);
    t.mock.timers.tick(100);
    assert.equal(Atomics.load(s.control,2),7);
  }finally{await s.close();}
});

test('already-aborted cancellation keeps precedence over completed work',async()=>{
  const s=session();
  const aborter=new AbortController();
  Atomics.store(s.control,1,1);
  aborter.abort();
  try{
    assert.equal(await s.wait({timeoutMs:1,pollMs:100,signal:aborter.signal}),7);
    assert.equal(s.abortSignal,null);assert.equal(s.abortHandler,null);
  }finally{await s.close();}
});

test('managed wait returns an existing failure and removes abort listeners',async()=>{
  const s=session();
  const aborter=new AbortController();
  s.fail(5);
  try{
    assert.equal(await s.wait({timeoutMs:1,pollMs:100,signal:aborter.signal}),5);
    const wake=Atomics.load(s.control,3);
    aborter.abort();
    assert.equal(Atomics.load(s.control,3),wake);
    assert.equal(s.abortSignal,null);assert.equal(s.abortHandler,null);
  }finally{await s.close();}
});

test('managed host joins workers after a thrown worker failure',async()=>{
  const s=session();
  const url=new URL('./fixtures/managed-host-worker.mjs',import.meta.url);
  s.spawn(url,{control:s.control,mode:'throw',doneIndex:1,wakeIndex:3,stopIndex:0});
  try{
    assert.equal(await s.wait({timeoutMs:2000}),5);
  }finally{await s.close();}
  assert.equal(s.state().cleanup,true);
  assert.equal(s.state().workersExited,1);
  assert.match(s.state().errors[0],/managed fixture failure/);
});

test('closing an active managed wait settles it after publishing stop',async()=>{
  const s=session();
  let guard;
  try{
    const waiting=s.wait({timeoutMs:2000,pollMs:100});
    await s.close();
    const outcome=await Promise.race([
      waiting.then(code=>({settled:true,code})),
      new Promise(resolve=>{guard=setTimeout(()=>resolve({settled:false}),50);}),
    ]);
    assert.deepEqual(outcome,{settled:true,code:0});
    assert.equal(Atomics.load(s.control,0),1);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
    assert.equal(s.waitResolve,null);
  }finally{clearTimeout(guard);await s.close();}
});

test('closing an active cancelled wait preserves first error and joins workers',async()=>{
  const s=session();
  const aborter=new AbortController();
  const url=new URL('./fixtures/managed-host-worker.mjs',import.meta.url);
  s.spawn(url,{control:s.control,mode:'wait',doneIndex:1,wakeIndex:3,stopIndex:0});
  let guard;
  try{
    const waiting=s.wait({timeoutMs:2000,pollMs:100,signal:aborter.signal});
    s.fail(7);
    await s.close();
    const outcome=await Promise.race([
      waiting.then(code=>({settled:true,code})),
      new Promise(resolve=>{guard=setTimeout(()=>resolve({settled:false}),50);}),
    ]);
    assert.deepEqual(outcome,{settled:true,code:7});
    assert.equal(s.state().cleanup,true);
    assert.equal(s.state().workersExited,1);
    assert.equal(s.timer,null);assert.equal(s.poll,null);
    assert.equal(s.waitResolve,null);
    assert.equal(s.abortSignal,null);assert.equal(s.abortHandler,null);
    const wake=Atomics.load(s.control,3);
    aborter.abort();
    assert.equal(Atomics.load(s.control,3),wake);
  }finally{clearTimeout(guard);await s.close();}
});
