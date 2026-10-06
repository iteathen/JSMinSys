// Experimental compact32 capacity extension. Bank topology is prepared cold.
// Each bank retains the unchanged native field layout and seqlock protocol.
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';
import {createConnect4RbaSharedLayoutCache32,attachConnect4RbaSharedLayoutCache32,storeConnect4RbaSharedLayoutCache32,probeConnect4RbaSharedLayoutCache32,prepareSharedCacheAccess,prepareSharedCacheLayout,
  compactLayoutSupportProfile8,compactLayoutTailProfile8} from './rba-connect4-shared-exact-cache-layout.mjs';
import {probeSharedPreparedCompact32,storeSharedPreparedCompact32} from './rba-connect4-prepared-compact-cache.mjs';

export function prepareBankedSharedCapacity32(capacity,bankCapacity){
 if(!Number.isSafeInteger(capacity)||capacity<1||capacity>2**32||!Number.isInteger(Math.log2(capacity))||
  !Number.isSafeInteger(bankCapacity)||bankCapacity<1||bankCapacity>2**29||!Number.isInteger(Math.log2(bankCapacity))||
  bankCapacity>capacity||capacity/bankCapacity>64)throw RangeError('invalid native TT bank capacity');
 return {capacity,bankCapacity,bankShift:Math.log2(bankCapacity),bankMask:capacity/bankCapacity-1,bankCount:capacity/bankCapacity};
}
export function sharedNativeBankCapacity32(layout){
 const stride=layout.kind==='compact32'?16:layout.kind==='direct'?layout.heightStride:layout.entryWords;
 return 2**Math.floor(Math.log2(0x80000000/stride));
}
export function createBankedSharedLayoutCache32({capacity,bankCapacity,keyWords,geometry}){
 const layout=prepareSharedCacheLayout(geometry,keyWords),plan=prepareBankedSharedCapacity32(capacity,bankCapacity);
 if(bankCapacity>sharedNativeBankCapacity32(layout))throw RangeError('native TT bank index exceeds optimized range');
 validateConnect4CacheCapacity32(bankCapacity,layout.kind==='compact32'?16:layout.kind==='direct'?layout.heightStride:layout.entryWords);
 const banks=Array.from({length:capacity/bankCapacity},()=>createConnect4RbaSharedLayoutCache32({capacity:bankCapacity,keyWords,geometry}));
 return attachBankedSharedLayoutCache32({mask:capacity-1,keyWords,storedKeyWords:banks[0].storedKeyWords,compact8:banks[0].compact8,
  layout:banks[0].layout,banks,bankShift:plan.bankShift,bankMask:plan.bankMask,
  stats:new Uint32Array(new SharedArrayBuffer(12))});
}

export function attachBankedSharedLayoutCache32(cache){
 // Attachment accepts our factory's topology and whole-object clones. JS SAB
 // object identity cannot authenticate independently supplied native backing
 // handles; arbitrary manually assembled bank topologies are not supported.
 const capacity=cache.mask+1,banks=cache.banks;
 prepareBankedSharedCapacity32(capacity,2**cache.bankShift);
 if(!cache.layout||!['compact32','direct','fullspan'].includes(cache.layout.kind)||!Array.isArray(banks)||!banks.length||banks.length>64||
  !Number.isInteger(Math.log2(banks.length))||cache.bankMask!==banks.length-1||
  !Number.isInteger(cache.bankShift)||cache.bankShift<0||2**cache.bankShift>sharedNativeBankCapacity32(cache.layout)||
  capacity!==banks.length*2**cache.bankShift||!(cache.stats instanceof Uint32Array)||cache.stats.length!==3||
  !(cache.stats.buffer instanceof SharedArrayBuffer)||cache.stats.byteOffset!==0||cache.stats.buffer.byteLength!==12)
   throw RangeError('invalid compact TT bank mapping');
 const buffers=new Set();
 for(const bank of banks){
  if(bank.banks!==undefined||bank.mask!==2**cache.bankShift-1||bank.keyWords!==cache.keyWords||
   bank.storedKeyWords!==cache.storedKeyWords||bank.compact8!==cache.compact8||
   JSON.stringify(bank.layout)!==JSON.stringify(cache.layout))throw RangeError('invalid native TT bank');
  attachConnect4RbaSharedLayoutCache32(bank);
  if(buffers.has(bank.entries.buffer)||bank.entries.buffer===cache.stats.buffer)throw RangeError('aliased compact TT banks/statistics');
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
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return probeConnect4RbaSharedLayoutCache32(bank,words,offset,hash);
}
export function prepareBankedDirectSharedCacheAccess32(cache,{counted=false}={}){
 const access=prepareSharedCacheAccess(cache.banks[0],{counted});
 function probeBankedDirect32(cache,words,offset,hash){
  const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
  return access.probe(bank,words,offset,hash);
 }
 function storeBankedDirect32(cache,words,offset,value,hash){
  const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
  return access.store(bank,words,offset,value,hash);
 }
 return {probe:probeBankedDirect32,store:storeBankedDirect32};
}
export function storeBankedCompactSharedCacheCounted32(cache,words,offset,value,hash){
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return storeConnect4RbaSharedLayoutCache32(bank,words,offset,value,hash);
}
