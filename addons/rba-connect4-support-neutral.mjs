// Experimental worker-side cache projection, not a gameplay q. No TT inference.
// Restricted to <=1 upset bit/player: its global generator is unambiguous, so no
// minimal-generator pass, support-basis rebuild, or persistent relevance mask.
import {firstSetBitIndex32} from '../src/word32.mjs';
export function prepareSupportNeutralSparse32(g){
  if(g.columns!==7||g.rows!==6||g.keyWords!==14)return null;
  const columns=new Uint32Array(g.shapeCount);
  for(let id=0;id<g.shapeCount;id++){
    let mask=0;
    for(let j=0;j<g.shapeSize[id];j++)mask|=1<<g.cellColumn[g.shapeCells[id*4+j]];
    columns[id]=mask;
  }
  return columns;
}

// HOT CONTRACT: output is a zero-initialized depth-local 14-word key span. Only
// offsets 0,1,8,11 are used; every successful call overwrites all four. Never
// pass this sentinel key to gameplay/cofactor/CPC. Rank retains total neutral
// capacity; active heights retain gravity. Global IDs retain exact residuals.
// The high sentinel bit keeps this encoding disjoint from physical support q.
// Full compact-key equality remains authoritative, not the locator hash.
export function projectSupportNeutralSparse32(columns,words,offset,basis,bi,out){
  let p0=-1,p1=-1;
  for(let w=0;w<3;w++){
    const bits=words[offset+8+w];
    if(bits){if(p0>=0||(bits&(bits-1)))return 0;p0=basis[bi+w*32+firstSetBitIndex32(bits)];}
  }
  for(let w=0;w<3;w++){
    const bits=words[offset+11+w];
    if(bits){if(p1>=0||(bits&(bits-1)))return 0;p1=basis[bi+w*32+firstSetBitIndex32(bits)];}
  }
  const active=(p0<0?0:columns[p0])|(p1<0?0:columns[p1]),inactive=127^active;
  if(!(inactive&(inactive-1)))return 0;
  let support=0;
  for(let c=0;c<7;c++)if(active&(1<<c))support|=words[offset+c]<<(c*3);
  out[offset]=(0x80000000|(active<<21)|support)>>>0;
  out[offset+1]=words[offset+7];
  out[offset+8]=p0+1;out[offset+11]=p1+1;
  return 1;
}
