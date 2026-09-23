import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bitTest32,
  bitSet32,
  bitClear32,
  bitToggle32,
  firstSetBitIndex32,
  popcount32,
  subset32,
} from '../src/word32.mjs';
import {
  and2x32Into,
  or2x32Into,
  xor2x32Into,
  zero2x32,
  equal2x32,
} from '../src/word64x32.mjs';

test('word32 bit blocks', () => {
  assert.equal(bitTest32(0b1000, 0b1000), true);
  assert.equal(bitTest32(0b1000, 0b0100), false);
  assert.equal(bitSet32(0, 0x80000000), 0x80000000);
  assert.equal(bitClear32(0xffffffff, 0x80000000), 0x7fffffff);
  assert.equal(bitToggle32(0x5, 0x1), 0x4);
});

test('first set bit index', () => {
  assert.equal(firstSetBitIndex32(0), -1);
  assert.equal(firstSetBitIndex32(1), 0);
  assert.equal(firstSetBitIndex32(0x80000000), 31);
  assert.equal(firstSetBitIndex32(0b1001000), 3);
});

test('popcount32', () => {
  assert.equal(popcount32(0), 0);
  assert.equal(popcount32(1), 1);
  assert.equal(popcount32(0xffffffff), 32);
  assert.equal(popcount32(0xf0f0f0f0), 16);
});

test('subset32', () => {
  assert.equal(subset32(0b0011, 0b1111), true);
  assert.equal(subset32(0b10000, 0b1111), false);
});

test('two-lane wordwise blocks', () => {
  const dst = new Uint32Array(2);

  and2x32Into(dst, 0, 0xf0f0, 0xaaaa, 0x0ff0, 0x5555);
  assert.deepEqual([...dst], [0x00f0, 0x0000]);

  or2x32Into(dst, 0, 0xf0f0, 0xaaaa, 0x0ff0, 0x5555);
  assert.deepEqual([...dst], [0xfff0, 0xffff]);

  xor2x32Into(dst, 0, 0xf0f0, 0xaaaa, 0x0ff0, 0x5555);
  assert.deepEqual([...dst], [0xff00, 0xffff]);

  assert.equal(zero2x32(0, 0), true);
  assert.equal(zero2x32(0, 1), false);
  assert.equal(equal2x32(1, 2, 1, 2), true);
  assert.equal(equal2x32(1, 2, 1, 3), false);
});


import {
  fillLandingCells32,
  landingCell32,
  maskContains32,
  maskContains2x32,
  residualTransition32,
  powerOfTwoIndex32,
  ttProbeIndex32,
  ttReplace32,
  selectGreater32,
  selectLess32,
} from '../src/indexed32.mjs';

test('indexed and table blocks', () => {
  const landingCells = new Uint32Array(7);
  assert.equal(fillLandingCells32(landingCells, 7), 7);
  landingCells[1] = 22;
  landingCells[2] = 44;
  assert.equal(landingCell32(landingCells, 1), 22);
  assert.equal(landingCell32(landingCells, 0), 0);
  assert.equal(maskContains32(0b1111, 0b0101), true);
  assert.equal(maskContains32(0b0011, 0b0101), false);
  assert.equal(maskContains32(0x80000000, 0x80000000), true);
  assert.equal(maskContains32(0, 0x80000000), false);
  assert.equal(maskContains2x32(0b1111, 0b1010, 0b0101, 0b0010), true);
  assert.equal(maskContains2x32(0b1111, 0, 0b0101, 0b0010), false);
  assert.equal(maskContains2x32(0x80000000, 0x80000000, 0x80000000, 0x80000000), true);

  const transitions = new Uint32Array([10, 11, 12, 20, 21, 22]);
  assert.equal(residualTransition32(transitions, 1, 2, 3), 22);
  assert.equal(powerOfTwoIndex32(0x1234, 0xff), 0x34);

  const tags = new Uint32Array(8);
  const values = new Uint32Array(8);
  ttReplace32(tags, values, 3, 99, 1234);
  assert.equal(ttProbeIndex32(tags, 7, 3, 99, 0xffffffff), 3);
  assert.equal(ttProbeIndex32(tags, 7, 3, 98, 0xffffffff), 0xffffffff);
  assert.equal(values[3], 1234);
  assert.equal(selectGreater32(4, 9), 9);
  assert.equal(selectLess32(4, 9), 4);
});


