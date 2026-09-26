import {readWorkerBehavior32} from '../src/worker-behavior32.mjs';

export const WORKER_BEHAVIOR_STOP = 1;
export const WORKER_SEARCH_CANCELLED = 3; // Outside relative WDL [-1,1].

export function prepareSearchBehavior32(state, behavior) {
  if (!behavior || typeof behavior.loadPrimary !== 'function')
    throw new TypeError('prepared atomic behavior worker required');
  state.behaviorLoad = behavior.loadPrimary;
  state.behaviorByteOffset = behavior.behaviorByteOffset;
  state.behaviorBase = behavior.behaviorBase;
  state.behaviorWords = behavior.behaviorWords;
  state.behaviorExtensions = behavior.behaviorExtensions;
  return state;
}

// HOT CONTRACT: every completed-node/forced-transit boundary calls this once.
// Never sample, cache the primary across nodes, allocate, stringify, message,
// acknowledge, spin, or move the read to initialization. Preserve this comment.
// The ordinary worker does not call this function. Publication overlap defers
// only the inconsistent extended update, never a valid primary-only STOP.
export function completeBehaviorNode32(state, value) {
  let flags = state.behaviorLoad(state.behaviorByteOffset) >>> 0;
  if (flags & 0x80000000) {
    flags = readWorkerBehavior32(state.behaviorWords, state.behaviorBase, state.behaviorExtensions, 0);
    if (flags === -1) return value;
  }
  return flags & WORKER_BEHAVIOR_STOP ? WORKER_SEARCH_CANCELLED : value;
}
