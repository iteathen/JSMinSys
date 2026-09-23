import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bitTest32,
  bitSet32,
  bitClear32,
  bitToggle32,
  bitSetI32,
  bitClearI32,
  bitToggleI32,
  firstSetBitIndex32,
  popcount32,
  popcount32Sparse,
  subset32,
  cardinalityClass32,
  isolatedBitIndex32,
  isolatedHighBitIndex32,
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

test('signed bit-pattern profile', () => {
  const high = 1 << 31;
  assert.equal(bitSetI32(0, high), high);
  assert.equal(bitClearI32(high, high), 0);
  assert.equal(bitToggleI32(0, high), high);
  assert.equal(maskContainsI32(high, high), true);
  assert.equal(maskContainsI32(0, high), false);
  assert.equal(maskContains2xI32(high, high, high, high), true);
  assert.equal(clearLowestSetBitI32(high | 1), high);
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
  assert.equal(equal2x32(0x80000000, 2, 0x80000000, 2), true);
});


import {
  fillLandingCells32,
  landingCell32,
  maskContainsI32,
  maskContains2xI32,
  maskContains32,
  maskContains2x32,
  residualBase32,
  residualTransition32,
  fillResidualActionMajor32,
  residualActionBase32,
  residualTransitionActionMajor32,
  powerOfTwoIndex32,
  ttHit32,
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
  const transitionBase = residualBase32(1, 3);
  assert.equal(transitionBase, 3);
  assert.equal(residualTransition32(transitions, transitionBase, 2), 22);

  const actionMajor = new Uint32Array(6);
  fillResidualActionMajor32(actionMajor, transitions, 2, 3);
  assert.deepEqual(actionMajor, new Uint32Array([10, 20, 11, 21, 12, 22]));
  const actionBase = residualActionBase32(2, 2);
  assert.equal(actionBase, 4);
  assert.equal(residualTransitionActionMajor32(actionMajor, actionBase, 1), 22);

  assert.equal(powerOfTwoIndex32(0x1234, 0xff), 0x34);

  const tags = new Uint32Array(8);
  const values = new Uint32Array(8);
  ttReplace32(tags, values, 3, 99, 1234);
  const ttIndex = powerOfTwoIndex32(3, 7);
  assert.equal(ttHit32(tags, ttIndex, 99), true);
  assert.equal(ttHit32(tags, ttIndex, 98), false);
  assert.equal(values[3], 1234);
  assert.equal(selectGreater32(4, 9), 9);
  assert.equal(selectLess32(4, 9), 4);
});


import {
  applyMove1x32,
  undoMove1x32,
  applyMove32,
  undoMove32,
  applyMove1x32CallerPly,
  undoMove1x32CallerPly,
  applyMove32CallerPly,
  undoMove32CallerPly,
  applyMove1x32KnownCell,
  applyMove1x32CallerPlyKnownCell,
  applyMove32KnownCell,
  applyMove32CallerPlyKnownCell,
  undoMove1x32KnownCell,
  undoMove1x32CallerPlyKnownCell,
  undoMove32KnownCell,
  undoMove32CallerPlyKnownCell,
  CALLER_PLY1_PLAYABLE_LO,
  CALLER_PLY1_SUPPORT_CODE,
  CALLER_PLY2_PLAYABLE_LO,
  CALLER_PLY2_PLAYABLE_HI,
  CALLER_PLY2_SUPPORT_CODE,
  PACKED_PLY1_PLAYABLE_LO,
  PACKED_PLY1_SUPPORT_PLY,
  PACKED_PLY2_PLAYABLE_LO,
  PACKED_PLY2_PLAYABLE_HI,
  PACKED_PLY2_SUPPORT_PLY,
  plyFromPackedSupport32,
  supportFromPackedSupport32,
  sideFromPackedSupport32,
  plyFromPackedRankLow32,
  supportFromPackedRankLow32,
  sideFromPackedRankLow32,
  applyMove1x32PackedPly,
  undoMove1x32PackedPly,
  applyMove32PackedPly,
  undoMove32PackedPly,
  applyMove1x32PackedPlyKnownCell,
  undoMove1x32PackedPlyKnownCell,
  applyMove32PackedPlyKnownCell,
  undoMove32PackedPlyKnownCell,
  STATE_PLY,
  sideFromPly32,
  STATE_PLAYABLE_LO,
  STATE_PLAYABLE_HI,
  STATE_SUPPORT_CODE,
} from '../src/state32.mjs';
import { mix32, mix32Medium, mix32Strong, fillReflect3Tables32, reflectPacked3x16, reflectPacked3x24, reflectPacked3x32, reflectPacked3Direct32, canonicalMin32 } from '../src/mix32.mjs';
import {
  reflectPacked3Columns2,
  reflectPacked3Columns3,
  reflectPacked3Columns4,
  reflectPacked3Columns5,
  reflectPacked3Columns6To7,
  reflectPacked3Columns8,
  reflectPacked3Columns9,
  reflectPacked3Columns10,
} from '../src/mix32.mjs';
import {
  normalizeMinimal2x32InPlace,
  normalizeMaximal2x32InPlace,
  normalizeMinimal2xI32InPlace,
  normalizeMaximal2xI32InPlace,
  normalizeMinimalI32InPlace,
  normalizeMaximalI32InPlace,
  normalizeMinimalI32LazyInPlace,
  normalizeMaximalI32LazyInPlace,
  normalizeMinimal2xI32LazyInPlace,
  normalizeMaximal2xI32LazyInPlace,
} from '../src/frontier32.mjs';
import {
  negateScore32,
  raiseLowerBound32,
  lowerUpperBound32,
  cutoff32,
  maxValueCutsOff32,
  minValueCutsOff32,
  argMaxPlayable32,
  argMaxPlayableSlot32,
  argMaxPlayableSlot7Nonempty32,
  argMaxPlayableSlot7ScalarsNonempty32,
  physicalColumnFromMoveSlot32,
} from '../src/search32.mjs';

test('apply and undo support state', () => {
  const state = new Uint32Array(4);
  const landingCells = new Uint32Array(7);
  fillLandingCells32(landingCells, 7);
  for (let column = 0; column < 7; column += 1) state[STATE_PLAYABLE_LO] |= (1 << column) >>> 0;

  const supportDelta = 1 << 9;
  const cell = applyMove32(state, landingCells, 3, 7, 42, supportDelta);
  assert.equal(cell, 3);
  assert.equal(state[STATE_PLY], 1);
  assert.equal(sideFromPly32(state[STATE_PLY]), 1);
  assert.equal(landingCells[3], 10);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 10)) !== 0, true);
  assert.equal(state[STATE_SUPPORT_CODE], 1 << 9);

  const undone = undoMove32(state, landingCells, 3, 7, 42, supportDelta);
  assert.equal(undone, 3);
  assert.equal(state[STATE_PLY], 0);
  assert.equal(sideFromPly32(state[STATE_PLY]), 0);
  assert.equal(landingCells[3], 3);
  assert.equal(state[STATE_SUPPORT_CODE], 0);
});

