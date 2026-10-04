import {workerData} from 'node:worker_threads';
import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownHeight} from './rba-connect4-coordinate.mjs';
import {
  attachConnect4RbaSharedExactCache32,
  isCompactProfile8,
  compactSupportProfile8,
  compactTailProfile8,
  probeConnect4RbaSharedExactCache32,
  storeConnect4RbaSharedExactCache32,
} from './rba-connect4-shared-exact-cache.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_WAKE=3,CONTROL_WINNER=4,
  RESULT_STRIDE=4,METRIC_WIDTH=15,CANCELLED=-2,
  index=workerData.workerIndex,g=workerData.geometry,
  profile=prepareConnect4RbaExecutionProfile(g),
  control=workerData.control,resultWords=workerData.resultWords,
  metrics=new Float64Array(workerData.metricBuffer),
  words=new Uint32Array((g.cellCount+1)*g.keyWords),
  basis=new Uint32Array((g.cellCount+1)*g.maxBasis),
  basisSize=new Uint32Array(g.cellCount+1),
  seen=new Uint32Array(g.shapeWordCount),
  centerOrder=Uint32Array.from(
    Array.from({length:g.columns},(_,column)=>column)
      .sort((a,b)=>Math.abs((a<<1)-(g.columns-1))-Math.abs((b<<1)-(g.columns-1))||a-b),
  ),
  shared=attachConnect4RbaSharedExactCache32(workerData.sharedExactCache),
  sharedSampleBits=(workerData.sharedSampleMask<<24)>>>0,
  localMask=workerData.localCacheCapacity-1,
  localCompact=isCompactProfile8(g,g.keyWords)?1:0,
  localStoredKeyWords=localCompact?8:g.keyWords,
  localKeys=new Uint32Array(workerData.localCacheCapacity*localStoredKeyWords),
  localValues=new Uint8Array(workerData.localCacheCapacity);

words.set(workerData.root.words);
basis.set(workerData.root.basis);
basisSize[0]=workerData.root.basis.length;

let nodes=0,cutoffs=0,cacheHits=0,bestMove=-1;

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

function storeLocalExact(slot,src,value){
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

function probeExact(src,hash,slot){
  const local=localValues[slot];
  if(local&&localKeyMatches(slot,src)){cacheHits+=1;return local;}
  if(!(hash&sharedSampleBits)){
    const value=probeConnect4RbaSharedExactCache32(shared,words,src,hash);
    if(value){storeLocalExact(slot,src,value);cacheHits+=1;return value;}
  }
  return 0;
}

function storeExact(src,hash,slot,value){
  storeLocalExact(slot,src,value);
  if(!(hash&sharedSampleBits))
    storeConnect4RbaSharedExactCache32(shared,words,src,value,hash);
}

function negamax(depth,n,mover,alpha,beta){
  if(Atomics.load(control,CONTROL_STOP))return CANCELLED;
  nodes+=1;
  const src=depth*g.keyWords,bi=depth*g.maxBasis,
    dst=src+g.keyWords,ci=bi+g.maxBasis,
    fullWindow=alpha===-2&&beta===2,
    hash=depth?mixSpan32Locator32(words,src,g.keyWords):0,
    slot=depth?(hash&localMask):0;

  if(depth){
    const cached=probeExact(src,hash,slot);
    if(cached)return relativeTerminal(cached,mover);
  }

  let best=-2;
  for(let oi=0;oi<g.columns;oi+=1){
    const column=centerOrder[oi],
      height=words[src+column];
    if(height>=g.rows)continue;

    const term=connect4RbaCofactorKnownHeight(
      g,profile,words,src,basis,bi,n,column,height,
      words,dst,basis,ci,seen,basisSize,depth+1,
    );
    let value;
    if(term)value=relativeTerminal(term,mover);
    else{
      value=negamax(depth+1,basisSize[depth+1],mover^1,-beta,-alpha);
      if(value===CANCELLED)return CANCELLED;
      value=-value;
    }

    if(value>best){
      best=value;
      if(depth===0)bestMove=column;
    }
    if(value>alpha)alpha=value;
    if(alpha>=beta){cutoffs+=1;break;}
  }

  // Only full-window nodes publish into the exact TT. Narrow-window results
  // remain alpha/beta bounds and never enter either cache.
  if(depth&&fullWindow)storeExact(src,hash,slot,relativeToAbsolute(best,mover));
  return best;
}

const meta=words[g.metaOffset],mover=(meta>>>2)&1,terminal=meta&3,
  relative=terminal?relativeTerminal(terminal,mover):negamax(0,basisSize[0],mover,-2,2);

if(relative!==CANCELLED){
  const resultBase=index*RESULT_STRIDE,metricBase=index*METRIC_WIDTH,
    value=terminal||relativeToAbsolute(relative,mover),
    move=bestMove<0?-1:workerData.rootReflected?g.mirrorColumn[bestMove]:bestMove;

  metrics[metricBase]=nodes;
  metrics[metricBase+1]=cutoffs;
  metrics[metricBase+2]=cacheHits;

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
