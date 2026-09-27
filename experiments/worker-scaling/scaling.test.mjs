import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import lockedProfile from './locked-profile.json' with {type:'json'};
test('diagnostic controls preserve WDL, count every worker, and disable sharing when requested',()=>{
  for(const [workers,noShare,order] of [[1,false,undefined],[1,true,undefined],[4,true,0]]){
    const env={...process.env};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
    if(noShare)env.SCALE_NO_SHARE='1';if(order!==undefined)env.SCALE_ORDER=String(order);
    const p=spawnSync(process.execPath,['--experimental-ffi','--import',new URL('./loader.mjs',import.meta.url).href,
      fileURLToPath(new URL('./sample.mjs',import.meta.url)),JSON.stringify({workers,moves:'1212',columns:4,rows:4,
        sharedCacheCapacity:131072,localCacheCapacity:65536})],
      {env,encoding:'utf8',timeout:10000});
    assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,0);assert.equal(r.cleanup,true);
    assert.equal(r.workersExited,workers);assert.equal(r.benchmarkNodeCounts.length,workers);
    assert.equal(r.config.sharedCacheCapacity,131072);assert.equal(r.config.localCacheCapacity,65536);
    // This 4x4 smoke fixture has seven key words, versus fourteen for 7x6.
    assert.equal(r.cachePayloadBytes,131072*36+12+workers*65536*33);
    assert.ok(r.observedPeakRss>=r.rss);
    assert.ok(r.totalNodes>=r.winnerMetrics.nodes);assert.ok(r.firstSearchToResultMs>0);
    assert.ok(r.firstSearchToResultMs<r.wallMs);assert.ok(r.workerTiming.every(x=>x[0]>0));
    if(noShare){assert.equal(r.sharedCacheStores,0);assert.equal(r.sharedCacheHits,0);}
    assert.equal(BigInt(r.bootstrapCycles)+BigInt(r.setupCycles)+BigInt(r.solveCycles),BigInt(r.totalCycles));
  }
});

test('cold sample uses the locked seven-worker resource profile when options are omitted',()=>{
  const env={...process.env};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
  const p=spawnSync(process.execPath,['--experimental-ffi','--import',new URL('./loader.mjs',import.meta.url).href,
    fileURLToPath(new URL('./sample.mjs',import.meta.url)),JSON.stringify({moves:'1212',columns:4,rows:4})],
    {env,encoding:'utf8',timeout:10000});
  assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);
  for(const [key,value] of Object.entries(lockedProfile.options))assert.equal(r.config[key],value);
  assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,0);assert.equal(r.cleanup,true);
  assert.equal(r.workersExited,7);assert.equal(r.sharedSampleMask,0);
  assert.equal(r.cachePayloadBytes,4194304*36+12+7*1048576*33);
  assert.equal(lockedProfile.cachePayloadBytes7x6,4194304*64+12+7*1048576*61);
});
