// Exact/conservative CPC/NDC closure over a prepared Connect4 RBA q.
// This module does not recursively enumerate continuations. It derives
// structural bounds/certificates from the current q and exposes projected
// parity/fork information only as advisory evidence unless an exact guard closes.

export const CPC_NONE=0;
export const CPC_EXACT=1;
export const CPC_BOUND=2;

export function prepareConnect4CpcScratch(g){
  return {
    threatCells:new Uint32Array(g.columns),
    threatColumns:new Uint32Array(g.columns),
    projectedCells:new Uint32Array(g.maxBasis),
    projectedOwner:new Uint32Array(g.maxBasis),
    projectedDistance:new Uint32Array(g.maxBasis),
    projectedCount:new Uint32Array(2),
    projectedForks:new Uint32Array(2),
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

// Basic CPC event-reservoir parity for one future target. The target-column
// contribution is truncated at the target; every other column contributes its
// currently remaining slots. This is a projection, not unconditional W/D/L.
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
    const coord=offset+(player?g.p1Offset:g.p0Offset);
    let count=0;
    for(let i=0;i<basisSize;i+=1){
      if(!coordHas(words,coord,i))continue;
      const id=basis[basisOffset+i];
      if(g.shapeSize[id]!==1)continue;
      const cell=g.shapeCells[id*4];
      if(connect4CpcTargetOwner32(g,words,offset,cell)!==player)continue;
      scratch.projectedCells[count]=cell;
      scratch.projectedOwner[count]=player;
      const distance=connect4CpcTargetSupportDistance32(g,words,offset,cell);
      scratch.projectedDistance[count]=distance;
      count+=1;
    }
    scratch.projectedCount[player]=count;
    let forks=0;
    for(let i=0;i<count;i+=1)for(let j=i+1;j<count;j+=1)
      if(scratch.projectedCells[i]!==scratch.projectedCells[j])forks+=1;
    scratch.projectedForks[player]=forks;
  }
}

// Returns CPC_EXACT/CPC_BOUND/CPC_NONE.
// interval[0..1] is an absolute P0-oriented WDL interval using 1..3.
// forcedColumn[0] is -1 unless one immediate opponent singleton forces a block.
// Projected singleton/fork counts are advisory only.
export function evaluateConnect4Cpc32(g,words,offset,basis,basisOffset,basisSize,scratch){
  scratch.interval[0]=1;scratch.interval[1]=3;scratch.forcedColumn[0]=-1;
  scratch.projectedCount[0]=0;scratch.projectedCount[1]=0;scratch.projectedForks[0]=0;scratch.projectedForks[1]=0;
  const meta=words[offset+g.metaOffset],terminal=meta&3,rank=meta>>>2,mover=rank&1;
  if(terminal){scratch.interval[0]=terminal;scratch.interval[1]=terminal;return CPC_EXACT;}

  const p0Any=coordAny(g,words,offset+g.p0Offset);
  const p1Any=coordAny(g,words,offset+g.p1Offset);
  if(!p0Any&&!p1Any){scratch.interval[0]=2;scratch.interval[1]=2;return CPC_EXACT;}

  // Residual exhaustion is exact one-sided no-win evidence.
  if(!p0Any)scratch.interval[1]=2;
  if(!p1Any)scratch.interval[0]=2;

  // Guarded paired-response closure from the qualified CPC/response profile.
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

  // Two distinct currently playable opponent singleton obligations cannot both
  // be answered by one move. With no current-player immediate terminal above,
  // this is an exact loss for the side to move.
  const opponent=mover^1;
  const threats=activeSingletons(g,words,offset,basis,basisOffset,basisSize,opponent,scratch,1);
  if(threats>1){
    const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
    return CPC_EXACT;
  }
  if(threats===1)scratch.forcedColumn[0]=scratch.threatColumns[0];

  collectProjected(g,words,offset,basis,basisOffset,basisSize,scratch);
  return scratch.interval[0]!==1||scratch.interval[1]!==3?CPC_BOUND:CPC_NONE;
}
