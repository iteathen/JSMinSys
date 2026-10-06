// C17 experiment: homogeneous minimal-worker pools only. Exact tags 1/2/3
// remain absolute; tag4 is player0 >= draw and tag5 is player0 <= draw.
// Storage primitives own full-key equality and atomic seqlock publication.
// Legacy exact-only consumers are not members of this pool.
import {prepareSharedCacheAccess} from './rba-connect4-shared-exact-cache-layout.mjs';
import {probeConnect4RbaSharedExactCacheUncounted32,storeConnect4RbaSharedExactCacheUncounted32} from './rba-connect4-shared-exact-cache-uncounted.mjs';
export function transportConnect4ZeroBound32(tag,mover){
  return tag>3&&mover?9-tag:tag;
}
export function prepareSharedProofCacheAccess(cache){
  if(cache.proofDomain!=='absolute-wdl-zero-v1')throw new TypeError('explicit shared proof domain required');
  return cache.layout?prepareSharedCacheAccess(cache):{
    probe:probeConnect4RbaSharedExactCacheUncounted32,
    store:storeConnect4RbaSharedExactCacheUncounted32,
  };
}
