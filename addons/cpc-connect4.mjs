import {firstSetBitIndex32,popcount32} from '../src/word32.mjs';

// Exact/conservative CPC/NDC closure over a prepared Connect4 RBA q.
// This module does not recursively enumerate continuations. It derives
// structural bounds/certificates from the current q and exposes projected
// parity/fork information only as advisory evidence unless an exact guard closes.

export const CPC_NONE=0;
export const CPC_EXACT=1;
export const CPC_BOUND=2;
export const CPC_RESTRICT=3;

export function prepareConnect4CpcScratch(g,{frontierResponse=false,projectedAdvisory=false}={}){
  const cellWords=Math.ceil(g.cellCount/32);
  return {
    threatCells:new Uint32Array(g.columns),
    threatColumns:new Uint32Array(g.columns),
    projectedCells:projectedAdvisory?new Uint32Array(g.maxBasis*2):null,
    projectedOwner:projectedAdvisory?new Uint32Array(g.maxBasis*2):null,
    projectedDistance:projectedAdvisory?new Uint32Array(g.maxBasis*2):null,
    projectedCount:new Uint32Array(2),
    projectedForks:new Uint32Array(2),
    projectedForkTotal:0,
    precursorTotal:0,
    forcedTotal:0,
    activeSingletonCells:new Uint32Array(cellWords),
    activeSingletonCellsOther:new Uint32Array(cellWords),
    forkTargets32:g.columns<=32?new Uint32Array(g.columns):null,
    precursorCount:new Uint32Array(1),
    preemptionCount:new Uint32Array(1),
    preemptionMask32:new Uint32Array(1),
    forcedColumn:new Int32Array(1),
    interval:new Uint32Array(2),
    frontierResponse:frontierResponse?1:0,
    projectedAdvisory:projectedAdvisory?1:0,
  };
}

function coordHas(words,base,index){
  return (words[base+(index>>>5)]&(1<<(index&31)))!==0;
}

function cellMarked(bits,cell){return (bits[cell>>>5]&(1<<(cell&31)))!==0;}
function playableCell(g,words,offset,cell){
  return words[offset+g.cellColumn[cell]]===g.cellRow[cell];
}

// One player-local pass records every active singleton and counts distinct
// currently playable singleton terminals, capped at two. Keeping the mover and
// opponent passes separate preserves the cheap early-terminal path while still
// eliminating the duplicate singleton scans formerly done by fork derivation.
function collectSingletonProfiles(g,words,offset,basis,basisOffset,basisSize,mover,moverBits,opponentBits,scratch){
  moverBits.fill(0);opponentBits.fill(0);
  const moverCoord=offset+(mover?g.p1Offset:g.p0Offset),
    opponentCoord=offset+(mover?g.p0Offset:g.p1Offset);
  let moverAny=0,opponentAny=0,threats=0;
  for(let i=0;i<basisSize;i+=1){
    const id=basis[basisOffset+i];
    // Basis ids are cardinality-sorted; singleton id is the physical cell.
    if(id>=g.pairShapeStart)break;
    const coordWord=i>>>5,coordMask=1<<(i&31),
      moverActive=words[moverCoord+coordWord]&coordMask,
      opponentActive=threats<2?(words[opponentCoord+coordWord]&coordMask):0;
    if(!(moverActive|opponentActive))continue;

    const cell=id,cellWord=cell>>>5,cellMask=1<<(cell&31),
      column=g.cellColumn[cell],
      playable=words[offset+column]===g.cellRow[cell];

    if(moverActive){
      moverBits[cellWord]|=cellMask;moverAny=1;
      // Current-player immediate terminal supersedes opponent obligations.
      if(playable)return 1|(moverAny<<3)|(opponentAny<<4)|(threats<<1);
    }
    if(opponentActive){
      opponentBits[cellWord]|=cellMask;opponentAny=1;
      if(playable){
        scratch.threatCells[threats]=cell;scratch.threatColumns[threats]=column;
        threats+=1;
      }
    }
  }
  return (threats<<1)|(moverAny<<3)|(opponentAny<<4);
}

