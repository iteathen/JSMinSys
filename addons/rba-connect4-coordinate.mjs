import {emitSortedSetBits32} from '../src/basis32.mjs';
import {publishSpan32} from '../src/widekey32.mjs';
import {connect4RbaShapeContains} from './rba-connect4-geometry.mjs';

export function connect4RbaTerminal(g,words,offset){return words[offset+g.metaOffset]&3;}
export function connect4RbaRank(g,words,offset){return words[offset+g.metaOffset]>>>2;}
export function connect4RbaPlayer(g,words,offset){return (words[offset+g.metaOffset]>>>2)&1;}

export function connect4RbaBasisFromSupport(g,support,supportOffset,out,outOffset,seen){
  for(let w=0;w<g.shapeWordCount;w+=1)seen[w]=0;
  for(let line=0;line<g.lineCount;line+=1){
    const base=line*4;let bits=0;
    for(let i=0;i<4;i+=1){
      const column=g.lineColumn[base+i],row=g.lineRow[base+i];
      if(support[supportOffset+column]<=row)bits|=1<<i;
    }
    if(bits){const id=g.lineShape[line*16+bits];seen[id>>>5]|=1<<(id&31);}
  }
  return emitSortedSetBits32(seen,g.shapeWordCount,out,outOffset);
}
export function connect4RbaCofactorBasis(g,profile,parent,parentOffset,count,cell,out,outOffset,seen,removed=null){
  for(let w=0;w<g.shapeWordCount;w+=1)seen[w]=0;
  for(let i=0;i<count;i+=1){
    const id=profile.removeCell(g,parent[parentOffset+i],cell);
    if(removed)removed[i]=id;
    if(id>=0)seen[id>>>5]|=1<<(id&31);
  }
  return emitSortedSetBits32(seen,g.shapeWordCount,out,outOffset);
}

export function connect4RbaCofactor(g,profile,source,src,basis,bi,n,column,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed=null){
  const meta=source[src+g.metaOffset],terminal=meta&3,rank=meta>>>2;
  if(terminal||column<0||column>=g.columns)return -1;
  const height=source[src+column];if(height>=g.rows)return -1;
  const cell=height*g.columns+column,player=rank&1;
  for(let c=0;c<g.columns;c+=1)target[dst+c]=source[src+c];
  target[dst+column]=height+1;target[dst+g.metaOffset]=(rank+1)<<2;
  for(let w=0;w<2*g.coordWords;w+=1)target[dst+g.p0Offset+w]=0;
  sizes[sizeIndex]=0;

  const singleton=g.singletonByCell[cell];
  if(singleton>=0){
    // Basis ids are sorted. Singleton shape ids occupy the first shape-size
    // class, so stop as soon as the target id has been passed instead of
    // scanning the entire residual basis on every played cell.
    const coord=src+(player?g.p1Offset:g.p0Offset);
    for(let i=0;i<n;i+=1){
      const id=basis[bi+i];if(id>singleton)break;
      if(id===singleton&&(source[coord+(i>>>5)]&(1<<(i&31)))){
        const value=player?1:3;target[dst+g.metaOffset]=((rank+1)<<2)|value;return value;
      }
    }
  }
  if(rank+1===g.cellCount){target[dst+g.metaOffset]=((rank+1)<<2)|2;return 2;}

  const cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed);sizes[sizeIndex]=cn;
  // Child basis ids are sorted by residual cardinality. Find each class
  // boundary once, then coordinate propagation never tests a too-small child
  // as a possible superset of the current image.
  let childPair=0;
  while(childPair<cn&&childBasis[ci+childPair]<g.pairShapeStart)childPair+=1;
  let childTriple=childPair;
  while(childTriple<cn&&childBasis[ci+childTriple]<g.tripleShapeStart)childTriple+=1;
  let childQuad=childTriple;
  while(childQuad<cn&&childBasis[ci+childQuad]<g.quadShapeStart)childQuad+=1;
  for(let p=0;p<2;p+=1){
    const sourceCoord=src+(p?g.p1Offset:g.p0Offset),targetCoord=dst+(p?g.p1Offset:g.p0Offset);
    for(let i=0;i<n;i+=1){
      if(!(source[sourceCoord+(i>>>5)]&(1<<(i&31))))continue;
      const id=basis[bi+i],raw=removed?removed[i]:profile.removeCell(g,id,cell),
        imageRemoved=raw===0xffffffff?-1:raw;
      if(p!==player&&imageRemoved!==id)continue;
      const image=p===player?imageRemoved:id;
      if(image<0)continue;
      let j=image<g.pairShapeStart?0:
        image<g.tripleShapeStart?childPair:
        image<g.quadShapeStart?childTriple:childQuad;
      for(;j<cn;j+=1)if(profile.shapeSubset(g,image,childBasis[ci+j]))
        target[targetCoord+(j>>>5)]|=1<<(j&31);
    }
  }
  return 0;
}

function compareSupport(g,words,offset,reflected){
  for(let c=0;c<g.columns;c+=1){
    const a=words[offset+c],b=reflected[c];
    if(a<b)return -1;if(a>b)return 1;
  }
  return 0;
}
export function connect4RbaCanonicalize(g,profile,words,offset,basis,bi,n,scratch){
  for(let c=0;c<g.columns;c+=1)scratch.mirror[c]=words[offset+g.mirrorColumn[c]];
  scratch.mirror[g.metaOffset]=words[offset+g.metaOffset];
  const primary=compareSupport(g,words,offset,scratch.mirror);
  if(primary<0)return 0;

  for(let w=0;w<g.shapeWordCount;w+=1)scratch.seen[w]=0;
  for(let i=0;i<n;i+=1){const id=g.reflect[basis[bi+i]];scratch.seen[id>>>5]|=1<<(id&31);}
  const rn=emitSortedSetBits32(scratch.seen,g.shapeWordCount,scratch.mirrorBasis,0);
  for(let i=0;i<rn;i+=1)scratch.inverse[scratch.mirrorBasis[i]]=i;
  for(let i=0;i<n;i+=1)scratch.map[i]=scratch.inverse[g.reflect[basis[bi+i]]];
  profile.permuteBits(scratch.mirror,g.p0Offset,g.coordWords,words,offset+g.p0Offset,scratch.map,0,n);
  profile.permuteBits(scratch.mirror,g.p1Offset,g.coordWords,words,offset+g.p1Offset,scratch.map,0,n);

  if(primary===0){
    let w=g.p0Offset;while(w<g.keyWords&&words[offset+w]===scratch.mirror[w])w+=1;
    if(w===g.keyWords||words[offset+w]<scratch.mirror[w])return 0;
  }
  publishSpan32(words,offset,scratch.mirror,0,g.keyWords);
  publishSpan32(basis,bi,scratch.mirrorBasis,0,n);
  return 1;
}
