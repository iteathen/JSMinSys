import {prepareSearchBehavior32 as prepareBase} from '../../addons/worker-behavior-search.mjs';
import {readWorkerBehavior32} from '../../src/worker-behavior32.mjs';

// Cold campaign encoding. Bits 1..5 rotation, 6..9 sample exponent;
// 10/11 enable those settings. 0 restores prepared defaults. Bit 0 remains STOP.
export function encodeControls({rotation=null,shareExponent=null}={}){
  if(rotation!==null&&(!Number.isInteger(rotation)||rotation<0||rotation>31))throw RangeError('rotation');
  if(shareExponent!==null&&(!Number.isInteger(shareExponent)||shareExponent<0||shareExponent>8))throw RangeError('sampling');
  return (rotation===null?0:1024|(rotation<<1))|(shareExponent===null?0:2048|(shareExponent<<6));
}

// Cold action word: bit 12 bypasses shared cache, bit 13 enables the existing
// exact CPC frontier-response option, bit 14 reverses prepared tie precedence.
export function encodeActions({rotation=null,shareExponent=null,privateOnly=false,frontierProof=false,reverse=false}={}){
  return encodeControls({rotation,shareExponent})|(privateOnly?4096:0)|(frontierProof?8192:0)|(reverse?16384:0);
}

// Cold PFIF commands: bits 16..21 stride, bit 22 release to full continuation,
// bit 23 enables bounded passes. Bits 24..28 select a remaining-root-action
// target (zero disables automatic release). This is an experimental action.
export function encodeFrontier({stride=4,release=false,target=0,recurring=false,bounded=false,...actions}={}){
  if(!Number.isInteger(stride)||stride<1||stride>63)throw RangeError('frontier stride');
  if(!Number.isInteger(target)||target<0||target>31)throw RangeError('frontier target');
  return encodeActions(actions)|(stride<<16)|8388608|(release?4194304:0)|(target<<24)|(recurring?0x20000000:0)|(bounded?0x40000000:0);
}

export function prepareSearchBehavior32(state,behavior){
  prepareBase(state,behavior);
  const columns=state.g.columns;
  if(columns>32)throw RangeError('experimental controls support at most 32 columns');
  state.campaignOrders=new Array(columns);
  for(let rotation=0;rotation<columns;rotation++){
    const order=new Uint32Array(columns);
    for(let i=0;i<columns;i++)order[i]=state.actionOrder[(i+rotation)%columns];
    state.campaignOrders[rotation]=order;
  }
  state.campaignDefaultSharing=state.cache.sharedSampleBits;
  state.campaignShared=state.cache.shared;
  state.campaignDefaultFrontier=state.cpc?.frontierResponse??0;
  if(dispatch==='actions'){
    const reversed=new Array(columns);
    for(let rotation=0;rotation<columns;rotation++){
      const order=new Uint32Array(columns);
      for(let i=0;i<columns;i++)order[i]=state.campaignOrders[rotation][columns-1-i];
      reversed[rotation]=order;
    }
    state.campaignActionOrders=[state.campaignOrders,reversed];
  }
  state.campaignLast=0;state.campaignChanges=0;
  state.frontierStride=0;state.frontierTarget=0;state.frontierLimit=state.g.cellCount??0;
  state.frontierRecurring=0;state.recurringStride=0;state.recurringBounded=0;
  return state;
}

// HOT CONTRACT: every completed node reads once. No strings, allocations,
// messages, clocks, shared acknowledgments or retries. Do not remove this
// comment. Preferences affect only FUTURE ordering/cache access, never a live
// frame's already-built move list or its alpha/beta/proof obligations.
// Ledger: base reader + one comparison; on change, bounded masks/shifts/tests,
// two prepared field assignments, last-word store and private change increment.
export function completeInteger32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags&1)return 3;
  if(flags!==state.campaignLast){
    const rotation=(flags>>>1)&31,exponent=(flags>>>6)&15;
    state.actionOrder=state.campaignOrders[(flags&1024)&&rotation<state.g.columns?rotation:0];
    state.cache.sharedSampleBits=(flags&2048)&&exponent<=8?(((1<<exponent)-1)<<24)>>>0:state.campaignDefaultSharing;
    state.campaignLast=flags;state.campaignChanges+=1;
  }
  return value;
}