// Qualified one-step fork-precursor closure.
// Guard: the side to move has no active singleton or minimal two-cell own
// requirement, so an off-preemption move cannot manufacture an earlier
// counter-terminal before the opponent's enabler/fork sequence.
// For configured widths above 32 the proof optimization is simply skipped;
// correctness then falls through to ordinary traversal.
function deriveForkPreemption32(g,words,offset,basis,basisOffset,basisSize,mover,moverHasSingleton,scratch){
  scratch.precursorCount[0]=0;scratch.preemptionCount[0]=0;scratch.preemptionMask32[0]=0;
  const targets=scratch.forkTargets32;if(!targets||moverHasSingleton)return 0;

  const p0Bits=scratch.activeSingletonCells,p1Bits=scratch.activeSingletonCellsOther;
  const moverBits=mover?p1Bits:p0Bits,attackerBits=mover?p0Bits:p1Bits;
  const moverCoord=offset+(mover?g.p1Offset:g.p0Offset),attackerCoord=offset+(mover?g.p0Offset:g.p1Offset);
  targets.fill(0);

  // A second basis pass handles both the mover minimal-pair guard and the
  // opponent's playable pair-to-fork precursor relation. Skip the singleton
  // prefix once, then stop at the triple boundary.
  let i=0;while(i<basisSize&&basis[basisOffset+i]<g.pairShapeStart)i+=1;
  for(;i<basisSize;i+=1){
    const id=basis[basisOffset+i];
    if(id>=g.tripleShapeStart)break;
    const base=id*4,a=g.shapeCells[base],b=g.shapeCells[base+1];

    if(coordHas(words,moverCoord,i)&&!cellMarked(moverBits,a)&&!cellMarked(moverBits,b))return 0;
    if(!coordHas(words,attackerCoord,i))continue;
    if(cellMarked(attackerBits,a)||cellMarked(attackerBits,b))continue;
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
  scratch.precursorTotal+=scratch.precursorCount[0];

  scratch.preemptionMask32[0]=intersection>>>0;
  const count=popcount32(intersection);scratch.preemptionCount[0]=count;
  if(count===1){scratch.forcedColumn[0]=firstSetBitIndex32(intersection);scratch.forcedTotal+=1;}
  return count===0?-1:count;
}

// Basic CPC event-reservoir parity for one future target. The target-column
// contribution is truncated at the target; every other column contributes its
// currently remaining slots. XOR of the per-column parities is exactly the
// parity of their sum. This is a projection, not unconditional W/D/L.
export function connect4CpcTargetOwner32(g,words,offset,targetCell){
  return g.cpcTargetOwnerBase^(g.cellRow[targetCell]&1);
}

export function connect4CpcTargetSupportDistance32(g,words,offset,targetCell){
  const column=g.cellColumn[targetCell],row=g.cellRow[targetCell];
  return row-words[offset+column];
}

function pairedResponseNoWin(g,words,offset,basis,basisOffset,basisSize,player){
  for(let c=0;c<g.columns;c+=1)if(((g.rows-words[offset+c])&1)!==0)return 0;
  const coord=offset+(player?g.p1Offset:g.p0Offset),cover=g.pairedResponseCover,cw=g.coordWords;
  for(let w=0;w<cw;w+=1){
    let bits=words[coord+w]>>>0;const indexBase=w<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);if(i>=basisSize)break;
      if(!cover[basis[basisOffset+i]])return 0;
      bits=(bits&(bits-1))>>>0;
    }
  }
  return 1;
}

// Pooled-frontier response plus a deterministic synchronized channel for
// each ascending pair of odd-remainder columns. For pair (a,b), consume
// L=min(remaining[a],remaining[b]) equal-depth cross pairs. Both remainders
// are odd, so L is odd and the longer post-channel tail is even; it therefore
// returns to the ordinary vertical paired response. This is one exact member
// of the qualified synchronized-channel family, not a search over pairings.
function synchronizedFrontierResponseNoWin(g,words,offset,basis,basisOffset,basisSize,player,scratch,maximal){
  // Reuse immediate-threat scratch after tactical closure has consumed it.
  // partner[c] is the synchronized mate column; depthLimit[c] is channel L.
  const partner=scratch.threatColumns,depthLimit=scratch.threatCells;
  partner.fill(0xffffffff);depthLimit.fill(0);
  let pending=-1;
  for(let c=0;c<g.columns;c+=1){
    const remaining=g.rows-words[offset+c];
    if(!(remaining&1))continue;
    if(pending<0){pending=c;continue;}
    const other=pending,otherRemaining=g.rows-words[offset+other],limit=maximal?Math.min(remaining,otherRemaining):1;
    partner[c]=other;partner[other]=c;depthLimit[c]=limit;depthLimit[other]=limit;pending=-1;
  }
  if(pending>=0)return 0;

  const coord=offset+(player?g.p1Offset:g.p0Offset),cw=g.coordWords;
  for(let w=0;w<cw;w+=1){
    let bits=words[coord+w]>>>0;const indexBase=w<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);if(i>=basisSize)break;
      const id=basis[basisOffset+i],base=id*4,size=g.shapeSize[id];
      let covered=0;

      // Vertical upper-response cells remain valid outside synchronized prefixes.
      for(let j=0;j<size;j+=1){
        const cell=g.shapeCells[base+j],column=g.cellColumn[cell],row=g.cellRow[cell];
        if((row&1)!==g.pairedResponseRowParity)continue;
        const height=words[offset+column],remaining=g.rows-height,depth=row-height;
        if((remaining&1)&&depth<depthLimit[column])continue;
        covered=1;break;
      }

      // Inside a synchronized prefix, equal-depth endpoints form an exact pair
      // blocker: the attacker can own at most one endpoint of each cross pair.
      if(!covered){
        for(let j=0;j<size&&!covered;j+=1){
          const cell=g.shapeCells[base+j],column=g.cellColumn[cell],mate=partner[column];
          if(mate===0xffffffff)continue;
          const depth=g.cellRow[cell]-words[offset+column];
          if(depth>=depthLimit[column])continue;
          const mateCell=(words[offset+mate]+depth)*g.columns+mate;
          for(let k=0;k<size;k+=1)if(g.shapeCells[base+k]===mateCell){covered=1;break;}
        }
      }
      if(!covered)return 0;
      bits=(bits&(bits-1))>>>0;
    }
  }
  return 1;
}