import {
  applyMove32,
  undoMove32,
  STATE_PLY,
  sideFromPly32,
  STATE_SUPPORT_LO,
  STATE_SUPPORT_HI,
  STATE_PLAYABLE_LO,
  STATE_PLAYABLE_HI,
  STATE_SUPPORT_CODE,
} from '../src/state32.mjs';
import { mix32, reflectPacked3x32, canonicalMin32 } from '../src/mix32.mjs';
import { normalizeMinimal2x32InPlace, normalizeMaximal2x32InPlace } from '../src/frontier32.mjs';
import {
  negateScore32,
  raiseLowerBound32,
  lowerUpperBound32,
  cutoff32,
  argMaxPlayable32,
} from '../src/search32.mjs';

test('apply and undo support state', () => {
  const state = new Uint32Array(6);
  const landingCells = new Uint32Array(7);
  fillLandingCells32(landingCells, 7);
  for (let column = 0; column < 7; column += 1) state[STATE_PLAYABLE_LO] |= (1 << column) >>> 0;

  const supportDelta = ((1 << 9) + (1 << 21)) >>> 0;
  const cell = applyMove32(state, landingCells, 3, 7, 42, supportDelta);
  assert.equal(cell, 3);
  assert.equal(state[STATE_PLY], 1);
  assert.equal(sideFromPly32(state[STATE_PLY]), 1);
  assert.equal(landingCells[3], 10);
  assert.equal((state[STATE_SUPPORT_LO] & (1 << 3)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 10)) !== 0, true);
  assert.equal(state[STATE_SUPPORT_CODE], ((1 << 9) + (1 << 21)) >>> 0);

  const undone = undoMove32(state, landingCells, 3, 7, 42, supportDelta);
  assert.equal(undone, 3);
  assert.equal(state[STATE_PLY], 0);
  assert.equal(sideFromPly32(state[STATE_PLY]), 0);
  assert.equal(landingCells[3], 3);
  assert.equal(state[STATE_SUPPORT_LO], 0);
  assert.equal(state[STATE_SUPPORT_HI], 0);
  assert.equal(state[STATE_SUPPORT_CODE], 0);
});

test('mix and reflection blocks', () => {
  assert.equal(mix32(0), 0);
  const code = ((2 << 21) | (1 << 0) | (2 << 3) | (3 << 18)) >>> 0;
  const reflected = reflectPacked3x32(code, 7, 21);
  assert.equal((reflected >>> 21), 2);
  assert.equal(reflected & 7, 3);
  assert.equal((reflected >>> 18) & 7, 1);
  const code4 = ((2 << 12) | 1 | (2 << 3) | (3 << 6) | (4 << 9)) >>> 0;
  const reflected4 = reflectPacked3x32(code4, 4, 12);
  assert.equal(reflected4 >>> 12, 2);
  assert.equal(reflected4 & 7, 4);
  assert.equal((reflected4 >>> 9) & 7, 1);
  assert.equal(canonicalMin32(9, 4), 4);
});

test('frontier normalization blocks', () => {
  // minimal precondition: nondecreasing cardinality.
  const lo = new Uint32Array([0b0100, 0b0011, 0b0111]);
  const hi = new Uint32Array(3);
  const minimal = normalizeMinimal2x32InPlace(lo, hi, 3);
  assert.equal(minimal, 2);
  assert.equal((lo[0] === 0b0011 && lo[1] === 0b0100) || (lo[0] === 0b0100 && lo[1] === 0b0011), true);

  // maximal precondition: nonincreasing cardinality.
  const lo2 = new Uint32Array([0b0111, 0b0011, 0b0100]);
  const hi2 = new Uint32Array(3);
  const maximal = normalizeMaximal2x32InPlace(lo2, hi2, 3);
  assert.equal(maximal, 1);
  assert.equal(lo2[0], 0b0111);
});

