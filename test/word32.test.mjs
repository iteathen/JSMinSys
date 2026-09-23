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
