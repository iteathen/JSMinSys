import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker,BehaviorWorker,createWorkerBehavior32,publishWorkerBehavior32,
  WORKER_BEHAVIOR_STRIDE32} from '../addons/index.mjs';
import {readWorkerBehavior32} from '../src/index.mjs';
import {Worker as NodeWorker} from 'node:worker_threads';
import {once} from 'node:events';

test('flag-free Worker stays minimal; behavior variant is explicitly selected',()=>{
  assert.deepEqual(Object.keys(new Worker(3)),['owner']);
  const words=createWorkerBehavior32(2),w=new BehaviorWorker(8,words,1);
  assert.ok(w instanceof Worker);
  assert.equal(w.behaviorBase,WORKER_BEHAVIOR_STRIDE32);
  assert.equal(w.readBehavior32(),0);
  assert.throws(()=>w.run(),/must be implemented/);
  assert.throws(()=>new BehaviorWorker(0,new Uint32Array(64),0),/shared/);
  assert.throws(()=>new BehaviorWorker(0,words,2),/index/);
});

test('one-word read never reads a version or extension and never writes shared memory',()=>{
  const words=createWorkerBehavior32(2),scratch=new Uint32Array([91,92,93]);
  publishWorkerBehavior32(words,1,0x40000001);
  // Even an odd extension-version sentinel is irrelevant to the single-word path.
  Atomics.store(words,WORKER_BEHAVIOR_STRIDE32+4,1);
  const before=words.slice();
  assert.equal(readWorkerBehavior32(words,WORKER_BEHAVIOR_STRIDE32,scratch,0),0x40000001);
  assert.deepEqual(scratch,new Uint32Array([91,92,93]));
  assert.deepEqual(words,before);
  assert.equal(readWorkerBehavior32(words,0,scratch,0),0);
});

test('extension chain supports sparse four-word flags, truncation and all 124 payload bits',()=>{
  const words=createWorkerBehavior32(1),scratch=new Uint32Array(5).fill(77);
  publishWorkerBehavior32(words,0,1,2);
  assert.equal(readWorkerBehavior32(words,0,scratch,1),0x80000001);
  assert.deepEqual([...scratch],[77,2,0,0,77]);
  publishWorkerBehavior32(words,0,1,0,0,8);
  assert.equal(readWorkerBehavior32(words,0,scratch,1),0x80000001);
  assert.deepEqual([...scratch],[77,0x80000000,0x80000000,8,77]);
  publishWorkerBehavior32(words,0,...new Array(4).fill(0x7fffffff));
  assert.equal(readWorkerBehavior32(words,0,scratch,1),0xffffffff);
  assert.deepEqual([...scratch],[77,0xffffffff,0xffffffff,0x7fffffff,77]);
  publishWorkerBehavior32(words,0,3);
  assert.equal(readWorkerBehavior32(words,0,scratch,1),3);
  publishWorkerBehavior32(words,0,0);
  assert.equal(readWorkerBehavior32(words,0,scratch,1),0);
});

test('overlapping extension publication defers without retry or modifying prior private snapshot',()=>{
  const words=createWorkerBehavior32(1),scratch=new Uint32Array([11,12,13]);
  publishWorkerBehavior32(words,0,1,2,3,4);
  Atomics.store(words,4,3);
  assert.equal(readWorkerBehavior32(words,0,scratch,0),-1);
  assert.deepEqual([...scratch],[11,12,13]);
});

test('a completed publication during extension reading cannot mix two flag sets',t=>{
  const words=createWorkerBehavior32(1),scratch=new Uint32Array([11,12,13]);
  publishWorkerBehavior32(words,0,1,2,3,4);
  const load=Atomics.load;let changed=false;
  t.mock.method(Atomics,'load',(array,index)=>{
    const value=load(array,index);
    if(array===words&&index===3&&!changed){changed=true;publishWorkerBehavior32(words,0,8,9,10,11);}
    return value;
  });
  assert.equal(readWorkerBehavior32(words,0,scratch,0),-1);
  assert.deepEqual([...scratch],[11,12,13]);
  assert.equal(readWorkerBehavior32(words,0,scratch,0),0x80000008);
  assert.deepEqual([...scratch],[0x80000009,0x8000000a,11]);
});

test('one-word checkpoint performs exactly one shared read',t=>{
  const words=createWorkerBehavior32(1),load=Atomics.load;let reads=0;
  t.mock.method(Atomics,'load',(array,index)=>{reads++;assert.equal(index,0);return load(array,index);});
  assert.equal(readWorkerBehavior32(words,0,null,0),0);
  assert.equal(reads,1);
});

test('cold writer rejects invalid flags/index/storage and version exhaustion before mutation',()=>{
  const words=createWorkerBehavior32(1);
  for(const flags of [-1,0x80000000,1.5,NaN]){
    assert.throws(()=>publishWorkerBehavior32(words,0,flags),/flags/);
    assert.deepEqual([...words],new Array(words.length).fill(0));
  }
  for(const index of [-1,1,0.5])assert.throws(()=>publishWorkerBehavior32(words,index,0),/index/);
  for(const count of [0,-1,1.2,Infinity])assert.throws(()=>createWorkerBehavior32(count));
  assert.throws(()=>publishWorkerBehavior32(new Uint32Array(32),0,0),/shared/);
  Atomics.store(words,4,0xfffffffe);const before=words.slice();
  assert.throws(()=>publishWorkerBehavior32(words,0,1),/version/);
  assert.deepEqual(words,before);
});

test('real reader worker observes complete extended generations while strategist publishes', {timeout:10000}, async()=>{
  const words=createWorkerBehavior32(1),control=new Int32Array(new SharedArrayBuffer(4));
  publishWorkerBehavior32(words,0,1,3,1^0x11111111,1^0x22222222);
  const worker=new NodeWorker(new URL('./fixtures/behavior-reader.mjs',import.meta.url),{
    workerData:{words,control},execArgv:[],
  });
  const exit=once(worker,'exit');
  try{
    const [ready]=await once(worker,'message');assert.equal(ready,'ready');
    const finished=once(worker,'message');
    for(let n=2;n<=100000;n++)publishWorkerBehavior32(words,0,n,n*3,n^0x11111111,n^0x22222222);
    Atomics.store(control,0,1);
    const [result]=await finished;
    assert.equal(result.mismatches,0);assert.ok(result.accepted>0);
    assert.equal((await exit)[0],0);
    // Reader never clears or acknowledges the last strategist publication.
    assert.equal(words[0]>>>0,(0x80000000|100000)>>>0);
    assert.equal(words[4],200000);
  }finally{await worker.terminate();}
});
