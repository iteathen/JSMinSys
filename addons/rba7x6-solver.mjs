import { prepareRba7x6Geometry, prepareRba7x6CoordinateScratch } from './rba7x6-geometry.mjs';
import {
  rba7x6BasisFromSupport,
  rba7x6Cofactor,
  rba7x6Canonicalize,
} from './rba7x6-coordinate.mjs';
import {
  prepareRba7x6FrontArena,
  buildRba7x6FourFront,
  queryRba7x6FourFront,
  RBA7X6_BOUNDARY_INCOMPLETE,
  RBA7X6_BOUNDARY_CAPACITY,
} from './rba7x6-front.mjs';
import {
  rbaTtPublishPrepared7x32,
  rbaTtPublishExactOwned32,
  rbaTtAttachDependencies7x32,
  rbaTtReconcile7x32,
  rbaTtSignalParents32,
  rbaTtEnqueueDependencies7x32,
  rbaTtDetachDependencies7x32,
  rbaTtMarkDone32,
  RBA_TT_ROOT,
  RBA_TT_PHASE_PENDING_ATTACH,
  RBA_TT_PHASE_ATTACHED,
  RBA_TT_STOP,
} from './rba-tt8x32.mjs';

export const RBA7X6_EXACT_P1 = 1;
export const RBA7X6_EXACT_DRAW = 2;
export const RBA7X6_EXACT_P0 = 3;
export const RBA7X6_BRANCH = 4;
export const RBA7X6_QUERY_UNCOVERED = 8;
export const RBA7X6_INTERRUPTED = 9;

export function prepareRba7x6Evaluator({
  geometry = prepareRba7x6Geometry(),
  boundaryDepth = 2,
  boundaryCapacity = 256,
  boundaryBudget = 100000,
} = {}) {
  return {
    g: geometry,
    scratch: prepareRba7x6CoordinateScratch(),
    boundary: prepareRba7x6FrontArena(boundaryDepth, boundaryCapacity, boundaryBudget),
    order: new Uint32Array([3,2,4,1,5,0,6]),
    keys: new Uint32Array(7 * 8),
    childBasis: new Uint32Array(7 * 69),
    childBasisSize: new Uint32Array(7),
    actions: new Uint32Array(7),
    actionLower: new Uint32Array(7),
    actionUpper: new Uint32Array(7),
    lower: 1,
    upper: 3,
    childMask: 0,
    count: 0,
    witness: -1,
    boundaryCalls: 0,
    boundaryClosures: 0,
    boundarySteps: 0,
    boundaryFailures: 0,
    transitions: 0,
    actionClosures: 0,
    actionsPruned: 0,
  };
}

// COLD ingress. External move replay enters the RBA carrier once; native solve
// descendants never call this function.
export function rba7x6FromMoves(
  moves,
  { geometry = prepareRba7x6Geometry(), canonical = true } = {},
) {
  const words = new Uint32Array(16);
  const basis = new Uint32Array(138);
  const scratch = prepareRba7x6CoordinateScratch();
  let source = 0;
  let target = 8;
  let basisOffset = 0;
  let childBasisOffset = 69;
  let basisSize = rba7x6BasisFromSupport(geometry, 0, basis, basisOffset, scratch.seen);

  for (let player = 0; player < 2; player += 1) {
    for (let index = 0; index < basisSize; index += 1) {
      words[2 + player * 3 + (index >>> 5)] |= 1 << (index & 31);
    }
  }

  for (const column of moves) {
    if (!Number.isInteger(column) || column < 0 || column > 6) throw new RangeError('invalid column');
    if (words[source + 1]) throw new RangeError('move after terminal');
    if (((words[source] >>> (column * 3)) & 7) === 6) throw new RangeError('column full');

    rba7x6Cofactor(
      geometry,
      words,
      source,
      basis,
      basisOffset,
      basisSize,
      column,
      words,
      target,
      basis,
      childBasisOffset,
      scratch.seen,
      scratch.size,
      0,
    );

    source ^= 8;
    target ^= 8;
    const previousBasisOffset = basisOffset;
    basisOffset = childBasisOffset;
    childBasisOffset = previousBasisOffset;
    basisSize = scratch.size[0];
  }

  const result = words.slice(source, source + 8);
  const rootBasis = basis.slice(basisOffset, basisOffset + basisSize);
  const reflected = canonical
    ? rba7x6Canonicalize(geometry, result, 0, rootBasis, 0, basisSize, scratch)
    : 0;
  return { words: result, basis: rootBasis, reflected };
}

