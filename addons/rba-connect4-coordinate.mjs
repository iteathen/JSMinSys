import {emitSortedSetBits32,emitSortedSetBitsAt32} from '../src/basis32.mjs';
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
export function connect4RbaCofactorBasis(g,profile,parent,parentOffset,count,cell,out,outOffset,seen,removed=null,seenOffset=0){
  for(let w=0;w<g.shapeWordCount;w+=1)seen[seenOffset+w]=0;
  const remove=profile.prepareRemove(g,cell);
  for(let i=0;i<count;i+=1){
    const id=profile.removePrepared(g,parent[parentOffset+i],remove);
    if(removed)removed[i]=id;
    if(id>=0)seen[seenOffset+(id>>>5)]|=1<<(id&31);
  }
  return seenOffset
    ?emitSortedSetBitsAt32(seen,seenOffset,g.shapeWordCount,out,outOffset)
    :emitSortedSetBits32(seen,g.shapeWordCount,out,outOffset);
}

export function connect4RbaCofactor(g,profile,source,src,basis,bi,n,column,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed=null,childIndex=null,seenOffset=0){
  const meta=source[src+g.metaOffset];
  if((meta&3)||column<0||column>=g.columns)return -1;
  const height=source[src+column];if(height>=g.rows)return -1;
  return connect4RbaCofactorKnownHeight(g,profile,source,src,basis,bi,n,column,height,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed,childIndex,seenOffset);
}
export function connect4RbaCofactorKnownLegal(g,profile,source,src,basis,bi,n,column,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed=null,childIndex=null,seenOffset=0){
  return connect4RbaCofactorKnownHeight(g,profile,source,src,basis,bi,n,column,source[src+column],target,dst,childBasis,ci,seen,sizes,sizeIndex,removed,childIndex,seenOffset);
}

const COFACTOR_PLAN_KILL=255;

