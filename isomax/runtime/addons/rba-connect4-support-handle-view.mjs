// Complete immutable plan contract. Handles are mixed-radix support identities.
export function initializeSupportBasisHandle32(g,words,offset,ingressBasis,bi,n){
 const plan=g.supportBasisPlans;let handle=0;
 for(let c=0;c<g.columns;c++)handle+=words[offset+c]*plan.strides[c];
 const base=handle*g.maxBasis;
 if(words[offset+g.metaOffset]&3)return handle;
 if(n!==plan.sizes[handle])throw new RangeError('root ingress basis size does not match support plan');
 for(let i=0;i<n;i++)if(ingressBasis[bi+i]!==plan.basis[base+i])throw new RangeError('root ingress basis order does not match support plan');
 return handle;
}

// Known legal child handle; no height scan, decoder or shared basis writes.
export function loadSupportBasisKnownHandle32(g,target,dst,childBasis,ci,seen,indexOut,childIndex,index){
 const plan=g.supportBasisPlans,n=plan.sizes[index],base=index*g.maxBasis;
 for(let i=0;i<n;i++)childIndex[plan.basis[base+i]]=i;
 indexOut[0]=index;
 return n;
}
