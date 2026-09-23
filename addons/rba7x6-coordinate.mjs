import { emitSortedSetBits32, transformDedupSortedActionMajor32, permuteBits3x32Into } from '../src/basis32.mjs';
import { canonicalPrimaryCompare32, reflectPacked3Columns6To7 } from '../src/mix32.mjs';
import { publishSpan32 } from '../src/widekey32.mjs';

// COLD ingress/reference basis derivation. Native descendants use cofactorBasis.
export function rba7x6BasisFromSupport(g, support, out, offset, seen) {
  for (let word = 0; word < 20; word += 1) seen[word] = 0;
  for (let line = 0; line < 69; line += 1) {
    const base = line * 4;
    const bits = (((support >>> g.lineShift[base]) & 7) <= g.lineRow[base] ? 1 : 0)
      | (((support >>> g.lineShift[base + 1]) & 7) <= g.lineRow[base + 1] ? 2 : 0)
      | (((support >>> g.lineShift[base + 2]) & 7) <= g.lineRow[base + 2] ? 4 : 0)
      | (((support >>> g.lineShift[base + 3]) & 7) <= g.lineRow[base + 3] ? 8 : 0);
    if (bits) {
      const id = g.lineShape[line * 16 + bits];
      seen[id >>> 5] |= 1 << (id & 31);
    }
  }
  return emitSortedSetBits32(seen, 20, out, offset);
}

export function rba7x6CofactorBasis(g, parent, parentOffset, count, cell, out, outOffset, seen) {
  return transformDedupSortedActionMajor32(
    parent,
    parentOffset,
    count,
    g.removeByCell,
    cell * 625,
    -1,
    seen,
    20,
    out,
    outOffset,
  );
}

// -1 inadmissible; 0 ordinary child; 1/2/3 exact terminal child.
export function rba7x6Cofactor(
  g,
  source,
  sourceOffset,
  basis,
  basisOffset,
  basisSize,
  column,
  target,
  targetOffset,
  childBasis,
  childBasisOffset,
  seen,
  childSizes,
  childSizeIndex,
) {
  const meta = source[sourceOffset];
  const height = (meta >>> (column * 3)) & 7;
  if (source[sourceOffset + 1] || column < 0 || column > 6 || height >= 6) return -1;

  const cell = height * 7 + column;
  const player = (meta >>> 21) & 1;
  target[targetOffset] = meta + (1 << (column * 3)) + (1 << 21);
  childSizes[childSizeIndex] = 0;
  for (let word = 1; word < 8; word += 1) target[targetOffset + word] = 0;

  // Stable shape ordering makes singleton cell IDs exactly 0..41.
  for (let index = 0; index < basisSize; index += 1) {
    if (basis[basisOffset + index] === cell
        && (source[sourceOffset + 2 + player * 3 + (index >>> 5)] & (1 << (index & 31)))) {
      target[targetOffset + 1] = player ? 1 : 3;
      return target[targetOffset + 1];
    }
  }

  if ((target[targetOffset] >>> 21) === 42) {
    target[targetOffset + 1] = 2;
    return 2;
  }

  const childSize = rba7x6CofactorBasis(
    g,
    basis,
    basisOffset,
    basisSize,
    cell,
    childBasis,
    childBasisOffset,
    seen,
  );
  childSizes[childSizeIndex] = childSize;
  const actionBase = cell * 625;

  for (let p = 0; p < 2; p += 1) {
    for (let index = 0; index < basisSize; index += 1) {
      if (!(source[sourceOffset + 2 + p * 3 + (index >>> 5)] & (1 << (index & 31)))) continue;
      const id = basis[basisOffset + index];
      const removed = g.removeByCell[actionBase + id];
      if (p !== player && removed !== id) continue;
      const image = p === player ? removed : id;
      const relationBase = image * 625;
      for (let childIndex = 0; childIndex < childSize; childIndex += 1) {
        if (g.supersetsByImage[relationBase + childBasis[childBasisOffset + childIndex]]) {
          target[targetOffset + 2 + p * 3 + (childIndex >>> 5)] |= 1 << (childIndex & 31);
        }
      }
    }
  }
  return 0;
}

export function rba7x6ReflectSupport(meta) {
  const support = meta & 0x1fffff;
  return ((meta & 0xffe00000) | reflectPacked3Columns6To7(support, 9, 15)) >>> 0;
}

// Canonicalize q and its carried local basis in place. Return 1 iff reflected.
export function rba7x6Canonicalize(g, words, offset, basis, basisOffset, basisSize, scratch) {
  const meta = words[offset];
  const reflected = rba7x6ReflectSupport(meta);
  const primary = canonicalPrimaryCompare32(meta, reflected);
  if (primary < 0) return 0;

  for (let word = 0; word < 20; word += 1) scratch.seen[word] = 0;
  for (let index = 0; index < basisSize; index += 1) {
    const id = g.reflect[basis[basisOffset + index]];
    scratch.seen[id >>> 5] |= 1 << (id & 31);
  }
  const reflectedSize = emitSortedSetBits32(scratch.seen, 20, scratch.mirrorBasis, 0);
  for (let index = 0; index < reflectedSize; index += 1) {
    scratch.inverse[scratch.mirrorBasis[index]] = index;
  }
  for (let index = 0; index < basisSize; index += 1) {
    scratch.map[index] = scratch.inverse[g.reflect[basis[basisOffset + index]]];
  }

  scratch.mirror[0] = reflected;
  scratch.mirror[1] = words[offset + 1];
  permuteBits3x32Into(scratch.mirror, 2, words, offset + 2, scratch.map, 0, basisSize);
  permuteBits3x32Into(scratch.mirror, 5, words, offset + 5, scratch.map, 0, basisSize);

  if (primary === 0) {
    let word = 2;
    while (word < 8 && words[offset + word] === scratch.mirror[word]) word += 1;
    if (word === 8 || words[offset + word] < scratch.mirror[word]) return 0;
  }

  publishSpan32(words, offset, scratch.mirror, 0, 8);
  publishSpan32(basis, basisOffset, scratch.mirrorBasis, 0, basisSize);
  return 1;
}