export function prepareConnect4RbaCofactorPlanCache32(g,{capacity=262144,maxKeyCount=8388608}={}){
  if(!Number.isInteger(capacity)||capacity<1||capacity>262144||
     !Number.isSafeInteger(maxKeyCount)||maxKeyCount<1)
    throw new RangeError('invalid cofactor plan capacity');
  if(g.maxBasis>=127||g.coordWords<1||g.coordWords>3||
     g.removeByCell===null||g.subsetTable===null||g.shapeCount>65535)
    throw new RangeError('geometry exceeds cofactor plan representation');
  const radix=g.rows+1;let supportCount=1;
  for(let c=0;c<g.columns;c+=1){
    supportCount*=radix;
    if(!Number.isSafeInteger(supportCount))throw new RangeError('cofactor plan support space overflow');
  }
  const keyCount=supportCount*g.columns;
  if(!Number.isSafeInteger(keyCount)||keyCount>maxKeyCount)
    throw new RangeError('cofactor plan key space exceeds configured bound');
  const planByKey=new Int32Array(keyCount);planByKey.fill(-1);
  return {
    capacity,count:0,columns:g.columns,radix,stride:g.maxBasis,words:g.coordWords,planByKey,
    n:new Uint8Array(capacity),cn:new Uint8Array(capacity),landing:new Uint8Array(capacity),
    basis:new Uint16Array(capacity*g.maxBasis),
    map:new Uint8Array(capacity*g.maxBasis),
    closure:new Uint32Array(capacity*g.maxBasis*g.coordWords),
  };
}
function cofactorPlanKey(source,src,column,cache){
  let code=0;
  for(let c=cache.columns-1;c>=0;c-=1)code=Math.imul(code,cache.radix)+source[src+c];
  return Math.imul(code,cache.columns)+column;
}
function applyConnect4RbaCofactorPlan32(cache,plan,g,source,src,n,column,height,target,dst,childBasis,ci,sizes,sizeIndex){
  const meta=source[src+g.metaOffset],rank=meta>>>2,player=rank&1;
  for(let c=0;c<g.columns;c+=1)target[dst+c]=source[src+c];
  target[dst+column]=height+1;target[dst+g.metaOffset]=(rank+1)<<2;
  const p0Target=dst+g.p0Offset,p1Target=dst+g.p1Offset,words=cache.words;
  for(let w=0;w<words;w+=1){target[p0Target+w]=0;target[p1Target+w]=0;}
  sizes[sizeIndex]=0;

  const landing=cache.landing[plan],coord=src+(player?g.p1Offset:g.p0Offset);
  if(landing!==COFACTOR_PLAN_KILL&&(source[coord+(landing>>>5)]&(1<<(landing&31)))){
    const value=player?1:3;target[dst+g.metaOffset]=((rank+1)<<2)|value;return value;
  }
  if(rank+1===g.cellCount){target[dst+g.metaOffset]=((rank+1)<<2)|2;return 2;}

  const cn=cache.cn[plan],planBase=plan*cache.stride,closureBase=planBase*words,
    p0Source=src+g.p0Offset,p1Source=src+g.p1Offset;
  sizes[sizeIndex]=cn;
  for(let j=0;j<cn;j+=1)childBasis[ci+j]=cache.basis[planBase+j];

  for(let i=0;i<n;i+=1){
    const sourceWord=i>>>5,sourceMask=1<<(i&31),
      active0=source[p0Source+sourceWord]&sourceMask,
      active1=source[p1Source+sourceWord]&sourceMask;
    if(!(active0|active1))continue;
    const encoded=cache.map[planBase+i];
    if(encoded===COFACTOR_PLAN_KILL)continue;
    const imageIndex=encoded&127,unchanged=encoded&128;
    let write0=active0&&(player===0||unchanged),
      write1=active1&&(player===1||unchanged);
    if(!write0&&!write1)continue;
    const targetWord=imageIndex>>>5,targetMask=1<<(imageIndex&31);
    write0=write0&&!(target[p0Target+targetWord]&targetMask);
    write1=write1&&!(target[p1Target+targetWord]&targetMask);
    if(!write0&&!write1)continue;
    const cb=closureBase+imageIndex*words;
    for(let w=0;w<words;w+=1){
      const closure=cache.closure[cb+w];
      if(write0)target[p0Target+w]|=closure;
      if(write1)target[p1Target+w]|=closure;
    }
  }
  return 0;
}
function storeConnect4RbaCofactorPlan32(cache,key,g,basis,bi,n,cell,landingIndex,childBasis,ci,cn,childIndex){
  if(cache.count>=cache.capacity)return;
  const plan=cache.count++,planBase=plan*cache.stride,words=cache.words,
    closureBase=planBase*words,
    removeRow=cell*g.shapeCount,removeByCell=g.removeByCell,subsetTable=g.subsetTable,shapeCount=g.shapeCount;
  cache.n[plan]=n;cache.cn[plan]=cn;cache.landing[plan]=landingIndex;
  for(let j=0;j<cn;j+=1)cache.basis[planBase+j]=childBasis[ci+j];
  for(let i=0;i<n;i+=1){
    const id=basis[bi+i],image=removeByCell[removeRow+id];
    cache.map[planBase+i]=image<0?COFACTOR_PLAN_KILL:(childIndex[image]|(image===id?128:0));
  }
  for(let j=0;j<cn;j+=1){
    const image=childBasis[ci+j],subset=image*shapeCount,cb=closureBase+j*words;
    for(let k=0;k<cn;k+=1)if(subsetTable[subset+childBasis[ci+k]])
      cache.closure[cb+(k>>>5)]|=1<<(k&31);
  }
  cache.planByKey[key]=plan;
}

