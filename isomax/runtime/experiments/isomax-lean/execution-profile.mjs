// COLD only. One choice before allocating/spawning the search environment.
// No profile callback or geometry/layout dispatch is added to recursive nodes.
import {isCompactProfile8} from './shared-cache.mjs';
export function prepareLeanExecutionProfile(geometry){
  if(!geometry)throw TypeError('prepared geometry required');
  if(isCompactProfile8(geometry,geometry.keyWords)){
    const suffix=geometry.removeByCell!==null?'-dense':'';
    return Object.freeze({kind:'standard',worker:`./worker${suffix}.mjs`,solver:`./solver${suffix}.mjs`,packed:true,wide:false});
  }
  let shift=0,stride=1;
  while(stride<geometry.columns&&shift<31){stride*=2;shift++;}
  const packed=shift<31&&geometry.lineCount<=(0xffffffff>>>shift),wide=geometry.columns>32;
  const suffix=`-general${wide?'-wide':''}${packed?'':'-unpacked'}${geometry.removeByCell!==null?'-dense':''}`;
  return Object.freeze({kind:'general',worker:`./worker${suffix}.mjs`,solver:`./solver${suffix}.mjs`,packed,wide});
}