test('search scalar blocks', () => {
  assert.equal(negateScore32(1), -1);
  assert.equal(raiseLowerBound32(-1, 1), 1);
  assert.equal(lowerUpperBound32(1, -1), -1);
  assert.equal(cutoff32(1, 1), true);
  const scores = new Int32Array([0, 1, 2, 8, 4, 3, 2]);
  const heights = new Uint8Array(7);
  heights[3] = 6;
  const order = new Uint8Array([3, 2, 4, 1, 5, 0, 6]);
  assert.equal(argMaxPlayable32(scores, heights, order, 7, 6, 0xffffffff), 4);
});


import {
  shl2x32Into,
  ushr2x32Into,
  add2x32Into,
  sub2x32Into,
  firstSetBitIndex2x32,
  clearLowestSetBit32,
  cardinalityClass2x32,
  popcount2x32,
} from '../src/word64x32.mjs';
import {
  playableColumn32,
  fillCoordinateTables32,
  decodeColumn32,
  decodeRow32,
} from '../src/indexed32.mjs';
import {
  allocateTypedCapacity,
  isPowerOfTwo32,
  nextPowerOfTwo32,
  rehashOverwrite32,
} from '../src/capacity32.mjs';
import {
  atomicTryClaim32,
  atomicRelease32,
  atomicExchange32,
  atomicAdd32,
  atomicSub32,
} from '../src/atomic32.mjs';
import { queueEnqueue32, queueDequeue32 } from '../src/queue32.mjs';

test('two-lane shifts and arithmetic', () => {
  const dst = new Uint32Array(2);

  shl2x32Into(dst, 0, 1, 0, 32);
  assert.deepEqual([...dst], [0, 1]);

  shl2x32Into(dst, 0, 0x80000000, 0, 1);
  assert.deepEqual([...dst], [0, 1]);

  ushr2x32Into(dst, 0, 0, 1, 32);
  assert.deepEqual([...dst], [1, 0]);

  ushr2x32Into(dst, 0, 0, 1, 1);
  assert.deepEqual([...dst], [0x80000000, 0]);

  add2x32Into(dst, 0, 0xffffffff, 1, 1, 2);
  assert.deepEqual([...dst], [0, 4]);

  sub2x32Into(dst, 0, 0, 4, 1, 2);
  assert.deepEqual([...dst], [0xffffffff, 1]);
});

test('two-lane set iteration and cardinality', () => {
  assert.equal(firstSetBitIndex2x32(0, 0), -1);
  assert.equal(firstSetBitIndex2x32(0, 1), 32);
  assert.equal(firstSetBitIndex2x32(8, 1), 3);
  assert.equal(clearLowestSetBit32(0b10100), 0b10000);
  assert.equal(cardinalityClass2x32(0, 0), 0);
  assert.equal(cardinalityClass2x32(8, 0), 1);
  assert.equal(cardinalityClass2x32(8, 1), 2);
  assert.equal(cardinalityClass2x32(0b1010, 0), 2);
  assert.equal(popcount2x32(0xffffffff, 0x3ff), 42);
});

test('trusted legality and coordinate reference decode', () => {
  const landing = new Uint32Array([0, 43, 16]);
  assert.equal(playableColumn32(landing, 0, 42), true);
  assert.equal(playableColumn32(landing, 1, 42), false);
  const rowByCell = new Uint32Array(42);
  const columnByCell = new Uint32Array(42);
  assert.equal(fillCoordinateTables32(rowByCell, columnByCell, 7, 6), 42);
  assert.equal(decodeColumn32(columnByCell, 23), 2);
  assert.equal(decodeRow32(rowByCell, 23), 3);

  const row4 = new Uint32Array(16);
  const column4 = new Uint32Array(16);
  assert.equal(fillCoordinateTables32(row4, column4, 4, 4), 16);
  assert.equal(decodeColumn32(column4, 14), 2);
  assert.equal(decodeRow32(row4, 14), 3);
});

