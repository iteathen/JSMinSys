import { mix8x32Locator32, publishSpan32 } from '../src/widekey32.mjs';
import { atomicTryClaim32, atomicReleaseNoNotify32 } from '../src/atomic32.mjs';
import {
  intrusiveEnqueueTailStamped32,
  intrusiveEnqueueOnceTailStamped32,
  intrusiveRemove32,
  intrusivePopHeadStamped32,
} from '../src/intrusive32.mjs';

export const RBA_TT_KEY_WORDS = 8;
export const RBA_TT_MAX_BASIS = 69;
export const RBA_TT_MAX_EDGES = 7;

export const RBA_TT_LOCK = 0;
export const RBA_TT_ERROR = 1;
export const RBA_TT_STOP = 2;
export const RBA_TT_FREE = 3;
export const RBA_TT_LIVE = 4;
export const RBA_TT_READY_HEAD = 5;
export const RBA_TT_READY_TAIL = 6;
export const RBA_TT_READY_COUNT = 7;
export const RBA_TT_EVENT_HEAD = 8;
export const RBA_TT_EVENT_TAIL = 9;
export const RBA_TT_EVENT_COUNT = 10;
export const RBA_TT_DONE = 11;
export const RBA_TT_ROOT = 12;
export const RBA_TT_ROOT_GENERATION = 13;
export const RBA_TT_WAKE = 14;
export const RBA_TT_CONTROL_WORDS = 16;

export const RBA_TT_EXECUTION_FREE = 0;
export const RBA_TT_EXECUTION_QUEUED = 1;

export const RBA_TT_PHASE_NEW = 0;
export const RBA_TT_PHASE_PENDING_ATTACH = 2;
export const RBA_TT_PHASE_ATTACHED = 3;
export const RBA_TT_PHASE_DETACHED = 4;

export const RBA_TT_ERR_CAPACITY = 1;
export const RBA_TT_ERR_CONFLICT = 2;
export const RBA_TT_ERR_GENERATION = 3;
export const RBA_TT_ERR_CONTRACT = 4;

// COLD configuration. The hot functions below operate only on prepared fixed
// numeric storage. Eight-word q and <=69 basis IDs are the selected add-on ABI.
export function createRbaTt8x32(capacity = 4096, bucketCount = 4096) {
  if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 0x1000000
      || !Number.isSafeInteger(bucketCount) || bucketCount < 1
      || bucketCount > 0x1000000 || (bucketCount & (bucketCount - 1))) {
    throw new RangeError('invalid RBA TT capacity/bucket count');
  }
  const u32 = (length) => new Uint32Array(new SharedArrayBuffer(length * 4));
  const i32 = (length) => new Int32Array(new SharedArrayBuffer(length * 4));
  const t = {
    capacity,
    bucketMask: bucketCount - 1,
    control: i32(RBA_TT_CONTROL_WORDS),
    buckets: i32(bucketCount),
    keys: u32(capacity * RBA_TT_KEY_WORDS),
    basis: u32(capacity * RBA_TT_MAX_BASIS),
    basisSize: u32(capacity),
    generation: u32(capacity),
    live: u32(capacity),
    refs: u32(capacity),
    execution: u32(capacity),
    exact: u32(capacity),
    lower: u32(capacity),
    upper: u32(capacity),
    phase: u32(capacity),
    link: i32(capacity),
    bucket: u32(capacity),
    readyNext: i32(capacity),
    readyPrev: i32(capacity),
    readyMember: u32(capacity),
    readyGeneration: u32(capacity),
    eventNext: i32(capacity),
    eventPrev: i32(capacity),
    eventMember: u32(capacity),
    eventGeneration: u32(capacity),
    count: u32(capacity),
    parentHead: i32(capacity),
    child: i32(capacity * RBA_TT_MAX_EDGES),
    childGeneration: u32(capacity * RBA_TT_MAX_EDGES),
    edgeNext: i32(capacity * RBA_TT_MAX_EDGES),
    edgePrev: i32(capacity * RBA_TT_MAX_EDGES),
    edgeLabel: u32(capacity * RBA_TT_MAX_EDGES),
    edgeAttached: u32(capacity * RBA_TT_MAX_EDGES),
    edgeLower: u32(capacity * RBA_TT_MAX_EDGES),
    edgeUpper: u32(capacity * RBA_TT_MAX_EDGES),
  };
  t.buckets.fill(-1);
  t.parentHead.fill(-1);
  t.child.fill(-1);
  t.readyNext.fill(-1);
  t.readyPrev.fill(-1);
  t.eventNext.fill(-1);
  t.eventPrev.fill(-1);
  t.edgeNext.fill(-1);
  t.edgePrev.fill(-1);
  t.control[RBA_TT_READY_HEAD] = -1;
  t.control[RBA_TT_READY_TAIL] = -1;
  t.control[RBA_TT_EVENT_HEAD] = -1;
  t.control[RBA_TT_EVENT_TAIL] = -1;
  t.control[RBA_TT_ROOT] = -1;
  for (let q = 0; q < capacity; q += 1) t.link[q] = q + 1;
  t.link[capacity - 1] = -1;
  return t;
}

