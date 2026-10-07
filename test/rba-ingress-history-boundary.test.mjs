import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves,connect4PositionCode64FromMoves} from '../addons/rba-connect4-ingress.mjs';

test('oversized history rejects before any ingress arena allocation or indexing',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:1}),moves=Array(5),Native=globalThis.Uint32Array;
 Object.defineProperty(moves,'0',{get(){throw Error('history indexed before rejection');}});
 globalThis.Uint32Array=class extends Native{constructor(){throw Error('arena allocated before rejection');}};
 try{
  assert.throws(()=>connect4RbaFromMoves(moves,{geometry:g}),/history.*capacity/);
  assert.throws(()=>connect4PositionCode64FromMoves(moves,{geometry:g}),/history.*capacity/);
 }finally{globalThis.Uint32Array=Native;}
});

test('history boundary accepts indexed numeric arrays, rejects DataView and arbitrary iterables',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:3});
 for(const moves of [new DataView(new ArrayBuffer(4)),null,{},'01',new Set([0,1])])
  assert.throws(()=>connect4RbaFromMoves(moves,{geometry:g}),/history/);
 const expected=connect4RbaFromMoves([0,1],{geometry:g});
 for(const moves of [new Uint8Array([0,1]),new Int32Array([0,1]),new Float64Array([0,1])])
  assert.deepEqual(connect4RbaFromMoves(moves,{geometry:g}),expected);
});

test('owned indexed history is read once and reused by position-code construction',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:3}),moves=[0,1];let reads=0;
 Object.defineProperty(moves,'0',{get(){return reads++===0?0:2;}});
 moves[Symbol.iterator]=()=>{throw Error('external iterator must not execute');};
 const actual=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),
  expected=connect4RbaFromMoves([0,1],{geometry:g,canonical:false});
 assert.deepEqual(actual,expected);assert.equal(reads,1);
});

test('ingress remains exact for array and typed history across dimensions1..10',()=>{
 for(let columns=1;columns<=10;columns++)for(let rows=1;rows<=10;rows++){
  const g=prepareConnect4RbaGeometry({columns,rows});
  assert.deepEqual(connect4RbaFromMoves(new Uint8Array([0]),{geometry:g}),connect4RbaFromMoves([0],{geometry:g}));
 }
});
