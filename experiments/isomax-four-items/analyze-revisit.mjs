import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const dir=process.argv[2];
const rows=readFileSync(dir+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,16);
const blocks=Array.from({length:4},(_,i)=>{
  const b=rows.slice(i*4,i*4+4);assert.equal(new Set(b.map(r=>r.arm)).size,4);
  for(const r of b)assert.equal(r.status,'EXACT');
  return Object.fromEntries(b.map(r=>[r.arm,r]));
});
const comparisons=[];
for(const [candidate,reference] of [['C','A'],['H','A'],['X','A'],['X','H'],['X','C']]){
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
const output={blocks:4,comparisons,limits:'Descriptive t intervals on four block log ratios; normal/independence assumptions, one host, no universal or robust statistical claim. No 1% cutoff.'};
writeFileSync(dir+'/BLOCK_ANALYSIS.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
