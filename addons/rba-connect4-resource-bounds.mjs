// Rules-derived certificates for valid RBA coordinates. Owner channels cannot
// revive: every projected bit requires a bit in that same parent owner channel.
// Bits4/8 mean owner0/owner1 cannot ever win. They are not physical terminals.
export function deriveConnect4RbaResourceFlags32(g,words,offset){
  if(words[offset+g.metaOffset]&3)return 0;
  let owner0=0,owner1=0;
  for(let w=0;w<g.coordWords;w+=1){owner0|=words[offset+g.p0Offset+w];owner1|=words[offset+g.p1Offset+w];}
  return (owner0?0:4)|(owner1?0:8);
}

// COLD adapter for an ordinary, dimension-selected cofactor. No rest arrays,
// allocation, clocks, reporting or mutable metadata in its recursive call.
export function wrapConnect4ResourceCofactor32(cofactor){
  return function resourceCofactor(g,profile,source,src,basis,bi,n,column,height,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed,childIndex){
    const terminal=cofactor(g,profile,source,src,basis,bi,n,column,height,target,dst,childBasis,ci,seen,sizes,sizeIndex,removed,childIndex);
    return terminal||deriveConnect4RbaResourceFlags32(g,target,dst);
  };
}
