import {Worker} from './worker.mjs';
import {readWorkerBehavior32} from '../src/worker-behavior32.mjs';

// Twenty active bytes per worker. 128-byte stride avoids two workers sharing
// a 64-byte cache line even without a JS guarantee of base-address alignment.
export const WORKER_BEHAVIOR_STRIDE32 = 32;

// Cold-only preparation. Fixed shared Wasm memory permits an i32.atomic.load
// without the generic JS AtomicsLoad builtin. See docs/worker-behavior.md for
// the scoped admission and the complete cost boundary; no memory growth.
export function createWorkerBehaviorMemory32(workerCount) {
  if (!Number.isSafeInteger(workerCount) || workerCount < 1 || workerCount > 32768)
    throw new RangeError('invalid behavior worker count');
  const pages = Math.ceil(workerCount * WORKER_BEHAVIOR_STRIDE32 * 4 / 65536);
  return new WebAssembly.Memory({initial:pages,maximum:pages,shared:true});
}

export function prepareWorkerBehaviorLoad32(memory) {
  if (!(memory instanceof WebAssembly.Memory) || !(memory.buffer instanceof SharedArrayBuffer))
    throw new TypeError('shared WebAssembly behavior memory required');
  // (import "m" "m" (memory 1 65536 shared))
  // (func (export "load") (param i32) (result i32)
  //   local.get 0; i32.atomic.load align=4 offset=0)
  const bytes = new Uint8Array([
    0,97,115,109,1,0,0,0,
    1,6,1,0x60,1,0x7f,1,0x7f,
    2,11,1,1,109,1,109,2,3,1,0x80,0x80,4,
    3,2,1,0,
    7,8,1,4,108,111,97,100,0,0,
    10,10,1,8,0,0x20,0,0xfe,0x10,2,0,0x0b,
  ]);
  const read = new WebAssembly.Instance(new WebAssembly.Module(bytes),{m:{m:memory}}).exports.load;
  // Compile/tier the tiny callable during preparation, before search.
  for (let i=0;i<100000;i+=1) read(0);
  return read;
}

// Cold setup. Flags are persistent desired behavior, not a reliable event queue.
// The application owns bit meanings and safe polling boundaries.
export function createWorkerBehavior32(workerCount) {
  if (!Number.isSafeInteger(workerCount) || workerCount < 1 ||
      !Number.isSafeInteger(workerCount * WORKER_BEHAVIOR_STRIDE32 * 4))
    throw new RangeError('invalid behavior worker count');
  return new Uint32Array(new SharedArrayBuffer(workerCount * WORKER_BEHAVIOR_STRIDE32 * 4));
}

function validateWorkerBehavior32(words, workerIndex) {
  if (!(words instanceof Uint32Array) || !(words.buffer instanceof SharedArrayBuffer) ||
      words.length % WORKER_BEHAVIOR_STRIDE32)
    throw new TypeError('prepared shared worker behavior words required');
  if (!Number.isInteger(workerIndex) || workerIndex < 0 ||
      workerIndex >= words.length / WORKER_BEHAVIOR_STRIDE32)
    throw new RangeError('invalid behavior worker index');
  return workerIndex * WORKER_BEHAVIOR_STRIDE32;
}

// Sole strategist writer. Four 31-bit payloads; extension markers are derived.
// No worker clears, acknowledges or writes this span. Do not bypass this
// publisher with raw stores during execution: readers rely on its versioning.
export function publishWorkerBehavior32(words, workerIndex, flags0, flags1 = 0, flags2 = 0, flags3 = 0) {
  const base = validateWorkerBehavior32(words, workerIndex);
  if (flags0 !== (flags0 & 0x7fffffff) || flags1 !== (flags1 & 0x7fffffff) ||
      flags2 !== (flags2 & 0x7fffffff) || flags3 !== (flags3 & 0x7fffffff))
    throw new RangeError('behavior flags must be 31-bit unsigned integers');
  const version = Atomics.load(words, base + 4);
  if ((version & 1) || version >= 0xfffffffe)
    throw new RangeError('behavior version busy or exhausted; replace after reader shutdown');

  Atomics.store(words, base + 4, version + 1);
  if (flags3) {
    Atomics.store(words, base + 3, flags3);
    flags2 |= 0x80000000;
  }
  if (flags2) {
    Atomics.store(words, base + 2, flags2);
    flags1 |= 0x80000000;
  }
  if (flags1) {
    Atomics.store(words, base + 1, flags1);
    flags0 |= 0x80000000;
  }
  Atomics.store(words, base, flags0);
  Atomics.store(words, base + 4, version + 2);
}

// Optional nominal worker base. Select the concrete worker during preparation;
// never add an "if behavior enabled" predicate to an existing worker loop.
// This class defines no scheduler, PFIF decisions, stop policy, or domain flags.
export class BehaviorWorker extends Worker {
  constructor(owner, behaviorWords, workerIndex, memory = null) {
    super(owner);
    this.behaviorBase = validateWorkerBehavior32(behaviorWords, workerIndex);
    this.behaviorWords = behaviorWords;
    this.behaviorExtensions = new Uint32Array(3);
    if (memory !== null && behaviorWords.buffer !== memory.buffer)
      throw new TypeError('behavior words and reader must share the same memory');
    this.loadPrimary = memory === null ? null : prepareWorkerBehaviorLoad32(memory);
    this.behaviorByteOffset = behaviorWords.byteOffset + this.behaviorBase * 4;
  }

  readBehavior32() {
    if (this.loadPrimary !== null) {
      const primary = this.loadPrimary(this.behaviorByteOffset) >>> 0;
      if (!(primary & 0x80000000)) return primary;
    }
    return readWorkerBehavior32(this.behaviorWords, this.behaviorBase, this.behaviorExtensions, 0);
  }
}
