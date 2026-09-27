// Cold campaign admission only. Entry capacities, not V8 heap limits.
export function memoryBytes(shared,local,workers=4){return shared*64+12+workers*local*61;}
export function validateMemoryArm(c){
  for(const k of ['shared','local'])if(!Number.isInteger(c[k])||c[k]<65536||c[k]>2097152||(c[k]&(c[k]-1)))throw RangeError('memory capacity');
  if(![5000,30000,300000].includes(c.timeoutMs))throw RangeError('campaign deadline');
  if(memoryBytes(c.shared,c.local)>616*1048576+12)throw RangeError('memory budget');
  return c;
}