// HOT specialized add-on. Every mutation requires successful enter/leave or
// equivalent exclusive cold ownership.
export function rbaTtEnter32(t, owner) {
  if (Atomics.load(t.control, RBA_TT_STOP)) return 0;
  return atomicTryClaim32(t.control, RBA_TT_LOCK, 0, owner) ? 1 : 0;
}

export function rbaTtLeave32(t) {
  atomicReleaseNoNotify32(t.control, RBA_TT_LOCK, 0);
}

export function rbaTtFail32(t, code) {
  Atomics.compareExchange(t.control, RBA_TT_ERROR, 0, code);
  Atomics.store(t.control, RBA_TT_STOP, 1);
  Atomics.add(t.control, RBA_TT_WAKE, 1);
  Atomics.notify(t.control, RBA_TT_WAKE);
  return 0;
}

export function rbaTtValid32(t, q, generation) {
  return q >= 0 && q < t.capacity && t.live[q] && t.generation[q] === generation ? 1 : 0;
}

export function rbaTtSetRoot32(t, q) {
  if (!t.live[q]) return rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
  t.control[RBA_TT_ROOT] = q;
  t.control[RBA_TT_ROOT_GENERATION] = t.generation[q];
  return q;
}

export function rbaTtIntern8x32(t, words, offset, basis, basisOffset, basisSize) {
  if (basisSize < 0 || basisSize > RBA_TT_MAX_BASIS || (basisSize | 0) !== basisSize) {
    rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
    return -1;
  }
  const hash = mix8x32Locator32(words, offset);
  const bucket = hash & t.bucketMask;
  for (let q = t.buckets[bucket]; q !== -1; q = t.link[q]) {
    const base = q * RBA_TT_KEY_WORDS;
    let lane = 0;
    while (lane < RBA_TT_KEY_WORDS && t.keys[base + lane] === words[offset + lane]) lane += 1;
    if (lane === RBA_TT_KEY_WORDS) {
      if (t.refs[q] === 0xffffffff) {
        rbaTtFail32(t, RBA_TT_ERR_CAPACITY);
        return -1;
      }
      t.refs[q] += 1;
      return q;
    }
  }

  const q = t.control[RBA_TT_FREE];
  if (q < 0) {
    rbaTtFail32(t, RBA_TT_ERR_CAPACITY);
    return -1;
  }
  if (t.generation[q] === 0xffffffff) {
    rbaTtFail32(t, RBA_TT_ERR_GENERATION);
    return -1;
  }

  t.control[RBA_TT_FREE] = t.link[q];
  publishSpan32(t.keys, q * RBA_TT_KEY_WORDS, words, offset, RBA_TT_KEY_WORDS);
  publishSpan32(t.basis, q * RBA_TT_MAX_BASIS, basis, basisOffset, basisSize);
  t.basisSize[q] = basisSize;
  t.generation[q] += 1;
  t.live[q] = 1;
  t.refs[q] = 1;
  t.execution[q] = RBA_TT_EXECUTION_FREE;
  t.exact[q] = 0;
  t.lower[q] = 1;
  t.upper[q] = 3;
  t.phase[q] = RBA_TT_PHASE_NEW;
  t.count[q] = 0;
  t.parentHead[q] = -1;
  t.readyMember[q] = 0;
  t.eventMember[q] = 0;
  t.bucket[q] = bucket;
  t.link[q] = t.buckets[bucket];
  t.buckets[bucket] = q;
  t.control[RBA_TT_LIVE] += 1;
  return q;
}

export function rbaTtRetain32(t, q, generation) {
  if (!rbaTtValid32(t, q, generation)) return 0;
  if (t.refs[q] === 0xffffffff) return rbaTtFail32(t, RBA_TT_ERR_CAPACITY);
  t.refs[q] += 1;
  return 1;
}

