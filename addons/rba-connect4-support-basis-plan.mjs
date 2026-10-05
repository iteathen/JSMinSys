// Geometry-only immutable support plans. No board owners, values or move labels.
import {connect4RbaBasisFromSupport} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {emitSortedSetBitsAt32} from '../src/basis32.mjs';

export function prepareSupportBasisPlans32(g,budgetBytes=256*2**20,withClosures=false){
  if(!Number.isSafeInteger(budgetBytes)||budgetBytes<0)throw new RangeError('invalid support-plan budget');
  if(typeof withClosures!=='boolean')throw new TypeError('invalid support closure mode');
  const radix=g.rows+1;
  let profiles=1;
  for(let c=0;c<g.columns;c++){
    profiles*=radix;
    if(!Number.isSafeInteger(profiles)||profiles>0xffffffff)return null;
  }
  const Id=g.shapeCount<=256?Uint8Array:g.shapeCount<=65536?Uint16Array:Uint32Array,
    Size=g.maxBasis<=255?Uint8Array:g.maxBasis<=65535?Uint16Array:Uint32Array,
    basisElements=profiles*g.maxBasis,maskElements=profiles*g.shapeWordCount,
    closureElements=withClosures?basisElements*g.coordWords:0,
    bytes=basisElements*Id.BYTES_PER_ELEMENT+maskElements*4+profiles*Size.BYTES_PER_ELEMENT+g.columns*4+closureElements*4;
  if(!Number.isSafeInteger(bytes)||bytes>budgetBytes||basisElements>0xffffffff||maskElements>0xffffffff||closureElements>0xffffffff)return null;
  const basis=new Id(new SharedArrayBuffer(basisElements*Id.BYTES_PER_ELEMENT)),
    sizes=new Size(new SharedArrayBuffer(profiles*Size.BYTES_PER_ELEMENT)),
    membership=new Uint32Array(new SharedArrayBuffer(maskElements*4)),
    strides=new Uint32Array(new SharedArrayBuffer(g.columns*4)),
    zero=new Uint32Array(g.columns),seen=new Uint32Array(g.shapeWordCount),
    profile=prepareConnect4RbaExecutionProfile(g);
  let stride=1;
  for(let c=0;c<g.columns;c++){strides[c]=stride;stride*=radix;}
  sizes[0]=connect4RbaBasisFromSupport(g,zero,0,basis,0,seen);
  membership.set(seen);
  // Pick one occupied column deterministically. Its one-cell predecessor has
  // smaller handle and is already prepared. Rule-derived cofactor, no replay.
  for(let index=1;index<profiles;index++){
    let remaining=index,column=0,height;
    while((height=remaining%radix)===0){remaining=Math.floor(remaining/radix);column++;}
    const parent=index-strides[column],parentBase=parent*g.maxBasis,
      maskBase=index*g.shapeWordCount,remove=profile.prepareRemove(g,(height-1)*g.columns+column);
    for(let i=0,n=sizes[parent];i<n;i++){
      const id=profile.removePrepared(g,basis[parentBase+i],remove);
      if(id>=0)membership[maskBase+(id>>>5)]|=1<<(id&31);
    }
    sizes[index]=emitSortedSetBitsAt32(membership,maskBase,g.shapeWordCount,basis,index*g.maxBasis);
  }
  const closures=withClosures?new Uint32Array(new SharedArrayBuffer(closureElements*4)):null;
  if(withClosures)compileSupportClosures32(g,basis,sizes,membership,closures,profiles);
  // Membership is a compile-time dependency only once closure rows exist.
  // No runtime consumer needs the intermediate table in the closure kernel.
  return Object.freeze({basis,sizes,membership:withClosures?null:membership,strides,profiles,
    bytes:withClosures?bytes-maskElements*4:bytes,workingBytes:bytes,radix,closures});
}

export function compileSupportClosures32(g,basis,sizes,membership,closures,profiles){
  const inverse=new Uint32Array(g.shapeCount),offsets=g.supersetWordOffsets,
    words=g.supersetWords,masks=g.supersetMasks,Z=g.coordWords;
  for(let index=0;index<profiles;index++){
    const base=index*g.maxBasis,maskBase=index*g.shapeWordCount,n=sizes[index];
    for(let i=0;i<n;i++)inverse[basis[base+i]]=i;
    for(let i=0;i<n;i++){
      const image=basis[base+i],row=(base+i)*Z;
      closures[row+(i>>>5)]|=1<<(i&31);
      for(let at=offsets[image],end=offsets[image+1];at<end;at++){
        const word=words[at],shapeBase=word<<5;
        let bits=masks[at]&membership[maskBase+word];
        // Only current membership bits can reach inverse; stale IDs cannot.
        while(bits){const bit=bits&-bits,j=inverse[shapeBase+31-Math.clz32(bit)];
          closures[row+(j>>>5)]|=1<<(j&31);bits^=bit;}
      }
    }
  }
}

// HOT: only selected when a complete plan was admitted during initialization.
// Current canonical support heights select the canonical child frame's basis.
export function loadSupportBasis32(g,target,dst,childBasis,ci,seen){
  const plan=g.supportBasisPlans;
  let index=0;
  for(let c=0;c<g.columns;c++)index+=target[dst+c]*plan.strides[c];
  const n=plan.sizes[index],base=index*g.maxBasis,maskBase=index*g.shapeWordCount;
  for(let i=0;i<n;i++)childBasis[ci+i]=plan.basis[base+i];
  for(let w=0;w<g.shapeWordCount;w++)seen[w]=plan.membership[maskBase+w];
  return n;
}

// Closure-only kernel: membership copying has become dead work. Keep the
// existing scratch ABI, but seen is no longer an output/dependency on this path.
export function loadSupportClosureBasis32(g,target,dst,childBasis,ci,seen,indexOut,childIndex){
  const plan=g.supportBasisPlans;
  let index=0;
  for(let c=0;c<g.columns;c++)index+=target[dst+c]*plan.strides[c];
  const n=plan.sizes[index],base=index*g.maxBasis;
  for(let i=0;i<n;i++){const id=plan.basis[base+i];childBasis[ci+i]=id;childIndex[id]=i;}
  indexOut[0]=index;
  return n;
}

export function applySupportClosure3x32(closures,base,count,target,p0,p1,write0,write1){
  const a=closures[base],b=closures[base+1],c=closures[base+2];
  if(write0){target[p0]|=a;target[p0+1]|=b;target[p0+2]|=c;}
  if(write1){target[p1]|=a;target[p1+1]|=b;target[p1+2]|=c;}
}
export function applySupportClosureSpan32(closures,base,count,target,p0,p1,write0,write1){
  for(let w=0;w<count;w++){
    const mask=closures[base+w];
    if(write0)target[p0+w]|=mask;
    if(write1)target[p1+w]|=mask;
  }
}
