import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const analyzer=fileURLToPath(new URL('../experiments/isomax-four-items/analyze-revisit.mjs',import.meta.url));
function fixture(completed,check,order='ACHXCXAHHAXCXHCA'){
  const dir=mkdtempSync(join(tmpdir(),'isomax-analysis-'));
  try{
    const helperSha='synthetic-test-fixture';
    const arms=Object.fromEntries(['A','B','C','H','X'].map(arm=>[arm,{sourceSha:arm.repeat(40)}]));
    const rows=[...order].map((arm,index)=>({index,arm,sourceSha:arms[arm].sourceSha,
      status:'EXACT',rootWdl:1,move:3,searchRootSequence:'44444',searchCalls:1,
      cleanup:true,workersExited:4,errors:[],wallMs:{A:100,B:90,C:95,H:99,X:90}[arm],
      solveCycles:String({A:10000,B:9000,C:9500,H:9900,X:9000}[arm]),cpuMs:1,peakRssBytes:1}));
    const write=(name,value)=>writeFileSync(join(dir,name),JSON.stringify(value));
    write('manifest.json',{helperSha,packet:{order,arms}});
    writeFileSync(join(dir,'samples.jsonl'),rows.map(JSON.stringify).join('\n')+'\n');
    if(completed)write('SUMMARY.json',{helperSha,order,
      rows:rows.map(({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})=>({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes}))});
    check(spawnSync(process.execPath,[analyzer,dir],{encoding:'utf8'}),dir);
  }finally{
    for(const name of readdirSync(dir))unlinkSync(join(dir,name));
    rmdirSync(dir);
  }
}
test('analysis rejects sixteen EXACT rows without successful runner completion',()=>{
  fixture(false,result=>assert.notEqual(result.status,0,'an incomplete or failed final validation must not qualify'));
});
test('analysis handles four adjacent AB/BA pairs without reversing the improvement sign',()=>{
  fixture(true,(result,dir)=>{
    assert.equal(result.status,0,result.stderr);
    const output=JSON.parse(readFileSync(join(dir,'BLOCK_ANALYSIS.json')));
    assert.equal(output.blockSize,2);
    assert.ok(output.comparisons[0].solveCycles.blockPercentLower.every(v=>Math.abs(v-10)<1e-10));
  },'ABBABAAB');
});
test('analysis reports hand-calculated ten percent combined reduction for a complete packet',()=>{
  fixture(true,(result,dir)=>{
    assert.equal(result.status,0,result.stderr);
    const output=JSON.parse(readFileSync(join(dir,'BLOCK_ANALYSIS.json')));
    const combined=output.comparisons.find(c=>c.candidate==='X'&&c.reference==='A');
    assert.ok(Math.abs(combined.wallMs.geometricPercentLower-10)<1e-10);
    assert.ok(combined.wallMs.descriptive95PercentInterval.every(v=>Math.abs(v-10)<1e-10));
  });
});
