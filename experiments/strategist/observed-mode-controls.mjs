import {prepareSearchBehavior32 as prepareBase} from './mode-controls.mjs';
import {readWorkerBehavior32} from '../../src/worker-behavior32.mjs';
import {createPendingObservation,bindPendingObservation} from './pending-observation.mjs';

export function prepareSearchBehavior32(state,behavior){
  prepareBase(state,behavior);
  state.observeCounts=new Uint32Array(state.g.cellCount+1);
  state.observePending=0;state.observeRequest=0;state.observeEpoch=0;
  bindPendingObservation(state,createPendingObservation(1,state.g.columns,state.g.rows),0);
  return state;
}

// HOT: retain one prepared flag load per completed node. DO NOT REMOVE.
// Unchanged primary follows the original read/extension/equality return path.
// On a changed request bit (8), arm a RAW snapshot for the next branch boundary.
// No width calculation or decision; the strategist owns request timing/modes.
export function completeBehaviorNode32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags===state.campaignLast)return value;
  if(flags&1)return 3;
  if((flags^state.campaignLast)&256){state.observePending=1;state.observeRequest=flags&256;}
  state.searchShallow=(flags>>>1)&1;state.modeStride=((flags>>>2)&63)||1;
  state.campaignLast=flags;state.campaignChanges++;
  return value;
}