function rootOrderedColumn(order, index, reflected) {
  const callerColumn = order[index];
  return reflected ? 6 - callerColumn : callerColumn;
}

// Evaluate one claimed q into exact value or prepared RBA dependency scratch.
// rootReflected means the canonical root is mirrored relative to caller frame.
export function evaluateRba7x6Tt32(t, q, state, rootQ = -1, rootReflected = 0) {
  if (Atomics.load(t.control, RBA_TT_STOP)) return RBA7X6_INTERRUPTED;

  const base = q * 8;
  if (t.keys[base + 1]) {
    state.witness = -1;
    return t.keys[base + 1];
  }

  state.count = 0;
  state.childMask = 0;
  state.witness = -1;
  state.boundaryCalls += 1;

  const basisSize = t.basisSize[q];
  if (!basisSize) return RBA7X6_QUERY_UNCOVERED;

  const outcome = buildRba7x6FourFront(
    state.g,
    state.boundary,
    t.keys[base],
    0,
    state.boundary.depth,
    t.basis,
    q * 69,
    basisSize,
  );
  state.boundarySteps += state.boundary.steps;
  if (outcome) {
    state.boundaryFailures += 1;
    return outcome;
  }

  const interval = queryRba7x6FourFront(state.boundary, 0, t.keys, base);
  state.lower = interval & 3;
  state.upper = interval >>> 2;
  const mover = (t.keys[base] >>> 21) & 1;

  if (state.lower === state.upper) {
    const value = state.lower;
    if (q !== rootQ) {
      state.boundaryClosures += 1;
      return value;
    }

    for (let orderIndex = 0; orderIndex < 7; orderIndex += 1) {
      const column = rootOrderedColumn(state.order, orderIndex, rootReflected);
      if (((t.keys[base] >>> (column * 3)) & 7) === 6) continue;
      const action = state.boundary.depth
        ? queryRba7x6FourFront(state.boundary, state.boundary.actionBase + column * 4, t.keys, base)
        : 13;
      const lower = action & 3;
      const upper = action >>> 2;

      if (mover ? lower > value : upper < value) continue;
      if (mover ? upper === value : lower === value) {
        state.witness = rootReflected ? 6 - column : column;
        state.boundaryClosures += 1;
        return value;
      }
      break;
    }
  }

  let count = 0;
  let childMask = 0;

  for (let orderIndex = 0; orderIndex < 7; orderIndex += 1) {
    const column = q === rootQ
      ? rootOrderedColumn(state.order, orderIndex, rootReflected)
      : state.order[orderIndex];

    if (((t.keys[base] >>> (column * 3)) & 7) === 6) continue;

    const action = state.boundary.depth
      ? queryRba7x6FourFront(state.boundary, state.boundary.actionBase + column * 4, t.keys, base)
      : 13;
    let lower = action & 3;
    let upper = action >>> 2;
    state.actions[count] = column;

    if (lower === upper) {
      state.actionClosures += 1;
    } else if (mover ? lower > state.upper : upper < state.lower) {
      state.actionsPruned += 1;
    } else {
      const terminal = rba7x6Cofactor(
        state.g,
        t.keys,
        base,
        t.basis,
        q * 69,
        basisSize,
        column,
        state.keys,
        count * 8,
        state.childBasis,
        count * 69,
        state.scratch.seen,
        state.childBasisSize,
        count,
      );
      state.transitions += 1;

      if (terminal < 0 || (terminal && (terminal < lower || terminal > upper))) {
        return RBA7X6_QUERY_UNCOVERED;
      }
      if (terminal) {
        lower = terminal;
        upper = terminal;
        state.actionClosures += 1;
      } else {
        rba7x6Canonicalize(
          state.g,
          state.keys,
          count * 8,
          state.childBasis,
          count * 69,
          state.childBasisSize[count],
          state.scratch,
        );
        childMask |= 1 << count;
      }
    }

    state.actionLower[count] = lower;
    state.actionUpper[count] = upper;
    count += 1;
  }

  if (!count) return RBA7X6_QUERY_UNCOVERED;
  state.count = count;
  state.childMask = childMask;
  return RBA7X6_BRANCH;
}