export function connect4RbaCofactorKnownHeight(g,profile,source,src,basis,bi,n,column,height,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed=null,childIndex=null,seenOffset=0){
  const meta=source[src+g.metaOffset],rank=meta>>>2,
    cell=height*g.columns+column,player=rank&1,
    planCache=profile.cofactorPlanCache,
    planKey=planCache?cofactorPlanKey(source,src,column,planCache):-1,
    plan=planCache?planCache.planByKey[planKey]:-1;
  if(plan>=0)return applyConnect4RbaCofactorPlan32(planCache,plan,g,source,src,n,column,height,target,dst,childBasis,ci,sizes,sizeIndex);
  for(let c=0;c<g.columns;c+=1)target[dst+c]=source[src+c];
  target[dst+column]=height+1;target[dst+g.metaOffset]=(rank+1)<<2;
  for(let w=0;w<2*g.coordWords;w+=1)target[dst+g.p0Offset+w]=0;
  sizes[sizeIndex]=0;

  // Every physical cell is a singleton residual whenever winning geometry
  // exists. Shape ordering is cardinality then cell id, so singleton id=cell.
  const singleton=cell,coord=src+(player?g.p1Offset:g.p0Offset);
  let lo=0,hi=n;
  while(lo<hi){const mid=(lo+hi)>>>1;if(basis[bi+mid]<singleton)lo=mid+1;else hi=mid;}
  if(lo<n&&basis[bi+lo]===singleton&&(source[coord+(lo>>>5)]&(1<<(lo&31)))){
    const value=player?1:3;target[dst+g.metaOffset]=((rank+1)<<2)|value;return value;
  }
  if(rank+1===g.cellCount){target[dst+g.metaOffset]=((rank+1)<<2)|2;return 2;}

  let cn;
  if(g.removeByCell!==null&&removed&&childIndex&&!seenOffset){
    for(let w=0;w<g.shapeWordCount;w+=1)seen[w]=0;
    const removeRow=cell*g.shapeCount,removeByCell=g.removeByCell;
    for(let i=0;i<n;i+=1){
      const id=removeByCell[removeRow+basis[bi+i]];
      removed[i]=id;
      if(id>=0)seen[id>>>5]|=1<<(id&31);
    }
    cn=emitSortedSetBits32(seen,g.shapeWordCount,childBasis,ci);sizes[sizeIndex]=cn;
  }else{
    cn=connect4RbaCofactorBasis(g,profile,basis,bi,n,cell,childBasis,ci,seen,removed,seenOffset);sizes[sizeIndex]=cn;
  }
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
    p0Target=dst+g.p0Offset,p1Target=dst+g.p1Offset,
    subsetTable=g.subsetTable,shapeCount=g.shapeCount;
  for(let i=0;i<n;i+=1){
    const sourceWord=i>>>5,sourceMask=1<<(i&31),
      active0=source[p0Source+sourceWord]&sourceMask,
      active1=source[p1Source+sourceWord]&sourceMask;
    if(!(active0|active1))continue;
    const id=basis[bi+i],raw=removed?removed[i]:profile.removePrepared(g,id,remove),
      image=raw===0xffffffff?-1:raw;
    if(image<0)continue;
    let write0=active0&&(player===0||image===id),
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
    // HOT CONTRACT: each prior insertion completed its upward closure in this
    // same child basis. An existing image bit therefore absorbs its entire
    // expansion. Test each surviving player independently, BEFORE writing the
    // current image; no additional state/allocation or cross-player inference.
    // Preserve this proof guard and comment when changing the hot path.
    write0=write0&&!(target[p0Target+targetWord]&targetMask);
    write1=write1&&!(target[p1Target+targetWord]&targetMask);
    if(!write0&&!write1)continue;
    if(write0)target[p0Target+targetWord]|=targetMask;
    if(write1)target[p1Target+targetWord]|=targetMask;

    let j=image<g.pairShapeStart?childPair:
      image<g.tripleShapeStart?childTriple:
      image<g.quadShapeStart?childQuad:cn;
    if(subsetTable!==null){
      const subset=image*shapeCount;
      for(;j<cn;j+=1)if(subsetTable[subset+childBasis[ci+j]]){
        targetWord=j>>>5;targetMask=1<<(j&31);
        if(write0)target[p0Target+targetWord]|=targetMask;
        if(write1)target[p1Target+targetWord]|=targetMask;
      }
    }else{
      const subset=profile.prepareSubset(g,image);
      for(;j<cn;j+=1)if(profile.shapeSubsetPrepared(g,subset,childBasis[ci+j])){
        targetWord=j>>>5;targetMask=1<<(j&31);
        if(write0)target[p0Target+targetWord]|=targetMask;
        if(write1)target[p1Target+targetWord]|=targetMask;
      }
    }
  }
  if(planCache&&plan<0&&removed&&childIndex&&!seenOffset){
    const landingIndex=lo<n&&basis[bi+lo]===singleton?lo:COFACTOR_PLAN_KILL;
    storeConnect4RbaCofactorPlan32(planCache,planKey,g,basis,bi,n,cell,landingIndex,childBasis,ci,cn,childIndex);
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
export function connect4RbaCanonicalize(g,profile,words,offset,basis,bi,n,scratch,selectedSet=null,selectedSetOffset=0){
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
  if(selectedSet)publishSpan32(selectedSet,selectedSetOffset,scratch.seen,0,g.shapeWordCount);
  return 1;
}
