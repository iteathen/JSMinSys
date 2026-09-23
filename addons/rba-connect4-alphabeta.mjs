import {mixSpan32Locator32,publishSpan32} from '../src/widekey32.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {prepareConnect4RbaCoordinateScratch} from './rba-connect4-geometry.mjs';
import {connect4RbaCofactor,connect4RbaCanonicalize,connect4RbaTerminal,connect4RbaRank} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront} from './rba-connect4-front.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4Cpc32,CPC_EXACT} from './cpc-connect4.mjs';

export const RBA_AB_CPC_ONLY=0;
export const RBA_AB_CPC_FOUR_FRONT=1;

export function createConnect4RbaExactCache32({capacity=65536,keyWords}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1)throw new RangeError('invalid exact cache');
  return {mask:capacity-1,keyWords,valid:new Uint8Array(capacity),value:new Uint8Array(capacity),
    keys:new Uint32Array(capacity*keyWords)};
}
export function probeConnect4RbaExactCache32(cache,words,offset){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask;
  if(!cache.valid[slot])return 0;
  const base=slot*cache.keyWords;
  for(let w=0;w<cache.keyWords;w+=1)if(cache.keys[base+w]!==words[offset+w])return 0;
  return cache.value[slot];
}
export function storeConnect4RbaExactCache32(cache,words,offset,value){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask;
  publishSpan32(cache.keys,slot*cache.keyWords,words,offset,cache.keyWords);
  cache.value[slot]=value;cache.valid[slot]=1;return value;
}

function absToRelative(value,mover){return value===2?0:mover===0?value-2:2-value;}
function relativeToAbs(value,mover){return value===0?2:mover===0?value+2:2-value;}
function intervalToRelative(lo,hi,mover){
  return mover===0?[lo-2,hi-2]:[2-hi,2-lo];
}

export function prepareConnect4RbaAlphaBeta({
  geometry,
  mode=RBA_AB_CPC_ONLY,
  boundaryDepth=2,
  boundaryCapacity=256,
  boundaryBudget=100000,
  cacheCapacity=65536,
}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(mode!==RBA_AB_CPC_ONLY&&mode!==RBA_AB_CPC_FOUR_FRONT)throw new RangeError('invalid alpha-beta mode');
  const g=geometry,profile=prepareConnect4RbaExecutionProfile(g),levels=g.cellCount+1;
  return {g,profile,mode,cpc:prepareConnect4CpcScratch(g),coord:prepareConnect4RbaCoordinateScratch(g),
    front:mode===RBA_AB_CPC_FOUR_FRONT
      ?prepareConnect4RbaFrontArena(g,{depth:boundaryDepth,capacity:boundaryCapacity,budget:boundaryBudget,profile})
      :null,
    words:new Uint32Array(levels*g.keyWords),basis:new Uint32Array(levels*g.maxBasis),
    basisSize:new Uint32Array(levels),cache:createConnect4RbaExactCache32({capacity:cacheCapacity,keyWords:g.keyWords}),
    order:new Uint32Array(levels*g.columns),orderScore:new Int32Array(levels*g.columns),actionLo:new Int8Array(levels*g.columns),
    actionHi:new Int8Array(levels*g.columns),actionKnown:new Uint8Array(levels*g.columns),
    nodes:0,cutoffs:0,cacheHits:0,cpcExact:0,cpcBounds:0,cpcForced:0,cpcProjectedForks:0,
    frontCalls:0,frontExact:0,frontFailures:0,frontSteps:0,frontActionExact:0,
    cofactors:0};
}

function selectOrder(state,words,offset,depth,root,reflected){
  const g=state.g,forced=state.cpc.forcedColumn[0],row=depth*g.columns;
  let count=0;
  for(let oi=0;oi<g.columns;oi+=1){
    const caller=g.actionOrder[oi],column=root&&reflected?g.mirrorColumn[caller]:caller;
    if(words[offset+column]>=g.rows)continue;
    if(forced>=0&&column!==forced)continue;
    state.order[row+count]=column;
    state.orderScore[row+count]=state.cpc.actionBias[column]*16+(g.columns-g.priorityByColumn[root&&reflected?caller:column]);
    count+=1;
  }
  // tiny in-place selection sort; ordering is advisory only.
  for(let i=0;i<count;i+=1){
    let best=i;
    for(let j=i+1;j<count;j+=1)if(state.orderScore[row+j]>state.orderScore[row+best])best=j;
    if(best!==i){let x=state.order[row+i];state.order[row+i]=state.order[row+best];state.order[row+best]=x;
      x=state.orderScore[row+i];state.orderScore[row+i]=state.orderScore[row+best];state.orderScore[row+best]=x;}
  }
  return count;
}

