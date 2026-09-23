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
