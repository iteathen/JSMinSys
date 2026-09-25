import {mixSpan32Locator32} from '../src/widekey32.mjs';

export function createConnect4RbaSharedExactCache32({capacity=65536,keyWords,diagnosticSampleMask=-1,diagnosticMetaOffset=-1,diagnosticRankCount=0}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1||
     !Number.isInteger(diagnosticSampleMask)||diagnosticSampleMask < -1||
     diagnosticSampleMask>255||
     (diagnosticSampleMask>=0&&(diagnosticSampleMask&(diagnosticSampleMask+1)))||
     !Number.isInteger(diagnosticMetaOffset)||diagnosticMetaOffset < -1||
     !Number.isInteger(diagnosticRankCount)||diagnosticRankCount<0)
    throw new RangeError('invalid shared exact cache');
  return {
    mask:capacity-1,
    keyWords,
    diagnosticSampleMask,
    diagnosticSampleBits:diagnosticSampleMask<0?0:(diagnosticSampleMask<<24)>>>0,
    diagnosticMetaOffset,
    diagnosticRankCount,
    diagnosticRankHits:diagnosticRankCount?new Uint32Array(new SharedArrayBuffer(diagnosticRankCount*2*Uint32Array.BYTES_PER_ELEMENT)):null,
    sequence:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    value:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    keys:new Uint32Array(new SharedArrayBuffer(capacity*keyWords*Uint32Array.BYTES_PER_ELEMENT)),
    stats:new Uint32Array(new SharedArrayBuffer(9*Uint32Array.BYTES_PER_ELEMENT)),
  };
}

export function probeConnect4RbaSharedExactCache32(cache,words,offset){
  const hash=mixSpan32Locator32(words,offset,cache.keyWords),
    slot=hash&cache.mask,
    before=Atomics.load(cache.sequence,slot);
  if(!before||(before&1))return 0;
  const base=slot*cache.keyWords;
  for(let w=0;w<cache.keyWords;w+=1)
    if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;
  const value=Atomics.load(cache.value,slot),
    after=Atomics.load(cache.sequence,slot);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  if(cache.diagnosticSampleMask>=0){
    const excluded=(hash&cache.diagnosticSampleBits)?1:0;
    Atomics.add(cache.stats,excluded?4:3,1);
    if(cache.diagnosticRankHits){
      const rank=words[offset+cache.diagnosticMetaOffset]>>>2;
      if(rank<cache.diagnosticRankCount)
        Atomics.add(cache.diagnosticRankHits,rank*2+excluded,1);
    }
  }
  return value;
}

export function storeConnect4RbaSharedExactCache32(cache,words,offset,value){
  const hash=mixSpan32Locator32(words,offset,cache.keyWords),
    slot=hash&cache.mask,
    current=Atomics.load(cache.sequence,slot);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){
    Atomics.add(cache.stats,2,1);return value;
  }
  const base=slot*cache.keyWords;
  if(cache.diagnosticSampleMask>=0){
    Atomics.add(cache.stats,(hash&cache.diagnosticSampleBits)?6:5,1);
    if(current){
      let diff=0;
      for(let w=0;w<cache.keyWords;w+=1)
        diff|=Atomics.load(cache.keys,base+w)^words[offset+w];
      Atomics.add(cache.stats,diff?8:7,1);
    }
  }
  for(let w=0;w<cache.keyWords;w+=1)Atomics.store(cache.keys,base+w,words[offset+w]);
  Atomics.store(cache.value,slot,value);
  Atomics.store(cache.sequence,slot,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  return value;
}
