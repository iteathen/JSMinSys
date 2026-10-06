// Complete immutable sorted support rows; no per-child inverse scratch.
export function prepareSupportSearchBasisScratch32(g){
 return {map:new Uint32Array(1),mirror:new Uint32Array(g.keyWords)};
}

// Legacy transition argument shape retained. All unused scratch is ignored.
export function loadSupportSearchBasisKnownHandle32(g,target,dst,childBasis,ci,seen,indexOut,childIndex,index){
 indexOut[0]=index;
 return g.supportBasisPlans.sizes[index];
}

// Precondition: image is a member of the exact sorted support row.
export function findSupportBasisSlot32(ids,base,n,image){
 let lo=0,hi=n;
 while(lo<hi){
  const mid=(lo+hi)>>>1;
  if(ids[base+mid]<image)lo=mid+1;else hi=mid;
 }
 return lo;
}
