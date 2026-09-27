import {encodeSearchMode} from './mode-controls.mjs';
export const WIDTH_POLICIES=['modes-width-delta','modes-width-relative','modes-width-observe'];

// Strategist only. No clock, TT occupancy or node-count proxy is accepted.
// The observer must identify its width semantics and submit complete samples.
export function createWidthPolicy({growthPercent=0,stride=2}={}){
  if(!Number.isInteger(growthPercent)||growthPercent<0||growthPercent>1000)throw RangeError('growth percent');
  return {scope:null,revision:0,width:0,delta:0,flags:0,changes:0,
    growthPercent,shallowFlags:encodeSearchMode({shallow:true,stride})};
}
export function advanceWidthPolicy(state,sample){
  if(!sample.complete)return state.flags;
  const {scope,revision,width}=sample;
  if(!Number.isSafeInteger(scope)||!Number.isSafeInteger(revision)||revision<1||
    !Number.isSafeInteger(width)||width<0)throw RangeError('width sample');
  if(state.scope!==scope){
    state.scope=scope;state.revision=revision;state.width=width;state.delta=0;
    if(state.flags){state.flags=0;state.changes++;}
    return state.flags;
  }
  if(revision<=state.revision)return state.flags;
  const delta=width-state.width;
  let next=state.flags;
  if(delta<0)next=0;
  else if(delta>0&&delta*100>=state.width*state.growthPercent)next=state.shallowFlags;
  if(next!==state.flags){state.flags=next;state.changes++;}
  state.revision=revision;state.width=width;state.delta=delta;
  return state.flags;
}
