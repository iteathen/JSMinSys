import {firstSetBitIndex32,popcount32} from '../src/word32.mjs';

// Exact/conservative CPC/NDC closure over a prepared Connect4 RBA q.
// This module does not recursively enumerate continuations. It derives
// structural bounds/certificates from the current q and exposes projected
// parity/fork information only as advisory evidence unless an exact guard closes.

export const CPC_NONE=0;
export const CPC_EXACT=1;
export const CPC_BOUND=2;
export const CPC_RESTRICT=3;

export function prepareConnect4CpcScratch(g){
  const cellWords=Math.ceil(g.cellCount/32);
  return {
    threatCells:new Uint32Array(g.columns),
    threatColumns:new Uint32Array(g.columns),
    projectedCells:new Uint32Array(g.maxBasis*2),
    projectedOwner:new Uint32Array(g.maxBasis*2),
    projectedDistance:new Uint32Array(g.maxBasis*2),
    projectedCount:new Uint32Array(2),
    projectedForks:new Uint32Array(2),
    activeSingletonCells:new Uint32Array(cellWords),
    forkTargets32:g.columns<=32?new Uint32Array(g.columns):null,
    precursorCount:new Uint32Array(1),
    preemptionCount:new Uint32Array(1),
    preemptionMask32:new Uint32Array(1),
    forcedColumn:new Int32Array(1),
    interval:new Uint32Array(2),
  };
}

function coordAny(g,words,base){
  let any=0;
  for(let w=0;w<g.coordWords;w+=1)any|=words[base+w];
  return any!==0;
}

function coordHas(words,base,index){
  return (words[base+(index>>>5)]&(1<<(index&31)))!==0;
}

function activeSingletons(g,words,offset,basis,basisOffset,basisSize,player,scratch,playableOnly){
  const coord=offset+(player?g.p1Offset:g.p0Offset);
  let count=0;
  for(let i=0;i<basisSize;i+=1){
    if(!coordHas(words,coord,i))continue;
    const id=basis[basisOffset+i];
    if(g.shapeSize[id]!==1)continue;
    const cell=g.shapeCells[id*4],column=g.cellColumn[cell],row=g.cellRow[cell];
    if(playableOnly&&words[offset+column]!==row)continue;
    let seen=0;
    for(let j=0;j<count;j+=1)if(scratch.threatCells[j]===cell){seen=1;break;}
    if(seen)continue;
    scratch.threatCells[count]=cell;
    scratch.threatColumns[count]=column;
    count+=1;
  }
  return count;
}

function markActiveSingletonCells(g,words,offset,basis,basisOffset,basisSize,player,bits){
  bits.fill(0);
  const coord=offset+(player?g.p1Offset:g.p0Offset);
  let count=0;
  for(let i=0;i<basisSize;i+=1){
    if(!coordHas(words,coord,i))continue;
    const id=basis[basisOffset+i];
    if(g.shapeSize[id]!==1)continue;
    const cell=g.shapeCells[id*4],word=cell>>>5,mask=1<<(cell&31);
    if(!(bits[word]&mask)){bits[word]|=mask;count+=1;}
  }
  return count;
}
function cellMarked(bits,cell){return (bits[cell>>>5]&(1<<(cell&31)))!==0;}
function playableCell(g,words,offset,cell){
  return words[offset+g.cellColumn[cell]]===g.cellRow[cell];
}
function hasActiveMinimalPair(g,words,offset,basis,basisOffset,basisSize,player,singletons){
  const coord=offset+(player?g.p1Offset:g.p0Offset);
  for(let i=0;i<basisSize;i+=1){
    if(!coordHas(words,coord,i))continue;
    const id=basis[basisOffset+i];if(g.shapeSize[id]!==2)continue;
    const base=id*4,a=g.shapeCells[base],b=g.shapeCells[base+1];
    if(!cellMarked(singletons,a)&&!cellMarked(singletons,b))return 1;
  }
  return 0;
}

