// Geometry-only immutable support plans. No board owners, values or move labels.
import {connect4RbaBasisFromSupport} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {emitSortedSetBitsAt32} from '../src/basis32.mjs';

export function prepareSupportBasisPlans32(g,budgetBytes=256*2**20){
  if(!Number.isSafeInteger(budgetBytes)||budgetBytes<0)throw new RangeError('invalid support-plan budget');
  const radix=g.rows+1;
  let profiles=1;
  for(let c=0;c<g.columns;c++){
    profiles*=radix;
    if(!Number.isSafeInteger(profiles)||profiles>0xffffffff)return null;
  }
  const Id=g.shapeCount<=256?Uint8Array:g.shapeCount<=65536?Uint16Array:Uint32Array,
    Size=g.maxBasis<=255?Uint8Array:g.maxBasis<=65535?Uint16Array:Uint32Array,
    basisElements=profiles*g.maxBasis,maskElements=profiles*g.shapeWordCount,
    bytes=basisElements*Id.BYTES_PER_ELEMENT+maskElements*4+profiles*Size.BYTES_PER_ELEMENT+g.columns*4;
  if(!Number.isSafeInteger(bytes)||bytes>budgetBytes||basisElements>0xffffffff||maskElements>0xffffffff)return null;
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
  return Object.freeze({basis,sizes,membership,strides,profiles,bytes,radix});
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