function rbaTtUnqueueReady32(t, q) {
  if (!t.readyMember[q]) return 0;
  intrusiveRemove32(
    t.control,
    RBA_TT_READY_HEAD,
    RBA_TT_READY_TAIL,
    RBA_TT_READY_COUNT,
    t.readyNext,
    t.readyPrev,
    t.readyMember,
    q,
  );
  t.execution[q] = RBA_TT_EXECUTION_FREE;
  return 1;
}

export function rbaTtRecycle32(t, q) {
  if (!t.live[q] || t.refs[q] || t.execution[q] || t.readyMember[q]
      || t.eventMember[q] || t.count[q] || t.parentHead[q] !== -1) return 0;

  const bucket = t.bucket[q];
  let previous = -1;
  let scan = t.buckets[bucket];
  while (scan !== q && scan !== -1) {
    previous = scan;
    scan = t.link[scan];
  }
  if (scan === -1) return rbaTtFail32(t, RBA_TT_ERR_CONTRACT);

  if (previous === -1) t.buckets[bucket] = t.link[q];
  else t.link[previous] = t.link[q];

  t.live[q] = 0;
  t.link[q] = t.control[RBA_TT_FREE];
  t.control[RBA_TT_FREE] = q;
  t.control[RBA_TT_LIVE] -= 1;
  return 1;
}

export function rbaTtRelease32(t, q, generation) {
  if (!rbaTtValid32(t, q, generation) || !t.refs[q]) return 0;
  t.refs[q] -= 1;
  if (!t.refs[q] && t.readyMember[q]) rbaTtUnqueueReady32(t, q);
  if (!t.refs[q] && t.count[q]) rbaTtSignal32(t, q);
  rbaTtRecycle32(t, q);
  return 1;
}

export function rbaTtEnqueue32(t, q) {
  if (!t.live[q] || !t.refs[q] || t.execution[q] !== RBA_TT_EXECUTION_FREE
      || t.exact[q] || t.phase[q] !== RBA_TT_PHASE_NEW || t.readyMember[q]) return 0;
  t.execution[q] = RBA_TT_EXECUTION_QUEUED;
  intrusiveEnqueueTailStamped32(
    t.control,
    RBA_TT_READY_HEAD,
    RBA_TT_READY_TAIL,
    RBA_TT_READY_COUNT,
    t.readyNext,
    t.readyPrev,
    t.readyMember,
    t.readyGeneration,
    t.generation,
    q,
  );
  return 1;
}

export function rbaTtTake32(t, owner) {
  for (;;) {
    const q = t.control[RBA_TT_READY_HEAD];
    if (q === -1) return -1;
    if (t.readyGeneration[q] !== t.generation[q]
        || t.execution[q] !== RBA_TT_EXECUTION_QUEUED) {
      rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
      return -1;
    }

    intrusivePopHeadStamped32(
      t.control,
      RBA_TT_READY_HEAD,
      RBA_TT_READY_TAIL,
      RBA_TT_READY_COUNT,
      t.readyNext,
      t.readyPrev,
      t.readyMember,
    );

    if (t.refs[q] && !t.exact[q]) {
      t.execution[q] = owner;
      return q;
    }

    t.execution[q] = RBA_TT_EXECUTION_FREE;
    rbaTtRecycle32(t, q);
  }
}

export function rbaTtReleaseExecution32(t, q, owner) {
  if (t.execution[q] !== owner) return rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
  t.execution[q] = RBA_TT_EXECUTION_FREE;
  rbaTtRecycle32(t, q);
  return 1;
}

export function rbaTtSignal32(t, q) {
  if (!t.live[q]) return 0;
  return intrusiveEnqueueOnceTailStamped32(
    t.control,
    RBA_TT_EVENT_HEAD,
    RBA_TT_EVENT_TAIL,
    RBA_TT_EVENT_COUNT,
    t.eventNext,
    t.eventPrev,
    t.eventMember,
    t.eventGeneration,
    t.generation,
    q,
  );
}

export function rbaTtTakeEvent32(t) {
  const q = t.control[RBA_TT_EVENT_HEAD];
  if (q === -1) return -1;
  if (t.eventGeneration[q] !== t.generation[q] || !t.live[q]) {
    rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
    return -1;
  }
  return intrusivePopHeadStamped32(
    t.control,
    RBA_TT_EVENT_HEAD,
    RBA_TT_EVENT_TAIL,
    RBA_TT_EVENT_COUNT,
    t.eventNext,
    t.eventPrev,
    t.eventMember,
  );
}

