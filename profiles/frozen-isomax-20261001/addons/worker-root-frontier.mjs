import {prepareSearchBehavior32} from './worker-behavior-search.mjs';
import {readWorkerBehavior32} from '../src/worker-behavior32.mjs';

// Cold encoding. Keep the selected campaign's numeric protocol: STOP bit 0;
// stride bits 16..21; release bit 22; bounded bit 23; target bits 24..28.
// Unrelated experimental action bits have no meaning in this worker profile.
export function encodeRootFrontier32({stride=2,target=1,release=false}={}){
  if(!Number.isInteger(stride)||stride<1||stride>63)throw RangeError('frontier stride');
  if(!Number.isInteger(target)||target<0||target>31)throw RangeError('frontier target');
  return (stride<<16)|8388608|(release?4194304:0)|(target<<24);
}

export function prepareRootFrontierBehavior32(state,behavior){
  prepareSearchBehavior32(state,behavior);
  state.frontierLast=-1;
  state.frontierStride=0;state.frontierTarget=0;state.frontierLimit=state.g.cellCount;
  return state;
}

// HOT CONTRACT — preserve this comment and its transitive requirements.
// Exactly one prepared atomic primary read at every completed-node boundary.
// Unchanged word: extension test, equality test, return. No allocation, strings,
// clocks, messages, acknowledgments, retries, move-order changes or TT changes.
// Decode only changed flags. Extended publication overlap defers the update.
// This channel changes future frontier work; it never makes unfinished WDL exact.
export function completeRootFrontierNode32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags===state.frontierLast)return value;
  if(flags&1)return 3;
  state.frontierStride=(flags&8388608)&&!(flags&4194304)?(flags>>>16)&63:0;
  state.frontierTarget=(flags>>>24)&31;
  if(!state.frontierStride)state.frontierLimit=state.g.cellCount;
  state.frontierLast=flags;
  return value;
}
