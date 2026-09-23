import { firstSetBitIndex32 } from '../src/word32.mjs';
import { insertMinimal6x32InPlace, productJoinMinimal6x32Into } from '../src/relational32.mjs';
import { rba7x6CofactorBasis } from './rba7x6-coordinate.mjs';

export const RBA7X6_BOUNDARY_INCOMPLETE = 6;
export const RBA7X6_BOUNDARY_CAPACITY = 7;

export function prepareRba7x6FrontArena(depth = 2, capacity = 256, budget = 100000) {
  if (!Number.isInteger(depth) || depth < 0 || depth > 4
      || !Number.isInteger(capacity) || capacity < 1 || capacity > 8192
      || !Number.isInteger(budget) || budget < 1 || budget > 10000000) {
    throw new RangeError('RBA front arena bounds');
  }
  const actionBase = (depth + 1) * 12;
  const slots = actionBase + 28;
  const base = Uint32Array.from({ length: slots }, (_, slot) => slot * capacity * 6);
  return {
    depth,
    capacity,
    budget,
    steps: 0,
    error: 0,
    actionBase,
    words: new Uint32Array(slots * capacity * 6),
    count: new Uint32Array(slots),
    base,
    basis: new Uint32Array((depth + 1) * 69),
    size: new Uint32Array(depth + 1),
    valid: new Uint32Array((depth + 1) * 3),
    up: new Uint32Array((depth + 1) * 69 * 3),
    seen: new Uint32Array(20),
    temp: new Uint32Array(6),
    image0: new Uint32Array(69 * 3),
    image1: new Uint32Array(69 * 3),
    top1: new Uint32Array(69),
    adjoint: new Uint32Array(3),
    target: new Uint32Array(70 * 3),
    cover: new Uint32Array(70 * 3),
    next: new Uint32Array(70),
  };
}

function spend(a, amount = 1) {
  if (a.steps + amount > a.budget) {
    a.error = RBA7X6_BOUNDARY_INCOMPLETE;
    return 0;
  }
  a.steps += amount;
  return 1;
}

export function rba7x6InsertFront(a, slot) {
  if (!spend(a)) return a.error;
  const length = insertMinimal6x32InPlace(
    a.words,
    a.base[slot],
    a.count[slot],
    a.capacity,
    a.temp,
    0,
  );
  if (length < 0) {
    a.error = RBA7X6_BOUNDARY_CAPACITY;
    return a.error;
  }
  a.count[slot] = length;
  return 0;
}

export function rba7x6SwapFront(a, left, right) {
  const base = a.base[left];
  const count = a.count[left];
  a.base[left] = a.base[right];
  a.count[left] = a.count[right];
  a.base[right] = base;
  a.count[right] = count;
}

function universal(a, slot) {
  a.count[slot] = 1;
  const base = a.base[slot];
  for (let lane = 0; lane < 6; lane += 1) a.words[base + lane] = 0;
}

export function rba7x6CombineFront(a, left, right, out, intersect) {
  a.count[out] = 0;
  if (!intersect) {
    rba7x6SwapFront(a, left, out);
    for (let index = 0; index < a.count[right]; index += 1) {
      const source = a.base[right] + index * 6;
      for (let lane = 0; lane < 6; lane += 1) a.temp[lane] = a.words[source + lane];
      if (rba7x6InsertFront(a, out)) return a.error;
    }
    return 0;
  }

  const pairs = a.count[left] * a.count[right];
  if (!spend(a, pairs || 1)) return a.error;
  const length = productJoinMinimal6x32Into(
    a.words,
    a.base[out],
    0,
    a.capacity,
    a.words,
    a.base[left],
    a.count[left],
    a.words,
    a.base[right],
    a.count[right],
    a.temp,
    0,
  );
  if (length < 0) {
    a.error = RBA7X6_BOUNDARY_CAPACITY;
    return a.error;
  }
  a.count[out] = length;
  return 0;
}

function prepareValid(a, depth, size) {
  for (let lane = 0; lane < 3; lane += 1) {
    const remaining = size - lane * 32;
    a.valid[depth * 3 + lane] = remaining >= 32
      ? 0xffffffff
      : remaining > 0
        ? (0xffffffff >>> (32 - remaining))
        : 0;
  }
}

