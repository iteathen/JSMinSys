// Current-rank response-capacity certificate. Exact prepared nonterminal q;
// caller rules out own immediate wins and dual opponent frontier obligations.
import {connect4RbaExposesOpponentWin} from './rba-connect4-coordinate.mjs';

export function prepareConnect4CpcxPairHub32(g){
  const start=g.pairShapeStart,end=g.tripleShapeStart,columns=g.columns,rows=g.rows,
    limit=(columns>rows?columns:rows)-1,
    Field=limit<=255?Uint8Array:limit<=65535?Uint16Array:Uint32Array,
    pairs=new Field((end-start)*4),counts=new Uint8Array(columns),
    firstColumn=new Uint32Array(columns),p0=g.p0Offset,p1=g.p1Offset;
  for(let id=start;id<end;id++){
    const at=(id-start)*4,base=id*4,a=g.shapeCells[base],b=g.shapeCells[base+1];
    pairs[at]=g.cellColumn[a];pairs[at+1]=g.cellRow[a];
    pairs[at+2]=g.cellColumn[b];pairs[at+3]=g.cellRow[b];
  }

  function addSpoke(words,offset,tc,tr,cc,cr,forced){
    if((forced>=0&&tc!==forced)||words[offset+tc]!==tr||
      cr!==words[offset+cc]+(cc===tc?1:0)||counts[tc]===255)return -1;
    if(counts[tc]===0){counts[tc]=1;firstColumn[tc]=cc;return -1;}
    if(firstColumn[tc]===cc)return -1;
    counts[tc]=2;return tc;
  }

  function findConnect4CpcxPairHub32(words,offset,basis,bi,n,mover,forced){
    if(!n||basis[bi+n-1]<start||basis[bi]>=end)return -1;
    for(let c=0;c<columns;c++)counts[c]=0;
    const own=offset+(mover?p1:p0),activeWords=(n+31)>>>5;
    for(let word=0;word<activeWords;word++){
      let bits=words[own+word];
      if(word+1===activeWords)bits&=0xffffffff>>>((-n)&31);
      while(bits){
        const low=bits&-bits,i=(word<<5)+31-Math.clz32(low),id=basis[bi+i];bits^=low;
        if(id<start)continue;if(id>=end)return -1;
        const at=(id-start)*4,ac=pairs[at],ar=pairs[at+1],bc=pairs[at+2],br=pairs[at+3];
        let candidate=addSpoke(words,offset,ac,ar,bc,br,forced);
        if(candidate>=0){
          if(!connect4RbaExposesOpponentWin(g,words,offset,basis,bi,n,mover,candidate,words[offset+candidate]))return candidate;
          counts[candidate]=255;
        }
        candidate=addSpoke(words,offset,bc,br,ac,ar,forced);
        if(candidate>=0){
          if(!connect4RbaExposesOpponentWin(g,words,offset,basis,bi,n,mover,candidate,words[offset+candidate]))return candidate;
          counts[candidate]=255;
        }
      }
    }
    return -1;
  }
  return {find:findConnect4CpcxPairHub32,fieldBytes:Field.BYTES_PER_ELEMENT,
    planBytes:pairs.byteLength,scratchBytes:counts.byteLength+firstColumn.byteLength};
}
