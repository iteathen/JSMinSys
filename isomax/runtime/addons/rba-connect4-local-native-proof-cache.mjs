// Private cache: one owner, no atomic protocol or statistics. Layout is cold.
import {isCompactProfile8,compactSupportProfile8,compactTailProfile8} from './rba-connect4-shared-exact-cache.mjs';
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';

export function createLocalNativeProofCache32(geometry,capacity){
  if(!isCompactProfile8(geometry,geometry?.keyWords))throw new RangeError('native private cache requires compact profile');
  validateConnect4CacheCapacity32(capacity,16);
  const buffer=new ArrayBuffer(capacity*32);
  return {entries:new Uint32Array(buffer),halves:new Uint16Array(buffer)};
}

// word0: native tag; word1: existing support profile; words2..5: full owner
// coordinates; half12/13: heights0/1; half14: existing tail; half15: unused.
export function localNativeProofKeyMatches32(cache,words,offset,slot){
  const keys=cache.entries,record=slot*8,halves=cache.halves,half=slot*16;
  return halves[half+12]===words[offset]&&halves[half+13]===words[offset+1]&&
    keys[record+1]===compactSupportProfile8(words,offset)&&
    keys[record+2]===words[offset+8]&&keys[record+3]===words[offset+9]&&
    keys[record+4]===words[offset+11]&&keys[record+5]===words[offset+12]&&
    halves[half+14]===compactTailProfile8(words,offset);
}

export function storeLocalNativeProofEntry32(cache,words,offset,slot,value){
  const keys=cache.entries,record=slot*8,halves=cache.halves,half=slot*16;
  halves[half+12]=words[offset];halves[half+13]=words[offset+1];
  keys[record+1]=compactSupportProfile8(words,offset);
  keys[record+2]=words[offset+8];keys[record+3]=words[offset+9];
  keys[record+4]=words[offset+11];keys[record+5]=words[offset+12];
  halves[half+14]=compactTailProfile8(words,offset);
  keys[record]=value;
}