test('caller-owned ply transition profiles match state-owned transition mechanics', () => {
  // <=32-cell profile.
  const base1 = new Uint32Array(4);
  const caller1 = new Uint32Array(2);
  const landingBase1 = new Uint32Array(4);
  const landingCaller1 = new Uint32Array(4);
  fillLandingCells32(landingBase1, 4);
  fillLandingCells32(landingCaller1, 4);
  for (let column = 0; column < 4; column += 1) {
    base1[STATE_PLAYABLE_LO] |= (1 << column) >>> 0;
    caller1[CALLER_PLY1_PLAYABLE_LO] |= (1 << column) >>> 0;
  }

  const delta1 = 1 << 6;
  assert.equal(
    applyMove1x32CallerPly(caller1, landingCaller1, 2, 4, 16, delta1),
    applyMove1x32(base1, landingBase1, 2, 4, 16, delta1),
  );
  assert.equal(caller1[CALLER_PLY1_PLAYABLE_LO], base1[STATE_PLAYABLE_LO]);
  assert.equal(caller1[CALLER_PLY1_SUPPORT_CODE], base1[STATE_SUPPORT_CODE]);
  assert.deepEqual(landingCaller1, landingBase1);
  assert.equal(
    undoMove1x32CallerPly(caller1, landingCaller1, 2, 4, 16, delta1),
    undoMove1x32(base1, landingBase1, 2, 4, 16, delta1),
  );
  assert.equal(caller1[CALLER_PLY1_PLAYABLE_LO], base1[STATE_PLAYABLE_LO]);
  assert.equal(caller1[CALLER_PLY1_SUPPORT_CODE], base1[STATE_SUPPORT_CODE]);
  assert.deepEqual(landingCaller1, landingBase1);

  // Two-lane profile. 7x6 is only a test geometry; the primitive remains
  // runtime-configured. Repeated column 3 moves exercise the 31->38 lane edge.
  const base2 = new Uint32Array(4);
  const caller2 = new Uint32Array(3);
  const landingBase2 = new Uint32Array(7);
  const landingCaller2 = new Uint32Array(7);
  fillLandingCells32(landingBase2, 7);
  fillLandingCells32(landingCaller2, 7);
  for (let column = 0; column < 7; column += 1) {
    base2[STATE_PLAYABLE_LO] |= (1 << column) >>> 0;
    caller2[CALLER_PLY2_PLAYABLE_LO] |= (1 << column) >>> 0;
  }

  const delta2 = 1 << 9;
  for (let move = 0; move < 5; move += 1) {
    assert.equal(
      applyMove32CallerPly(caller2, landingCaller2, 3, 7, 42, delta2),
      applyMove32(base2, landingBase2, 3, 7, 42, delta2),
    );
    assert.equal(caller2[CALLER_PLY2_PLAYABLE_LO], base2[STATE_PLAYABLE_LO]);
    assert.equal(caller2[CALLER_PLY2_PLAYABLE_HI], base2[STATE_PLAYABLE_HI]);
    assert.equal(caller2[CALLER_PLY2_SUPPORT_CODE], base2[STATE_SUPPORT_CODE]);
    assert.deepEqual(landingCaller2, landingBase2);
  }

  for (let move = 0; move < 5; move += 1) {
    assert.equal(
      undoMove32CallerPly(caller2, landingCaller2, 3, 7, 42, delta2),
      undoMove32(base2, landingBase2, 3, 7, 42, delta2),
    );
    assert.equal(caller2[CALLER_PLY2_PLAYABLE_LO], base2[STATE_PLAYABLE_LO]);
    assert.equal(caller2[CALLER_PLY2_PLAYABLE_HI], base2[STATE_PLAYABLE_HI]);
    assert.equal(caller2[CALLER_PLY2_SUPPORT_CODE], base2[STATE_SUPPORT_CODE]);
    assert.deepEqual(landingCaller2, landingBase2);
  }
});

test('known-cell apply profiles reuse an already observed landing cell', () => {
  const landingA = new Uint32Array(4);
  const landingB = new Uint32Array(4);
  fillLandingCells32(landingA, 4);
  fillLandingCells32(landingB, 4);
  const stateA = new Uint32Array(4);
  const stateB = new Uint32Array(4);
  stateA[STATE_PLAYABLE_LO] = 0b1111;
  stateB[STATE_PLAYABLE_LO] = 0b1111;
  const delta1 = 1 << 6;
  const cell1 = landingB[2];
  assert.equal(applyMove1x32(stateA, landingA, 2, 4, 16, delta1), cell1);
  assert.equal(applyMove1x32KnownCell(stateB, landingB, 2, cell1, 4, 16, delta1), cell1);
  assert.deepEqual(stateB, stateA);
  assert.deepEqual(landingB, landingA);

  const compactA = new Uint32Array(2);
  const compactB = new Uint32Array(2);
  const compactLandingA = new Uint32Array(4);
  const compactLandingB = new Uint32Array(4);
  fillLandingCells32(compactLandingA, 4);
  fillLandingCells32(compactLandingB, 4);
  compactA[CALLER_PLY1_PLAYABLE_LO] = 0b1111;
  compactB[CALLER_PLY1_PLAYABLE_LO] = 0b1111;
  const compactCell = compactLandingB[1];
  applyMove1x32CallerPly(compactA, compactLandingA, 1, 4, 16, 1 << 3);
  applyMove1x32CallerPlyKnownCell(compactB, compactLandingB, 1, compactCell, 4, 16, 1 << 3);
  assert.deepEqual(compactB, compactA);
  assert.deepEqual(compactLandingB, compactLandingA);

  // Low-lane cell 31 with the next landing in the high lane exercises the
  // cross-lane branch while still supplying the landing cell from the caller.
  const twoA = new Uint32Array(4);
  const twoB = new Uint32Array(4);
  const twoLandingA = new Uint32Array(7);
  const twoLandingB = new Uint32Array(7);
  twoLandingA[3] = 31;
  twoLandingB[3] = 31;
  twoA[STATE_PLAYABLE_LO] = 0x80000000;
  twoB[STATE_PLAYABLE_LO] = 0x80000000;
  const delta2 = 1 << 9;
  applyMove32(twoA, twoLandingA, 3, 7, 42, delta2);
  applyMove32KnownCell(twoB, twoLandingB, 3, 31, 7, 42, delta2);
  assert.deepEqual(twoB, twoA);
  assert.deepEqual(twoLandingB, twoLandingA);

  const compactTwoA = new Uint32Array(3);
  const compactTwoB = new Uint32Array(3);
  const compactTwoLandingA = new Uint32Array(7);
  const compactTwoLandingB = new Uint32Array(7);
  compactTwoLandingA[3] = 31;
  compactTwoLandingB[3] = 31;
  compactTwoA[CALLER_PLY2_PLAYABLE_LO] = 0x80000000;
  compactTwoB[CALLER_PLY2_PLAYABLE_LO] = 0x80000000;
  applyMove32CallerPly(compactTwoA, compactTwoLandingA, 3, 7, 42, delta2);
  applyMove32CallerPlyKnownCell(compactTwoB, compactTwoLandingB, 3, 31, 7, 42, delta2);
  assert.deepEqual(compactTwoB, compactTwoA);
  assert.deepEqual(compactTwoLandingB, compactTwoLandingA);
});

