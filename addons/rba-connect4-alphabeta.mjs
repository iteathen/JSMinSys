import {mixSpan32Locator32,publishSpan32} from '../src/widekey32.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {prepareConnect4RbaCoordinateScratch} from './rba-connect4-geometry.mjs';
import {connect4RbaCofactorKnownHeight,connect4RbaCanonicalize,connect4RbaTerminal,connect4RbaRank} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront} from './rba-connect4-front.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32,CPC_EXACT,CPC_BOUND,CPC_RESTRICT} from './cpc-connect4.mjs';

export const RBA_AB_CPC_ONLY=0;
export const RBA_AB_CPC_FOUR_FRONT=1;

export function createConnect4RbaExactCache32({capacity=65536,keyWords}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1)throw new RangeError('invalid exact cache');
  return {mask:capacity-1,keyWords,epoch:1,stamp:new Uint32Array(capacity),value:new Uint8Array(capacity),
    keys:new Uint32Array(capacity*keyWords)};
}
function probeConnect4RbaExactCacheSlot32(cache,words,offset,slot){
  if(cache.stamp[slot]!==cache.epoch)return 0;
  const keyWords=cache.keyWords,base=slot*keyWords,keys=cache.keys;
  if(keyWords===14){
    if((keys[base]^words[offset])|(keys[base+1]^words[offset+1])|
       (keys[base+2]^words[offset+2])|(keys[base+3]^words[offset+3])|
       (keys[base+4]^words[offset+4])|(keys[base+5]^words[offset+5])|
       (keys[base+6]^words[offset+6])|(keys[base+7]^words[offset+7])|
       (keys[base+8]^words[offset+8])|(keys[base+9]^words[offset+9])|
       (keys[base+10]^words[offset+10])|(keys[base+11]^words[offset+11])|
       (keys[base+12]^words[offset+12])|(keys[base+13]^words[offset+13]))return 0;
  }else if(keyWords===7){
    if((keys[base]^words[offset])|(keys[base+1]^words[offset+1])|
       (keys[base+2]^words[offset+2])|(keys[base+3]^words[offset+3])|
       (keys[base+4]^words[offset+4])|(keys[base+5]^words[offset+5])|
       (keys[base+6]^words[offset+6]))return 0;
  }else for(let w=0;w<keyWords;w+=1)if(keys[base+w]!==words[offset+w])return 0;
  return cache.value[slot];
}
function storeConnect4RbaExactCacheSlot32(cache,words,offset,value,slot){
  const keyWords=cache.keyWords;
  publishSpan32(cache.keys,slot*keyWords,words,offset,keyWords);
  cache.value[slot]=value;cache.stamp[slot]=cache.epoch;return value;
}
export function probeConnect4RbaExactCache32(cache,words,offset){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask;
  return probeConnect4RbaExactCacheSlot32(cache,words,offset,slot);
}
export function storeConnect4RbaExactCache32(cache,words,offset,value){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask;
  return storeConnect4RbaExactCacheSlot32(cache,words,offset,value,slot);
}
function resetConnect4RbaExactCache32(cache){
  let epoch=(cache.epoch+1)>>>0;
  if(!epoch){cache.stamp.fill(0);epoch=1;}
  cache.epoch=epoch;
}

function absToRelative(value,mover){return value===2?0:mover===0?value-2:2-value;}
function relativeToAbs(value,mover){return value===0?2:mover===0?value+2:2-value;}
export function prepareConnect4RbaAlphaBeta({
  geometry,
  mode=RBA_AB_CPC_ONLY,
  boundaryDepth=2,
  boundaryCapacity=256,
  boundaryBudget=100000,
  cacheCapacity=65536,
  cpcFrontierResponse=false,
  cpcProjectedAdvisory=false,
}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(mode!==RBA_AB_CPC_ONLY&&mode!==RBA_AB_CPC_FOUR_FRONT)throw new RangeError('invalid alpha-beta mode');
  const g=geometry,profile=prepareConnect4RbaExecutionProfile(g),levels=g.cellCount+1;
  return {g,profile,mode,cpc:prepareConnect4CpcScratch(g,{frontierResponse:cpcFrontierResponse,projectedAdvisory:cpcProjectedAdvisory}),coord:prepareConnect4RbaCoordinateScratch(g),
    front:mode===RBA_AB_CPC_FOUR_FRONT
      ?prepareConnect4RbaFrontArena(g,{depth:boundaryDepth,capacity:boundaryCapacity,budget:boundaryBudget,profile})
      :null,
    words:new Uint32Array(levels*g.keyWords),basis:new Uint32Array(levels*g.maxBasis),
    basisSize:new Uint32Array(levels),cache:createConnect4RbaExactCache32({capacity:cacheCapacity,keyWords:g.keyWords}),
    actionLo:mode===RBA_AB_CPC_FOUR_FRONT?new Int8Array(levels*g.columns):null,
    actionHi:mode===RBA_AB_CPC_FOUR_FRONT?new Int8Array(levels*g.columns):null,
    actionKnown:mode===RBA_AB_CPC_FOUR_FRONT?new Uint8Array(levels*g.columns):null,
    nodes:0,cutoffs:0,cacheHits:0,cpcExact:0,cpcBounds:0,cpcRestrictions:0,cpcForced:0,cpcPrecursors:0,cpcProjectedForks:0,
    frontCalls:0,frontExact:0,frontFailures:0,frontSteps:0,frontActionExact:0,
    cofactors:0};
}

