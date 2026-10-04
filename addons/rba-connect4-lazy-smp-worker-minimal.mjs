import {workerData} from 'node:worker_threads';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {prepareConnect4RbaCoordinateScratch} from './rba-connect4-geometry.mjs';
import {connect4RbaCofactorKnownHeight,connect4RbaCanonicalize} from './rba-connect4-coordinate.mjs';
import {
  attachConnect4RbaSharedExactCache32,
  isCompactProfile8,
  compactSupportProfile8,
  compactTailProfile8,
  probeConnect4RbaSharedExactCache32,
  storeConnect4RbaSharedExactCache32,
} from './rba-connect4-shared-exact-cache.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_WAKE=3,CONTROL_WINNER=4,
  RESULT_STRIDE=4,CANCELLED=-2,LOCAL_LOWER0=4,LOCAL_UPPER0=5,
  index=workerData.workerIndex,g=workerData.geometry,
  profile=prepareConnect4RbaExecutionProfile(g),
  control=workerData.control,resultWords=workerData.resultWords,
  words=new Uint32Array((g.cellCount+1)*g.keyWords),
  basis=new Uint32Array((g.cellCount+1)*g.maxBasis),
  basisSize=new Uint32Array(g.cellCount+1),
  coord=prepareConnect4RbaCoordinateScratch(g),
  centerOrder=new Uint32Array(g.columns),
  shared=attachConnect4RbaSharedExactCache32(workerData.sharedExactCache),
  sharedSampleBits=(workerData.sharedSampleMask<<24)>>>0,
  localMask=workerData.localCacheCapacity-1,
  localCompact=isCompactProfile8(g,g.keyWords)?1:0,
  localStoredKeyWords=localCompact?8:g.keyWords,
  localKeys=new Uint32Array(workerData.localCacheCapacity*localStoredKeyWords),
  localValues=new Uint8Array(workerData.localCacheCapacity);

let orderAt=0,left=(g.columns-1)>>1,right=g.columns>>1,pair=0;
if(left===right){centerOrder[orderAt++]=left;left-=1;right+=1;}
while(orderAt<g.columns){
  const rightFirst=(index>>>pair)&1;
  if(rightFirst){
    if(right<g.columns)centerOrder[orderAt++]=right++;
    if(left>=0)centerOrder[orderAt++]=left--;
  }else{
    if(left>=0)centerOrder[orderAt++]=left--;
    if(right<g.columns)centerOrder[orderAt++]=right++;
  }
  pair+=1;
}

words.set(workerData.root.words);
basis.set(workerData.root.basis);
basisSize[0]=workerData.root.basis.length;

let bestMove=-1;

function relativeTerminal(value,mover){
  return value===2?0:value===(mover?1:3)?1:-1;
}

function relativeToAbsolute(value,mover){
  return value===0?2:mover===0?value+2:2-value;
}

function localKeyMatches(slot,src){
  const base=slot*localStoredKeyWords;
  if(localCompact)return localKeys[base]===words[src]&&
    localKeys[base+1]===words[src+1]&&
    localKeys[base+2]===compactSupportProfile8(words,src)&&
    localKeys[base+3]===words[src+8]&&
    localKeys[base+4]===words[src+9]&&
    localKeys[base+5]===words[src+11]&&
    localKeys[base+6]===words[src+12]&&
    localKeys[base+7]===compactTailProfile8(words,src);
  for(let w=0;w<g.keyWords;w+=1)
    if(localKeys[base+w]!==words[src+w])return 0;
  return 1;
}

function storeLocalEntry(slot,src,value){
  const base=slot*localStoredKeyWords;
  if(localCompact){
    localKeys[base]=words[src];localKeys[base+1]=words[src+1];
    localKeys[base+2]=compactSupportProfile8(words,src);
    localKeys[base+3]=words[src+8];localKeys[base+4]=words[src+9];
    localKeys[base+5]=words[src+11];localKeys[base+6]=words[src+12];
    localKeys[base+7]=compactTailProfile8(words,src);
  }else for(let w=0;w<g.keyWords;w+=1)localKeys[base+w]=words[src+w];
  localValues[slot]=value;
}

function probeCache(src,hash,slot){
  const local=localValues[slot];
  if(local&&localKeyMatches(slot,src)){return local;}
  if(!(hash&sharedSampleBits)){
    const value=probeConnect4RbaSharedExactCache32(shared,words,src,hash);
    if(value){storeLocalEntry(slot,src,value);return value;}
  }
  return 0;
}