// Qualified one-step fork-precursor closure.
// Guard: the side to move has no active singleton or minimal two-cell own
// requirement, so an off-preemption move cannot manufacture an earlier
// counter-terminal before the opponent's enabler/fork sequence.
// For configured widths above 32 the proof optimization is simply skipped;
// correctness then falls through to ordinary traversal.
function deriveForkPreemption32(g,words,offset,basis,basisOffset,basisSize,mover,scratch){
  scratch.precursorCount[0]=0;scratch.preemptionCount[0]=0;scratch.preemptionMask32[0]=0;
  const targets=scratch.forkTargets32;if(!targets)return 0;

  const singletonBits=scratch.activeSingletonCells;
  if(markActiveSingletonCells(g,words,offset,basis,basisOffset,basisSize,mover,singletonBits))return 0;
  if(hasActiveMinimalPair(g,words,offset,basis,basisOffset,basisSize,mover,singletonBits))return 0;

  const attacker=mover^1;
  markActiveSingletonCells(g,words,offset,basis,basisOffset,basisSize,attacker,singletonBits);
  targets.fill(0);
  const coord=offset+(attacker?g.p1Offset:g.p0Offset);
  for(let i=0;i<basisSize;i+=1){
    if(!coordHas(words,coord,i))continue;
    const id=basis[basisOffset+i];if(g.shapeSize[id]!==2)continue;
    const base=id*4,a=g.shapeCells[base],b=g.shapeCells[base+1];
    if(cellMarked(singletonBits,a)||cellMarked(singletonBits,b))continue;
    if(!playableCell(g,words,offset,a)||!playableCell(g,words,offset,b))continue;
    const ca=g.cellColumn[a],cb=g.cellColumn[b];if(ca===cb)continue;
    targets[ca]=(targets[ca]|((1<<cb)>>>0))>>>0;
    targets[cb]=(targets[cb]|((1<<ca)>>>0))>>>0;
  }

  let first=1,intersection=0;
  for(let column=0;column<g.columns;column+=1){
    const targetMask=targets[column]>>>0,targetCount=popcount32(targetMask);
    if(targetCount<2)continue;
    // With two future singleton obligations, the defender may preoccupy either
    // target now or the enabler. With three or more, one preoccupation plus the
    // single post-enable response slot is insufficient, so only the enabler
    // preempts the fork.
    let preempt=((1<<column)>>>0);
    if(targetCount===2)preempt=(preempt|targetMask)>>>0;
    intersection=first?preempt:(intersection&preempt)>>>0;
    first=0;scratch.precursorCount[0]+=1;
  }
  if(first)return 0;

  scratch.preemptionMask32[0]=intersection>>>0;
  const count=popcount32(intersection);scratch.preemptionCount[0]=count;
  if(count===1)scratch.forcedColumn[0]=firstSetBitIndex32(intersection);
  return count===0?-1:count;
}

// Basic CPC event-reservoir parity for one future target. The target-column
// contribution is truncated at the target; every other column contributes its
// currently remaining slots. XOR of the per-column parities is exactly the
// parity of their sum. This is a projection, not unconditional W/D/L.
export function connect4CpcTargetOwner32(g,words,offset,targetCell){
  const targetColumn=g.cellColumn[targetCell],targetRow=g.cellRow[targetCell];
  let parity=0;
  for(let column=0;column<g.columns;column+=1){
    const height=words[offset+column];
    const events=column===targetColumn
      ? targetRow-height+1
      : g.rows-height;
    parity^=events&1;
  }
  const mover=(words[offset+g.metaOffset]>>>2)&1;
  return mover^(parity^1);
}

export function connect4CpcTargetSupportDistance32(g,words,offset,targetCell){
  const column=g.cellColumn[targetCell],row=g.cellRow[targetCell];
  return row-words[offset+column];
}

function pairedResponseNoWin(g,words,offset,basis,basisOffset,basisSize,player){
  for(let c=0;c<g.columns;c+=1)if(((g.rows-words[offset+c])&1)!==0)return 0;
  const coord=offset+(player?g.p1Offset:g.p0Offset);
  for(let i=0;i<basisSize;i+=1){
    if(!coordHas(words,coord,i))continue;
    const id=basis[basisOffset+i],base=id*4,size=g.shapeSize[id];
    let covered=0;
    for(let j=0;j<size;j+=1){
      const cell=g.shapeCells[base+j];
      if((g.cellRow[cell]&1)===g.pairedResponseRowParity){covered=1;break;}
    }
    if(!covered)return 0;
  }
  return 1;
}

