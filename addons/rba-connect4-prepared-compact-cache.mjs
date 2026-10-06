// GENERATED: unchanged compact32 key/protocol with caller-prepared support/tail.
// Precondition: scalars are computed from the same immutable words/offset.
export function localPreparedCompactKeyMatches32(cache,words,offset,slot,support,tail){
  const keys=cache.entries,record=slot*8,halves=cache.halves,half=slot*16;
  return halves[half+12]===words[offset]&&halves[half+13]===words[offset+1]&&
    keys[record+1]===support&&
    keys[record+2]===words[offset+8]&&keys[record+3]===words[offset+9]&&
    keys[record+4]===words[offset+11]&&keys[record+5]===words[offset+12]&&
    halves[half+14]===tail;
}
export function storeLocalPreparedCompactEntry32(cache,words,offset,slot,value,support,tail){
  const keys=cache.entries,record=slot*8,halves=cache.halves,half=slot*16;
  halves[half+12]=words[offset];halves[half+13]=words[offset+1];
  keys[record+1]=support;
  keys[record+2]=words[offset+8];keys[record+3]=words[offset+9];
  keys[record+4]=words[offset+11];keys[record+5]=words[offset+12];
  halves[half+14]=tail;
  keys[record]=value;
}
export function probeSharedPreparedCompact32(cache,words,offset,knownHash,support,tail){
  const slot=knownHash&cache.mask,record=slot*8,
    before=Atomics.load(cache.entries,record);
  if(!before||(before&1))return 0;
  const keys=cache.entries,half=slot*16,halves=cache.halves;
  if(Atomics.load(halves,half+12)!==words[offset]||
     Atomics.load(halves,half+13)!==words[offset+1]||
     Atomics.load(keys,record+1)!==support||
     Atomics.load(keys,record+2)!==words[offset+8]||
     Atomics.load(keys,record+3)!==words[offset+9]||
     Atomics.load(keys,record+4)!==words[offset+11]||
     Atomics.load(keys,record+5)!==words[offset+12]||
     Atomics.load(halves,half+14)!==tail)return 0;
  const value=Atomics.load(halves,half+15),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  return value;
}
export function storeSharedPreparedCompact32(cache,words,offset,value,knownHash,support,tail){
  const slot=knownHash&cache.mask,record=slot*8,current=Atomics.load(cache.entries,record);
  if(current&1)return value;
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.entries,record,current,odd)!==current)return value;
  const keys=cache.entries,half=slot*16,halves=cache.halves;
  Atomics.store(halves,half+12,words[offset]);
  Atomics.store(halves,half+13,words[offset+1]);
  Atomics.store(keys,record+1,support);
  Atomics.store(keys,record+2,words[offset+8]);
  Atomics.store(keys,record+3,words[offset+9]);
  Atomics.store(keys,record+4,words[offset+11]);
  Atomics.store(keys,record+5,words[offset+12]);
  Atomics.store(halves,half+14,tail);
  Atomics.store(halves,half+15,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  return value;
}
