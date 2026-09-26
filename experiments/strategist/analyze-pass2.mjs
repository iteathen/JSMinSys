// Cold evidence validation/reporting. No imports into workers or search.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const directory=process.argv[2];
if(!directory)throw Error('evidence directory required');
const read=name=>readFileSync(join(directory,name+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const median=a=>{const s=a.toSorted((x,y)=>x-y),i=s.length>>>1;return s.length&1?s[i]:(s[i-1]+s[i])/2;};
const groups=new Map(),verified={};
for(const name of ['screen','strategies','confirmation']){
  const rows=read(name).filter(r=>r.type==='trial');
  assert.equal(rows.length,{screen:11,strategies:66,confirmation:42}[name]);
  for(const r of rows){
    assert.equal(r.status,'EXACT');assert.equal(r.cleanup,true);
    assert.equal(r.errors.length,0);assert.equal(r.forcedTerminations,0);
    assert.equal(BigInt(r.evaluatorCycles),r.evaluators.reduce((n,e)=>n+BigInt(e.cycles),0n));
    assert.equal(r.nodes,r.evaluators.reduce((n,e)=>n+e.result.metrics.nodes,0));
    for(const e of r.evaluators)if(e.result.status==='EXACT')assert.equal(e.result.value,r.value);
    if(name!=='screen')assert.equal(r.value,r.fixture.columns===4?2:1);
    const key=[name,r.fixture.columns+'x'+r.fixture.rows,r.fixture.moves.join('')||'empty',r.label].join('/');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);
  }
  verified[name]=rows.length;
}
const strategies=[...groups].map(([key,rows])=>({key,count:rows.length,
  cycles:median(rows.map(r=>Number(r.evaluatorCycles))),nodes:median(rows.map(r=>r.nodes)),
  cyclesPerNode:median(rows.map(r=>r.cyclesPerNode)),solveMs:median(rows.map(r=>r.solveWallMs)),
  minCycles:Math.min(...rows.map(r=>Number(r.evaluatorCycles))),maxCycles:Math.max(...rows.map(r=>Number(r.evaluatorCycles))),
  strategistCycles:median(rows.map(r=>Number(r.strategist?.cycles??0))),
  helperEarlyRetirements:rows.filter(r=>r.strategist?.strategy.includes('seed')&&r.evaluators.some(e=>e.index>0&&e.result.status==='CANCELLED'&&e.ended<r.evaluators.find(w=>w.index===0).ended)).length}));
const probes=read('dispatch').filter(r=>r.type==='dispatch-probe'),dispatchGroups=new Map();
assert.equal(probes.length,16);
for(const probe of probes)for(const r of probe.rows){
  assert.equal(r.nodes,(r.fixture.columns===4?13382:24684)*r.fixture.repeats);
  if(r.scenario==='changing')assert.ok(r.changes>1,'asynchronous updates actually observed');
  else assert.equal(r.changes,0,'unchanged preferences not reapplied');
  const key=r.fixture.columns+'x'+r.fixture.rows+'/'+r.scenario+'/'+r.dispatch;
  if(!dispatchGroups.has(key))dispatchGroups.set(key,[]);dispatchGroups.get(key).push(r);
}
const dispatch=[...dispatchGroups].map(([key,rows])=>({key,count:rows.length,
  cyclesPerNode:median(rows.map(r=>r.cyclesPerNode)),min:Math.min(...rows.map(r=>r.cyclesPerNode)),max:Math.max(...rows.map(r=>r.cyclesPerNode))}));
console.log(JSON.stringify({verified,dispatchBatches:probes.reduce((n,r)=>n+r.rows.length,0),strategies,dispatch},null,2));
