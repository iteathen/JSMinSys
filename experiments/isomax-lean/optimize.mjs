// Build-time transforms only. No feature checks execute in a worker hot loop.
import assert from 'node:assert/strict';
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
export function optimizeCpc(s){
  const start=s.indexOf('function collectSingletonProfiles('),end=s.indexOf('function deriveForkPreemption32(');
  let collect=s.slice(start,end);
  collect=once(collect,'  for(let i=0;i<basisSize;i+=1){','  let i=0;\n  for(;i<basisSize;i+=1){');
  collect=once(collect,'return (threats<<1)|(moverAny<<3)|(opponentAny<<4);','return (threats<<1)|(moverAny<<3)|(opponentAny<<4)|(i<<5);');
  s=s.slice(0,start)+collect+s.slice(end);
  s=once(s,'moverHasSingleton,scratch){\n  scratch.preemptionCount[0]=0;scratch.preemptionMask32[0]=0;','moverHasSingleton,scratch,pairStart){\n  // Caller resets these fields before tactical closure; do not clear twice.');
  s=once(s,'let i=0;while(i<basisSize&&basis[basisOffset+i]<g.pairShapeStart)i+=1;','let i=pairStart;');
  s=once(s,'mover,moverHasSingleton,scratch);','mover,moverHasSingleton,scratch,singletonProfile>>>5);');
  return s;
}
export function optimizeSharedCache(s){
  s=once(s,'    sequence:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),\n    value:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),\n    keys:new Uint32Array(new SharedArrayBuffer(capacity*storedKeyWords*Uint32Array.BYTES_PER_ELEMENT)),',
    '    // Ten words per entry: sequence, value, eight exact key words.\n    entries:new Uint32Array(new SharedArrayBuffer(capacity*40)),');
  const start=s.indexOf('export function attachConnect4RbaSharedExactCache32('),end=s.indexOf('export function probeConnect4RbaSharedExactCache32(');
  s=s.slice(0,start)+`export function attachConnect4RbaSharedExactCache32(cache){
  const entries=cache.entries,expected=(cache.mask+1)*10;
  if(!(entries instanceof Uint32Array)||!(entries.buffer instanceof SharedArrayBuffer)||
     entries.byteOffset!==0||entries.buffer.byteLength!==expected*4)
    throw new RangeError('invalid shared exact entry backing');
  if(entries.length!==expected)cache.entries=new Uint32Array(entries.buffer);
  return cache;
}

`+s.slice(end);
  assert.equal(s.split('slot=hash&cache.mask,').length,3);
  s=s.replaceAll('slot=hash&cache.mask,','slot=hash&cache.mask,record=slot*10,');
  s=s.replaceAll('cache.sequence,slot','cache.entries,record').replaceAll('cache.value,slot','cache.entries,record+1');
  s=s.replaceAll('const base=slot*cache.storedKeyWords,keys=cache.keys;','const base=record+2,keys=cache.entries;');
  return s;
}
export function fixedOpsSource(){
  let s='// Same fourteen-word hash recurrence, unrolled without changing any bit.\nexport function mix14x32Locator32(words,offset){\n  let hash=0,x;\n';
  for(let i=0;i<14;i++)s+=`  x=hash^words[offset+${i}];hash=Math.imul(x^(x>>>16),0x7feb352d);\n`;
  s+='  return hash>>>0;\n}\n';
  s+=`// Same-frame and disjoint-frame contract matches the general update.
export function advanceLive3x32(profile,source,sourceOffset,mover,cell,target,targetOffset){
  const through=profile.through,throughBase=cell*3,ownBase=mover*3,blockedBase=(1-mover)*3;
`;
  for(let i=0;i<3;i++)s+=`  target[targetOffset+ownBase+${i}]=source[sourceOffset+ownBase+${i}];\n  target[targetOffset+blockedBase+${i}]=source[sourceOffset+blockedBase+${i}]&~through[throughBase+${i}];\n`;
  return s+'  return target;\n}\n';
}
