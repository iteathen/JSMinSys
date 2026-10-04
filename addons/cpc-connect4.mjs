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
  if((meta&3)||controller===((meta>>>2)&1)||g.columns>7)return 0;

  let pending=-1,p0a=-1,p0b=-1,p1a=-1,p1b=-1,p2a=-1,p2b=-1,pairs=0;
  for(let column=0;column<g.columns;column+=1){
    const height=words[offset+column],remaining=g.rows-height;
    if(!(remaining&1))continue;
    if(pending<0){pending=column;continue;}
    const a=words[offset+pending]*g.columns+pending,
      b=height*g.columns+column;
    if(pairs===0){p0a=a;p0b=b;}
    else if(pairs===1){p1a=a;p1b=b;}
    else{p2a=a;p2b=b;}
    pairs+=1;pending=-1;
  }
  if(pending>=0)return 0;

  const own=offset+(controller?g.p1Offset:g.p0Offset),
    opponent=offset+(controller?g.p0Offset:g.p1Offset),
    coordinateWords=g.coordWords;

  // First require one controller residual that the response policy owns in full.
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

  // Every opponent residual must be hit by the same single response policy.
  for(let word=0;word<coordinateWords;word+=1){
    let bits=words[opponent+word]>>>0,indexBase=word<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);
      if(i>=basisSize)break;
      const id=basis[basisOffset+i],base=id*4,size=g.shapeSize[id];
      let blocked=0,pairBits=0;
      for(let j=0;j<size;j+=1){
        const cell=g.shapeCells[base+j],column=g.cellColumn[cell],
          height=words[offset+column],delta=g.cellRow[cell]-height,
          remaining=g.rows-height;
        if(delta>=0&&((remaining&1)?(delta>=2&&(delta&1)===0):(delta&1)!==0)){
          blocked=1;break;
        }
        if(pairs>0){
          if(cell===p0a)pairBits|=1;else if(cell===p0b)pairBits|=2;
          if(pairs>1){if(cell===p1a)pairBits|=4;else if(cell===p1b)pairBits|=8;}
          if(pairs>2){if(cell===p2a)pairBits|=16;else if(cell===p2b)pairBits|=32;}
        }
      }
      if(!blocked&&!((pairBits&3)===3||(pairBits&12)===12||(pairBits&48)===48))return 0;
      bits=(bits&(bits-1))>>>0;
    }
  }
  return 1;
}