test('known-cell undo profiles reuse the cell returned by apply', () => {
  // One-lane, state-owned ply.
  const oneBase = new Uint32Array(4);
  const oneFast = new Uint32Array(4);
  const landingBase = new Uint32Array(4);
  const landingFast = new Uint32Array(4);
  fillLandingCells32(landingBase, 4);
  fillLandingCells32(landingFast, 4);
  oneBase[STATE_PLAYABLE_LO] = 0b1111;
  oneFast[STATE_PLAYABLE_LO] = 0b1111;
  const delta1 = 1 << 6;

  const baseCell = applyMove1x32(oneBase, landingBase, 2, 4, 16, delta1);
  const fastCell = applyMove1x32KnownCell(oneFast, landingFast, 2, 2, 4, 16, delta1);
  assert.equal(fastCell, baseCell);
  undoMove1x32(oneBase, landingBase, 2, 4, 16, delta1);
  undoMove1x32KnownCell(oneFast, landingFast, 2, fastCell, 4, 12, delta1);
  assert.deepEqual(oneFast, oneBase);
  assert.deepEqual(landingFast, landingBase);

  // One-lane, caller-owned ply.
  const compactBase = new Uint32Array(2);
  const compactFast = new Uint32Array(2);
  const compactLandingBase = new Uint32Array(4);
  const compactLandingFast = new Uint32Array(4);
  fillLandingCells32(compactLandingBase, 4);
  fillLandingCells32(compactLandingFast, 4);
  compactBase[CALLER_PLY1_PLAYABLE_LO] = 0b1111;
  compactFast[CALLER_PLY1_PLAYABLE_LO] = 0b1111;

  const compactBaseCell = applyMove1x32CallerPly(compactBase, compactLandingBase, 1, 4, 16, delta1);
  const compactFastCell = applyMove1x32CallerPlyKnownCell(compactFast, compactLandingFast, 1, 1, 4, 16, delta1);
  assert.equal(compactFastCell, compactBaseCell);
  undoMove1x32CallerPly(compactBase, compactLandingBase, 1, 4, 16, delta1);
  undoMove1x32CallerPlyKnownCell(compactFast, compactLandingFast, 1, compactFastCell, 4, 12, delta1);
  assert.deepEqual(compactFast, compactBase);
  assert.deepEqual(compactLandingFast, compactLandingBase);

  // Two-lane boundary: cell 31 -> next 38 crosses into the high lane.
  const twoBase = new Uint32Array(4);
  const twoFast = new Uint32Array(4);
  const twoLandingBase = new Uint32Array(7);
  const twoLandingFast = new Uint32Array(7);
  twoLandingBase[3] = 31;
  twoLandingFast[3] = 31;
  twoBase[STATE_PLAYABLE_LO] = 0x80000000;
  twoFast[STATE_PLAYABLE_LO] = 0x80000000;
  const delta2 = 1 << 9;

  const twoBaseCell = applyMove32(twoBase, twoLandingBase, 3, 7, 42, delta2);
  const twoFastCell = applyMove32KnownCell(twoFast, twoLandingFast, 3, 31, 7, 42, delta2);
  assert.equal(twoFastCell, twoBaseCell);
  undoMove32(twoBase, twoLandingBase, 3, 7, 42, delta2);
  undoMove32KnownCell(twoFast, twoLandingFast, 3, twoFastCell, 7, 35, 25, delta2);
  assert.deepEqual(twoFast, twoBase);
  assert.deepEqual(twoLandingFast, twoLandingBase);

  // Two-lane + caller-owned ply.
  const compactTwoBase = new Uint32Array(3);
  const compactTwoFast = new Uint32Array(3);
  const compactTwoLandingBase = new Uint32Array(7);
  const compactTwoLandingFast = new Uint32Array(7);
  compactTwoLandingBase[3] = 31;
  compactTwoLandingFast[3] = 31;
  compactTwoBase[CALLER_PLY2_PLAYABLE_LO] = 0x80000000;
  compactTwoFast[CALLER_PLY2_PLAYABLE_LO] = 0x80000000;

  const compactTwoBaseCell = applyMove32CallerPly(compactTwoBase, compactTwoLandingBase, 3, 7, 42, delta2);
  const compactTwoFastCell = applyMove32CallerPlyKnownCell(compactTwoFast, compactTwoLandingFast, 3, 31, 7, 42, delta2);
  assert.equal(compactTwoFastCell, compactTwoBaseCell);
  undoMove32CallerPly(compactTwoBase, compactTwoLandingBase, 3, 7, 42, delta2);
  undoMove32CallerPlyKnownCell(compactTwoFast, compactTwoLandingFast, 3, compactTwoFastCell, 7, 35, 25, delta2);
  assert.deepEqual(compactTwoFast, compactTwoBase);
  assert.deepEqual(compactTwoLandingFast, compactTwoLandingBase);
});

test('known-cell undo prepared top-row boundary', () => {
  const state = new Uint32Array(4);
  const landing = new Uint32Array(4);
  state[STATE_PLAYABLE_LO] = 1 << 14;
  state[STATE_PLY] = 1;
  state[STATE_SUPPORT_CODE] = 1 << 6;
  landing[2] = 18;

  assert.equal(
    undoMove1x32KnownCell(state, landing, 2, 14, 4, 12, 1 << 6),
    14,
  );
  assert.equal(landing[2], 14);
  assert.equal(state[STATE_PLAYABLE_LO], 0);
  assert.equal(state[STATE_PLY], 0);
});

