import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {createConnect4RbaSharedExactCache32} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {probeConnect4RbaSharedExactCacheUncounted32 as probe} from '../addons/rba-connect4-shared-exact-cache-uncounted.mjs';
import {createAsyncExactPublication32,prepareAsyncExactProducer32,prepareAsyncExactConsumer32,drainAsyncExactBatch32} from '../addons/rba-connect4-async-publication.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
import {Worker} from 'node:worker_threads';
import {setImmediate} from 'node:timers/promises';
import {fillAsyncTestKey,asyncTestValue} from './fixtures/rba-async-key.mjs';

test('batched proof transport preserves exact keys, frame snapshots and full-queue nonblocking behavior',()=>{
  for(const [columns,rows] of [[7,6],[7,5],[4,4]]){
    const geometry=prepareConnect4RbaGeometry({columns,rows}),cache=createConnect4RbaSharedExactCache32({capacity:16,keyWords:geometry.keyWords,geometry}),
      root=connect4RbaFromMoves([],{geometry}),child=connect4RbaFromMoves([0],{geometry}),
      publication=createAsyncExactPublication32(cache,1,{capacity:4,batch:2}),queue=publication.queues[0],
      p=prepareAsyncExactProducer32(queue),c=prepareAsyncExactConsumer32(queue,cache),frame=root.words.slice();
    cache.stats.set([11,22,33]);
    p.enqueue(p,frame,0,3,1);frame.fill(0xffffffff);
    assert.equal(drainAsyncExactBatch32(c),0,'partial batch is invisible');
    p.enqueue(p,child.words,0,2,2);
    p.enqueue(p,root.words,0,3,3);p.enqueue(p,root.words,0,3,4);
    p.enqueue(p,child.words,0,1,5);
    assert.equal(p.write,4,'full queue skips optional publication');
    assert.equal(drainAsyncExactBatch32(c),1);
    assert.equal(probe(cache,root.words,0,1),3,'stable source snapshot');
    assert.equal(probe(cache,child.words,0,2),2);
    assert.equal(probe(cache,child.words,0,5),0,'dropped record did not enter TT');
    assert.equal(drainAsyncExactBatch32(c),1);assert.equal(drainAsyncExactBatch32(c),0);
    p.enqueue(p,child.words,0,1,1);p.enqueue(p,root.words,0,3,2);
    drainAsyncExactBatch32(c);
    assert.equal(probe(cache,root.words,0,1),0,'same-slot replacement still checks key');
    assert.equal(probe(cache,child.words,0,1),1);
    assert.deepEqual(Array.from(cache.stats),[11,22,33]);
  }
});

test('queue cursors wrap without exposing uncommitted data or overwriting unread batches',()=>{
  const cache=createConnect4RbaSharedExactCache32({capacity:4,keyWords:1}),q=createAsyncExactPublication32(cache,1,{capacity:4,batch:2}).queues[0],
    p=prepareAsyncExactProducer32(q),c=prepareAsyncExactConsumer32(q,cache),key=new Uint32Array([123]);
  p.write=c.read=0xfffffffe;q.control[0]=q.control[16]=0xfffffffe;
  p.enqueue(p,key,0,1,0);p.enqueue(p,key,0,2,1);
  assert.equal(p.write,0);assert.equal(drainAsyncExactBatch32(c),1);assert.equal(c.read,0);
  assert.equal(probe(cache,key,0,0),1);assert.equal(probe(cache,key,0,1),2);
  assert.throws(()=>createAsyncExactPublication32(cache,1,{capacity:4,batch:3}));
});

test('four-search-worker prepared solve initializes and cleans up an idle or active helper',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:3}),options={geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:10000,preparedEmptyTiming:true};
  const control=await runLazySmpConnect4Rba32([],options);
  for(const publicationMode of ['idle','async']){
    const result=await runLazySmpConnect4Rba32([],{...options,publicationMode,publicationCapacity:64,publicationBatch:2});
    assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,control.rootWdl);
    assert.equal(result.preparedTiming.readyWorkers,4);assert.equal(result.preparedTiming.readyMaintenanceWorkers,1);
    assert.equal(result.workersExited,5);assert.equal(result.maintenanceWorkers,1);assert.equal(result.cleanup,true);
    assert.equal(result.sharedCacheStores,null);
  }
});

test('concurrent producers and a sole publisher never expose a mixed exact row',async()=>{
  for(const [columns,rows] of [[7,6],[7,5]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),cache=createConnect4RbaSharedExactCache32({capacity:32,keyWords:g.keyWords,geometry:g}),
      publication=createAsyncExactPublication32(cache,4,{capacity:256,batch:8}),control=new Int32Array(new SharedArrayBuffer(20)),
      done=new Int32Array(new SharedArrayBuffer(16)),threads=[],errors=[],key=new Uint32Array(g.keyWords);
    let matches=0,probes=0,seed=177;
    const add=(url,data)=>{const w=new Worker(new URL(url,import.meta.url),{workerData:data});w.on('error',e=>errors.push(e));threads.push(w);};
    try{
      add('../addons/rba-connect4-exact-publisher-worker.mjs',{sharedExactCache:cache,publication,control,publicationMode:'async'});
      for(let index=0;index<4;index++)add('./fixtures/rba-async-producer.mjs',{queue:publication.queues[index],done,index});
      const deadline=Date.now()+10000;
      do{
        for(let j=0;j<4096;j++){
          seed=(Math.imul(seed,1664525)+1013904223)>>>0;const id=(seed%20000)+1;
          const producer=(seed>>>16)&3;
          fillAsyncTestKey(key,id,producer,cache.compact8);
          const value=probe(cache,key,0,id&31);probes++;if(value){matches++;assert.equal(value,asyncTestValue(id,producer));}
          // An id/producer pair uniquely determines all fields. These hybrids
          // were never enqueued and must miss even under concurrent replacement.
          key[1]=(producer+1)&3;assert.equal(probe(cache,key,0,id&31),0);
          key[1]=producer;key[2]^=1;assert.equal(probe(cache,key,0,id&31),0);
          key[2]^=1;key[key.length-1]^=1;assert.equal(probe(cache,key,0,id&31),0);
        }
        await setImmediate();assert.equal(errors.length,0,errors[0]?.stack);assert.ok(Date.now()<deadline,'publisher stalled');
      }while(!Array.from(done).every(x=>x===1)||publication.queues.some(q=>Atomics.load(q.control,0)!==Atomics.load(q.control,16)));
      assert.ok(probes>0);assert.ok(matches>0,'must observe published rows');
      assert.deepEqual(Array.from(cache.stats),[0,0,0]);
      assert.ok(Array.from(cache.value).every(x=>x<=3));
    }finally{Atomics.store(control,0,1);await Promise.all(threads.map(w=>w.terminate()));}
  }
});

test('publisher participates in timeout cleanup and invalid modes cannot silently run',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
  const result=await runLazySmpConnect4Rba32([],{geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:4096,localCacheCapacity:4096,publicationMode:'async',timeoutMs:10});
  assert.equal(result.status,'TIMEOUT');assert.equal(result.cleanup,true);assert.equal(result.workersExited,5);
  await assert.rejects(runLazySmpConnect4Rba32([],{geometry,workers:4,workerMode:'minimal',publicationMode:'bad'}),/valid mode/);
});