function preparePrincipalUpsets(g, a, depth, basis, basisOffset, size) {
  for (let index = 0; index < size; index += 1) {
    const row = (depth * 69 + index) * 3;
    a.up[row] = 0;
    a.up[row + 1] = 0;
    a.up[row + 2] = 0;
    const image = basis[basisOffset + index];
    const relationBase = image * 625;
    for (let child = 0; child < size; child += 1) {
      if (g.supersetsByImage[relationBase + basis[basisOffset + child]]) {
        a.up[row + (child >>> 5)] |= 1 << (child & 31);
      }
    }
  }
}

function prepareImages(g, a, depth, cell, mover, basis, basisOffset) {
  const size = a.size[depth];
  const childSize = a.size[depth + 1];
  const actionBase = cell * 625;

  for (let index = 0; index < size; index += 1) {
    const id = basis[basisOffset + index];
    const removed = g.removeByCell[actionBase + id];
    for (let lane = 0; lane < 3; lane += 1) {
      a.image0[index * 3 + lane] = 0;
      a.image1[index * 3 + lane] = 0;
    }
    a.top1[index] = 0;

    for (let player = 0; player < 2; player += 1) {
      if (player !== mover && removed !== id) continue;
      const image = player === mover ? removed : id;
      const output = player === 0 ? a.image0 : a.image1;

      if (image < 0) {
        if (player === 1) a.top1[index] = 1;
        for (let lane = 0; lane < 3; lane += 1) {
          output[index * 3 + lane] = a.valid[(depth + 1) * 3 + lane];
        }
      } else {
        const relationBase = image * 625;
        for (let child = 0; child < childSize; child += 1) {
          if (g.supersetsByImage[relationBase + a.basis[(depth + 1) * 69 + child]]) {
            output[index * 3 + (child >>> 5)] |= 1 << (child & 31);
          }
        }
      }
    }
  }
}

function covers(a, depth, childBase, out) {
  const size = a.size[depth];
  for (let lane = 0; lane < 3; lane += 1) {
    a.target[lane] = a.words[childBase + lane];
    a.cover[lane] = 0;
  }
  a.next[0] = 0;
  let level = 0;

  while (level >= 0) {
    if (!spend(a)) return a.error;
    const base = level * 3;
    if (!(a.target[base] | a.target[base + 1] | a.target[base + 2])) {
      for (let lane = 0; lane < 3; lane += 1) {
        a.temp[lane] = a.cover[base + lane];
        a.temp[3 + lane] = a.valid[depth * 3 + lane] & ~a.adjoint[lane];
      }
      if (rba7x6InsertFront(a, out)) return a.error;
      level -= 1;
      continue;
    }

    let lane = 0;
    while (!a.target[base + lane]) lane += 1;
    const mask = 1 << firstSetBitIndex32(a.target[base + lane]);
    let index = a.next[level];
    while (index < size && !(a.image0[index * 3 + lane] & mask)) index += 1;
    if (index === size) {
      level -= 1;
      continue;
    }

    a.next[level] = index + 1;
    for (let word = 0; word < 3; word += 1) {
      a.target[base + 3 + word] = a.target[base + word] & ~a.image0[index * 3 + word];
      a.cover[base + 3 + word] = a.cover[base + word] | a.up[(depth * 69 + index) * 3 + word];
    }
    level += 1;
    a.next[level] = 0;
  }
  return 0;
}

function preimage(a, depth, child, out, cell, mover, basis, basisOffset) {
  a.count[out] = 0;

  for (let generator = 0; generator < a.count[child]; generator += 1) {
    const childBase = a.base[child] + generator * 6;
    a.adjoint[0] = 0;
    a.adjoint[1] = 0;
    a.adjoint[2] = 0;

    for (let index = 0; index < a.size[depth]; index += 1) {
      if (a.top1[index]) continue;
      let accepted = 1;
      for (let lane = 0; lane < 3; lane += 1) {
        if (a.image1[index * 3 + lane] & a.words[childBase + 3 + lane]) {
          accepted = 0;
          break;
        }
      }
      if (accepted) {
        const row = (depth * 69 + index) * 3;
        a.adjoint[0] |= a.up[row];
        a.adjoint[1] |= a.up[row + 1];
        a.adjoint[2] |= a.up[row + 2];
      }
    }

    if (covers(a, depth, childBase, out)) return a.error;
  }

  if (mover === 0) {
    for (let index = 0; index < a.size[depth]; index += 1) {
      if (basis[basisOffset + index] === cell) {
        const row = (depth * 69 + index) * 3;
        a.temp[0] = a.up[row];
        a.temp[1] = a.up[row + 1];
        a.temp[2] = a.up[row + 2];
        a.temp[3] = 0;
        a.temp[4] = 0;
        a.temp[5] = 0;
        if (rba7x6InsertFront(a, out)) return a.error;
        break;
      }
    }
  }
  return 0;
}