test('general packed support+ply transitions match separate state', () => {
  const ordinary1 = new Uint32Array(4);
  const packed1 = new Uint32Array(2);
  const landingOrdinary1 = new Uint32Array(4);
  const landingPacked1 = new Uint32Array(4);
  fillLandingCells32(landingOrdinary1, 4);
  fillLandingCells32(landingPacked1, 4);
  ordinary1[STATE_PLAYABLE_LO] = 0b1111;
  packed1[PACKED_PLY1_PLAYABLE_LO] = 0b1111;

  const rankShift1 = 12;
  const supportMask1 = (1 << rankShift1) - 1;
  const supportDelta1 = 1 << 3;
  const combinedDelta1 = supportDelta1 + (1 << rankShift1);

  const ordinaryCell1 = applyMove1x32(
    ordinary1, landingOrdinary1, 1, 4, 16, supportDelta1,
  );
  const packedCell1 = applyMove1x32PackedPly(
    packed1, landingPacked1, 1, 4, 16, combinedDelta1,
  );
  assert.equal(packedCell1, ordinaryCell1);
  assert.equal(packed1[PACKED_PLY1_PLAYABLE_LO], ordinary1[STATE_PLAYABLE_LO]);
  assert.equal(
    supportFromPackedSupport32(packed1[PACKED_PLY1_SUPPORT_PLY], supportMask1),
    ordinary1[STATE_SUPPORT_CODE],
  );
  assert.equal(
    plyFromPackedSupport32(packed1[PACKED_PLY1_SUPPORT_PLY], rankShift1),
    ordinary1[STATE_PLY],
  );
  assert.deepEqual(landingPacked1, landingOrdinary1);

  assert.equal(
    undoMove1x32PackedPly(packed1, landingPacked1, 1, 4, 16, combinedDelta1),
    undoMove1x32(ordinary1, landingOrdinary1, 1, 4, 16, supportDelta1),
  );
  assert.equal(packed1[PACKED_PLY1_PLAYABLE_LO], ordinary1[STATE_PLAYABLE_LO]);
  assert.equal(packed1[PACKED_PLY1_SUPPORT_PLY], 0);
  assert.deepEqual(landingPacked1, landingOrdinary1);

  const ordinary2 = new Uint32Array(4);
  const packed2 = new Uint32Array(3);
  const landingOrdinary2 = new Uint32Array(7);
  const landingPacked2 = new Uint32Array(7);
  landingOrdinary2[3] = 31;
  landingPacked2[3] = 31;
  ordinary2[STATE_PLAYABLE_LO] = 0x80000000;
  packed2[PACKED_PLY2_PLAYABLE_LO] = 0x80000000;

  const rankShift2 = 21;
  const supportMask2 = (1 << rankShift2) - 1;
  const supportDelta2 = 1 << 9;
  const combinedDelta2 = supportDelta2 + (1 << rankShift2);

  const ordinaryCell2 = applyMove32(
    ordinary2, landingOrdinary2, 3, 7, 42, supportDelta2,
  );
  const packedCell2 = applyMove32PackedPly(
    packed2, landingPacked2, 3, 7, 42, combinedDelta2,
  );
  assert.equal(packedCell2, ordinaryCell2);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_LO], ordinary2[STATE_PLAYABLE_LO]);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_HI], ordinary2[STATE_PLAYABLE_HI]);
  assert.equal(
    supportFromPackedSupport32(packed2[PACKED_PLY2_SUPPORT_PLY], supportMask2),
    ordinary2[STATE_SUPPORT_CODE],
  );
  assert.equal(
    plyFromPackedSupport32(packed2[PACKED_PLY2_SUPPORT_PLY], rankShift2),
    ordinary2[STATE_PLY],
  );
  assert.deepEqual(landingPacked2, landingOrdinary2);

  assert.equal(
    undoMove32PackedPly(packed2, landingPacked2, 3, 7, 42, combinedDelta2),
    undoMove32(ordinary2, landingOrdinary2, 3, 7, 42, supportDelta2),
  );
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_LO], ordinary2[STATE_PLAYABLE_LO]);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_HI], ordinary2[STATE_PLAYABLE_HI]);
  assert.equal(packed2[PACKED_PLY2_SUPPORT_PLY], 0);
  assert.deepEqual(landingPacked2, landingOrdinary2);
});

test('packed support+ply transition profile preserves support-only reflection boundary', () => {
  // Runtime-configured one-lane 4x4: support uses 12 bits, ply begins at bit 12.
  const ordinary1 = new Uint32Array(4);
  const packed1 = new Uint32Array(2);
  const landingOrdinary1 = new Uint32Array(4);
  const landingPacked1 = new Uint32Array(4);
  fillLandingCells32(landingOrdinary1, 4);
  fillLandingCells32(landingPacked1, 4);
  ordinary1[STATE_PLAYABLE_LO] = 0b1111;
  packed1[PACKED_PLY1_PLAYABLE_LO] = 0b1111;

  const rankShift1 = 12;
  const supportMask1 = (1 << rankShift1) - 1;
  const supportDelta1 = 1 << 6;
  const combinedDelta1 = supportDelta1 + (1 << rankShift1);

  applyMove1x32KnownCell(ordinary1, landingOrdinary1, 2, 2, 4, 16, supportDelta1);
  applyMove1x32PackedPlyKnownCell(packed1, landingPacked1, 2, 2, 4, 16, combinedDelta1);
  assert.equal(packed1[PACKED_PLY1_PLAYABLE_LO], ordinary1[STATE_PLAYABLE_LO]);
  assert.deepEqual(landingPacked1, landingOrdinary1);
  assert.equal(
    supportFromPackedSupport32(packed1[PACKED_PLY1_SUPPORT_PLY], supportMask1),
    ordinary1[STATE_SUPPORT_CODE],
  );
  assert.equal(plyFromPackedSupport32(packed1[PACKED_PLY1_SUPPORT_PLY], rankShift1), ordinary1[STATE_PLY]);
  assert.equal(sideFromPackedSupport32(packed1[PACKED_PLY1_SUPPORT_PLY], rankShift1), 1);

  undoMove1x32KnownCell(ordinary1, landingOrdinary1, 2, 2, 4, 12, supportDelta1);
  undoMove1x32PackedPlyKnownCell(packed1, landingPacked1, 2, 2, 4, 12, combinedDelta1);
  assert.equal(packed1[PACKED_PLY1_PLAYABLE_LO], ordinary1[STATE_PLAYABLE_LO]);
  assert.deepEqual(landingPacked1, landingOrdinary1);
  assert.equal(packed1[PACKED_PLY1_SUPPORT_PLY], 0);

  // Runtime-configured two-lane 7x6 test vector crossing cell 31 -> 38.
  const ordinary2 = new Uint32Array(4);
  const packed2 = new Uint32Array(3);
  const landingOrdinary2 = new Uint32Array(7);
  const landingPacked2 = new Uint32Array(7);
  landingOrdinary2[3] = 31;
  landingPacked2[3] = 31;
  ordinary2[STATE_PLAYABLE_LO] = 0x80000000;
  packed2[PACKED_PLY2_PLAYABLE_LO] = 0x80000000;

  const rankShift2 = 21;
  const supportMask2 = (1 << rankShift2) - 1;
  const supportDelta2 = 1 << 9;
  const combinedDelta2 = supportDelta2 + (1 << rankShift2);

  applyMove32KnownCell(ordinary2, landingOrdinary2, 3, 31, 7, 42, supportDelta2);
  applyMove32PackedPlyKnownCell(packed2, landingPacked2, 3, 31, 7, 42, combinedDelta2);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_LO], ordinary2[STATE_PLAYABLE_LO]);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_HI], ordinary2[STATE_PLAYABLE_HI]);
  assert.deepEqual(landingPacked2, landingOrdinary2);
  assert.equal(
    supportFromPackedSupport32(packed2[PACKED_PLY2_SUPPORT_PLY], supportMask2),
    ordinary2[STATE_SUPPORT_CODE],
  );
  assert.equal(plyFromPackedSupport32(packed2[PACKED_PLY2_SUPPORT_PLY], rankShift2), ordinary2[STATE_PLY]);

  undoMove32KnownCell(ordinary2, landingOrdinary2, 3, 31, 7, 35, 25, supportDelta2);
  undoMove32PackedPlyKnownCell(packed2, landingPacked2, 3, 31, 7, 35, 25, combinedDelta2);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_LO], ordinary2[STATE_PLAYABLE_LO]);
  assert.equal(packed2[PACKED_PLY2_PLAYABLE_HI], ordinary2[STATE_PLAYABLE_HI]);
  assert.deepEqual(landingPacked2, landingOrdinary2);
  assert.equal(packed2[PACKED_PLY2_SUPPORT_PLY], 0);
});

