import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';

// Extract the actual cold layout and actual hot ordering block, without
// allocating impossible billion-column geometries. No copied implementation.
const source=readFileSync(new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url),'utf8');
const layoutSource=source.slice(source.indexOf('  const moveColumnBits='),source.indexOf('  return {g,profile,mode,'));
assert.ok(layoutSource.includes('moveColumnMask'));
const layout=Function('g',layoutSource+'return {packedMoveOrder,moveColumnBits,moveColumnMask};');
const sortStart=source.indexOf('    const scores=state.moveScores,ordered=state.moveOrder,packedMoves='),
  sortEnd=source.indexOf('    if(!actionCount)return 0;',sortStart);
assert.ok(sortStart>0&&sortEnd>sortStart);
const sort=Function('state','words','g','evaluateConnect4LiveLine3x32','evaluateConnect4LiveLineCell32',
  'const keyOffset=0,orderRow=0,orientation=0,liveOffset=0,mover=0,actionMask=-1,live=state.live;'+
  source.slice(sortStart,sortEnd)+'return actionCount;');

test('actual packing guard and unsigned stable insertion cover field boundaries',()=>{
  assert.deepEqual(layout({columns:1,lineCount:1}),{packedMoveOrder:1,moveColumnBits:0,moveColumnMask:0});
  assert.equal(layout({columns:7,lineCount:0x1fffffff}).packedMoveOrder,1);
  assert.equal(layout({columns:7,lineCount:0x20000000}).packedMoveOrder,0);
  assert.equal(layout({columns:0x40000001,lineCount:1}).packedMoveOrder,0);
  let seed=47;
  for(let trial=0;trial<400;trial++){
    const columns=7,hi=0x1fffffff,values=Array.from({length:columns},(_,i)=>{
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      return trial===0?hi:trial===1?0:trial===2?i:(seed%5===0?hi:seed%17);
    }),order=Array.from({length:columns},(_,i)=>(i+trial)%columns),
      state={...layout({columns,lineCount:hi}),actionOrder:order,moveOrder:new Uint32Array(columns),
        moveScores:new Int32Array(columns),live:{wordCount:3,through:null},liveState:null},
      score=(_through,offset)=>values[offset/3];
    assert.equal(sort(state,new Uint32Array(columns),{columns,rows:6},score,()=>{throw Error('wrong scorer');}),columns);
    const expected=order.toSorted((a,b)=>values[b]-values[a]);
    assert.deepEqual([...state.moveOrder].map(v=>v&state.moveColumnMask),expected);
    assert.deepEqual([...state.moveOrder].map(v=>v>>>state.moveColumnBits),expected.map(c=>values[c]));
  }
});

test('prepared move packing follows initialized geometry, not a fixed column width',()=>{
  for(const [columns,rows] of [[4,4],[7,6],[10,4]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),s=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:64});
    assert.equal(s.packedMoveOrder,1);
    assert.equal(s.moveColumnBits,Math.ceil(Math.log2(columns)));
    assert.equal(s.moveColumnMask,2**s.moveColumnBits-1);
  }
});

test('actual recursive packed rows preserve every column write and solve metric',()=>{
  // Diagnostic correctness only. Proxy trace is never present in timing.
  for(const [columns,rows,moves] of [[4,4,[]],[7,6,[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3]]]){
    const g=prepareConnect4RbaGeometry({columns,rows});
    for(const history of [moves,moves.map(c=>columns-1-c)])for(let orderOffset=0;orderOffset<4;orderOffset++){
      const root=connect4RbaFromMoves(history,{geometry:g}),runs=[];
      for(const packed of [0,1]){
        const state=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024,orderOffset});
        assert.equal(state.packedMoveOrder,1);
        state.packedMoveOrder=packed;
        const trace=[];
        state.moveOrder=new Proxy(state.moveOrder,{
          set(target,index,value){
            const i=Number(index);
            trace.push(i,packed&&i>=columns?value&state.moveColumnMask:value);
            target[index]=value;return true;
          },
        });
        const result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
        runs.push({trace,result});
      }
      assert.ok(runs[0].trace.some((value,i)=>!(i&1)&&value>=columns),'must exercise recursive ordering');
      assert.deepEqual(runs[1],runs[0],`${columns}x${rows} offset ${orderOffset}`);
    }
  }
});

test('generated cycle accounting separates insertion shifts from cancellation checks',()=>{
  const ledger=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url),'utf8'));
  for(const name of ['searchCpcOnlyBehavior','searchCpcOnlyFrontier']){
    const u=ledger.units.find(u=>u.name===name);
    assert.match(u.cycleCount.parameters.K,/insertion/);
    assert.match(u.cycleCount.parameters.STOP_TEST,/cancellation/);
    for(const op of ['control.test.u32','control.branch'])
      assert.ok(u.operations.some(x=>x.op===op&&x.count==='STOP_TEST'));
  }
});
