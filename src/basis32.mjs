export function emitSortedSetBits32(seen, wordCount, out, outOffset) {
  let count = 0;
  for (let word = 0; word < wordCount; word += 1) {
    let bits = seen[word];
    while (bits) {
      const bit = 31 - Math.clz32(bits & -bits);
      out[outOffset + count] = word * 32 + bit;
      count += 1;
      bits &= bits - 1;
    }
  }
  return count;
}

// table is action-major: table[actionBase + sourceId] -> mapped id or missingValue.
// seen is caller-owned scratch spanning the mapped-id domain.
export function transformDedupSortedActionMajor32(
  source,
  sourceOffset,
  count,
  table,
  actionBase,
  missingValue,
  seen,
  seenWordCount,
  out,
  outOffset,
) {
  for (let word = 0; word < seenWordCount; word += 1) seen[word] = 0;
  for (let index = 0; index < count; index += 1) {
    const mapped = table[actionBase + source[sourceOffset + index]];
    if (mapped !== missingValue) seen[mapped >>> 5] |= 1 << (mapped & 31);
  }
  let outCount = 0;
  for (let word = 0; word < seenWordCount; word += 1) {
    let bits = seen[word];
    while (bits) {
      const bit = 31 - Math.clz32(bits & -bits);
      out[outOffset + outCount] = word * 32 + bit;
      outCount += 1;
      bits &= bits - 1;
    }
  }
  return outCount;
}

// map[mapOffset+i] gives the destination bit index for source bit i.
// count is caller-validated <= 96 and every mapped destination is in [0,95].
export function permuteBits3x32Into(out, outOffset, source, sourceOffset, map, mapOffset, count) {
  out[outOffset] = 0;
  out[outOffset + 1] = 0;
  out[outOffset + 2] = 0;
  for (let index = 0; index < count; index += 1) {
    if (source[sourceOffset + (index >>> 5)] & (1 << (index & 31))) {
      const target = map[mapOffset + index];
      out[outOffset + (target >>> 5)] |= 1 << (target & 31);
    }
  }
  return outOffset;
}
