// Cold preparation only: exact geometry containment in native word groups.
import {prepareConnect4RbaExecutionProfile as prepareBase} from '../../addons/rba-connect4-profile.mjs';
import {connect4RbaShapeSubset} from '../../addons/rba-connect4-geometry.mjs';
export function prepareConnect4RbaExecutionProfile(g){
  if(g.columns!==7||g.rows!==6||g.shapeCount!==625)throw RangeError('standard geometry required');
  const profile=prepareBase(g),offsets=new Uint32Array(626),words=[],masks=[],scratch=new Uint32Array(20);
  for(let a=0;a<625;a++){
    offsets[a]=words.length;scratch.fill(0);
    for(let b=a+1;b<625;b++)if(connect4RbaShapeSubset(g,a,b))scratch[b>>>5]|=1<<(b&31);
    for(let word=0;word<20;word++)if(scratch[word]){words.push(word);masks.push(scratch[word]);}
  }
  offsets[625]=words.length;
  profile.supersetWordOffsets=offsets;
  profile.supersetWords=Uint8Array.from(words);profile.supersetMasks=Uint32Array.from(masks);
  return profile;
}