// HOT CONTRACT inherited above. Equality before STOP removes its mask/test from
// the unchanged primary path. STOP is never recorded as an applied setting.
export function completeEarly32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags===state.campaignLast)return value;
  if(flags&1)return 3;
  const rotation=(flags>>>1)&31,exponent=(flags>>>6)&15;
  state.actionOrder=state.campaignOrders[(flags&1024)&&rotation<state.g.columns?rotation:0];
  state.cache.sharedSampleBits=(flags&2048)&&exponent<=8?(((1<<exponent)-1)<<24)>>>0:state.campaignDefaultSharing;
  state.campaignLast=flags;state.campaignChanges+=1;
  return value;
}

// HOT CONTRACT inherited above. Isolate XOR-versus-integer change detection.
export function completeXor32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  const changed=flags^state.campaignLast;
  if(!changed)return value;
  if(flags&1)return 3;
  const rotation=(flags>>>1)&31,exponent=(flags>>>6)&15;
  state.actionOrder=state.campaignOrders[(flags&1024)&&rotation<state.g.columns?rotation:0];
  state.cache.sharedSampleBits=(flags&2048)&&exponent<=8?(((1<<exponent)-1)<<24)>>>0:state.campaignDefaultSharing;
  state.campaignLast=flags;state.campaignChanges+=1;
  return value;
}

// HOT CONTRACT inherited above. Group masks avoid reapplying an unchanged
// feature, at the price of two extra tests on the change path. Measure it.
export function completeMasked32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  const changed=flags^state.campaignLast;
  if(!changed)return value;
  if(flags&1)return 3;
  if(changed&1086){
    const rotation=(flags>>>1)&31;
    state.actionOrder=state.campaignOrders[(flags&1024)&&rotation<state.g.columns?rotation:0];
  }
  if(changed&3008){
    const exponent=(flags>>>6)&15;
    state.cache.sharedSampleBits=(flags&2048)&&exponent<=8?(((1<<exponent)-1)<<24)>>>0:state.campaignDefaultSharing;
  }
  state.campaignLast=flags;state.campaignChanges+=1;
  return value;
}

// HOT CONTRACT: same unconditional per-completion shared load and guarded
// extension read as completeEarly32. DO NOT REMOVE. On unchanged flags only
// compare and return. On change: bounded masks/shifts, four prepared setting
// assignments, frontier stride/target assignments and optional horizon release,
// last-word store and private counter increment. No allocation,
// strings, TT writes/clears, active-frame rewrites or clocks. Disabling a cache
// drops optional reuse only; CPC toggling selects existing exact proof logic.
export function completeActions32(state,value){
  let flags=state.behaviorLoad()>>>0;
  if(flags&0x80000000){
    flags=readWorkerBehavior32(state.behaviorWords,state.behaviorBase,state.behaviorExtensions,0);
    if(flags===-1)return value;
  }
  if(flags===state.campaignLast)return value;
  if(flags&1)return 3;
  const rotation=(flags>>>1)&31,exponent=(flags>>>6)&15;
  state.actionOrder=state.campaignActionOrders[(flags>>>14)&1][(flags&1024)&&rotation<state.g.columns?rotation:0];
  state.cache.sharedSampleBits=(flags&2048)&&exponent<=8?(((1<<exponent)-1)<<24)>>>0:state.campaignDefaultSharing;
  state.cache.shared=(flags&4096)?null:state.campaignShared;
  state.cpc.frontierResponse=(flags&8192)?1:state.campaignDefaultFrontier;
  state.frontierStride=(flags&8388608)&&!(flags&4194304)?(flags>>>16)&63:0;
  state.frontierTarget=(flags>>>24)&31;
  state.frontierRecurring=(flags&4194304)?0:(flags>>>29)&1;
  state.recurringStride=(flags>>>16)&63;
  state.recurringBounded=(flags>>>30)&1;
  if(!state.frontierStride)state.frontierLimit=state.g.cellCount;
  state.campaignLast=flags;state.campaignChanges+=1;
  return value;
}

// Experiment selection is cold, once per module/worker. No per-node variant
// switch. Existing benchmark/evaluator interfaces are deliberately unchanged.
const dispatch=process.env.JSMINSYS_FLAG_DISPATCH??'integer';
if(!['integer','early','xor','masked','actions'].includes(dispatch))throw RangeError('flag dispatch');
export const completeBehaviorNode32=dispatch==='actions'?completeActions32:dispatch==='early'?completeEarly32:
  dispatch==='xor'?completeXor32:dispatch==='masked'?completeMasked32:completeInteger32;