test('rank-low packed support+ply layout keeps extraction cheap', () => {
  const ordinary = new Uint32Array(4);
  const packed = new Uint32Array(2);
  const landingOrdinary = new Uint32Array(4);
  const landingPacked = new Uint32Array(4);
  fillLandingCells32(landingOrdinary, 4);
  fillLandingCells32(landingPacked, 4);
  ordinary[STATE_PLAYABLE_LO] = 0b1111;
  packed[PACKED_PLY1_PLAYABLE_LO] = 0b1111;

  const rankBits = 5;
  const rankMask = (1 << rankBits) - 1;
  const supportDelta = 1 << 6;
  const combinedDelta = 1 + (supportDelta << rankBits);

  applyMove1x32KnownCell(
    ordinary, landingOrdinary, 2, 2, 4, 16, supportDelta,
  );
  applyMove1x32PackedPlyKnownCell(
    packed, landingPacked, 2, 2, 4, 16, combinedDelta,
  );

  assert.equal(
    supportFromPackedRankLow32(packed[PACKED_PLY1_SUPPORT_PLY], rankBits),
    ordinary[STATE_SUPPORT_CODE],
  );
  assert.equal(
    plyFromPackedRankLow32(packed[PACKED_PLY1_SUPPORT_PLY], rankMask),
    ordinary[STATE_PLY],
  );
  assert.equal(sideFromPackedRankLow32(packed[PACKED_PLY1_SUPPORT_PLY]), 1);

  undoMove1x32KnownCell(
    ordinary, landingOrdinary, 2, 2, 4, 12, supportDelta,
  );
  undoMove1x32PackedPlyKnownCell(
    packed, landingPacked, 2, 2, 4, 12, combinedDelta,
  );
  assert.equal(packed[PACKED_PLY1_SUPPORT_PLY], 0);
});

test('mix and reflection blocks', () => {
  assert.equal(mix32(0), 0);
  assert.equal(mix32Medium(0), 0);
  assert.equal(mix32Strong(0), 0);
  const mixed = new Set();
  for (let value = 0; value < 4096; value += 1) mixed.add(mix32(value));
  assert.equal(mixed.size, 4096);
  assert.equal(mix32Strong(0), 0);
  assert.notEqual(mix32(0x12345678), mix32Strong(0x12345678));
  assert.equal(
    powerOfTwoIndex32(mix32(0xfedcba98), 0xff),
    (mix32(0xfedcba98) >>> 0) & 0xff,
  );
  const tables7 = new Uint32Array(768);
  assert.equal(fillReflect3Tables32(tables7, 7, 3), 21);
  const code = ((1 << 0) | (2 << 3) | (3 << 18)) >>> 0;
  const reflected = reflectPacked3x24(code, tables7);
  assert.equal(reflected, reflectPacked3Direct32(code, 7, 18));
  assert.equal(reflectPacked3x32(code, tables7), reflected);
  assert.equal(reflected & 7, 3);
  assert.equal((reflected >>> 18) & 7, 1);

  const tables4 = new Uint32Array(512);
  assert.equal(fillReflect3Tables32(tables4, 4, 2), 12);
  const code4 = (1 | (2 << 3) | (3 << 6) | (4 << 9)) >>> 0;
  const reflected4 = reflectPacked3x16(code4, tables4);
  assert.equal(reflected4, reflectPacked3Direct32(code4, 4, 9));
  assert.equal(reflected4 & 7, 4);
  assert.equal((reflected4 >>> 9) & 7, 1);
  assert.equal(canonicalMin32(9, 4), 4);
});


test('configured packed-3 register reflection profiles', () => {
  // A one-column reflection is identity; initialization should select no work.
  assert.equal(reflectPacked3Direct32(5, 1, 0), 5);

  const profiles = [
    [2, reflectPacked3Columns2],
    [3, reflectPacked3Columns3],
    [4, reflectPacked3Columns4],
    [5, reflectPacked3Columns5],
    [6, (code) => reflectPacked3Columns6To7(code, 6, 18)],
    [7, (code) => reflectPacked3Columns6To7(code, 9, 15)],
    [8, reflectPacked3Columns8],
    [9, reflectPacked3Columns9],
    [10, reflectPacked3Columns10],
  ];

  let seed = 0x12345678;
  for (const [columns, reflect] of profiles) {
    const bits = columns * 3;
    const mask = (1 << bits) - 1;
    const samples = columns <= 5 ? (1 << bits) : 4096;

    for (let sample = 0; sample < samples; sample += 1) {
      let code = sample;
      if (columns > 5) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        code = seed & mask;
      }

      assert.equal(
        reflect(code),
        reflectPacked3Direct32(code, columns, 3 * (columns - 1)),
        `columns=${columns} code=${code}`,
      );
    }
  }
});

