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
  assert.equal(firstSetBitIndex32(0), 32);
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
  const a = new Uint32Array([0xf0f0, 0xaaaa]);
  const b = new Uint32Array([0x0ff0, 0x5555]);
  const dst = new Uint32Array(2);

  and2x32Into(dst, 0, a, 0, b, 0);
  assert.deepEqual([...dst], [0x00f0, 0x0000]);

  or2x32Into(dst, 0, a, 0, b, 0);
  assert.deepEqual([...dst], [0xfff0, 0xffff]);

  xor2x32Into(dst, 0, a, 0, b, 0);
  assert.deepEqual([...dst], [0xff00, 0xffff]);

  assert.equal(zero2x32(0, 0), true);
  assert.equal(zero2x32(0, 1), false);
  assert.equal(equal2x32(1, 2, 1, 2), true);
  assert.equal(equal2x32(1, 2, 1, 3), false);
});


import {
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
  const heights = new Uint8Array([0, 3, 6]);
  assert.equal(landingCell32(heights, 1, 7, 6, 0xffffffff), 22);
  assert.equal(landingCell32(heights, 2, 7, 6, 0xffffffff), 0xffffffff);
  assert.equal(maskContains32(0b1111, 0b0101), true);
  assert.equal(maskContains32(0b0011, 0b0101), false);
  assert.equal(maskContains2x32(0b1111, 0b1010, 0b0101, 0b0010), true);
  assert.equal(maskContains2x32(0b1111, 0, 0b0101, 0b0010), false);

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
  STATE_SIDE,
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
  const state = new Uint32Array(7);
  const heights = new Uint8Array(7);
  const moveColumns = new Uint8Array(42);
  const cellLo = new Uint32Array(42);
  const cellHi = new Uint32Array(42);
  for (let cell = 0; cell < 32; cell += 1) cellLo[cell] = (1 << cell) >>> 0;
  for (let cell = 32; cell < 42; cell += 1) cellHi[cell] = (1 << (cell - 32)) >>> 0;
  for (let column = 0; column < 7; column += 1) state[STATE_PLAYABLE_LO] |= (1 << column) >>> 0;

  const cell = applyMove32(state, heights, moveColumns, cellLo, cellHi, 3, 7, 6, 21);
  assert.equal(cell, 3);
  assert.equal(state[STATE_PLY], 1);
  assert.equal(state[STATE_SIDE], 1);
  assert.equal(heights[3], 1);
  assert.equal((state[STATE_SUPPORT_LO] & (1 << 3)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 10)) !== 0, true);
  assert.equal(state[STATE_SUPPORT_CODE], ((1 << 9) + (1 << 21)) >>> 0);

  const undone = undoMove32(state, heights, moveColumns, cellLo, cellHi, 7, 6, 21);
  assert.equal(undone, 3);
  assert.equal(state[STATE_PLY], 0);
  assert.equal(state[STATE_SIDE], 0);
  assert.equal(heights[3], 0);
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
  assert.equal(canonicalMin32(9, 4), 4);
});

test('frontier normalization blocks', () => {
  const lo = new Uint32Array([0b0011, 0b0111, 0b0100]);
  const hi = new Uint32Array(3);
  const minimal = normalizeMinimal2x32InPlace(lo, hi, 3);
  assert.equal(minimal, 2);
  assert.equal((lo[0] === 0b0011 && lo[1] === 0b0100) || (lo[0] === 0b0100 && lo[1] === 0b0011), true);

  const lo2 = new Uint32Array([0b0011, 0b0111, 0b0100]);
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
