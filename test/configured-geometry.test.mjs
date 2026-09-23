import test from 'node:test';
import assert from 'node:assert/strict';
import {
  equalSpan32At, subsetSpan32At, orSpan32Into, andSpan32Into, andNotSpan32Into, reverseSpan32Into,
} from '../src/span32.mjs';
import {insertMinimalSpan32InPlace, productJoinMinimalSpan32Into} from '../src/relational32.mjs';
import {mixSpan32Locator32, probeSpan32IdSlot32, publishSpanIdSlot32} from '../src/widekey32.mjs';
import {reduceMaxIntervals32Into, reduceMinIntervals32Into} from '../src/interval32.mjs';
import {permuteBitsSpan32Into} from '../src/basis32.mjs';
import {publishDependencies32, retainFirstRunnableDependency32} from '../src/worker32.mjs';
import {applyMoveSpan32, undoMoveSpan32} from '../src/state32.mjs';

test('runtime-sized set and exact-key primitives exceed former fixed widths',()=>{
  const words=11,a=new Uint32Array(words),b=new Uint32Array(words),out=new Uint32Array(words);
  a[0]=1;a[5]=0x80000000;a[10]=4;
  b.set(a);b[3]=8;
  assert.equal(equalSpan32At(a,0,b,0,words),0);
  assert.equal(subsetSpan32At(a,0,b,0,words),1);
  orSpan32Into(out,0,a,0,b,0,words);assert.equal(out[3],8);assert.equal(out[10],4);
  andSpan32Into(out,0,a,0,b,0,words);assert.equal(out[3],0);assert.equal(out[5],0x80000000);
  andNotSpan32Into(out,0,b,0,a,0,words);assert.equal(out[3],8);
  reverseSpan32Into(out,0,b,0,words);assert.equal(out[10],b[0]);assert.equal(out[0],b[10]);

  const slots=new Int32Array(32);slots.fill(-1);
  const store=new Uint32Array(32*words);
  const hash=mixSpan32Locator32(b,0,words),start=hash&31;
  const miss=probeSpan32IdSlot32(slots,store,31,start,b,0,words,-1);
  assert.ok(miss<0);publishSpanIdSlot32(store,slots,~miss,7,b,0,words);
  assert.equal(probeSpan32IdSlot32(slots,store,31,start,b,0,words,-1),7);
});

test('runtime-sized skyline/product supports records wider than six words',()=>{
  const recordWords=10,store=new Uint32Array(6*recordWords),candidate=new Uint32Array(recordWords);
  candidate[0]=3;candidate[9]=1;
  let n=insertMinimalSpan32InPlace(store,0,0,6,recordWords,candidate,0);
  assert.equal(n,1);
  candidate[0]=7;n=insertMinimalSpan32InPlace(store,0,n,6,recordWords,candidate,0);assert.equal(n,1);
  candidate[0]=1;n=insertMinimalSpan32InPlace(store,0,n,6,recordWords,candidate,0);assert.equal(n,1);

  const left=new Uint32Array(2*recordWords),right=new Uint32Array(2*recordWords),out=new Uint32Array(8*recordWords),scratch=new Uint32Array(recordWords);
  left[0]=3;left[recordWords]=12;right[0]=5;right[recordWords]=10;
  const count=productJoinMinimalSpan32Into(out,0,0,8,left,0,2,right,0,2,recordWords,scratch,0);
  assert.ok(count>0);assert.ok(count<=4);
});

test('runtime action-count reductions and dependency publication handle width ten',()=>{
  const count=10;
  const lo=Uint32Array.from([1,2,1,3,2,1,2,1,3,2]);
  const hi=Uint32Array.from([2,3,3,3,2,2,3,1,3,2]);
  const out=new Uint32Array(4);
  reduceMaxIntervals32Into(lo,hi,0,count,out,0);
  reduceMinIntervals32Into(lo,hi,0,count,out,2);
  assert.deepEqual([...out],[3,3,1,1]);

  const childIn=Int32Array.from({length:count},(_,i)=>i+20);
  const generationIn=Uint32Array.from({length:count},(_,i)=>i+1);
  const p0=Uint32Array.from({length:count},(_,i)=>i);
  const p1=Uint32Array.from({length:count},(_,i)=>i+10);
  const p2=Uint32Array.from({length:count},(_,i)=>i+20);
  const childOut=new Int32Array(count),gOut=new Uint32Array(count),o0=new Uint32Array(count),o1=new Uint32Array(count),o2=new Uint32Array(count);
  assert.equal(publishDependencies32(childOut,gOut,o0,o1,o2,0,childIn,generationIn,p0,p1,p2,0,count),count);
  assert.equal(childOut[9],29);assert.equal(o2[9],29);

  const execution=new Uint32Array(40),resolved=new Uint32Array(40),state=new Uint32Array(40);
  resolved[20]=1;state[21]=1;
  assert.equal(retainFirstRunnableDependency32(execution,resolved,state,childOut,0,count,7,0),22);
});

test('runtime packed-bit permutation spans more than three words',()=>{
  const words=5,count=150;
  const source=new Uint32Array(words),out=new Uint32Array(words),map=new Uint32Array(count);
  source[0]|=1;source[2]|=1<<6;source[4]|=1<<21;
  for(let i=0;i<count;i++)map[i]=count-1-i;
  permuteBitsSpan32Into(out,0,words,source,0,map,0,count);
  assert.ok(out[(149>>>5)]&(1<<(149&31)));
  assert.ok(out[(79>>>5)]&(1<<(79&31)));
  assert.ok(out[(0>>>5)]&1);
});

test('runtime-sized board transition supports 10x10 without packed-three-bit heights',()=>{
  const columns=10,rows=10,cellCount=columns*rows;
  const playable=new Uint32Array(Math.ceil(cellCount/32));
  const landing=new Int32Array(columns);
  for(let c=0;c<columns;c++){landing[c]=c;playable[c>>>5]|=1<<(c&31);}
  const sequence=[9,9,9,9,9,9,9,9,9,9];
  const cells=[];
  for(const column of sequence)cells.push(applyMoveSpan32(playable,landing,column,columns,cellCount));
  assert.deepEqual(cells,[9,19,29,39,49,59,69,79,89,99]);
  assert.equal(landing[9],109);
  for(let i=sequence.length-1;i>=0;i--)assert.equal(undoMoveSpan32(playable,landing,sequence[i],columns,cellCount),cells[i]);
  assert.equal(landing[9],9);
});
