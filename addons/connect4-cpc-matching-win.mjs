import {firstSetBitIndex32} from '../src/word32.mjs';
import {prepareConnect4CpcWin32,evaluateConnect4PreparedCpcWin32} from './connect4-cpc-prepared-win.mjs';

// COLD geometry-only complete matchings. No outcome data or state-specific plans.
export function collectConnect4FrontierMatchings32(mask,pairs,out){
  if(!mask){out.push(pairs.slice());return;}
  const a=mask&-mask,remaining=mask^a;
  for(let bits=remaining;bits;bits&=bits-1){
    const b=bits&-bits;pairs.push(a|b);
    collectConnect4FrontierMatchings32(remaining^b,pairs,out);pairs.length-=1;
  }
}

export function prepareConnect4CpcMatchingWin32(g){
  const p=prepareConnect4CpcWin32(g);
  // At most six odd tails at even rank on <=7 columns: at most15 matchings.
  // Wider dimensions retain the qualified whole-reservoir implementation.
  if(g.columns>7){p.evaluate=evaluateConnect4PreparedCpcWin32;return p;}
  const span=1<<g.columns,valid=new Uint32Array(span),blocked=new Uint32Array(span*span);
  for(let odd=0;odd<span;odd++){
    const matchings=[];collectConnect4FrontierMatchings32(odd,[],matchings);
    valid[odd]=(1<<matchings.length)-1;
    for(let frontier=0;frontier<span;frontier++){
      let allowed=0;
      for(let m=0;m<matchings.length;m++)
        for(const pair of matchings[m])if((frontier&pair)===pair){allowed|=1<<m;break;}
      blocked[odd*span+frontier]=allowed;
    }
  }
  p.matchingSpan=span;p.matchingValid=valid;p.matchingBlocked=blocked;
  p.evaluate=evaluateConnect4CpcMatchingWin32;return p;
}

export function evaluateConnect4CpcMatchingWin32(p,words,offset,basis,basisOffset,basisSize,controller){
  const g=p.g,meta=words[offset+g.metaOffset];
  if((meta&3)||controller===((meta>>>2)&1)||((g.cellCount-(meta>>>2))&1))return 0;
  const own=offset+(controller?g.p1Offset:g.p0Offset),
    opponent=offset+(controller?g.p0Offset:g.p1Offset),coordinateWords=g.coordWords,
    candidate=p.guaranteeCandidate,responseCount=p.responseCount,
    responseColumns=p.responseColumns,responseRows=p.responseRows;
  let guaranteed=0;
  for(let word=0;word<coordinateWords&&!guaranteed;word+=1){
    let bits=words[own+word]>>>0;const indexBase=word<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);if(i>=basisSize)break;
      const id=basis[basisOffset+i];
      if(candidate[id]){
        const base=id*4,count=responseCount[id];let all=1;
        for(let j=0;j<count;j+=1){
          const at=base+j;
          if(responseRows[at]<=words[offset+responseColumns[at]]){all=0;break;}
        }
        if(all){guaranteed=1;break;}
      }
      bits=(bits&(bits-1))>>>0;
    }
  }
  if(!guaranteed)return 0;

  const columns=g.columns,rows=g.rows,shapeCells=g.shapeCells,shapeSize=g.shapeSize,
    cellRow=g.cellRow,cellColumn=g.cellColumn;
  let odd=0;
  for(let c=0;c<columns;c++)if((rows-words[offset+c])&1)odd|=1<<c;
  let viable=p.matchingValid[odd];const row=odd*p.matchingSpan,table=p.matchingBlocked;
  for(let word=0;word<coordinateWords;word++){
    let bits=words[opponent+word]>>>0;const indexBase=word<<5;
    while(bits){
      const i=indexBase+firstSetBitIndex32(bits);if(i>=basisSize)break;
      const id=basis[basisOffset+i],base=id*4,count=responseCount[id];let blocked=0;
      for(let j=0;j<count;j++){
        const at=base+j;
        if(responseRows[at]>words[offset+responseColumns[at]]){blocked=1;break;}
      }
      if(!blocked){
        let frontier=0;
        for(let j=0;j<shapeSize[id];j++){
          const cell=shapeCells[base+j],column=cellColumn[cell];
          if(cellRow[cell]===words[offset+column])frontier|=1<<column;
        }
        viable&=table[row+frontier];if(!viable)return 0;
      }
      bits=(bits&(bits-1))>>>0;
    }
  }
  return 1;
}
