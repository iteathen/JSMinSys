import {mixSpan32Locator32} from '../src/widekey32.mjs';

export function createConnect4RbaSharedExactCache32({capacity=65536,keyWords,diagnosticProvenance=0}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1||!Number.isInteger(diagnosticProvenance)||diagnosticProvenance<0||diagnosticProvenance>1)
    throw new RangeError('invalid shared exact cache');
  return {
    mask:capacity-1,
    keyWords,
    sequence:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    value:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    keys:new Uint32Array(new SharedArrayBuffer(capacity*keyWords*Uint32Array.BYTES_PER_ELEMENT)),
    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),
    provenance:diagnosticProvenance?new Uint8Array(new SharedArrayBuffer(capacity*Uint8Array.BYTES_PER_ELEMENT)):null,
    provenanceHitStats:diagnosticProvenance?new Uint32Array(new SharedArrayBuffer(5*Uint32Array.BYTES_PER_ELEMENT)):null,
    provenanceStoreStats:diagnosticProvenance?new Uint32Array(new SharedArrayBuffer(5*Uint32Array.BYTES_PER_ELEMENT)):null,
  };
}

export function probeConnect4RbaSharedExactCache32(cache,words,offset){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask,
    before=Atomics.load(cache.sequence,slot);
  if(!before||(before&1))return 0;
  const base=slot*cache.keyWords;
  for(let w=0;w<cache.keyWords;w+=1)
    if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;
  const value=Atomics.load(cache.value,slot),
    provenance=cache.provenance?Atomics.load(cache.provenance,slot):0,
    after=Atomics.load(cache.sequence,slot);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  if(cache.provenanceHitStats)Atomics.add(cache.provenanceHitStats,provenance,1);
  return value;
}

export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,provenance=0){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask,
    current=Atomics.load(cache.sequence,slot);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){
    Atomics.add(cache.stats,2,1);return value;
  }
  const base=slot*cache.keyWords,p=provenance>=0&&provenance<5?provenance:0;
  for(let w=0;w<cache.keyWords;w+=1)Atomics.store(cache.keys,base+w,words[offset+w]);
  Atomics.store(cache.value,slot,value);
  if(cache.provenance)Atomics.store(cache.provenance,slot,p);
  Atomics.store(cache.sequence,slot,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  if(cache.provenanceStoreStats)Atomics.add(cache.provenanceStoreStats,p,1);
  return value;
}