test('capacity helpers and overwrite rehash', () => {
  assert.equal(isPowerOfTwo32(1), true);
  assert.equal(isPowerOfTwo32(8), true);
  assert.equal(isPowerOfTwo32(10), false);
  assert.equal(nextPowerOfTwo32(0), 1);
  assert.equal(nextPowerOfTwo32(1), 1);
  assert.equal(nextPowerOfTwo32(2), 2);
  assert.equal(nextPowerOfTwo32(3), 4);
  assert.equal(nextPowerOfTwo32(9), 16);
  assert.equal(nextPowerOfTwo32(0x80000000), 0x80000000);

  const oldHashes = new Uint32Array([1, 5, 0xffffffff, 9]);
  const oldValues = new Uint32Array([10, 50, 0, 90]);
  const newHashes = new Uint32Array(8);
  newHashes.fill(0xffffffff);
  const newValues = new Uint32Array(8);
  assert.equal(rehashOverwrite32(oldHashes, oldValues, 4, newHashes, newValues, 7, 0xffffffff), 8);
  assert.equal(newHashes[1], 9);
  assert.equal(newValues[1], 90);
  assert.equal(newHashes[5], 5);
  assert.equal(newValues[5], 50);
});

test('atomic blocks', () => {
  const words = new Int32Array(new SharedArrayBuffer(16));
  assert.equal(atomicTryClaim32(words, 0, 0, 7), true);
  assert.equal(atomicTryClaim32(words, 0, 0, 8), false);
  assert.equal(atomicExchange32(words, 1, 5), 0);
  assert.equal(atomicAdd32(words, 1, 3), 5);
  assert.equal(atomicSub32(words, 1, 2), 8);
  assert.equal(atomicRelease32(words, 0, 0), 0);
});

test('bounded shared queue blocks without waiting', () => {
  const enqueue = new Int32Array(new SharedArrayBuffer(4));
  const dequeue = new Int32Array(new SharedArrayBuffer(4));
  const sequence = new Int32Array(new SharedArrayBuffer(4 * 4));
  const values = new Int32Array(new SharedArrayBuffer(4 * 4));
  for (let i = 0; i < 4; i += 1) sequence[i] = i;
  assert.equal(queueEnqueue32(enqueue, sequence, values, 3, 4, 77), 0);
  assert.equal(queueDequeue32(dequeue, sequence, values, 3, 4), 77);
  assert.equal(sequence[0], 4);
});


test('typed capacity allocation', () => {
  const storage = allocateTypedCapacity(8);
  assert.equal(storage instanceof Uint32Array, true);
  assert.equal(storage.length, 8);
  assert.deepEqual([...storage], [0, 0, 0, 0, 0, 0, 0, 0]);
});


test('high-lane apply and undo derives masks without lookup tables', () => {
  const state = new Uint32Array(6);
  const landingCells = new Uint32Array(7);
  fillLandingCells32(landingCells, 7);
  landingCells[5] = 33;
  state[STATE_PLAYABLE_HI] = 1 << 1;

  const supportDelta = ((1 << 15) + (1 << 21)) >>> 0;
  const cell = applyMove32(state, landingCells, 5, 7, 42, supportDelta);
  assert.equal(cell, 33);
  assert.equal((state[STATE_SUPPORT_HI] & (1 << 1)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 8)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 1)) !== 0, false);

  const undone = undoMove32(state, landingCells, 5, 7, 42, supportDelta);
  assert.equal(undone, 33);
  assert.equal(landingCells[5], 33);
  assert.equal((state[STATE_SUPPORT_HI] & (1 << 1)) !== 0, false);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 1)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 8)) !== 0, false);
});


test('runtime-configured 4x4 transition', () => {
  const state = new Uint32Array(6);
  const landingCells = new Uint32Array(4);
  fillLandingCells32(landingCells, 4);
  state[STATE_PLAYABLE_LO] = 0b1111;
  const column = 2;
  const supportDelta = ((1 << 6) + (1 << 12)) >>> 0;

  const cell = applyMove32(state, landingCells, column, 4, 16, supportDelta);
  assert.equal(cell, 2);
  assert.equal(landingCells[column], 6);
  assert.equal(sideFromPly32(state[STATE_PLY]), 1);
  assert.equal((state[STATE_SUPPORT_LO] & (1 << 2)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 6)) !== 0, true);
  assert.equal(state[STATE_SUPPORT_CODE], supportDelta);

  const undone = undoMove32(state, landingCells, column, 4, 16, supportDelta);
  assert.equal(undone, 2);
  assert.equal(landingCells[column], 2);
  assert.equal(sideFromPly32(state[STATE_PLY]), 0);
  assert.equal(state[STATE_SUPPORT_LO], 0);
  assert.equal(state[STATE_SUPPORT_CODE], 0);
});