export function rbaTtTighten32(t, q, lower, upper) {
  if (lower < 1 || upper > 3 || lower > upper
      || (lower | 0) !== lower || (upper | 0) !== upper) {
    return rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
  }
  if (lower < t.lower[q]) lower = t.lower[q];
  if (upper > t.upper[q]) upper = t.upper[q];
  if (lower > upper) return rbaTtFail32(t, RBA_TT_ERR_CONFLICT);
  if (lower === t.lower[q] && upper === t.upper[q]) return 1;
  t.lower[q] = lower;
  t.upper[q] = upper;
  if (lower === upper) t.exact[q] = lower;
  rbaTtSignal32(t, q);
  return 1;
}

export function rbaTtSetExact32(t, q, value) {
  return rbaTtTighten32(t, q, value, value);
}

function rbaTtReleaseEdge32(t, edge) {
  const child = t.child[edge];
  if (child < 0) return 0;
  if (t.edgeAttached[edge]) {
    const previous = t.edgePrev[edge];
    const next = t.edgeNext[edge];
    if (previous === -1) t.parentHead[child] = next;
    else t.edgeNext[previous] = next;
    if (next !== -1) t.edgePrev[next] = previous;
    t.edgeAttached[edge] = 0;
  }
  t.child[edge] = -1;
  rbaTtRelease32(t, child, t.childGeneration[edge]);
  return 1;
}

// Worker-side publication of a prepared relational branch. childMask bit i
// means scratch row i contains an ordinary child q. Scalar-only rows retain
// interval evidence without a child pin. Returns retained child id or -1.
export function rbaTtPublishPrepared7x32(
  t,
  q,
  owner,
  stateLower,
  stateUpper,
  keys,
  keyOffset,
  basis,
  basisOffset,
  basisStride,
  basisSizes,
  labels,
  actionLower,
  actionUpper,
  childMask,
  count,
) {
  if (t.execution[q] !== owner || count < 1 || count > RBA_TT_MAX_EDGES
      || (count | 0) !== count || childMask < 0 || childMask > 0x7f
      || (childMask | 0) !== childMask) {
    rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
    return -1;
  }
  if (!rbaTtTighten32(t, q, stateLower, stateUpper)) return -1;

  const edgeBase = q * RBA_TT_MAX_EDGES;
  for (let index = 0; index < count; index += 1) {
    const lower = actionLower[index];
    const upper = actionUpper[index];
    if (lower < 1 || upper > 3 || lower > upper) {
      rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
      return -1;
    }

    let child = -1;
    if (childMask & (1 << index)) {
      child = rbaTtIntern8x32(
        t,
        keys,
        keyOffset + index * RBA_TT_KEY_WORDS,
        basis,
        basisOffset + index * basisStride,
        basisSizes[index],
      );
      if (child < 0) return -1;
      if (!rbaTtTighten32(t, child, lower, upper)) return -1;
    }

    const edge = edgeBase + index;
    t.child[edge] = child;
    t.childGeneration[edge] = child < 0 ? 0 : t.generation[child];
    t.edgeLabel[edge] = labels[index];
    t.edgeLower[edge] = lower;
    t.edgeUpper[edge] = upper;
    t.edgeAttached[edge] = 0;
    t.edgeNext[edge] = -1;
    t.edgePrev[edge] = -1;
    t.count[q] = index + 1;
  }

  t.phase[q] = RBA_TT_PHASE_PENDING_ATTACH;
  rbaTtSignal32(t, q);

  let next = -1;
  for (let index = 0; index < count; index += 1) {
    const child = t.child[edgeBase + index];
    if (child >= 0 && t.execution[child] === RBA_TT_EXECUTION_FREE
        && !t.exact[child] && t.phase[child] === RBA_TT_PHASE_NEW) {
      t.execution[child] = owner;
      next = child;
      break;
    }
  }

  rbaTtReleaseExecution32(t, q, owner);
  return next;
}

export function rbaTtPublishExactOwned32(t, q, owner, value) {
  if (t.execution[q] !== owner) return rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
  if (!rbaTtSetExact32(t, q, value)) return 0;
  return rbaTtReleaseExecution32(t, q, owner);
}