function frontierResponseNoWin(g,words,offset,basis,basisOffset,basisSize,player,scratch){
  // The parity of the odd-column frontier pool equals the parity of the total
  // remaining cell count, so reject odd pools without constructing channels.
  const rank=words[offset+g.metaOffset]>>>2;
  if(((g.cellCount-rank)&1)!==0)return 0;

  // L=1 preserves the pooled-frontier certificate and adds fixed first-pair
  // blockers. A maximal synchronized channel is a different exact policy, not
  // a replacement; accept either policy so the extension is monotone.
  if(synchronizedFrontierResponseNoWin(g,words,offset,basis,basisOffset,basisSize,player,scratch,0))return 1;
  return synchronizedFrontierResponseNoWin(g,words,offset,basis,basisOffset,basisSize,player,scratch,1);
}

function collectProjected(g,words,offset,basis,basisOffset,basisSize,scratch){
  scratch.projectedCount[0]=0;scratch.projectedCount[1]=0;
  scratch.projectedForks[0]=0;scratch.projectedForks[1]=0;
  for(let player=0;player<2;player+=1){
    const coord=offset+(player?g.p1Offset:g.p0Offset),store=player*g.maxBasis;
    let count=0;
    for(let i=0;i<basisSize;i+=1){
      const id=basis[basisOffset+i];if(id>=g.pairShapeStart)break;
      if(!coordHas(words,coord,i))continue;
      const cell=id;
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
  const terminal=words[offset+g.metaOffset]&3;
  if(!terminal)return evaluateConnect4CpcNonterminal32(g,words,offset,basis,basisOffset,basisSize,scratch);
  scratch.interval[0]=terminal;scratch.interval[1]=terminal;scratch.forcedColumn[0]=-1;
  scratch.precursorCount[0]=0;scratch.preemptionCount[0]=0;scratch.preemptionMask32[0]=0;
  if(scratch.projectedAdvisory){
    scratch.projectedCount[0]=0;scratch.projectedCount[1]=0;scratch.projectedForks[0]=0;scratch.projectedForks[1]=0;
  }
  return CPC_EXACT;
}

// EXPERIMENT ONLY: win-only CPC. Unknown remains [P1 win,P0 win].
// No predictive losses/draws or restrictions survive this replacement.
// Preserve first-win priority, native residual identity and numeric hot storage.
export function evaluateConnect4CpcNonterminal32(g,words,offset,basis,basisOffset,basisSize,scratch){
  scratch.interval[0]=1;scratch.interval[1]=3;scratch.forcedColumn[0]=-1;
  scratch.precursorCount[0]=0;scratch.preemptionCount[0]=0;scratch.preemptionMask32[0]=0;
  const mover=(words[offset+g.metaOffset]>>>2)&1,
    coord=offset+(mover?g.p1Offset:g.p0Offset);
  for(let i=0;i<basisSize;i+=1){
    const cell=basis[basisOffset+i];
    if(cell>=g.pairShapeStart)break;
    if(!(words[coord+(i>>>5)]&(1<<(i&31))))continue;
    if(words[offset+g.cellColumn[cell]]!==g.cellRow[cell])continue;
    const value=mover?1:3;
    scratch.interval[0]=value;scratch.interval[1]=value;
    return CPC_EXACT;
  }
  return CPC_NONE;
}
