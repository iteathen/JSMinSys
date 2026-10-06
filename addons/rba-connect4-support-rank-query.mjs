import {popcount32} from '../src/word32.mjs';

// Geometry-only preparation. Reuse all prior basis/closure/reflection buffers.
export function prepareSupportRankQuery32(g,plan,budgetBytes){
 if(!Number.isSafeInteger(budgetBytes)||budgetBytes<0)throw new RangeError('invalid support rank budget');
 if(!plan?.closures||!plan?.mirrorMap)return null;
 const Prefix=g.maxBasis<=255?Uint8Array:g.maxBasis<=65535?Uint16Array:Uint32Array,
  elements=plan.profiles*g.shapeWordCount,bytes=elements*(4+Prefix.BYTES_PER_ELEMENT),
  workingBytes=plan.workingBytes+bytes;
 if(!Number.isSafeInteger(elements)||elements>0xffffffff||!Number.isSafeInteger(workingBytes)||workingBytes>budgetBytes)return null;
 const rankMembership=new Uint32Array(new SharedArrayBuffer(elements*4)),
  rankPrefix=new Prefix(new SharedArrayBuffer(elements*Prefix.BYTES_PER_ELEMENT));
 for(let h=0;h<plan.profiles;h++){
  const base=h*g.maxBasis,wordBase=h*g.shapeWordCount;
  for(let i=0,n=plan.sizes[h];i<n;i++){
   const id=plan.basis[base+i];rankMembership[wordBase+(id>>>5)]|=1<<(id&31);
  }
  let count=0;
  for(let w=0;w<g.shapeWordCount;w++){
   rankPrefix[wordBase+w]=count;count+=popcount32(rankMembership[wordBase+w]);
  }
 }
 return Object.freeze({...plan,rankMembership,rankPrefix,rankQueryBytes:bytes,bytes:plan.bytes+bytes,workingBytes});
}

// A proved member of the exact child support row licenses the rank query.
export function findSupportRankSlot32(membership,prefix,rowBase,image){
 const at=rowBase+(image>>>5),lower=~(0xffffffff<<(image&31));
 // GENERATED expansion of sealed popcount32; no nested hot call.
  let x = membership[at] & lower;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return prefix[at] + (Math.imul(x, 0x01010101) >>> 24);
}