function frontEvidence(state,words,offset,basis,basisOffset,basisSize){
  const a=state.front,g=state.g;
  state.frontCalls+=1;
  const result=buildConnect4RbaFourFront(g,a,words,offset,basis,basisOffset,basisSize);
  state.frontSteps+=a.steps;
  if(result){state.frontFailures+=1;return -1;}
  const packed=queryConnect4RbaFourFront(g,a,0,words,offset);
  if((packed&3)===(packed>>>2))state.frontExact+=1;
  return packed;
}

function search(state,depth,alpha,beta){
  const g=state.g,keyOffset=depth*g.keyWords,basisOffset=depth*g.maxBasis,alphaOrig=alpha,betaOrig=beta;
  const words=state.words,basis=state.basis,n=state.basisSize[depth],meta=words[keyOffset+g.metaOffset];
  const mover=(meta>>>2)&1;
  state.nodes+=1;

  // search() is reached only after connect4RbaCofactor returned nonterminal;
  // terminal cofactors are consumed directly by the parent. Root terminal
  // handling remains in solveConnect4RbaAlphaBeta().
  const cache=state.cache,cacheSlot=mixSpan32Locator32(words,keyOffset,cache.keyWords)&cache.mask;
  const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot);
  if(cached){state.cacheHits+=1;return absToRelative(cached,mover);}

  const cpcKind=evaluateConnect4CpcNonterminal32(g,words,keyOffset,basis,basisOffset,n,state.cpc);
  if(state.cpc.projectedAdvisory)state.cpcProjectedForks+=state.cpc.projectedForks[0]+state.cpc.projectedForks[1];
  state.cpcPrecursors+=state.cpc.precursorCount[0];
  if(cpcKind===CPC_EXACT){
    state.cpcExact+=1;const value=state.cpc.interval[0];
    storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,value,cacheSlot);
    return absToRelative(value,mover);
  }
  if(cpcKind===CPC_BOUND)state.cpcBounds+=1;
  else if(cpcKind===CPC_RESTRICT)state.cpcRestrictions+=1;
  if(state.cpc.forcedColumn[0]>=0)state.cpcForced+=1;

  let semanticLo,semanticHi;
  if(mover===0){semanticLo=state.cpc.interval[0]-2;semanticHi=state.cpc.interval[1]-2;}
  else{semanticLo=2-state.cpc.interval[1];semanticHi=2-state.cpc.interval[0];}
  if(state.mode===RBA_AB_CPC_FOUR_FRONT){
    const packed=frontEvidence(state,words,keyOffset,basis,basisOffset,n);
    if(packed>=0){
      const lo=packed&3,hi=packed>>>2,
        frontLo=mover===0?lo-2:2-hi,frontHi=mover===0?hi-2:2-lo;
      if(frontLo>semanticLo)semanticLo=frontLo;
      if(frontHi<semanticHi)semanticHi=frontHi;
    }
  }
  if(semanticLo===semanticHi){
    const abs=relativeToAbs(semanticLo,mover);storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,abs,cacheSlot);return semanticLo;
  }
  if(semanticLo>=beta){state.cutoffs+=1;return semanticLo;}
  if(semanticHi<=alpha){state.cutoffs+=1;return semanticHi;}
  if(semanticLo>alpha)alpha=semanticLo;
  if(semanticHi<beta)beta=semanticHi;

  const forced=state.cpc.forcedColumn[0],preemptCount=state.cpc.preemptionCount[0],preemptMask=state.cpc.preemptionMask32[0],
    usePreempt=preemptCount>1,useFront=state.mode===RBA_AB_CPC_FOUR_FRONT&&state.front&&state.front.depth,row=depth*g.columns,
    childDepth=depth+1,childKey=keyOffset+g.keyWords,childBasis=basisOffset+g.maxBasis,
    actionStart=forced>=0?g.priorityByColumn[forced]:0,actionEnd=forced>=0?actionStart+1:g.columns;
  let legal=0;
  // Four-Front needs a parent action-bound prepass because the reusable arena
  // is overwritten by child recursion. CPC-only mode needs no such pass: the
  // ordinary search loop can detect whether any action survives its filters.
  if(useFront){
    for(let oi=actionStart;oi<actionEnd;oi+=1){
      const column=g.actionOrder[oi];
      if(words[keyOffset+column]>=g.rows||(usePreempt&&!(preemptMask&((1<<column)>>>0))))continue;
      legal+=1;
      const packed=queryConnect4RbaFourFront(g,state.front,state.front.actionBase+column*4,words,keyOffset);
      const lo=packed&3,hi=packed>>>2,
        relLo=mover===0?lo-2:2-hi,relHi=mover===0?hi-2:2-lo;
      state.actionLo[row+column]=relLo;state.actionHi[row+column]=relHi;state.actionKnown[row+column]=1;
      if(relLo===relHi)state.frontActionExact+=1;
    }
    if(!legal)return 0;
  }

  let best=-2,cut=0;
  for(let oi=actionStart;oi<actionEnd;oi+=1){
    const column=g.actionOrder[oi],height=words[keyOffset+column];
    if(height>=g.rows||(usePreempt&&!(preemptMask&((1<<column)>>>0))))continue;
    if(!useFront)legal=1;
    let value;
    if(useFront&&state.actionKnown[row+column]&&state.actionLo[row+column]===state.actionHi[row+column]){
      value=state.actionLo[row+column];
    }else{
      if(useFront&&state.actionKnown[row+column]&&state.actionHi[row+column]<=alpha){state.cutoffs+=1;continue;}
      const term=connect4RbaCofactorKnownHeight(g,state.profile,words,keyOffset,basis,basisOffset,n,column,height,
        words,childKey,basis,childBasis,state.coord.seen,state.basisSize,childDepth,state.coord.map,state.coord.inverse);
      state.cofactors+=1;
      if(term)value=absToRelative(term,mover);
      else{
        connect4RbaCanonicalize(g,state.profile,words,childKey,basis,childBasis,state.basisSize[childDepth],state.coord);
        value=-search(state,childDepth,-beta,-alpha);
      }
    }
    if(value>best)best=value;
    if(value>alpha)alpha=value;
    if(alpha>=beta){state.cutoffs+=1;cut=1;break;}
    if(best===1)break;
  }
  if(!legal)return 0;
  if(best===-2)best=semanticLo;
  // Only full-window, non-cut nodes are cached as exact. Narrow-window returns
  // may be valid alpha/beta bounds but are not global q truth.
  if(!cut&&alphaOrig===-2&&betaOrig===2){
    const abs=relativeToAbs(best,mover);storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,abs,cacheSlot);
  }
  return best;
}