test('prepared 6/7 packed reflection shifts match direct reflection', () => {
  for (let value = 0; value < (1 << 18); value += 257) {
    assert.equal(
      reflectPacked3Columns6To7(value, 6, 18),
      reflectPacked3Direct32(value, 6, 15),
    );
  }

  let seed = 0x9e3779b9;
  for (let sample = 0; sample < 4096; sample += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = seed & 0x1fffff;
    assert.equal(
      reflectPacked3Columns6To7(value, 9, 15),
      reflectPacked3Direct32(value, 7, 18),
    );
  }
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

test('signed frontier normalization profiles', () => {
  const high = 1 << 31;
  const lo = new Int32Array([high, high | 1, 1]);
  const hi = new Int32Array(3);
  assert.equal(normalizeMinimal2xI32InPlace(lo, hi, 3), 2);

  const lo2 = new Int32Array([high | 1, high, 1]);
  const hi2 = new Int32Array(3);
  assert.equal(normalizeMaximal2xI32InPlace(lo2, hi2, 3), 1);
  assert.equal(lo2[0], high | 1);
});

test('one-lane signed frontier normalization profiles', () => {
  const minimalWords = new Int32Array([0b0100, 0b0011, 0b0111]);
  const minimal = normalizeMinimalI32InPlace(minimalWords, 3);
  assert.equal(minimal, 2);
  assert.equal(
    (minimalWords[0] === 0b0011 && minimalWords[1] === 0b0100)
      || (minimalWords[0] === 0b0100 && minimalWords[1] === 0b0011),
    true,
  );

  const maximalWords = new Int32Array([0b0111, 0b0011, 0b0100]);
  const maximal = normalizeMaximalI32InPlace(maximalWords, 3);
  assert.equal(maximal, 1);
  assert.equal(maximalWords[0], 0b0111);

  const bit31 = new Int32Array([0x80000000, 0x80000001]);
  assert.equal(normalizeMinimalI32InPlace(bit31, 2), 1);
  assert.equal(bit31[0], -2147483648);
});

test('lazy frontier compaction skips accepted-prefix rewrites', () => {
  const minimalBase = new Int32Array([0b0100, 0b0011, 0b0111, 0b1000]);
  const minimalLazy = new Int32Array(minimalBase);
  const minimalExpected = normalizeMinimalI32InPlace(minimalBase, 4);
  const minimalActual = normalizeMinimalI32LazyInPlace(minimalLazy, 4);
  assert.equal(minimalActual, minimalExpected);
  assert.deepEqual(
    [...minimalLazy.slice(0, minimalActual)],
    [...minimalBase.slice(0, minimalExpected)],
  );

  const maximalBase = new Int32Array([0b1111, 0b0111, 0b0011, 0b1000]);
  const maximalLazy = new Int32Array(maximalBase);
  const maximalExpected = normalizeMaximalI32InPlace(maximalBase, 4);
  const maximalActual = normalizeMaximalI32LazyInPlace(maximalLazy, 4);
  assert.equal(maximalActual, maximalExpected);
  assert.deepEqual(
    [...maximalLazy.slice(0, maximalActual)],
    [...maximalBase.slice(0, maximalExpected)],
  );

  const noReject = new Int32Array([1, 2, 4, 8]);
  const noRejectBefore = new Int32Array(noReject);
  assert.equal(normalizeMinimalI32LazyInPlace(noReject, 4), 4);
  assert.deepEqual(noReject, noRejectBefore);

  const loMinBase = new Int32Array([0b0100, 0b0011, 0b0111, 0b1000]);
  const hiMinBase = new Int32Array([0, 1, 1, 2]);
  const loMinLazy = new Int32Array(loMinBase);
  const hiMinLazy = new Int32Array(hiMinBase);
  const min2Expected = normalizeMinimal2xI32InPlace(loMinBase, hiMinBase, 4);
  const min2Actual = normalizeMinimal2xI32LazyInPlace(loMinLazy, hiMinLazy, 4);
  assert.equal(min2Actual, min2Expected);
  assert.deepEqual([...loMinLazy.slice(0, min2Actual)], [...loMinBase.slice(0, min2Expected)]);
  assert.deepEqual([...hiMinLazy.slice(0, min2Actual)], [...hiMinBase.slice(0, min2Expected)]);

  const loMaxBase = new Int32Array([0b1111, 0b0111, 0b0011, 0b1000]);
  const hiMaxBase = new Int32Array([3, 3, 1, 0]);
  const loMaxLazy = new Int32Array(loMaxBase);
  const hiMaxLazy = new Int32Array(hiMaxBase);
  const max2Expected = normalizeMaximal2xI32InPlace(loMaxBase, hiMaxBase, 4);
  const max2Actual = normalizeMaximal2xI32LazyInPlace(loMaxLazy, hiMaxLazy, 4);
  assert.equal(max2Actual, max2Expected);
  assert.deepEqual([...loMaxLazy.slice(0, max2Actual)], [...loMaxBase.slice(0, max2Expected)]);
  assert.deepEqual([...hiMaxLazy.slice(0, max2Actual)], [...hiMaxBase.slice(0, max2Expected)]);
});

test('search scalar blocks', () => {
  assert.equal(negateScore32(1), -1);
  assert.equal(raiseLowerBound32(-1, 1), 1);
  assert.equal(lowerUpperBound32(1, -1), -1);
  assert.equal(cutoff32(1, 1), true);
  assert.equal(maxValueCutsOff32(7, 7), true);
  assert.equal(maxValueCutsOff32(6, 7), false);
  assert.equal(minValueCutsOff32(-3, -3), true);
  assert.equal(minValueCutsOff32(-2, -3), false);
  const order = new Uint8Array([3, 2, 4, 1, 5, 0, 6]);
  const scoresInOrder = new Int32Array([-2147483648, 2, 4, 1, 3, 0, 2]);
  assert.equal(argMaxPlayable32(scoresInOrder, order, 7, 0xffffffff), 4);

  scoresInOrder.fill(-2147483648);
  assert.equal(argMaxPlayable32(scoresInOrder, order, 7, 0xffffffff), 0xffffffff);

  const evenScores = new Int32Array([1, 7, 3, 5, 2, 4]);
  const evenOrder = new Uint8Array([0, 1, 2, 3, 4, 5]);
  assert.equal(argMaxPlayable32(evenScores, evenOrder, 6, 0xffffffff), 1);
});


import {
  shl2x32Lt32Into,
  shl2x32Ge32Into,
  ushr2x32Lt32Into,
  ushr2x32Ge32Into,
  shl2x32Lt32PreparedInto,
  shl2x32Ge32PreparedInto,
  ushr2x32Lt32PreparedInto,
  ushr2x32Ge32PreparedInto,
  shl2x32Into,
  ushr2x32Into,
  add2x32Into,
  sub2x32Into,
  firstSetBitIndex2x32,
  clearLowestSetBitI32,
  clearLowestSetBit32,
  clearIsolatedBitI32,
  clearIsolatedBit32,
  cardinalityClass2x32,
  popcount2x32SparseHigh,
  popcount2x32SparseBits,
  popcount2x32,
  fillPopcount10Table32,
  popcount2x32High10Table,
} from '../src/word64x32.mjs';
import {
  playableColumn32,
  playableKnownCell32,
  fillLandingCellsByOrder32,
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
  atomicReleaseNoNotify32,
  atomicExchange32,
  atomicAdd32,
  atomicSub32,
} from '../src/atomic32.mjs';
import {
  queueEnqueue32,
  queueDequeue32,
  queueTryEnqueue32,
  queueTryDequeue32,
  queueTryEnqueueOwnedPosition32,
  queueTryDequeueOwnedPosition32,
  queueTryEnqueueOwnedNext32,
  queueTryDequeueOwnedNext32,
  queueEnqueueOwnedNext32,
  queueDequeueOwnedNext32,
} from '../src/queue32.mjs';

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

  shl2x32Into(dst, 0, 1, 0, 63);
  assert.deepEqual([...dst], [0, 0x80000000]);
  shl2x32Ge32Into(dst, 0, 1, 63);
  assert.deepEqual([...dst], [0, 0x80000000]);

  shl2x32Lt32Into(dst, 0, 0x80000000, 0, 1);
  assert.deepEqual([...dst], [0, 1]);

  ushr2x32Into(dst, 0, 0, 0x80000000, 63);
  assert.deepEqual([...dst], [1, 0]);
  ushr2x32Ge32Into(dst, 0, 0x80000000, 63);
  assert.deepEqual([...dst], [1, 0]);

  ushr2x32Lt32Into(dst, 0, 0, 1, 1);
  assert.deepEqual([...dst], [0x80000000, 0]);

  shl2x32Lt32PreparedInto(dst, 0, 0x80000000, 0, 1, 31);
  assert.deepEqual([...dst], [0, 1]);
  ushr2x32Lt32PreparedInto(dst, 0, 0, 1, 1, 31);
  assert.deepEqual([...dst], [0x80000000, 0]);
  shl2x32Ge32PreparedInto(dst, 0, 1, 31);
  assert.deepEqual([...dst], [0, 0x80000000]);
  ushr2x32Ge32PreparedInto(dst, 0, 0x80000000, 31);
  assert.deepEqual([...dst], [1, 0]);

  add2x32Into(dst, 0, 0xffffffff, 1, 1, 2);
  assert.deepEqual([...dst], [0, 4]);
  add2x32Into(dst, 0, 5, 1, 7, 2);
  assert.deepEqual([...dst], [12, 3]);

  sub2x32Into(dst, 0, 0, 4, 1, 2);
  assert.deepEqual([...dst], [0xffffffff, 1]);
});

test('two-lane set iteration and cardinality', () => {
  assert.equal(firstSetBitIndex2x32(0, 1), 32);
  assert.equal(firstSetBitIndex2x32(8, 1), 3);
  assert.equal(clearLowestSetBit32(0b10100), 0b10000);
  assert.equal(cardinalityClass2x32(0, 0), 0);
  assert.equal(cardinalityClass2x32(8, 0), 1);
  assert.equal(cardinalityClass2x32(8, 1), 2);
  assert.equal(cardinalityClass2x32(0b1010, 0), 2);
  assert.equal(popcount2x32(0xffffffff, 0x3ff), 42);
  assert.equal(popcount2x32(0xffffffff, 0xffffffff), 64);
  assert.equal(popcount2x32SparseHigh(0xffffffff, 0), 32);
  assert.equal(popcount2x32SparseHigh(0xffffffff, 0x3ff), 42);
  assert.equal(popcount2x32SparseHigh(0xffffffff, 0xffffffff), 64);
});

