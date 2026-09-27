import test from 'node:test';
import assert from 'node:assert/strict';
import {compareArms} from './stats.mjs';
test('objective selects its own metric, paired by block rather than file order',()=>{
  const rows=[];
  for(let b=0;b<8;b++)for(const arm of 'DCBA')rows.push({block:b,arm,
    wallMs:(b+1)*100*(arm==='D'?.8:1),solveCycles:String((b+1)*1000*(arm==='D'?1.2:1))});
  assert.ok(Math.abs(compareArms(rows,'wallMs').D.meanDeltaPct+20)<1e-10);
  assert.ok(Math.abs(compareArms(rows,'solveCycles').D.meanDeltaPct-20)<1e-10);
});
test('missing, duplicate, zero and nonfinite measurements fail closed',()=>{
  const rows=Array.from({length:8},(_,block)=>[...'ABCD'].map(arm=>({block,arm,wallMs:100}))).flat();
  for(const bad of [rows.slice(1),[...rows,rows[0]],rows.map((r,i)=>i?r:{...r,wallMs:0}),rows.map((r,i)=>i?r:{...r,wallMs:NaN})])
    assert.throws(()=>compareArms(bad,'wallMs'));
});