function collectProjected(g,words,offset,basis,basisOffset,basisSize,scratch){
  scratch.projectedCount[0]=0;scratch.projectedCount[1]=0;
  scratch.projectedForks[0]=0;scratch.projectedForks[1]=0;
  for(let player=0;player<2;player+=1){
    const coord=offset+(player?g.p1Offset:g.p0Offset),store=player*g.maxBasis;
    let count=0;
    for(let i=0;i<basisSize;i+=1){
      if(!coordHas(words,coord,i))continue;
      const id=basis[basisOffset+i];
      if(g.shapeSize[id]!==1)continue;
      const cell=g.shapeCells[id*4];
      if(connect4CpcTargetOwner32(g,words,offset,cell)!==player)continue;
      scratch.projectedCells[store+count]=cell;
      scratch.projectedOwner[store+count]=player;
      scratch.projectedDistance[store+count]=connect4CpcTargetSupportDistance32(g,words,offset,cell);
      count+=1;
    }
    scratch.projectedCount[player]=count;
    let forks=0;
    for(let i=0;i<count;i+=1)for(let j=i+1;j<count;j+=1)
      if(scratch.projectedCells[store+i]!==scratch.projectedCells[store+j])forks+=1;
    scratch.projectedForks[player]=forks;
  }
}

// Returns CPC_EXACT/CPC_BOUND/CPC_RESTRICT/CPC_NONE.
// interval[0..1] is an absolute P0-oriented WDL interval using 1..3.
// forcedColumn[0] is exact when >=0.
// preemptionMask32/preemptionCount are exact current-action restrictions when
// available for a <=32-column profile.
// Projected singleton/fork counts remain advisory until their temporal/response
// guards close.
export function evaluateConnect4Cpc32(g,words,offset,basis,basisOffset,basisSize,scratch){
  scratch.interval[0]=1;scratch.interval[1]=3;scratch.forcedColumn[0]=-1;
  scratch.precursorCount[0]=0;scratch.preemptionCount[0]=0;scratch.preemptionMask32[0]=0;
  scratch.projectedCount[0]=0;scratch.projectedCount[1]=0;scratch.projectedForks[0]=0;scratch.projectedForks[1]=0;
  const meta=words[offset+g.metaOffset],terminal=meta&3,rank=meta>>>2,mover=rank&1;
  if(terminal){scratch.interval[0]=terminal;scratch.interval[1]=terminal;return CPC_EXACT;}

  const p0Any=coordAny(g,words,offset+g.p0Offset);
  const p1Any=coordAny(g,words,offset+g.p1Offset);
  if(!p0Any&&!p1Any){scratch.interval[0]=2;scratch.interval[1]=2;return CPC_EXACT;}

  if(!p0Any)scratch.interval[1]=2;
  if(!p1Any)scratch.interval[0]=2;

  if(mover===0&&pairedResponseNoWin(g,words,offset,basis,basisOffset,basisSize,0))
    scratch.interval[1]=Math.min(scratch.interval[1],2);
  if(mover===1&&pairedResponseNoWin(g,words,offset,basis,basisOffset,basisSize,1))
    scratch.interval[0]=Math.max(scratch.interval[0],2);

  if(scratch.interval[0]===scratch.interval[1])return CPC_EXACT;

  // Current-player immediate terminal supersedes all opponent obligations.
  const own=activeSingletons(g,words,offset,basis,basisOffset,basisSize,mover,scratch,1);
  if(own>0){
    const value=mover?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
    return CPC_EXACT;
  }

  const opponent=mover^1;
  const threats=activeSingletons(g,words,offset,basis,basisOffset,basisSize,opponent,scratch,1);
  if(threats>1){
    const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
    return CPC_EXACT;
  }
  if(threats===1){
    const column=scratch.threatColumns[0];
    scratch.forcedColumn[0]=column;
    scratch.preemptionMask32[0]=g.columns<=32?((1<<column)>>>0):0;
    scratch.preemptionCount[0]=1;
  }else{
    const precursor=deriveForkPreemption32(g,words,offset,basis,basisOffset,basisSize,mover,scratch);
    if(precursor<0){
      const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
      return CPC_EXACT;
    }
  }

  collectProjected(g,words,offset,basis,basisOffset,basisSize,scratch);
  if(scratch.interval[0]!==1||scratch.interval[1]!==3)return CPC_BOUND;
  if(scratch.preemptionCount[0])return CPC_RESTRICT;
  return CPC_NONE;
}