test('sparse exact popcount profiles', () => {
  const oneLane = [0, 1, 0x80000000, 0b1010, 0x80000001];
  for (const value of oneLane) {
    assert.equal(popcount32Sparse(value), popcount32(value));
  }

  const twoLane = [
    [0, 0],
    [1, 0],
    [0x80000000, 1],
    [0b1010, 0b0101],
    [0x80000001, 0x200],
  ];
  for (const [lo, hi] of twoLane) {
    assert.equal(popcount2x32SparseBits(lo, hi), popcount2x32(lo, hi));
  }
});

test('10-bit high-lane popcount table profile', () => {
  const table = new Uint32Array(1024);
  assert.equal(fillPopcount10Table32(table), 1024);
  assert.equal(table[0], 0);
  assert.equal(table[0x3ff], 10);
  assert.equal(table[0x155], popcount32(0x155));

  const vectors = [
    [0, 0],
    [0xffffffff, 0],
    [0xffffffff, 0x3ff],
    [0x12345678, 0x155],
    [0x80000000, 0x200],
  ];
  for (const [lo, hi] of vectors) {
    assert.equal(
      popcount2x32High10Table(lo, hi, table),
      popcount2x32(lo, hi),
    );
  }
});

test('move-slot index space removes hot physical-column remap', () => {
  const order = new Uint8Array([3, 2, 4, 1, 5, 0, 6]);
  const scores = new Int32Array([-2147483648, 2, 4, 1, 3, 0, 2]);

  const slot = argMaxPlayableSlot32(scores, 7);
  assert.equal(slot, 2);
  assert.equal(argMaxPlayableSlot7Nonempty32(scores), 2);
  assert.equal(
    argMaxPlayableSlot7ScalarsNonempty32(
      scores[0],
      scores[1],
      scores[2],
      scores[3],
      scores[4],
      scores[5],
      scores[6],
    ),
    2,
  );
  assert.equal(
    argMaxPlayableSlot7ScalarsNonempty32(-2147483648, 9, 9, 8, 7, 6, 5),
    1,
  );
  assert.equal(physicalColumnFromMoveSlot32(order, slot), 4);

  scores.fill(-2147483648);
  assert.equal(argMaxPlayableSlot32(scores, 7), -1);

  const landing = new Uint32Array(7);
  assert.equal(fillLandingCellsByOrder32(landing, order, 7), 7);
  assert.deepEqual(landing, new Uint32Array([3, 2, 4, 1, 5, 0, 6]));

  // Hot transition consumes slot 2 directly. The landing value, not the slot
  // ordinal, supplies the physical cell; columns remains the physical stride.
  const state = new Uint32Array(4);
  for (let column = 0; column < 7; column += 1) state[STATE_PLAYABLE_LO] |= (1 << column) >>> 0;
  const supportDelta = 1 << (4 * 3);
  assert.equal(applyMove32(state, landing, slot, 7, 42, supportDelta), 4);
  assert.equal(landing[slot], 11);
  assert.equal(undoMove32(state, landing, slot, 7, 42, supportDelta), 4);
  assert.equal(landing[slot], 4);
});

test('isolated-bit clear profiles reuse caller isolation', () => {
  assert.equal(clearIsolatedBitI32(0b1010, 0b0010), 0b1000);
  assert.equal(clearIsolatedBitI32(0x80000001, 1), -2147483648);
  assert.equal(clearIsolatedBit32(0x80000001, 1), 0x80000000);
  assert.equal(clearIsolatedBit32(0xffffffff, 0x80000000), 0x7fffffff);
});

test('isolated-bit index profiles reuse caller isolation', () => {
  assert.equal(isolatedBitIndex32(1), 0);
  assert.equal(isolatedBitIndex32(1 << 17), 17);
  assert.equal(isolatedBitIndex32(0x80000000), 31);
  assert.equal(isolatedHighBitIndex32(1), 32);
  assert.equal(isolatedHighBitIndex32(1 << 9), 41);
  assert.equal(isolatedHighBitIndex32(0x80000000), 63);
});

test('one-lane cardinality classification', () => {
  assert.equal(cardinalityClass32(0), 0);
  assert.equal(cardinalityClass32(1), 1);
  assert.equal(cardinalityClass32(0x80000000), 1);
  assert.equal(cardinalityClass32(0b1010), 2);
  assert.equal(cardinalityClass32(0xffffffff), 2);
});

test('known landing cell legality reuses observed state', () => {
  assert.equal(playableKnownCell32(0, 42), true);
  assert.equal(playableKnownCell32(41, 42), true);
  assert.equal(playableKnownCell32(42, 42), false);
  assert.equal(playableKnownCell32(49, 42), false);
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
  rehashOverwrite32(oldHashes, oldValues, 4, newHashes, newValues, 7, 0xffffffff);
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
  assert.equal(atomicReleaseNoNotify32(words, 0, 7), 7);
  assert.equal(Atomics.load(words, 0), 7);
});

test('bounded shared queue blocks without waiting', () => {
  const enqueue = new Int32Array(new SharedArrayBuffer(4));
  const dequeue = new Int32Array(new SharedArrayBuffer(4));
  const sequence = new Int32Array(new SharedArrayBuffer(4 * 4));
  const values = new Int32Array(new SharedArrayBuffer(4 * 4));
  for (let i = 0; i < 4; i += 1) sequence[i] = i;
  assert.equal(queueEnqueue32(enqueue, sequence, values, 3, 77), 0);
  assert.equal(queueDequeue32(dequeue, sequence, values, 3, 4), 77);
  assert.equal(sequence[0], 4);
});


test('caller-owned queue positions remove reservation CAS', () => {
  const capacity = 4;
  const mask = capacity - 1;
  const sequence = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * capacity));
  const values = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * capacity));
  const out = new Int32Array(1);
  for (let slot = 0; slot < capacity; slot += 1) sequence[slot] = slot;

  let enqueuePosition = 0;
  let dequeuePosition = 0;

  assert.equal(
    queueTryEnqueueOwnedPosition32(sequence, values, mask, enqueuePosition, 77),
    true,
  );
  enqueuePosition = (enqueuePosition + 1) | 0;

  assert.equal(
    queueTryDequeueOwnedPosition32(
      sequence,
      values,
      mask,
      capacity,
      dequeuePosition,
      out,
      0,
    ),
    true,
  );
  dequeuePosition = (dequeuePosition + 1) | 0;
  assert.equal(out[0], 77);
  assert.equal(enqueuePosition, 1);
  assert.equal(dequeuePosition, 1);

  // Position 1 is empty until its matching sequence is published.
  assert.equal(
    queueTryDequeueOwnedPosition32(
      sequence,
      values,
      mask,
      capacity,
      dequeuePosition,
      out,
      0,
    ),
    false,
  );

  for (let value = 0; value < capacity; value += 1) {
    assert.equal(
      queueTryEnqueueOwnedPosition32(sequence, values, mask, enqueuePosition, value),
      true,
    );
    enqueuePosition = (enqueuePosition + 1) | 0;
  }
  assert.equal(
    queueTryEnqueueOwnedPosition32(sequence, values, mask, enqueuePosition, 99),
    false,
  );
});

