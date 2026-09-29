import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';

const url=new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url);
const source=readFileSync(url,'utf8').replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,url).href}'`);
const api=await import('data:text/javascript;base64,'+Buffer.from(
  source+'\nexport {prepareConnect4MoveOrderPacking32};'
).toString('base64'));

test('packed move-row geometry guard is exact and conservative',()=>{
  const standard=api.prepareConnect4MoveOrderPacking32(7,69);
  assert.deepEqual(standard,{shift:3,mask:7});
  assert.deepEqual(api.prepareConnect4MoveOrderPacking32(1,1),{shift:0,mask:0});

  // With b=15, a score of 131071 is the largest value that can be shifted
  // without losing semantic bits in one uint32 row entry.
  assert.deepEqual(api.prepareConnect4MoveOrderPacking32(32768,131071),{shift:15,mask:32767});
  assert.deepEqual(api.prepareConnect4MoveOrderPacking32(32768,131072),{shift:-1,mask:0xffffffff});
});

test('packed move rows preserve maximum fields and stable score ties',()=>{
  const {shift,mask}=api.prepareConnect4MoveOrderPacking32(7,69),
    maxScore=0xffffffff>>>shift,
    maxEntry=((maxScore<<shift)|mask)>>>0;
  assert.equal(maxEntry,0xffffffff);
  assert.equal(maxEntry&mask,mask);
  assert.equal(maxEntry>>>shift,maxScore);

  const actionOrder=[3,4,2,5,1,6,0],
    scores=[5,5,7,5,7,1,5],
    eager=[];
  for(let i=0;i<actionOrder.length;i++){
    const item={score:scores[i],column:actionOrder[i]};let at=eager.length;
    while(at>0&&eager[at-1].score<item.score)at--;
    eager.splice(at,0,item);
  }

  const packed=[];
  for(let i=0;i<actionOrder.length;i++){
    const score=scores[i],column=actionOrder[i],
      threshold=(score<<shift)>>>0,entry=((score<<shift)|column)>>>0;
    let at=packed.length;
    while(at>0&&packed[at-1]<threshold)at--;
    packed.splice(at,0,entry);
  }
  assert.deepEqual(
    packed.map(entry=>({score:entry>>>shift,column:entry&mask})),
    eager,
  );
});

test('prepared solver uses packed recursive rows but keeps root row as columns',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    root=connect4RbaFromMoves([],{geometry:g,canonical:false}),
    state=api.prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:4096});
  assert.equal(state.movePackShift,2);
  assert.equal(state.moveOrderMask,3);

  const result=api.solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
  assert.ok(result.value>=1&&result.value<=3);

  const rootRow=Array.from(state.moveOrder.slice(0,g.columns));
  assert.ok(rootRow.some(v=>v<g.columns));
  assert.ok(rootRow.every(v=>v===0||v<g.columns),'root row must remain ordinary columns');

  const recursive=Array.from(state.moveOrder.slice(g.columns));
  assert.ok(recursive.some(v=>v>state.moveOrderMask),
    'at least one recursive row entry must carry a nonzero packed score');
  for(const entry of recursive)assert.ok((entry&state.moveOrderMask)<g.columns);
});
