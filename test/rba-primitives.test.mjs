import test from 'node:test';
import assert from 'node:assert/strict';
import {
  equal3x32At, subset3x32At, or3x32Into, and3x32Into, andNot3x32Into,
  equal6x32At, subset6x32At, or6x32Into, equal8x32At,
} from '../src/fixedset32.mjs';
import {insertMinimal6x32InPlace, productJoinMinimal6x32Into} from '../src/relational32.mjs';
import {mix8x32Locator32, probe8x32IdSlot32, publish8x32IdSlot32, publishSpan32} from '../src/widekey32.mjs';
import {tightenInterval32, reduceMaxIntervals7x32Into, reduceMinIntervals7x32Into} from '../src/interval32.mjs';
import {emitSortedSetBits32, transformDedupSortedActionMajor32, permuteBits3x32Into} from '../src/basis32.mjs';
import {slotMask7Contains32, slotMask7Add32, slotMask7Remove32, slotMask7First32} from '../src/slotmask32.mjs';
import {
  intrusiveEnqueueTailStamped32, intrusiveEnqueueOnceTailStamped32,
  intrusiveRemove32, intrusivePopHeadStamped32, intrusiveTicketValid32,
} from '../src/intrusive32.mjs';

test('fixed 3/6/8 word set operations preserve bit-31 and lane boundaries', () => {
  const a = new Uint32Array([0x80000001, 2, 4, 1, 2, 4, 8, 16]);
  const b = new Uint32Array([0xffffffff, 6, 4, 1, 2, 4, 8, 16]);
  const out = new Uint32Array(8);
  assert.equal(subset3x32At(a, 0, b, 0), true);
  assert.equal(equal3x32At(a, 0, b, 0), false);
  or3x32Into(out, 0, a, 0, b, 0); assert.deepEqual([...out.slice(0, 3)], [0xffffffff, 6, 4]);
  and3x32Into(out, 0, a, 0, b, 0); assert.deepEqual([...out.slice(0, 3)], [0x80000001, 2, 4]);
  andNot3x32Into(out, 0, b, 0, a, 0); assert.deepEqual([...out.slice(0, 3)], [0x7ffffffe, 4, 0]);
  assert.equal(subset6x32At(a, 0, b, 0), true);
  assert.equal(equal6x32At(a, 0, b, 0), false);
  or6x32Into(out, 0, a, 0, b, 0); assert.equal(out[0], 0xffffffff);
  assert.equal(equal8x32At(a, 0, a, 0), true);
});

test('six-word skyline insert rejects dominated candidates and removes dominated retained generators', () => {
  const words = new Uint32Array(4 * 6);
  const candidate = new Uint32Array(6);
  candidate[0] = 3;
  let n = insertMinimal6x32InPlace(words, 0, 0, 4, candidate, 0);
  assert.equal(n, 1);
  candidate[0] = 7; n = insertMinimal6x32InPlace(words, 0, n, 4, candidate, 0); assert.equal(n, 1);
  candidate[0] = 1; n = insertMinimal6x32InPlace(words, 0, n, 4, candidate, 0); assert.equal(n, 1); assert.equal(words[0], 1);
  candidate[0] = 2; n = insertMinimal6x32InPlace(words, 0, n, 4, candidate, 0); assert.equal(n, 2);
  const one = new Uint32Array(6); one[1] = 1;
  n = insertMinimal6x32InPlace(words, 0, n, 2, one, 0); assert.ok(n < 0, 'incomparable insert must report capacity');
});

test('streamed six-word join product absorbs the Cartesian product immediately', () => {
  const left = new Uint32Array(12), right = new Uint32Array(12), out = new Uint32Array(24), scratch = new Uint32Array(6);
  left[0] = 3; left[6] = 12; right[0] = 5; right[6] = 10;
  const n = productJoinMinimal6x32Into(out, 0, 0, 4, left, 0, 2, right, 0, 2, scratch, 0);
  const actual = Array.from({length:n}, (_, i) => out[i * 6]).sort((x, y) => x - y);
  const raw = [...new Set([3, 12].flatMap(x => [5, 10].map(y => x | y)))];
  const expected = raw.filter(x => !raw.some(y => y !== x && (y & ~x) === 0)).sort((x, y) => x - y);
  assert.deepEqual(actual, expected);
});