function storeExact(src,hash,slot,value){
  storeLocalEntry(slot,src,value);
  if(!(hash&sharedSampleBits))
    storeConnect4RbaSharedExactCache32(shared,words,src,value,hash);
}

function storeBound(src,hash,slot,value){
  const prior=localValues[slot];
  if(prior&&localKeyMatches(slot,src)){
    if(prior<=3||prior===value)return prior;
    // The same canonical q has both >=0 and <=0, therefore exact draw.
    // Keep this inferred draw worker-local; shared publication is reserved for
    // exact values produced by the ordinary search result path.
    storeLocalEntry(slot,src,2);
    return 2;
  }
  storeLocalEntry(slot,src,value);
  return value;
}

function negamax(depth,n,mover,alpha,beta){
  if(Atomics.load(control,CONTROL_STOP))return CANCELLED;
  const src=depth*g.keyWords,bi=depth*g.maxBasis,
    dst=src+g.keyWords,ci=bi+g.maxBasis,
    alphaOrig=alpha,betaOrig=beta,
    hash=depth?mixSpan32Locator32(words,src,g.keyWords):0,
    slot=depth?(hash&localMask):0;

  if(depth){
    const cached=probeCache(src,hash,slot);
    if(cached){
      if(cached<=3)return relativeTerminal(cached,mover);
      if(cached===LOCAL_LOWER0){
        if(beta<=0){return 0;}
        if(alpha<0)alpha=0;
      }else{
        if(alpha>=0){return 0;}
        if(beta>0)beta=0;
      }
    }
  }

  let best=-2;
  for(let oi=0;oi<g.columns;oi+=1){
    const column=centerOrder[oi],
      height=words[src+column];
    if(height>=g.rows)continue;

    const term=connect4RbaCofactorKnownHeight(
      g,profile,words,src,basis,bi,n,column,height,
      words,dst,basis,ci,coord.seen,basisSize,depth+1,coord.map,coord.inverse,
    );
    let value;
    if(term)value=relativeTerminal(term,mover);
    else{
      const childN=basisSize[depth+1];
      connect4RbaCanonicalize(g,profile,words,dst,basis,ci,childN,coord);
      value=negamax(depth+1,childN,mover^1,-beta,-alpha);
      if(value===CANCELLED)return CANCELLED;
      value=-value;
    }

    if(value>best){
      best=value;
      if(depth===0)bestMove=column;
    }
    if(value>alpha)alpha=value;
    if(alpha>=beta){break;}
  }

  if(depth){
    // Classify against the caller's original window. Narrow-window exacts are
    // retained locally; shared publication is reserved for full W/D/L-window
    // proofs to avoid turning local bound reuse into excessive atomic traffic.
    const shareExact=alphaOrig===-2&&betaOrig===2;
    if(best>alphaOrig&&best<betaOrig){
      const exact=relativeToAbsolute(best,mover);
      if(shareExact)storeExact(src,hash,slot,exact);
      else storeLocalEntry(slot,src,exact);
    }else if(best>=betaOrig){
      if(best===1){
        const exact=relativeToAbsolute(1,mover);
        if(shareExact)storeExact(src,hash,slot,exact);
        else storeLocalEntry(slot,src,exact);
      }else if(best===0)storeBound(src,hash,slot,LOCAL_LOWER0);
    }else if(best<=alphaOrig){
      if(best===-1){
        const exact=relativeToAbsolute(-1,mover);
        if(shareExact)storeExact(src,hash,slot,exact);
        else storeLocalEntry(slot,src,exact);
      }else if(best===0)storeBound(src,hash,slot,LOCAL_UPPER0);
    }
  }
  return best;
}

const meta=words[g.metaOffset],mover=(meta>>>2)&1,terminal=meta&3,
  relative=terminal?relativeTerminal(terminal,mover):negamax(0,basisSize[0],mover,-2,2);

if(relative!==CANCELLED){
  const resultBase=index*RESULT_STRIDE,
    value=terminal||relativeToAbsolute(relative,mover),
    move=bestMove<0?-1:workerData.rootReflected?g.mirrorColumn[bestMove]:bestMove;

  Atomics.store(resultWords,resultBase,value);
  Atomics.store(resultWords,resultBase+1,relative);
  Atomics.store(resultWords,resultBase+2,move);
  Atomics.store(resultWords,resultBase+3,1);

  if(Atomics.compareExchange(control,CONTROL_WINNER,-1,index)===-1){
    Atomics.store(control,CONTROL_DONE,1);
    Atomics.add(control,CONTROL_WAKE,1);
    Atomics.notify(control,CONTROL_WAKE);
  }
}