export function buildRba7x6FourFront(g, a, support, depth, remaining, basis, basisOffset, basisSize) {
  if (depth === 0) {
    a.steps = 0;
    a.error = 0;
    for (let slot = 0; slot < 28; slot += 1) a.count[a.actionBase + slot] = 0;
  }
  if (!spend(a)) return a.error;

  const slot = depth * 12;
  a.size[depth] = basisSize;
  prepareValid(a, depth, basisSize);

  if ((support >>> 21) === 42) {
    universal(a, slot);
    a.count[slot + 1] = 0;
    universal(a, slot + 2);
    a.count[slot + 3] = 0;
    return 0;
  }

  // Horizon leaves need only valid-mask metadata and constant unknown fronts.
  // They never consume their own principal-upset table.
  if (!remaining) {
    a.count[slot] = 0;
    a.count[slot + 1] = 0;
    universal(a, slot + 2);
    universal(a, slot + 3);
    return 0;
  }

  preparePrincipalUpsets(g, a, depth, basis, basisOffset, basisSize);

  const mover = (support >>> 21) & 1;
  for (let threshold = 0; threshold < 4; threshold += 1) {
    if (mover) universal(a, slot + threshold);
    else a.count[slot + threshold] = 0;
  }

  for (let column = 0; column < 7; column += 1) {
    const height = (support >>> (column * 3)) & 7;
    if (height === 6) continue;
    const cell = height * 7 + column;
    const childBasisOffset = (depth + 1) * 69;
    const childSize = rba7x6CofactorBasis(
      g,
      basis,
      basisOffset,
      basisSize,
      cell,
      a.basis,
      childBasisOffset,
      a.seen,
    );

    if (buildRba7x6FourFront(
      g,
      a,
      support + (1 << (column * 3)) + (1 << 21),
      depth + 1,
      remaining - 1,
      a.basis,
      childBasisOffset,
      childSize,
    )) return a.error;

    prepareImages(g, a, depth, cell, mover, basis, basisOffset);
    for (let threshold = 0; threshold < 4; threshold += 1) {
      if (preimage(a, depth, (depth + 1) * 12 + threshold, slot + 4 + threshold, cell, mover, basis, basisOffset)) {
        return a.error;
      }
      if (rba7x6CombineFront(a, slot + threshold, slot + 4 + threshold, slot + 8 + threshold, mover)) {
        return a.error;
      }
      rba7x6SwapFront(a, slot + 8 + threshold, slot + threshold);
      if (depth === 0) rba7x6SwapFront(a, slot + 4 + threshold, a.actionBase + column * 4 + threshold);
    }
  }
  return 0;
}

function member(a, slot, words, offset) {
  for (let index = 0; index < a.count[slot]; index += 1) {
    const base = a.base[slot] + index * 6;
    let accepted = 1;
    for (let lane = 0; lane < 3; lane += 1) {
      if ((a.words[base + lane] & ~words[offset + 2 + lane])
          || (a.words[base + 3 + lane] & words[offset + 5 + lane])) {
        accepted = 0;
        break;
      }
    }
    if (accepted) return 1;
  }
  return 0;
}

// Packed endpoints: low | (high << 2), each endpoint in exact code domain 1..3.
export function queryRba7x6FourFront(a, slot, words, offset) {
  const lower = member(a, slot + 1, words, offset) ? 3 : member(a, slot, words, offset) ? 2 : 1;
  const upper = member(a, slot + 3, words, offset) ? 3 : member(a, slot + 2, words, offset) ? 2 : 1;
  return lower | (upper << 2);
}
