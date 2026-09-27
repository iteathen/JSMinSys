import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const arms=['native','poll','mode','deep-ablation'];
test('dormant wide-path controls preserve WDL and matched mode/ablation traversal',()=>{
  const results=[];
  for(const arm of arms){
    const env={...process.env,ISOMAX_WIDE_PATH:arm};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
    const p=spawnSync(process.execPath,['--experimental-ffi','--import',new URL('./wide-path-loader.mjs',import.meta.url).href,
      fileURLToPath(new URL('./sample.mjs',import.meta.url)),JSON.stringify({moves:'1212',columns:4,rows:4,workers:1,sharedCacheCapacity:65536,localCacheCapacity:65536})],
      {env,encoding:'utf8',timeout:10000});
    assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);results.push(r);
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,0);assert.equal(r.cleanup,true);assert.equal(r.workersExited,1);
    assert.ok(r.totalNodes>0);assert.equal(r.totalNodes,r.winnerMetrics.nodes);
  }
  assert.equal(results[0].totalNodes,results[1].totalNodes);
  assert.equal(results[2].totalNodes,results[3].totalNodes);
  assert.equal(results[2].move,results[3].move);
});

test('split root probe preserves exact work and actually releases to deep continuation',()=>{
  const results=[];
  for(const arm of ['probe','probe-split']){
    const env={...process.env,ISOMAX_WIDE_PATH:arm};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
    const p=spawnSync(process.execPath,['--experimental-ffi','--import',new URL('./wide-path-loader.mjs',import.meta.url).href,
      fileURLToPath(new URL('./sample.mjs',import.meta.url)),JSON.stringify({moves:'2431572135633422',workers:1})],
      {env,encoding:'utf8',timeout:10000});
    assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);results.push(r);
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,-1);assert.equal(r.cleanup,true);
    assert.ok(r.probeMetrics[0][1]>0);assert.equal(r.probeMetrics[0][2],1);
  }
  assert.equal(results[0].totalNodes,results[1].totalNodes);assert.equal(results[0].move,results[1].move);
});