export function solveConnect4RbaAlphaBeta(root,{state,reflected=0}={}){
  if(!state)throw new TypeError('prepared alpha-beta state required');
  const g=state.g;
  resetConnect4RbaExactCache32(state.cache);
  state.nodes=state.cutoffs=state.cacheHits=state.cpcExact=state.cpcBounds=state.cpcRestrictions=state.cpcForced=state.cpcPrecursors=state.cpcProjectedForks=0;
  state.frontCalls=state.frontExact=state.frontFailures=state.frontSteps=state.frontActionExact=state.cofactors=0;
  publishSpan32(state.words,0,root.words,0,g.keyWords);publishSpan32(state.basis,0,root.basis,0,root.basis.length);
  state.basisSize[0]=root.basis.length;
  const rootMeta=state.words[g.metaOffset],mover=(rootMeta>>>2)&1,terminal=rootMeta&3;
  if(terminal)return {value:terminal,relative:absToRelative(terminal,mover),move:-1,metrics:metrics(state)};
  const cpcKind=evaluateConnect4CpcNonterminal32(g,state.words,0,state.basis,0,state.basisSize[0],state.cpc);
  let rootLo=state.cpc.interval[0],rootHi=state.cpc.interval[1];
  state.cpcPrecursors+=state.cpc.precursorCount[0];
  if(cpcKind===CPC_EXACT)state.cpcExact+=1;else if(cpcKind===CPC_BOUND)state.cpcBounds+=1;else if(cpcKind===CPC_RESTRICT)state.cpcRestrictions+=1;
  if(state.cpc.forcedColumn[0]>=0)state.cpcForced+=1;
  if(state.mode===RBA_AB_CPC_FOUR_FRONT){
    const packed=frontEvidence(state,state.words,0,state.basis,0,state.basisSize[0]);
    if(packed>=0){
      const absLo=packed&3,absHi=packed>>>2;
      if(absLo>rootLo)rootLo=absLo;if(absHi<rootHi)rootHi=absHi;
    }
  }
  const rootExact=rootLo===rootHi?absToRelative(rootLo,mover):null,
    rootSemanticLo=mover===0?rootLo-2:2-rootHi,
    rootSemanticHi=mover===0?rootHi-2:2-rootLo;

  // A two-value exact CPC interval needs only one W/D/L threshold test at the
  // root. Keep the historical full window for the unconstrained three-value
  // domain so exact-cache qualification semantics remain unchanged there.
  let alpha=-2,beta=2;
  if(rootExact===null&&rootSemanticHi-rootSemanticLo===1){
    alpha=rootSemanticLo;beta=rootSemanticHi;
  }
  let best=-2,bestMove=-1;
  const forced=state.cpc.forcedColumn[0],preemptCount=state.cpc.preemptionCount[0],preemptMask=state.cpc.preemptionMask32[0],
    usePreempt=preemptCount>1,row=0,childKey=g.keyWords,childBasis=g.maxBasis,
    forcedCaller=forced<0?-1:reflected?g.mirrorColumn[forced]:forced,
    actionStart=forcedCaller>=0?g.priorityByColumn[forcedCaller]:0,actionEnd=forcedCaller>=0?actionStart+1:g.columns;
  if(state.mode===RBA_AB_CPC_FOUR_FRONT&&state.front&&state.front.depth){
    for(let callerIndex=actionStart;callerIndex<actionEnd;callerIndex+=1){
      const caller=g.actionOrder[callerIndex],column=reflected?g.mirrorColumn[caller]:caller;
      if(state.words[column]>=g.rows||(usePreempt&&!(preemptMask&((1<<column)>>>0))))continue;
      const packed=queryConnect4RbaFourFront(g,state.front,state.front.actionBase+column*4,state.words,0);
      const lo=packed&3,hi=packed>>>2;
      state.actionLo[row+column]=mover===0?lo-2:2-hi;
      state.actionHi[row+column]=mover===0?hi-2:2-lo;
      state.actionKnown[row+column]=1;
    }
  }
  for(let callerIndex=actionStart;callerIndex<actionEnd;callerIndex+=1){
    const caller=g.actionOrder[callerIndex],column=reflected?g.mirrorColumn[caller]:caller,
      height=state.words[column];
    if(height>=g.rows||(usePreempt&&!(preemptMask&((1<<column)>>>0))))continue;
    // If the mover's exact root value is a loss, every surviving legal action
    // has that same value. The first initialization-ordered action is therefore
    // already the deterministic optimal witness.
    if(rootExact===-1){best=-1;bestMove=caller;break;}
    let value;
    if(state.mode===RBA_AB_CPC_FOUR_FRONT&&state.actionKnown[row+column]&&state.actionLo[row+column]===state.actionHi[row+column]){
      value=state.actionLo[row+column];state.frontActionExact+=1;
    }else{
    const term=connect4RbaCofactorKnownHeight(g,state.profile,state.words,0,state.basis,0,state.basisSize[0],column,height,
      state.words,childKey,state.basis,childBasis,state.coord.seen,state.basisSize,1,state.coord.map,state.coord.inverse);
    state.cofactors+=1;
    if(term)value=absToRelative(term,mover);
    else{
      connect4RbaCanonicalize(g,state.profile,state.words,childKey,state.basis,childBasis,state.basisSize[1],state.coord);
      if(rootExact!==null){
        // Exact root W/D/L only needs a one-step discrimination window to find
        // the first action attaining that known value. For root win/draw the
        // corresponding child target is -1/0 respectively.
        const childAlpha=-rootExact;
        value=-search(state,1,childAlpha,childAlpha+1);
      }else value=-search(state,1,-beta,-alpha);
    }
    }
    if(value>best){best=value;bestMove=caller;}
    if(value>alpha)alpha=value;
    if(rootExact!==null&&value===rootExact){best=rootExact;bestMove=caller;break;}
    if(rootExact===null&&(best===1||alpha>=beta))break;
  }
  const relative=rootExact!==null?rootExact:best;
  return {value:relativeToAbs(relative,mover),relative,move:bestMove,metrics:metrics(state)};
}
function metrics(s){return {nodes:s.nodes,cutoffs:s.cutoffs,cacheHits:s.cacheHits,cpcExact:s.cpcExact,cpcBounds:s.cpcBounds,
  cpcRestrictions:s.cpcRestrictions,cpcForced:s.cpcForced,cpcPrecursors:s.cpcPrecursors,cpcProjectedForks:s.cpcProjectedForks,
  frontCalls:s.frontCalls,frontExact:s.frontExact,
  frontFailures:s.frontFailures,frontSteps:s.frontSteps,frontActionExact:s.frontActionExact,cofactors:s.cofactors};}
