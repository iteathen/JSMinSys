import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {argMaxPlayableSlot7Nonempty32} from '../src/search32.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';

test('lazy selector preserves stable score order for masks and worker permutations',()=>{
  let seed=73;
  for(let trial=0;trial<2000;trial++){
    const scores=new Int32Array(7),order=[3,2,4,1,5,0,6],offset=trial%7;
    for(let i=0;i<7;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;scores[i]=(seed&7)===0?-2147483648:seed%14;}
    const expected=[...scores].map((score,slot)=>({score,slot})).filter(x=>x.score!==-2147483648).sort((a,b)=>b.score-a.score||a.slot-b.slot);
    const actual=[];
    for(let i=0;i<expected.length;i++){const slot=argMaxPlayableSlot7Nonempty32(scores);actual.push(order[(slot+offset)%7]);scores[slot]=-2147483648;}
    assert.deepEqual(actual,expected.map(x=>order[(x.slot+offset)%7]));
  }
});

test('isolated lazy selection retains forced transit and uses independent prepared score rows',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),s=prepareConnect4RbaAlphaBeta({geometry:g});
  assert.equal(s.recursiveScores.length,43);
  s.recursiveScores[1][0]=71;s.recursiveScores[2][0]=99;assert.equal(s.recursiveScores[1][0],71);
  const source=readFileSync(new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url),'utf8');
  const hot=source.slice(source.indexOf('function searchCpcOnly('),source.indexOf('function search(state,'));
  assert.ok(hot.includes('if(forced>=0)'));assert.ok(hot.includes('state.actionOrder['));assert.ok(hot.includes('actionMask'));
  assert.equal(hot.includes('priorScore'),false);
});
