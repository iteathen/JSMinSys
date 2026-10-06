// Experimental compact32 capacity extension. Bank topology is prepared cold.
// Each bank retains the unchanged native field layout and seqlock protocol.
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';
import {createConnect4RbaSharedLayoutCache32,attachConnect4RbaSharedLayoutCache32,storeConnect4RbaSharedLayoutCache32,
  compactLayoutSupportProfile8,compactLayoutTailProfile8} from './rba-connect4-shared-exact-cache-layout.mjs';
import {probeSharedPreparedCompact32,storeSharedPreparedCompact32} from './rba-connect4-prepared-compact-cache.mjs';

export function createBankedCompactSharedCache32({capacity,bankCapacity,keyWords,geometry}){
 validateConnect4CacheCapacity32(capacity,1);
 validateConnect4CacheCapacity32(bankCapacity,16);
 if(bankCapacity>2**27||bankCapacity>capacity||capacity/bankCapacity>16)
  throw RangeError('invalid compact TT bank capacity');
 const banks=Array.from({length:capacity/bankCapacity},()=>createConnect4RbaSharedLayoutCache32({capacity:bankCapacity,keyWords,geometry}));
 return attachBankedCompactSharedCache32({mask:capacity-1,keyWords,storedKeyWords:8,compact8:1,
  layout:banks[0].layout,banks,bankShift:Math.log2(bankCapacity),bankMask:banks.length-1,
  stats:new Uint32Array(new SharedArrayBuffer(12))});
}

export function attachBankedCompactSharedCache32(cache){
 const capacity=cache.mask+1,banks=cache.banks;
 validateConnect4CacheCapacity32(capacity,1);
 if(cache.layout?.kind!=='compact32'||cache.keyWords!==14||cache.storedKeyWords!==8||cache.compact8!==1||
  cache.layout.entryWords!==8||cache.layout.entryBytes!==32||!Array.isArray(banks)||!banks.length||banks.length>16||
  !Number.isInteger(Math.log2(banks.length))||cache.bankMask!==banks.length-1||
  !Number.isInteger(cache.bankShift)||cache.bankShift<0||cache.bankShift>27||
  capacity!==banks.length*2**cache.bankShift||!(cache.stats instanceof Uint32Array)||cache.stats.length!==3||
  !(cache.stats.buffer instanceof SharedArrayBuffer))throw RangeError('invalid compact TT bank mapping');
 const buffers=new Set();
 for(const bank of banks){
  if(bank.banks!==undefined||bank.mask!==2**cache.bankShift-1||bank.keyWords!==cache.keyWords||
   bank.layout?.kind!=='compact32')throw RangeError('invalid compact TT bank');
  attachConnect4RbaSharedLayoutCache32(bank);
  if(buffers.has(bank.entries.buffer))throw RangeError('aliased compact TT banks');
  buffers.add(bank.entries.buffer);
  bank.stats=cache.stats;
 }
 Object.freeze(cache.layout);
 return cache;
}

// Existing prepared scalar inputs are reused. No allocation, packing, counters,
// retries or layout branch are added to the current four-GiB access functions.
export function probeSharedPreparedBankedCompact32(cache,words,offset,hash,support,tail){
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return probeSharedPreparedCompact32(bank,words,offset,hash,support,tail);
}
export function storeSharedPreparedBankedCompact32(cache,words,offset,value,hash,support,tail){
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return storeSharedPreparedCompact32(bank,words,offset,value,hash,support,tail);
}
export function probeBankedCompactSharedCache32(cache,words,offset,hash){
 return probeSharedPreparedBankedCompact32(cache,words,offset,hash,compactLayoutSupportProfile8(words,offset),compactLayoutTailProfile8(words,offset));
}
export function storeBankedCompactSharedCache32(cache,words,offset,value,hash){
 return storeSharedPreparedBankedCompact32(cache,words,offset,value,hash,compactLayoutSupportProfile8(words,offset),compactLayoutTailProfile8(words,offset));
}
export function probeBankedCompactSharedCacheCounted32(cache,words,offset,hash){
 const value=probeBankedCompactSharedCache32(cache,words,offset,hash);
 if(value)Atomics.add(cache.stats,0,1);
 return value;
}
export function storeBankedCompactSharedCacheCounted32(cache,words,offset,value,hash){
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return storeConnect4RbaSharedLayoutCache32(bank,words,offset,value,hash);
}