function frontEvidence(state,words,offset,basis,basisOffset,basisSize,mover){
  const a=state.front,g=state.g;
  state.frontCalls+=1;
  const result=buildConnect4RbaFourFront(g,a,words,offset,basis,basisOffset,basisSize);
  state.frontSteps+=a.steps;
  if(result){state.frontFailures+=1;return null;}
  const packed=queryConnect4RbaFourFront(g,a,0,words,offset),lo=packed&3,hi=packed>>>2;
  const relative=intervalToRelative(lo,hi,mover);
  if(lo===hi)state.frontExact+=1;
  return relative;
}

function search(state,depth,alpha,beta,root,rootReflected){
  const g=state.g,keyOffset=depth*g.keyWords,basisOffset=depth*g.maxBasis;
  const words=state.words,basis=state.basis,n=state.basisSize[depth],meta=words[keyOffset+g.metaOffset];
  const mover=(meta>>>2)&1;
  state.nodes+=1;

  const terminal=connect4RbaTerminal(g,words,keyOffset);
  if(terminal)return absToRelative(terminal,mover);

  const cached=probeConnect4RbaExactCache32(state.cache,words,keyOffset);
  if(cached){state.cacheHits+=1;return absToRelative(cached,mover);}

  const cpcKind=evaluateConnect4Cpc32(g,words,keyOffset,basis,basisOffset,n,state.cpc);
  state.cpcProjectedForks+=state.cpc.projectedForks[0]+state.cpc.projectedForks[1];
  if(cpcKind===CPC_EXACT){
    state.cpcExact+=1;const value=state.cpc.interval[0];
    storeConnect4RbaExactCache32(state.cache,words,keyOffset,value);
    return absToRelative(value,mover);
  }
  if(cpcKind)state.cpcBounds+=1;
  if(state.cpc.forcedColumn[0]>=0)state.cpcForced+=1;

  let semantic=intervalToRelative(state.cpc.interval[0],state.cpc.interval[1],mover);
  if(state.mode===RBA_AB_CPC_FOUR_FRONT){
    const f=frontEvidence(state,words,keyOffset,basis,basisOffset,n,mover);
    if(f){if(f[0]>semantic[0])semantic[0]=f[0];if(f[1]<semantic[1])semantic[1]=f[1];}
  }
  if(semantic[0]===semantic[1]){
    const abs=relativeToAbs(semantic[0],mover);storeConnect4RbaExactCache32(state.cache,words,keyOffset,abs);return semantic[0];
  }
  if(semantic[0]>=beta){state.cutoffs+=1;return semantic[0];}
  if(semantic[1]<=alpha){state.cutoffs+=1;return semantic[1];}
  if(semantic[0]>alpha)alpha=semantic[0];
  if(semantic[1]<beta)beta=semantic[1];

  const count=selectOrder(state,words,keyOffset,depth,root,rootReflected),row=depth*g.columns;
  if(!count)return 0;

  // Copy action-specific Four-Front evidence before descending because the arena
  // is reused by recursive calls.
  for(let i=0;i<count;i++){state.actionKnown[row+i]=0;state.actionLo[row+i]=-1;state.actionHi[row+i]=1;}
  if(state.mode===RBA_AB_CPC_FOUR_FRONT&&state.front&&state.front.depth){
    for(let i=0;i<count;i++){
      const column=state.order[row+i],packed=queryConnect4RbaFourFront(g,state.front,state.front.actionBase+column*4,words,keyOffset);
      const lo=packed&3,hi=packed>>>2,rel=intervalToRelative(lo,hi,mover);
      state.actionLo[row+i]=rel[0];state.actionHi[row+i]=rel[1];state.actionKnown[row+i]=1;if(rel[0]===rel[1])state.frontActionExact+=1;
    }
  }

  let best=-2,complete=1;
  for(let i=0;i<count;i++){
    let value;
    if(state.actionKnown[row+i]&&state.actionLo[row+i]===state.actionHi[row+i]){
      value=state.actionLo[row+i];
    }else{
      if(state.actionKnown[row+i]&&state.actionHi[row+i]<=alpha){state.cutoffs+=1;complete=0;continue;}
      const column=state.order[row+i],childKey=(depth+1)*g.keyWords,childBasis=(depth+1)*g.maxBasis;
      const term=connect4RbaCofactor(g,state.profile,words,keyOffset,basis,basisOffset,n,column,
        words,childKey,basis,childBasis,state.coord.seen,state.basisSize,depth+1);
      state.cofactors+=1;
      if(term<0)continue;
      if(!term)connect4RbaCanonicalize(g,state.profile,words,childKey,basis,childBasis,state.basisSize[depth+1],state.coord);
      value=-search(state,depth+1,-beta,-alpha,0,0);
    }
    if(value>best)best=value;
    if(value>alpha)alpha=value;
    if(alpha>=beta){state.cutoffs+=1;complete=0;break;}
    if(best===1)break;
  }
  if(best===-2)best=semantic[0];
  // Full-window or fully enumerated node is exact; cutoff returns a valid bound
  // to its caller but is deliberately not published into the exact cache.
  if(complete){
    const abs=relativeToAbs(best,mover);storeConnect4RbaExactCache32(state.cache,words,keyOffset,abs);
  }
  return best;
}

