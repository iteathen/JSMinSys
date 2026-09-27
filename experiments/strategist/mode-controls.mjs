import {prepareSearchBehavior32 as prepareBase} from '../../addons/worker-behavior-search.mjs';
import {readWorkerBehavior32} from '../../src/worker-behavior32.mjs';

// This cold-selected experiment has its own payload: 0 STOP, 1 SHALLOW,
// 2..7 band width. Deep is zero. Strategy lives exclusively in the publisher.
export function encodeSearchMode({shallow=false,stride=2}={}){
  if(!Number.isInteger(stride)||stride<1||stride>63)throw RangeError('mode stride');
  return shallow?2|(stride<<2):0;
}
export function prepareSearchBehavior32(state,behavior){
  prepareBase(state,behavior);
  state.searchShallow=0;state.modeStride=2;state.campaignLast=0;state.campaignChanges=0;
  return state;
}

// HOT: DO NOT REMOVE. One prepared shared load at EVERY completed node.
// Unchanged primary: extension test, equality test, return. Changed primary:
// STOP test, two numeric setting stores, last-word store, change counter.
// No narrowing/yield/expansion decisions, messages, allocations or TT writes.
// Extended publication retains the established bounded consistency reader.
export function completeModeNode32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags===state.campaignLast)return value;
  if(flags&1)return 3;
  state.searchShallow=(flags>>>1)&1;
  state.modeStride=((flags>>>2)&63)||1;
  state.campaignLast=flags;state.campaignChanges+=1;
  return value;
}
export {completeModeNode32 as completeBehaviorNode32};
