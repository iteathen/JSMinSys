// Geometry-owned immutable row access. Complete closure+reflection plan required.
export function prepareSupportBasisViewScratch32(g){
  return {inverse:new Uint32Array(g.shapeCount),map:new Uint32Array(1),mirror:new Uint32Array(g.keyWords)};
}

// Position-dependent one-shot check AFTER readiness; no row remapping heuristic.
export function initializeSupportBasisView32(g,words,offset,ingressBasis,bi,n){
  const plan=g.supportBasisPlans;let handle=0;
  for(let c=0;c<g.columns;c++)handle+=words[offset+c]*plan.strides[c];
  const base=handle*g.maxBasis;
  if(words[offset+g.metaOffset]&3)return base; // terminal never reads a basis
  if(n!==plan.sizes[handle])throw new RangeError('root ingress basis size does not match support plan');
  for(let i=0;i<n;i++)if(ingressBasis[bi+i]!==plan.basis[base+i])throw new RangeError('root ingress basis order does not match support plan');
  return base;
}

// Same legacy scratch ABI, but childBasis/ci/seen are intentionally not outputs.
export function loadSupportClosureBasisView32(g,target,dst,childBasis,ci,seen,indexOut,childIndex){
  const plan=g.supportBasisPlans;let index=0;
  for(let c=0;c<g.columns;c++)index+=target[dst+c]*plan.strides[c];
  const n=plan.sizes[index],base=index*g.maxBasis;
  for(let i=0;i<n;i++)childIndex[plan.basis[base+i]]=i;
  indexOut[0]=index;
  return n;
}
