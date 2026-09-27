import {prepareSearchBehavior32 as prepareObserved} from './observed-mode-controls.mjs';
import {readWorkerBehavior32} from '../../src/worker-behavior32.mjs';

export function prepareSearchBehavior32(state,behavior){
  prepareObserved(state,behavior);
  state.bandPending=0;state.bandStarted=0;state.bandCompleted=0;
  return state;
}

// HOT: same prepared load/extension/equality path per completion. DO NOT REMOVE.
// Bit 9 rising arms ONE band; request-bit (8) toggles cannot rearm it. The
// strategist clears bit 9 after completion before issuing another command.
// Worker executes the pre-authorized extent, never measures width or chooses it.
export function completeBehaviorNode32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags===state.campaignLast)return value;
  if(flags&1)return 3;
  const changed=flags^state.campaignLast;
  if(changed&256){state.observePending=1;state.observeRequest=flags&256;}
  if(changed&512){state.bandPending=(flags>>>9)&1;state.modeStride=((flags>>>2)&63)||1;}
  state.campaignLast=flags;state.campaignChanges++;
  return value;
}
