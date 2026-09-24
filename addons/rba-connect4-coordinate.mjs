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
  const remove=profile.prepareRemove(g,cell);
  for(let i=0;i<count;i+=1){
    const id=profile.removePrepared(g,parent[parentOffset+i],remove);
    if(removed)removed[i]=id;
    if(id>=0)seen[id>>>5]|=1<<(id&31);
  }
  return emitSortedSetBits32(seen,g.shapeWordCount,out,outOffset);
}

export function connect4RbaCofactor(g,profile,source,src,basis,bi,n,column,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed=null,childIndex=null){
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
    let lo=0,hi=n;
    while(lo<hi){const mid=(lo+hi)>>>1;if(basis[bi+mid]<singleton)lo=mid+1;else hi=mid;}
    if(lo<n&&basis[bi+lo]===singleton&&(source[coord+(lo>>>5)]&(1<<(lo&31)))){
      const value=player?1:3;target[dst+g.metaOffset]=((rank+1)<<2)|value;return value;
    }
  }
  if(rank+1===g.cellCount){target[dst+g.metaOffset]=((rank+1)<<2)|2;return 2;}

  const cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed);sizes[sizeIndex]=cn;
  // One child-basis pass publishes the exact id->index map already owned by
  // coordinate scratch and discovers all cardinality boundaries.
  let childPair=cn,childTriple=cn,childQuad=cn;
  for(let j=0;j<cn;j+=1){
    const id=childBasis[ci+j];
    if(childIndex)childIndex[id]=j;
    if(childPair===cn&&id>=g.pairShapeStart)childPair=j;
    if(childTriple===cn&&id>=g.tripleShapeStart)childTriple=j;
    if(childQuad===cn&&id>=g.quadShapeStart)childQuad=j;
  }
  const remove=removed?0:profile.prepareRemove(g,cell),
    p0Source=src+g.p0Offset,p1Source=src+g.p1Offset,
    p0Target=dst+g.p0Offset,p1Target=dst+g.p1Offset;
  for(let i=0;i<n;i+=1){
    const sourceWord=i>>>5,sourceMask=1<<(i&31),
      active0=source[p0Source+sourceWord]&sourceMask,
      active1=source[p1Source+sourceWord]&sourceMask;
    if(!(active0|active1))continue;
    const id=basis[bi+i],raw=removed?removed[i]:profile.removePrepared(g,id,remove),
      image=raw===0xffffffff?-1:raw;
    if(image<0)continue;
    const write0=active0&&(player===0||image===id),
      write1=active1&&(player===1||image===id);
    if(!write0&&!write1)continue;

    // Both coordinates share the same residual image whenever they survive.
    // Locate and expand it once, then publish the resulting upset bits into
    // whichever player coordinates are active.
    let lo;
    if(childIndex)lo=childIndex[image];
    else{
      lo=0;let hi=cn;
      while(lo<hi){const mid=(lo+hi)>>>1;if(childBasis[ci+mid]<image)lo=mid+1;else hi=mid;}
    }
    let targetWord=lo>>>5,targetMask=1<<(lo&31);
    if(write0)target[p0Target+targetWord]|=targetMask;
    if(write1)target[p1Target+targetWord]|=targetMask;

    let j=image<g.pairShapeStart?childPair:
      image<g.tripleShapeStart?childTriple:
      image<g.quadShapeStart?childQuad:cn;
    const subset=profile.prepareSubset(g,image);
    for(;j<cn;j+=1)if(profile.shapeSubsetPrepared(g,subset,childBasis[ci+j])){
      targetWord=j>>>5;targetMask=1<<(j&31);
      if(write0)target[p0Target+targetWord]|=targetMask;
      if(write1)target[p1Target+targetWord]|=targetMask;
    }
  }
  return 0;
}

function compareReflectedSupport(g,words,offset){
  const half=g.columns>>>1;
  for(let c=0;c<half;c+=1){
    const a=words[offset+c],b=words[offset+g.mirrorColumn[c]];
    if(a<b)return -1;if(a>b)return 1;
  }
  return 0;
}
export function connect4RbaCanonicalize(g,profile,words,offset,basis,bi,n,scratch){
  const primary=compareReflectedSupport(g,words,offset);
  if(primary<0)return 0;

  for(let w=0;w<g.shapeWordCount;w+=1)scratch.seen[w]=0;
  for(let i=0;i<n;i+=1){
    const id=g.reflect[basis[bi+i]];scratch.map[i]=id;scratch.seen[id>>>5]|=1<<(id&31);
  }
  emitSortedSetBits32(scratch.seen,g.shapeWordCount,scratch.mirrorBasis,0);
  for(let i=0;i<n;i+=1)scratch.inverse[scratch.mirrorBasis[i]]=i;
  for(let i=0;i<n;i+=1)scratch.map[i]=scratch.inverse[scratch.map[i]];
  profile.permuteCoordinates(
    scratch.mirror,g.p0Offset,g.p1Offset,g.coordWords,
    words,offset+g.p0Offset,offset+g.p1Offset,scratch.map,0,n,
  );

  if(primary===0){
    let w=g.p0Offset;while(w<g.keyWords&&words[offset+w]===scratch.mirror[w])w+=1;
    if(w===g.keyWords||words[offset+w]<scratch.mirror[w])return 0;
  }
  // Support/meta are needed only when reflection is actually selected. In the
  // symmetric-support case that remains canonical, avoid writing them at all.
  for(let c=0;c<g.columns;c+=1)scratch.mirror[c]=words[offset+g.mirrorColumn[c]];
  scratch.mirror[g.metaOffset]=words[offset+g.metaOffset];
  publishSpan32(words,offset,scratch.mirror,0,g.keyWords);
  publishSpan32(basis,bi,scratch.mirrorBasis,0,n);
  return 1;
}
