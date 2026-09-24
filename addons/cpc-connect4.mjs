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
function collectPlayerSingletons(g,words,offset,basis,basisOffset,basisSize,player,bits,scratch,storeThreats){
  bits.fill(0);
  const coord=offset+(player?g.p1Offset:g.p0Offset);
  let immediate=0,any=0;
  for(let i=0;i<basisSize;i+=1){
    const id=basis[basisOffset+i];
    // Basis ids are sorted by residual cardinality. pairShapeStart is prepared
    // once from that ordering, so singleton scans require no shape-size load.
    if(id>=g.pairShapeStart)break;
    if(!coordHas(words,coord,i))continue;
    const cell=g.shapeCells[id*4],word=cell>>>5,mask=1<<(cell&31);
    if(bits[word]&mask)continue;
    bits[word]|=mask;any=1;
    const column=g.cellColumn[cell];
    if(words[offset+column]!==g.cellRow[cell])continue;
    // Mover singleton: CPC is already exact, so the rest of the basis is
    // irrelevant. Opponent: two distinct playable singletons are already an
    // exact loss, so stop after recording the second witness.
    if(!storeThreats)return 5; // immediate=1 | any=4
    scratch.threatCells[immediate]=cell;scratch.threatColumns[immediate]=column;
    immediate+=1;
    if(immediate===2)return 6; // immediate=2 | any=4
  }
  return immediate|(any?4:0);
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
  for(let column=0;column<g.columns;column+=1)
    parity^=(g.rows-words[offset+column])&1;
  const height=words[offset+targetColumn];
  parity^=(g.rows-height)&1;
  parity^=(targetRow-height+1)&1;
  const mover=(words[offset+g.metaOffset]>>>2)&1;
  return mover^(parity^1);
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
  if(scratch.projectedAdvisory){
    scratch.projectedCount[0]=0;scratch.projectedCount[1]=0;scratch.projectedForks[0]=0;scratch.projectedForks[1]=0;
  }
  const meta=words[offset+g.metaOffset],terminal=meta&3,rank=meta>>>2,mover=rank&1;
  if(terminal){scratch.interval[0]=terminal;scratch.interval[1]=terminal;return CPC_EXACT;}

  const p0Base=offset+g.p0Offset,p1Base=offset+g.p1Offset;let p0Any=0,p1Any=0;
  for(let w=0;w<g.coordWords;w+=1){p0Any|=words[p0Base+w];p1Any|=words[p1Base+w];}
  if(!p0Any&&!p1Any){scratch.interval[0]=2;scratch.interval[1]=2;return CPC_EXACT;}

  if(!p0Any)scratch.interval[1]=2;
  if(!p1Any)scratch.interval[0]=2;

  if(scratch.interval[0]===scratch.interval[1])return CPC_EXACT;

  // Current-player immediate terminal supersedes every opponent obligation.
  const moverBits=mover?scratch.activeSingletonCellsOther:scratch.activeSingletonCells;
  const opponentBits=mover?scratch.activeSingletonCells:scratch.activeSingletonCellsOther;
  const ownProfile=collectPlayerSingletons(g,words,offset,basis,basisOffset,basisSize,mover,moverBits,scratch,0);
  if(ownProfile&3){
    const value=mover?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
    return CPC_EXACT;
  }

  const opponent=mover^1;
  const opponentProfile=collectPlayerSingletons(g,words,offset,basis,basisOffset,basisSize,opponent,opponentBits,scratch,1);
  const threats=opponentProfile&3,moverHasSingleton=(ownProfile>>>2)&1,
    opponentHasSingleton=(opponentProfile>>>2)&1;
  if(threats>1){
    const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
    return CPC_EXACT;
  }
  if(threats===1){
    const column=scratch.threatColumns[0],height=words[offset+column];
    // The only current singleton must be blocked now. If that support event
    // exposes another opponent singleton immediately above it, first-win order
    // makes the opponent's next move terminal.
    if(height+1<g.rows&&cellMarked(opponentBits,(height+1)*g.columns+column)){
      const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
      return CPC_EXACT;
    }
    scratch.forcedColumn[0]=column;
    scratch.preemptionMask32[0]=g.columns<=32?((1<<column)>>>0):0;
    scratch.preemptionCount[0]=1;
  }else{
    // With no current singleton threat, a move changes support in one column.
    // If there are no opponent singleton targets at all this test cannot fire,
    // so avoid even the short legal-column scan.
    if(opponentHasSingleton){
      let legal=0,allLift=1;
      for(let column=0;column<g.columns;column+=1){
        const height=words[offset+column];if(height>=g.rows)continue;
        legal+=1;
        if(height+1>=g.rows||!cellMarked(opponentBits,(height+1)*g.columns+column)){allLift=0;break;}
      }
      if(legal&&allLift){
        const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
        return CPC_EXACT;
      }
    }
    const precursor=deriveForkPreemption32(g,words,offset,basis,basisOffset,basisSize,mover,moverHasSingleton,scratch);
    if(precursor<0){
      const value=opponent?1:3;scratch.interval[0]=value;scratch.interval[1]=value;
      return CPC_EXACT;
    }
  }

  // Long-range response closure is intentionally after the cheap tactical
  // exact/restriction checks so unresolved nodes alone pay its residual scan.
  // The prior all-even theorem remains the production baseline. The pooled/
  // synchronized frontier extension is selected once at initialization for A/B.
  if(mover===0){
    if(scratch.interval[1]===3){
      const noWin=scratch.frontierResponse
        ?frontierResponseNoWin(g,words,offset,basis,basisOffset,basisSize,0,scratch)
        :pairedResponseNoWin(g,words,offset,basis,basisOffset,basisSize,0);
      if(noWin)scratch.interval[1]=2;
    }
  }else if(scratch.interval[0]===1){
    const noWin=scratch.frontierResponse
      ?frontierResponseNoWin(g,words,offset,basis,basisOffset,basisSize,1,scratch)
      :pairedResponseNoWin(g,words,offset,basis,basisOffset,basisSize,1);
    if(noWin)scratch.interval[0]=2;
  }
  if(scratch.interval[0]===scratch.interval[1])return CPC_EXACT;

  if(scratch.projectedAdvisory)collectProjected(g,words,offset,basis,basisOffset,basisSize,scratch);
  if(scratch.interval[0]!==1||scratch.interval[1]!==3)return CPC_BOUND;
  if(scratch.preemptionCount[0])return CPC_RESTRICT;
  return CPC_NONE;
}