// Publish one evaluator result through the integrated RBA TT add-on.
// Returns retained child id or -1. rootWitnessOut is caller-owned Int32 storage.
export function publishRba7x6Evaluation32(
  t,
  q,
  owner,
  state,
  code,
  rootQ,
  rootWitnessOut,
  witnessIndex = 0,
) {
  if (code >= 1 && code <= 3) {
    if (!rbaTtPublishExactOwned32(t, q, owner, code)) return -1;
    if (q === rootQ && (t.keys[q * 8 + 1] || state.witness >= 0)) {
      rootWitnessOut[witnessIndex] = state.witness;
      rbaTtMarkDone32(t);
    }
    return -1;
  }

  if (code !== RBA7X6_BRANCH) return -1;

  return rbaTtPublishPrepared7x32(
    t,
    q,
    owner,
    state.lower,
    state.upper,
    state.keys,
    0,
    state.childBasis,
    0,
    69,
    state.childBasisSize,
    state.actions,
    state.actionLower,
    state.actionUpper,
    state.childMask,
    state.count,
  );
}

function priority7x6(action) {
  return action < 3 ? (3 - action) * 2 - 1 : (action - 3) * 2;
}

// Return caller-frame witness, -1 for already-terminal root, -2 unresolved.
export function selectRba7x6RootWitness32(t, root, reflected) {
  if (!t.exact[root]) return -2;
  if (t.keys[root * 8 + 1]) return -1;

  const value = t.exact[root];
  const minimize = (t.keys[root * 8] >>> 21) & 1;
  const edgeBase = root * 7;
  let bestPriority = 7;
  let result = -2;

  for (let index = 0; index < t.count[root]; index += 1) {
    const edge = edgeBase + index;
    const lower = t.edgeLower[edge];
    const upper = t.edgeUpper[edge];
    const label = t.edgeLabel[edge];
    const callerAction = reflected ? 6 - label : label;
    const possible = minimize ? lower <= value : upper >= value;
    if (!possible) continue;

    const priority = priority7x6(callerAction);
    if (priority < bestPriority) {
      bestPriority = priority;
      result = minimize
        ? (upper === value ? callerAction : -2)
        : (lower === value ? callerAction : -2);
    }
  }
  return result;
}

// Manager-side application of one coalesced q event.
// Returns 1 when root completes, 0 otherwise, -1 on a table failure.
export function reconcileRba7x6Event32(
  t,
  q,
  rootReflected,
  rootWitnessOut,
  witnessIndex = 0,
) {
  if (t.phase[q] === RBA_TT_PHASE_PENDING_ATTACH) {
    if (!rbaTtAttachDependencies7x32(t, q)) return -1;
  }

  if (t.phase[q] === RBA_TT_PHASE_ATTACHED) {
    const minimize = (t.keys[q * 8] >>> 21) & 1;
    rbaTtReconcile7x32(t, q, minimize);
    if (Atomics.load(t.control, RBA_TT_STOP)) return -1;
  }

  rbaTtSignalParents32(t, q);

  if (t.exact[q]) {
    if (q === t.control[RBA_TT_ROOT]) {
      const witness = selectRba7x6RootWitness32(t, q, rootReflected);
      if (witness >= -1) {
        rootWitnessOut[witnessIndex] = witness;
        if (t.count[q]) rbaTtDetachDependencies7x32(t, q);
        rbaTtMarkDone32(t);
        return 1;
      }
      rbaTtEnqueueDependencies7x32(t, q);
      return 0;
    }

    if (t.count[q]) rbaTtDetachDependencies7x32(t, q);
    return 0;
  }

  rbaTtEnqueueDependencies7x32(t, q);
  return 0;
}

export {
  RBA7X6_BOUNDARY_INCOMPLETE,
  RBA7X6_BOUNDARY_CAPACITY,
};