export function rbaTtAttachDependencies7x32(t, q) {
  if (t.phase[q] !== RBA_TT_PHASE_PENDING_ATTACH) return 0;
  const edgeBase = q * RBA_TT_MAX_EDGES;
  for (let index = 0; index < t.count[q]; index += 1) {
    const edge = edgeBase + index;
    const child = t.child[edge];
    if (child < 0) continue;
    if (!rbaTtValid32(t, child, t.childGeneration[edge])) {
      rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
      return 0;
    }
    const head = t.parentHead[child];
    t.edgeNext[edge] = head;
    t.edgePrev[edge] = -1;
    if (head !== -1) t.edgePrev[head] = edge;
    t.parentHead[child] = edge;
    t.edgeAttached[edge] = 1;
  }
  t.phase[q] = RBA_TT_PHASE_ATTACHED;
  return 1;
}

// Generic Bellman interval reconciliation. minimize=0 selects componentwise
// maxima across actions; minimize=1 selects minima. Exact/pruned child pins are
// released while scalar edge evidence remains.
export function rbaTtReconcile7x32(t, q, minimize) {
  if (t.phase[q] !== RBA_TT_PHASE_ATTACHED || (minimize !== 0 && minimize !== 1)) {
    return rbaTtFail32(t, RBA_TT_ERR_CONTRACT);
  }

  const edgeBase = q * RBA_TT_MAX_EDGES;
  let lower = minimize ? 4 : 0;
  let upper = lower;

  for (let index = 0; index < t.count[q]; index += 1) {
    const edge = edgeBase + index;
    const child = t.child[edge];
    let lo = t.edgeLower[edge];
    let hi = t.edgeUpper[edge];

    if (child >= 0) {
      if (t.lower[child] > lo) lo = t.lower[child];
      if (t.upper[child] < hi) hi = t.upper[child];
    }

    // Parent exact evidence may constrain every child in one universally valid
    // Bellman direction: min-parent lower or max-parent upper.
    if (minimize) {
      if (t.lower[q] > lo) lo = t.lower[q];
    } else if (t.upper[q] < hi) {
      hi = t.upper[q];
    }

    if (lo > hi) return rbaTtFail32(t, RBA_TT_ERR_CONFLICT);
    t.edgeLower[edge] = lo;
    t.edgeUpper[edge] = hi;

    if (minimize) {
      if (lo < lower) lower = lo;
      if (hi < upper) upper = hi;
    } else {
      if (lo > lower) lower = lo;
      if (hi > upper) upper = hi;
    }

    if (child >= 0 && !rbaTtTighten32(t, child, lo, hi)) return 0;
  }

  if (!rbaTtTighten32(t, q, lower, upper)) return 0;

  for (let index = 0; index < t.count[q]; index += 1) {
    const edge = edgeBase + index;
    const child = t.child[edge];
    if (child < 0) continue;
    const lo = t.edgeLower[edge];
    const hi = t.edgeUpper[edge];
    if (lo === hi || (minimize ? lo > t.upper[q] : hi < t.lower[q])) {
      rbaTtReleaseEdge32(t, edge);
    }
  }
  return t.exact[q];
}

export function rbaTtEnqueueDependencies7x32(t, q) {
  const edgeBase = q * RBA_TT_MAX_EDGES;
  let queued = 0;
  for (let index = 0; index < t.count[q]; index += 1) {
    const child = t.child[edgeBase + index];
    if (child >= 0) queued += rbaTtEnqueue32(t, child);
  }
  return queued;
}

export function rbaTtSignalParents32(t, q) {
  let count = 0;
  for (let edge = t.parentHead[q]; edge !== -1; edge = t.edgeNext[edge]) {
    count += rbaTtSignal32(t, (edge / RBA_TT_MAX_EDGES) | 0);
  }
  return count;
}

export function rbaTtDetachDependencies7x32(t, q) {
  const edgeBase = q * RBA_TT_MAX_EDGES;
  const count = t.count[q];
  t.count[q] = 0;
  for (let index = 0; index < count; index += 1) rbaTtReleaseEdge32(t, edgeBase + index);
  t.phase[q] = RBA_TT_PHASE_DETACHED;
  rbaTtRecycle32(t, q);
  return count;
}

export function rbaTtMarkDone32(t) {
  Atomics.store(t.control, RBA_TT_DONE, 1);
  Atomics.add(t.control, RBA_TT_WAKE, 1);
  Atomics.notify(t.control, RBA_TT_WAKE);
  return 1;
}
