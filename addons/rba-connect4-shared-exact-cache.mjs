import {mixSpan32Locator32} from '../src/widekey32.mjs';

export function createConnect4RbaSharedExactCache32({capacity=65536,keyWords}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1)
    throw new RangeError('invalid shared exact cache');
  return {
    mask:capacity-1,
    keyWords,
    sequence:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    tag:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    value:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    keys:new Uint32Array(new SharedArrayBuffer(capacity*keyWords*Uint32Array.BYTES_PER_ELEMENT)),
  };
}

export function probeConnect4RbaSharedExactCache32(cache,words,offset,stats=null,statsBase=0,knownHash=null){
  const hash=knownHash===null?mixSpan32Locator32(words,offset,cache.keyWords):knownHash>>>0,
    slot=hash&cache.mask,before=Atomics.load(cache.sequence,slot);
  if(!before||(before&1))return 0;
  if(Atomics.load(cache.tag,slot)!==hash)return 0;
  const base=slot*cache.keyWords;
  for(let w=0;w<cache.keyWords;w+=1)
    if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;
  const value=Atomics.load(cache.value,slot),
    after=Atomics.load(cache.sequence,slot);
  if(before!==after||(after&1)||!value)return 0;
  if(stats)stats[statsBase]+=1;
  return value;
}

export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,stats=null,statsBase=0,knownHash=null){
  const hash=knownHash===null?mixSpan32Locator32(words,offset,cache.keyWords):knownHash>>>0,
    slot=hash&cache.mask,current=Atomics.load(cache.sequence,slot);
  if(current&1){if(stats)stats[statsBase+2]+=1;return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){
    if(stats)stats[statsBase+2]+=1;return value;
  }
  const base=slot*cache.keyWords;
  Atomics.store(cache.tag,slot,hash);
  for(let w=0;w<cache.keyWords;w+=1)Atomics.store(cache.keys,base+w,words[offset+w]);
  Atomics.store(cache.value,slot,value);
  Atomics.store(cache.sequence,slot,(odd+1)>>>0);
  if(stats)stats[statsBase+1]+=1;
  return value;
}
