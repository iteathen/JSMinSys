import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const dir=process.argv[2];
const rows=readFileSync(dir+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse);
// The runner writes this only after every result/identity/cleanup/affinity gate.
// A samples row alone is not completion evidence: it is appended before gates.
const completion=JSON.parse(readFileSync(dir+'/SUMMARY.json','utf8'));
const manifest=JSON.parse(readFileSync(dir+'/manifest.json','utf8'));
assert.equal(completion.helperSha,manifest.helperSha);
assert.equal(completion.order,manifest.packet.order);
assert.equal(completion.order,rows.map(r=>r.arm).join(''));
assert.deepEqual(completion.rows,rows.map(({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})=>
  ({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})));
for(const row of rows){
  assert.equal(row.sourceSha,manifest.packet.arms[row.arm].sourceSha);
  assert.equal(row.rootWdl,1);assert.equal(row.move,3);assert.equal(row.searchRootSequence,'44444');
  assert.equal(row.searchCalls,1);assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);
  assert.deepEqual(row.errors,[]);
}
assert.ok(rows.length===16||rows.length===8);
const width=rows.length/4;
const blocks=Array.from({length:4},(_,i)=>{
  const b=rows.slice(i*width,i*width+width);assert.equal(new Set(b.map(r=>r.arm)).size,width);
  assert.deepEqual([...new Set(b.map(r=>r.arm))].sort(),width===4?['A','C','H','X']:['A','B']);
  for(const r of b)assert.equal(r.status,'EXACT');
  return Object.fromEntries(b.map(r=>[r.arm,r]));
});
const comparisons=[];
for(const [candidate,reference] of (width===4?[['C','A'],['H','A'],['X','A'],['X','H'],['X','C']]:[['B','A']])){
  const result={candidate,reference};
  for(const field of ['wallMs','solveCycles']){
    const logs=blocks.map(b=>Math.log(Number(b[candidate][field])/Number(b[reference][field])));
    const mean=logs.reduce((a,b)=>a+b,0)/4;
    const sd=Math.sqrt(logs.reduce((s,x)=>s+(x-mean)**2,0)/3),half=3.182446*sd/2;
    result[field]={blockPercentLower:logs.map(x=>100*(1-Math.exp(x))),
      geometricPercentLower:100*(1-Math.exp(mean)),
      descriptive95PercentInterval:[100*(1-Math.exp(mean+half)),100*(1-Math.exp(mean-half))]};
  }
  comparisons.push(result);
}
const output={blocks:4,blockSize:width,comparisons,limits:'Descriptive t intervals on four block/pair log ratios; normal/independence assumptions, one host, no universal or robust statistical claim. No 1% cutoff.'};
writeFileSync(dir+'/BLOCK_ANALYSIS.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
