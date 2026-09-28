import {mixSpan32Locator32} from '../src/widekey32.mjs';

function isCompactProfile8(geometry,keyWords){
  return geometry!==null&&geometry!==undefined&&
    geometry.columns===7&&geometry.rows===6&&geometry.coordWords===3&&
    (geometry.lineCount-((geometry.coordWords-1)<<5))===5&&
    keyWords===14&&geometry.keyWords===14&&
    geometry.metaOffset===7&&geometry.p0Offset===8&&geometry.p1Offset===11;
}
function compactSupportProfile8(words,offset){
  return (words[offset+2]|(words[offset+3]<<3)|(words[offset+4]<<6)|
    (words[offset+5]<<9)|(words[offset+6]<<12)|((words[offset+7]&3)<<15))>>>0;
}
function compactTailProfile8(words,offset){
  return ((words[offset+10]&31)|((words[offset+13]&31)<<5))>>>0;
}

export function createConnect4RbaSharedExactCache32({capacity=65536,keyWords,geometry=null}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1)
    throw new RangeError('invalid shared exact cache');
  if(geometry!==null&&geometry!==undefined&&geometry.keyWords!==keyWords)
    throw new RangeError('shared exact cache/profile mismatch');
  const compact8=isCompactProfile8(geometry,keyWords)?1:0,
    storedKeyWords=compact8?8:keyWords;
  return {
    mask:capacity-1,
    keyWords,
    storedKeyWords,
    compact8,
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
  const base=slot*cache.storedKeyWords,keys=cache.keys;
  if(cache.compact8){
    if(Atomics.load(keys,base)!==words[offset]||
       Atomics.load(keys,base+1)!==words[offset+1]||
       Atomics.load(keys,base+2)!==compactSupportProfile8(words,offset)||
       Atomics.load(keys,base+3)!==words[offset+8]||
       Atomics.load(keys,base+4)!==words[offset+9]||
       Atomics.load(keys,base+5)!==words[offset+11]||
       Atomics.load(keys,base+6)!==words[offset+12]||
       Atomics.load(keys,base+7)!==compactTailProfile8(words,offset))return 0;
  }else{
    for(let w=0;w<cache.keyWords;w+=1)
      if(Atomics.load(keys,base+w)!==words[offset+w])return 0;
  }
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
  const base=slot*cache.storedKeyWords,keys=cache.keys;
  if(cache.compact8){
    Atomics.store(keys,base,words[offset]);
    Atomics.store(keys,base+1,words[offset+1]);
    Atomics.store(keys,base+2,compactSupportProfile8(words,offset));
    Atomics.store(keys,base+3,words[offset+8]);
    Atomics.store(keys,base+4,words[offset+9]);
    Atomics.store(keys,base+5,words[offset+11]);
    Atomics.store(keys,base+6,words[offset+12]);
    Atomics.store(keys,base+7,compactTailProfile8(words,offset));
  }else{
    for(let w=0;w<cache.keyWords;w+=1)Atomics.store(keys,base+w,words[offset+w]);
  }
  Atomics.store(cache.value,slot,value);
  Atomics.store(cache.sequence,slot,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  return value;
}