test('owned queue next-position profiles reuse publication increment', () => {
  const capacity = 4;
  const mask = capacity - 1;
  const sequence = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * capacity));
  const values = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * capacity));
  const out = new Int32Array(1);
  for (let slot = 0; slot < capacity; slot += 1) sequence[slot] = slot;

  let enqueuePosition = 0;
  let dequeuePosition = 0;

  const nextEnqueue = queueTryEnqueueOwnedNext32(
    sequence, values, mask, enqueuePosition, 91,
  );
  assert.notEqual(nextEnqueue, enqueuePosition);
  enqueuePosition = nextEnqueue;

  const nextDequeue = queueTryDequeueOwnedNext32(
    sequence, values, mask, capacity, dequeuePosition, out, 0,
  );
  assert.notEqual(nextDequeue, dequeuePosition);
  dequeuePosition = nextDequeue;
  assert.equal(out[0], 91);

  // Unavailable returns the unchanged owned position.
  assert.equal(
    queueTryDequeueOwnedNext32(
      sequence, values, mask, capacity, dequeuePosition, out, 0,
    ),
    dequeuePosition,
  );

  // Int32 wrap remains caller-ready.
  const wrapSequence = new Int32Array(new SharedArrayBuffer(4));
  const wrapValues = new Int32Array(new SharedArrayBuffer(4));
  wrapSequence[0] = 0x7fffffff;
  assert.equal(
    queueTryEnqueueOwnedNext32(
      wrapSequence, wrapValues, 0, 0x7fffffff, 5,
    ),
    -2147483648,
  );
});

test('owned blocking queue positions remove reservation RMW', () => {
  const capacity = 4;
  const mask = capacity - 1;
  const sequence = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * capacity));
  const values = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * capacity));
  const out = new Int32Array(1);
  for (let slot = 0; slot < capacity; slot += 1) sequence[slot] = slot;

  let enqueuePosition = 0;
  let dequeuePosition = 0;

  enqueuePosition = queueEnqueueOwnedNext32(
    sequence, values, mask, enqueuePosition, 123,
  );
  assert.equal(enqueuePosition, 1);

  dequeuePosition = queueDequeueOwnedNext32(
    sequence, values, mask, capacity, dequeuePosition, out, 0,
  );
  assert.equal(dequeuePosition, 1);
  assert.equal(out[0], 123);
  assert.equal(sequence[0], capacity);

  const wrapSequence = new Int32Array(new SharedArrayBuffer(4));
  const wrapValues = new Int32Array(new SharedArrayBuffer(4));
  const wrapOut = new Int32Array(1);
  wrapSequence[0] = 0x7fffffff;
  const wrapped = queueEnqueueOwnedNext32(
    wrapSequence, wrapValues, 0, 0x7fffffff, 7,
  );
  assert.equal(wrapped, -2147483648);
  assert.equal(
    queueDequeueOwnedNext32(
      wrapSequence, wrapValues, 0, 1, 0x7fffffff, wrapOut, 0,
    ),
    -2147483648,
  );
  assert.equal(wrapOut[0], 7);
});

test('typed capacity allocation', () => {
  const storage = allocateTypedCapacity(8);
  assert.equal(storage instanceof Uint32Array, true);
  assert.equal(storage.length, 8);
  assert.deepEqual([...storage], [0, 0, 0, 0, 0, 0, 0, 0]);
});


test('high-lane apply and undo derives masks without lookup tables', () => {
  const state = new Uint32Array(4);
  const landingCells = new Uint32Array(7);
  fillLandingCells32(landingCells, 7);
  landingCells[5] = 33;
  state[STATE_PLAYABLE_HI] = 1 << 1;

  const supportDelta = 1 << 15;
  const cell = applyMove32(state, landingCells, 5, 7, 42, supportDelta);
  assert.equal(cell, 33);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 8)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 1)) !== 0, false);

  const undone = undoMove32(state, landingCells, 5, 7, 42, supportDelta);
  assert.equal(undone, 33);
  assert.equal(landingCells[5], 33);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 1)) !== 0, true);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 8)) !== 0, false);
});


test('runtime-configured 4x4 transition', () => {
  const state = new Uint32Array(4);
  const landingCells = new Uint32Array(4);
  fillLandingCells32(landingCells, 4);
  state[STATE_PLAYABLE_LO] = 0b1111;
  const column = 2;
  const supportDelta = 1 << 6;

  const cell = applyMove1x32(state, landingCells, column, 4, 16, supportDelta);
  assert.equal(cell, 2);
  assert.equal(landingCells[column], 6);
  assert.equal(sideFromPly32(state[STATE_PLY]), 1);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 6)) !== 0, true);
  assert.equal(state[STATE_SUPPORT_CODE], supportDelta);

  const undone = undoMove1x32(state, landingCells, column, 4, 16, supportDelta);
  assert.equal(undone, 2);
  assert.equal(landingCells[column], 2);
  assert.equal(sideFromPly32(state[STATE_PLY]), 0);
  assert.equal(state[STATE_SUPPORT_CODE], 0);
});


test('bit-31 transition survives typed-store coercion', () => {
  const state = new Uint32Array(4);
  const landingCells = new Uint32Array(8);
  fillLandingCells32(landingCells, 8);
  landingCells[7] = 31;
  state[STATE_PLAYABLE_LO] = 0x80000000;
  const supportDelta = 1;

  assert.equal(applyMove32(state, landingCells, 7, 8, 64, supportDelta), 31);
  assert.equal((state[STATE_PLAYABLE_HI] & (1 << 7)) !== 0, true);

  assert.equal(undoMove32(state, landingCells, 7, 8, 64, supportDelta), 31);
  assert.equal(state[STATE_PLAYABLE_LO], 0x80000000);
});


test('one-lane full-column transition', () => {
  const state = new Uint32Array(4);
  const landingCells = new Uint32Array(4);
  fillLandingCells32(landingCells, 4);
  const column = 3;
  landingCells[column] = 15;
  state[STATE_PLAYABLE_LO] = 1 << 15;
  const supportDelta = 1 << 9;

  assert.equal(applyMove1x32(state, landingCells, column, 4, 16, supportDelta), 15);
  assert.equal(landingCells[column], 19);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 15)) !== 0, false);

  assert.equal(undoMove1x32(state, landingCells, column, 4, 16, supportDelta), 15);
  assert.equal(landingCells[column], 15);
  assert.equal((state[STATE_PLAYABLE_LO] & (1 << 15)) !== 0, true);
});


test('nonblocking queue try paths', () => {
  const enqueue = new Int32Array(new SharedArrayBuffer(4));
  const dequeue = new Int32Array(new SharedArrayBuffer(4));
  const sequence = new Int32Array(new SharedArrayBuffer(4 * 4));
  const values = new Int32Array(new SharedArrayBuffer(4 * 4));
  const out = new Int32Array(1);
  for (let i = 0; i < 4; i += 1) sequence[i] = i;

  assert.equal(queueTryEnqueue32(enqueue, sequence, values, 3, 55), true);
  assert.equal(queueTryDequeue32(dequeue, sequence, values, 3, 4, out, 0), true);
  assert.equal(out[0], 55);
  assert.equal(queueTryDequeue32(dequeue, sequence, values, 3, 4, out, 0), false);
});
