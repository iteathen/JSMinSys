import {firstSetBitIndex32} from '../src/word32.mjs';

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

// Win-only whole-reservoir CPC certificate.
//
// Contract: controller is the player who just moved, so the other player is
// currently to move. CPC pairs the entire remaining event reservoir into legal
// trigger/response pairs. Even column tails use vertical lower->upper pairs.
// Odd tails are paired at their current frontiers, after which both tails are
// even and use the same vertical response. The controller therefore owns every
// fixed response cell and one endpoint of every cross-frontier pair.
//
// A win is proved iff:
//   1. one surviving controller residual is entirely fixed-response cells; and
//   2. every surviving opponent residual contains a fixed-response cell or both
//      endpoints of one cross-frontier pair.
//
// Nothing else is classified. Failure to close is simply unresolved.
export function evaluateConnect4CpcWin32(g,words,offset,basis,basisOffset,basisSize,controller){
  const meta=words[offset+g.metaOffset];
  if((meta&3)||controller===((meta>>>2)&1))return 0;

  // Every odd column tail must have a mate. The actual pair endpoints are
  // derived from the live frontiers only when an opponent residual needs them.
  let odd=0;
  for(let column=0;column<g.columns;column+=1)
    odd^=(g.rows-words[offset+column])&1;
  if(odd)return 0;

  const own=offset+(controller?g.p1Offset:g.p0Offset),
    opponent=offset+(controller?g.p0Offset:g.p1Offset),
    coordinateWords=g.coordWords;

  // The response policy must force at least one complete controller residual.
  // Even tails: controller owns odd deltas above the current frontier.
  // Odd tails: the frontier is cross-paired, then controller owns even deltas
  // starting at delta 2.
  let guaranteed=0;
  for(let word=0;word<coordinateWords&&!guaranteed;word+=1){
    let bits=words[own+word]>>>0,indexBase=word<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);
      if(i>=basisSize)break;
      const id=basis[basisOffset+i],base=id*4,size=g.shapeSize[id];
      let all=1;
      for(let j=0;j<size;j+=1){
        const cell=g.shapeCells[base+j],column=g.cellColumn[cell],
          height=words[offset+column],delta=g.cellRow[cell]-height,
          remaining=g.rows-height;
        if(delta<0||((remaining&1)?(delta<2||(delta&1)!==0):(delta&1)===0)){
          all=0;break;
        }
      }
      if(all){guaranteed=1;break;}
      bits=(bits&(bits-1))>>>0;
    }
  }
  if(!guaranteed)return 0;

  // The same response policy must deny every surviving opponent residual.
  // A residual is denied by either one fixed controller response cell or both
  // endpoints of one dynamic cross-frontier pair.
  for(let word=0;word<coordinateWords;word+=1){
    let bits=words[opponent+word]>>>0,indexBase=word<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);
      if(i>=basisSize)break;
      const id=basis[basisOffset+i],base=id*4,size=g.shapeSize[id];
      let blocked=0;
      for(let j=0;j<size;j+=1){
        const cell=g.shapeCells[base+j],column=g.cellColumn[cell],
          height=words[offset+column],delta=g.cellRow[cell]-height,
          remaining=g.rows-height;
        if(delta>=0&&((remaining&1)?(delta>=2&&(delta&1)===0):(delta&1)!==0)){
          blocked=1;break;
        }
      }

      if(!blocked){
        let pending=-1;
        for(let column=0;column<g.columns&&!blocked;column+=1){
          const height=words[offset+column];
          if(!((g.rows-height)&1))continue;
          if(pending<0){pending=column;continue;}
          const a=words[offset+pending]*g.columns+pending,
            b=height*g.columns+column;
          let hasA=0,hasB=0;
          for(let j=0;j<size;j+=1){
            const cell=g.shapeCells[base+j];
            if(cell===a)hasA=1;
            else if(cell===b)hasB=1;
          }
          if(hasA&&hasB)blocked=1;
          pending=-1;
        }
      }

      if(!blocked)return 0;
      bits=(bits&(bits-1))>>>0;
    }
  }
  return 1;
}

