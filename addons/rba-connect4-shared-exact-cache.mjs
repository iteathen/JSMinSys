import {mixSpan32Locator32} from '../src/widekey32.mjs';

export function createConnect4RbaSharedExactCache32({capacity=65536,keyWords,derivedWord}={}){
  const omit=derivedWord===undefined?keyWords:derivedWord;
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1||
     !Number.isInteger(omit)||omit<0||omit>keyWords)
    throw new RangeError('invalid shared exact cache');
  const storedKeyWords=keyWords-(omit<keyWords);
  return {
    mask:capacity-1,
    keyWords,
    derivedWord:omit,
    storedKeyWords,
    sequence:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    value:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    keys:new Uint32Array(new SharedArrayBuffer(capacity*storedKeyWords*Uint32Array.BYTES_PER_ELEMENT)),
    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),
  };
}

export function probeConnect4RbaSharedExactCache32(cache,words,offset,knownHash){
  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash,
    slot=hash&cache.mask,
    before=Atomics.load(cache.sequence,slot);
  if(!before||(before&1))return 0;
  const keyWords=cache.keyWords,derivedWord=cache.derivedWord,
    base=slot*cache.storedKeyWords,keys=cache.keys;
  for(let w=0;w<derivedWord;w+=1)
    if(Atomics.load(keys,base+w)!==words[offset+w])return 0;
  for(let w=derivedWord+1;w<keyWords;w+=1)
    if(Atomics.load(keys,base+w-1)!==words[offset+w])return 0;
  const value=Atomics.load(cache.value,slot),
    after=Atomics.load(cache.sequence,slot);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  return value;
}

export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,knownHash){
  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash,
    slot=hash&cache.mask,
    current=Atomics.load(cache.sequence,slot);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){
    Atomics.add(cache.stats,2,1);return value;
  }
  const keyWords=cache.keyWords,derivedWord=cache.derivedWord,
    base=slot*cache.storedKeyWords,keys=cache.keys;
  for(let w=0;w<derivedWord;w+=1)Atomics.store(keys,base+w,words[offset+w]);
  for(let w=derivedWord+1;w<keyWords;w+=1)Atomics.store(keys,base+w-1,words[offset+w]);
  Atomics.store(cache.value,slot,value);
  Atomics.store(cache.sequence,slot,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  return value;
}