test('eight-word locator, exact probe/publication and span publication preserve exact identity', () => {
  const keys = new Uint32Array(32), slots = new Int32Array(8); slots.fill(-1);
  const key = Uint32Array.from([1,2,3,4,5,6,7,0x80000000]);
  const hash = mix8x32Locator32(key, 0), start = hash & 7;
  const empty = probe8x32IdSlot32(slots, keys, 7, start, key, 0, -1);
  assert.ok(empty < 0);
  publish8x32IdSlot32(keys, slots, ~empty, 2, key, 0);
  assert.equal(probe8x32IdSlot32(slots, keys, 7, start, key, 0, -1), 2);
  const other = key.slice(); other[7] ^= 1;
  assert.notEqual(probe8x32IdSlot32(slots, keys, 7, start, other, 0, -1), 2);
  const target = new Uint32Array(12); publishSpan32(target, 3, key, 2, 5);
  assert.deepEqual([...target.slice(3, 8)], [3,4,5,6,7]);
});

test('exact interval tightening and fixed-degree Bellman reductions remain monotone', () => {
  const bounds = new Uint32Array([1,3]);
  assert.equal(tightenInterval32(bounds, 0, 2, 3), 1); assert.deepEqual([...bounds], [2,3]);
  assert.equal(tightenInterval32(bounds, 0, 2, 3), 0);
  assert.equal(tightenInterval32(bounds, 0, 3, 3), 2); assert.deepEqual([...bounds], [3,3]);
  assert.equal(tightenInterval32(bounds, 0, 1, 2), -1);
  const lo=Uint32Array.from([1,2,1,3,2,1,2]), hi=Uint32Array.from([2,3,3,3,2,2,3]), out=new Uint32Array(4);
  reduceMaxIntervals7x32Into(lo,hi,0,7,out,0); assert.deepEqual([...out.slice(0,2)],[3,3]);
  reduceMinIntervals7x32Into(lo,hi,0,7,out,2); assert.deepEqual([...out.slice(2,4)],[1,2]);
});

test('ordered basis transform deduplicates mapped IDs and three-word permutation remaps active bits', () => {
  const source=Uint32Array.from([1,4,7,9]), table=new Int32Array(32).fill(-1), seen=new Uint32Array(2), out=new Uint32Array(16);
  const base=10; table[base+1]=33; table[base+4]=2; table[base+7]=33; table[base+9]=31;
  const n=transformDedupSortedActionMajor32(source,0,4,table,base,-1,seen,2,out,0);
  assert.equal(n,3); assert.deepEqual([...out.slice(0,n)],[2,31,33]);
  seen.fill(0); seen[0]=(1<<0)|(1<<31); seen[1]=1;
  assert.equal(emitSortedSetBits32(seen,2,out,0),3); assert.deepEqual([...out.slice(0,3)],[0,31,32]);
  const coord=new Uint32Array(3), mapped=new Uint32Array(3), map=new Uint32Array(69);
  coord[0]=(1<<0)|(1<<31); coord[2]=1<<(68-64);
  for(let i=0;i<69;i++)map[i]=68-i;
  permuteBits3x32Into(mapped,0,coord,0,map,0,69);
  assert.ok(mapped[2]&(1<<(68-64))); assert.ok(mapped[1]&(1<<(37-32))); assert.ok(mapped[0]&1);
});

test('seven-slot masks stay inside seven bits', () => {
  let mask=0; mask=slotMask7Add32(mask,6); mask=slotMask7Add32(mask,2);
  assert.equal(slotMask7Contains32(mask,6),true); assert.equal(slotMask7First32(mask),2);
  mask=slotMask7Remove32(mask,2); assert.equal(mask,64); assert.equal(slotMask7First32(mask),6);
});

test('intrusive stamped work list supports coalescing, arbitrary removal and generation validation', () => {
  const control=new Int32Array([-1,-1,0]), next=new Int32Array(4), prev=new Int32Array(4), member=new Uint32Array(4), stamp=new Uint32Array(4), generation=Uint32Array.from([1,4,9,16]);
  next.fill(-1);prev.fill(-1);
  assert.equal(intrusiveEnqueueOnceTailStamped32(control,0,1,2,next,prev,member,stamp,generation,2),1);
  assert.equal(intrusiveEnqueueOnceTailStamped32(control,0,1,2,next,prev,member,stamp,generation,2),0);
  intrusiveEnqueueTailStamped32(control,0,1,2,next,prev,member,stamp,generation,1);
  assert.deepEqual([...control], [2,1,2]); assert.equal(intrusiveTicketValid32(stamp,generation,2),true);
  generation[2]++; assert.equal(intrusiveTicketValid32(stamp,generation,2),false);
  assert.equal(intrusiveRemove32(control,0,1,2,next,prev,member,1),1); assert.deepEqual([...control],[2,2,1]);
  assert.equal(intrusivePopHeadStamped32(control,0,1,2,next,prev,member),2); assert.deepEqual([...control],[-1,-1,0]);
});