export function solveConnect4RbaAlphaBeta(root,{state,reflected=0}={}){
  if(!state)throw new TypeError('prepared alpha-beta state required');
  const g=state.g;
  state.words.fill(0);state.basis.fill(0);state.basisSize.fill(0);state.cache.valid.fill(0);
  state.nodes=state.cutoffs=state.cacheHits=state.cpcExact=state.cpcBounds=state.cpcForced=state.cpcProjectedForks=0;
  state.frontCalls=state.frontExact=state.frontFailures=state.frontSteps=state.frontActionExact=state.cofactors=0;
  publishSpan32(state.words,0,root.words,0,g.keyWords);publishSpan32(state.basis,0,root.basis,0,root.basis.length);
  state.basisSize[0]=root.basis.length;
  const mover=connect4RbaRank(g,state.words,0)&1,terminal=connect4RbaTerminal(g,state.words,0);
  if(terminal)return {value:terminal,relative:absToRelative(terminal,mover),move:-1,metrics:metrics(state)};
  const cpcKind=evaluateConnect4Cpc32(g,state.words,0,state.basis,0,state.basisSize[0],state.cpc);
  let rootLo=state.cpc.interval[0],rootHi=state.cpc.interval[1];
  if(cpcKind===CPC_EXACT)state.cpcExact+=1;else if(cpcKind)state.cpcBounds+=1;
  if(state.mode===RBA_AB_CPC_FOUR_FRONT){
    const f=frontEvidence(state,state.words,0,state.basis,0,state.basisSize[0],mover);
    if(f){
      const absLo=mover===0?f[0]+2:2-f[1],absHi=mover===0?f[1]+2:2-f[0];
      if(absLo>rootLo)rootLo=absLo;if(absHi<rootHi)rootHi=absHi;
    }
  }
  const rootExact=rootLo===rootHi?absToRelative(rootLo,mover):null;

  let alpha=-2,beta=2,best=-2,bestMove=-1;
  const count=selectOrder(state,state.words,0,0,1,reflected),row=0;
  if(state.mode===RBA_AB_CPC_FOUR_FRONT&&state.front&&state.front.depth){
    for(let i=0;i<count;i++){
      const column=state.order[row+i],packed=queryConnect4RbaFourFront(g,state.front,state.front.actionBase+column*4,state.words,0);
      const lo=packed&3,hi=packed>>>2,rel=intervalToRelative(lo,hi,mover);
      state.actionLo[row+i]=rel[0];state.actionHi[row+i]=rel[1];state.actionKnown[row+i]=1;
    }
  }
  for(let i=0;i<count;i++){
    const column=state.order[row+i],caller=reflected?g.mirrorColumn[column]:column;
    let value;
    if(state.mode===RBA_AB_CPC_FOUR_FRONT&&state.actionKnown[row+i]&&state.actionLo[row+i]===state.actionHi[row+i]){
      value=state.actionLo[row+i];state.frontActionExact+=1;
    }else{
    const childKey=g.keyWords,childBasis=g.maxBasis;
    const term=connect4RbaCofactor(g,state.profile,state.words,0,state.basis,0,state.basisSize[0],column,
      state.words,childKey,state.basis,childBasis,state.coord.seen,state.basisSize,1);
    state.cofactors+=1;if(term<0)continue;
    if(!term)connect4RbaCanonicalize(g,state.profile,state.words,childKey,state.basis,childBasis,state.basisSize[1],state.coord);
    value=-search(state,1,-beta,-alpha,0,0);
    }
    if(value>best){best=value;bestMove=caller;}
    if(value>alpha)alpha=value;
    if(rootExact!==null&&value===rootExact){best=rootExact;bestMove=caller;break;}
    if(rootExact===null&&best===1)break;
  }
  const relative=rootExact!==null?rootExact:best;
  return {value:relativeToAbs(relative,mover),relative,move:bestMove,metrics:metrics(state)};
}
function metrics(s){return {nodes:s.nodes,cutoffs:s.cutoffs,cacheHits:s.cacheHits,cpcExact:s.cpcExact,cpcBounds:s.cpcBounds,
  cpcForced:s.cpcForced,cpcProjectedForks:s.cpcProjectedForks,frontCalls:s.frontCalls,frontExact:s.frontExact,
  frontFailures:s.frontFailures,frontSteps:s.frontSteps,frontActionExact:s.frontActionExact,cofactors:s.cofactors};}
