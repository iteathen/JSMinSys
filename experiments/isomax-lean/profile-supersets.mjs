// Cold geometry-only compilation. No solved values or position identities.
import {prepareConnect4RbaExecutionProfile as prepareBase} from '../../addons/rba-connect4-profile.mjs';
import {connect4RbaShapeSubset} from '../../addons/rba-connect4-geometry.mjs';
export function prepareConnect4RbaExecutionProfile(g){
  if(g.columns!==7||g.rows!==6||g.shapeCount!==625)throw RangeError('standard geometry required');
  const profile=prepareBase(g),offsets=new Uint32Array(g.shapeCount+1),ids=[];
  for(let a=0;a<g.shapeCount;a++){
    offsets[a]=ids.length;
    for(let b=a+1;b<g.shapeCount;b++)if(connect4RbaShapeSubset(g,a,b))ids.push(b);
  }
  offsets[g.shapeCount]=ids.length;
  profile.supersetOffsets=offsets;profile.supersetIds=Uint16Array.from(ids);
  return profile;
}
