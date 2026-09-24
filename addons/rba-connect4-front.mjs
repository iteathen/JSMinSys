import {firstSetBitIndex32} from '../src/word32.mjs';
import {connect4RbaCofactorBasis} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';

export const RBA_BOUNDARY_INCOMPLETE=6,RBA_BOUNDARY_CAPACITY=7;

export function prepareConnect4RbaFrontArena(g,{depth=2,capacity=256,budget=100000,profile=prepareConnect4RbaExecutionProfile(g)}={}){
  if(!Number.isInteger(depth)||depth<0||!Number.isInteger(capacity)||capacity<1||
     !Number.isInteger(budget)||budget<1)throw new RangeError('RBA front arena bounds');
  const actionBase=(depth+1)*12,slots=actionBase+g.columns*4,recordWords=g.generatorWords,
    base=new Uint32Array(slots),slotStride=capacity*recordWords;
  for(let slot=0;slot<slots;slot+=1)base[slot]=slot*slotStride;
  return {depth,capacity,budget,steps:0,error:0,actionBase,recordWords,profile,
    words:new Uint32Array(slots*capacity*recordWords),count:new Uint32Array(slots),base,
    basis:new Uint32Array((depth+1)*g.maxBasis),size:new Uint32Array(depth+1),
    valid:new Uint32Array((depth+1)*g.coordWords),
    up:new Uint32Array((depth+1)*g.maxBasis*g.coordWords),
    seen:new Uint32Array(g.shapeWordCount),temp:new Uint32Array(recordWords),
    image0:new Uint32Array(g.maxBasis*g.coordWords),image1:new Uint32Array(g.maxBasis*g.coordWords),
    top1:new Uint32Array(g.maxBasis),adjoint:new Uint32Array(g.coordWords),
    target:new Uint32Array((g.maxBasis+1)*g.coordWords),cover:new Uint32Array((g.maxBasis+1)*g.coordWords),
    next:new Uint32Array(g.maxBasis+1),heights:new Uint32Array(g.columns),rootRank:0};
}
function spend(a,n=1){if(a.steps+n>a.budget){a.error=RBA_BOUNDARY_INCOMPLETE;return 0;}a.steps+=n;return 1;}
function insertFrom(a,slot,source,sourceOffset){
  if(!spend(a))return a.error;
  const n=a.profile.insertFront(a.words,a.base[slot],a.count[slot],a.capacity,a.recordWords,source,sourceOffset);
  if(n<0){a.error=RBA_BOUNDARY_CAPACITY;return a.error;}a.count[slot]=n;return 0;
}
function insert(a,slot){return insertFrom(a,slot,a.temp,0);}
function swap(a,left,right){const b=a.base[left],n=a.count[left];a.base[left]=a.base[right];a.count[left]=a.count[right];a.base[right]=b;a.count[right]=n;}
function universal(a,slot){a.count[slot]=1;const b=a.base[slot];for(let w=0;w<a.recordWords;w+=1)a.words[b+w]=0;}
function combine(a,left,right,out,intersect){
  a.count[out]=0;
  if(!intersect){swap(a,left,out);for(let i=0;i<a.count[right];i+=1){const b=a.base[right]+i*a.recordWords;if(insertFrom(a,out,a.words,b))return a.error;}return 0;}
  const pairs=a.count[left]*a.count[right];if(!spend(a,pairs||1))return a.error;
  const n=a.profile.productJoin(a.words,a.base[out],0,a.capacity,a.words,a.base[left],a.count[left],a.words,a.base[right],a.count[right],a.recordWords,a.temp,0);
  if(n<0){a.error=RBA_BOUNDARY_CAPACITY;return a.error;}a.count[out]=n;return 0;
}
function prepareValid(g,a,d,n){
  const cw=g.coordWords,base=d*cw,full=n>>>5,rem=n&31;let w=0;
  for(;w<full;w+=1)a.valid[base+w]=0xffffffff;
  if(w<cw){a.valid[base+w]=rem?0xffffffff>>>(32-rem):0;w+=1;}
  for(;w<cw;w+=1)a.valid[base+w]=0;
}
function prepareUpsets(g,a,d,basis,bi,n){
  const cw=g.coordWords,depthBase=d*g.maxBasis*cw;
  let pair=0;while(pair<n&&basis[bi+pair]<g.pairShapeStart)pair+=1;
  let triple=pair;while(triple<n&&basis[bi+triple]<g.tripleShapeStart)triple+=1;
  let quad=triple;while(quad<n&&basis[bi+quad]<g.quadShapeStart)quad+=1;
  for(let i=0;i<n;i+=1){
    const row=depthBase+i*cw;for(let w=0;w<cw;w+=1)a.up[row+w]=0;
    a.up[row+(i>>>5)]|=1<<(i&31);
    const id=basis[bi+i],start=id<g.pairShapeStart?pair:
      id<g.tripleShapeStart?triple:id<g.quadShapeStart?quad:n,subset=a.profile.prepareSubset(g,id);
    for(let j=start;j<n;j+=1)if(a.profile.shapeSubsetPrepared(g,subset,basis[bi+j]))a.up[row+(j>>>5)]|=1<<(j&31);
  }
}
function prepareImages(g,a,d,cell,mover,basis,bi){
  const n=a.size[d],cn=a.size[d+1],cw=g.coordWords,nextValid=(d+1)*cw,nextBasis=(d+1)*g.maxBasis,
    remove=a.profile.prepareRemove(g,cell);
  let pair=0;while(pair<cn&&a.basis[nextBasis+pair]<g.pairShapeStart)pair+=1;
  let triple=pair;while(triple<cn&&a.basis[nextBasis+triple]<g.tripleShapeStart)triple+=1;
  let quad=triple;while(quad<cn&&a.basis[nextBasis+quad]<g.quadShapeStart)quad+=1;
  for(let i=0;i<n;i+=1){const id=basis[bi+i],removed=a.profile.removePrepared(g,id,remove);a.top1[i]=0;
    const row=i*cw;for(let w=0;w<cw;w+=1){a.image0[row+w]=0;a.image1[row+w]=0;}
    for(let p=0;p<2;p+=1){if(p!==mover&&removed!==id)continue;const image=p===mover?removed:id,out=p===0?a.image0:a.image1;
      if(image<0){if(p===1)a.top1[i]=1;for(let w=0;w<cw;w+=1)out[row+w]=a.valid[nextValid+w];}
      else{
        const classStart=image<g.pairShapeStart?0:image<g.tripleShapeStart?pair:image<g.quadShapeStart?triple:quad,
          largerStart=image<g.pairShapeStart?pair:image<g.tripleShapeStart?triple:image<g.quadShapeStart?quad:cn;
        for(let j=classStart;j<largerStart;j+=1)if(a.basis[nextBasis+j]===image){out[row+(j>>>5)]|=1<<(j&31);break;}
        const subset=a.profile.prepareSubset(g,image);
        for(let j=largerStart;j<cn;j+=1)if(a.profile.shapeSubsetPrepared(g,subset,a.basis[nextBasis+j]))out[row+(j>>>5)]|=1<<(j&31);
      }
    }
  }
}
function covers(g,a,d,childBase,out){
  const n=a.size[d],cw=g.coordWords,validBase=d*cw,upBase=d*g.maxBasis*cw;
  for(let w=0;w<cw;w+=1){a.target[w]=a.words[childBase+w];a.cover[w]=0;}a.next[0]=0;let level=0;
  while(level>=0){if(!spend(a))return a.error;const b=level*cw;let any=0;for(let w=0;w<cw;w+=1)any|=a.target[b+w];
    if(!any){for(let w=0;w<cw;w+=1){a.temp[w]=a.cover[b+w];a.temp[cw+w]=a.valid[validBase+w]&~a.adjoint[w];}if(insert(a,out))return a.error;level-=1;continue;}
    let lane=0;while(lane<cw&&!a.target[b+lane])lane+=1;const mask=1<<firstSetBitIndex32(a.target[b+lane]);
    let i=a.next[level];while(i<n&&!(a.image0[i*cw+lane]&mask))i+=1;if(i===n){level-=1;continue;}
    const upRow=upBase+i*cw;
    a.next[level]=i+1;for(let w=0;w<cw;w+=1){a.target[b+cw+w]=a.target[b+w]&~a.image0[i*cw+w];a.cover[b+cw+w]=a.cover[b+w]|a.up[upRow+w];}
    level+=1;a.next[level]=0;
  }
  return 0;
}
function preimage(g,a,d,child,out,cell,mover,basis,bi){
  const cw=g.coordWords,size=a.size[d],upBase=d*g.maxBasis*cw;a.count[out]=0;
  for(let j=0;j<a.count[child];j+=1){const cb=a.base[child]+j*a.recordWords;for(let w=0;w<cw;w+=1)a.adjoint[w]=0;
    for(let i=0;i<size;i+=1){if(a.top1[i])continue;let ok=1;for(let w=0;w<cw;w+=1)if(a.image1[i*cw+w]&a.words[cb+cw+w]){ok=0;break;}
      if(ok){const upRow=upBase+i*cw;for(let w=0;w<cw;w+=1)a.adjoint[w]|=a.up[upRow+w];}
    }
    if(covers(g,a,d,cb,out))return a.error;
  }
  if(mover===0){const singleton=g.singletonByCell[cell];if(singleton>=0)for(let i=0;i<size;i+=1)if(basis[bi+i]===singleton){
    const upRow=upBase+i*cw;for(let w=0;w<cw;w+=1){a.temp[w]=a.up[upRow+w];a.temp[cw+w]=0;}if(insert(a,out))return a.error;break;
  }}
  return 0;
}
function buildAt(g,a,d,remaining,basis,bi,n){
  if(!spend(a))return a.error;const slot=d*12,rank=a.rootRank+d;a.size[d]=n;prepareValid(g,a,d,n);
  if(rank===g.cellCount){universal(a,slot);a.count[slot+1]=0;universal(a,slot+2);a.count[slot+3]=0;return 0;}
  if(!remaining){a.count[slot]=0;a.count[slot+1]=0;universal(a,slot+2);universal(a,slot+3);return 0;}
  prepareUpsets(g,a,d,basis,bi,n);const mover=rank&1,childBi=(d+1)*g.maxBasis,childSlot=(d+1)*12;
  for(let h=0;h<4;h+=1){if(mover)universal(a,slot+h);else a.count[slot+h]=0;}
  for(let c=0;c<g.columns;c+=1){const height=a.heights[c];if(height>=g.rows)continue;const cell=height*g.columns+c;
    const cn=connect4RbaCofactorBasis(g,a.profile,basis,bi,n,cell,a.basis,childBi,a.seen);a.heights[c]=height+1;
    if(buildAt(g,a,d+1,remaining-1,a.basis,childBi,cn))return a.error;a.heights[c]=height;prepareImages(g,a,d,cell,mover,basis,bi);
    for(let h=0;h<4;h+=1){if(preimage(g,a,d,childSlot+h,slot+4+h,cell,mover,basis,bi))return a.error;
      if(combine(a,slot+h,slot+4+h,slot+8+h,mover))return a.error;swap(a,slot+8+h,slot+h);
      if(d===0)swap(a,slot+4+h,a.actionBase+c*4+h);
    }
  }
  return 0;
}
export function buildConnect4RbaFourFront(g,a,words,offset,basis,bi,n){
  a.steps=0;a.error=0;
  for(let c=0;c<g.columns;c+=1)a.heights[c]=words[offset+c];a.rootRank=words[offset+g.metaOffset]>>>2;
  return buildAt(g,a,0,a.depth,basis,bi,n);
}
function member(a,slot,words,p0,p1,cw){
  const count=a.count[slot],base=a.base[slot],recordWords=a.recordWords,front=a.words;
  for(let i=0;i<count;i+=1){const b=base+i*recordWords;let ok=1;
    for(let w=0;w<cw;w+=1)if((front[b+w]&~words[p0+w])||(front[b+cw+w]&words[p1+w])){ok=0;break;}
    if(ok)return 1;
  }return 0;
}
export function queryConnect4RbaFourFront(g,a,slot,words,offset){
  const cw=g.coordWords,p0=offset+g.p0Offset,p1=offset+g.p1Offset;
  const lower=member(a,slot+1,words,p0,p1,cw)?3:member(a,slot,words,p0,p1,cw)?2:1;
  const upper=member(a,slot+3,words,p0,p1,cw)?3:member(a,slot+2,words,p0,p1,cw)?2:1;
  return lower|(upper<<2);
}
