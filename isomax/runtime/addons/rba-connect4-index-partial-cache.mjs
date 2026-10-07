import {isCompactLayoutProfile8} from './rba-connect4-shared-exact-cache-layout.mjs';
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';
import {prepareBankedSharedCapacity32} from './rba-connect4-shared-banked-cache.mjs';

// Exact current-run nonterminal q domain: heights0..6, rank=sum(heights),
// meta=rank<<2, tails<=31. No board-history identity or probabilistic lock.
// Given these retained inputs, mixSpan32Locator32 is bijective in word12:
// every XOR/odd multiplication/XOR-shift step is invertible. Index low bits
// plus the stored high bits retain the full locator, thus the omitted word.
export function packIndexPartial24Support32(words,offset){
 return (words[offset]|(words[offset+1]<<3)|(words[offset+2]<<6)|
  (words[offset+3]<<9)|(words[offset+4]<<12)|(words[offset+5]<<15)|
  (words[offset+6]<<18)|((words[offset+10]&31)<<21)|((words[offset+13]&31)<<26))>>>0;
}
export function createIndexPartialCache32({geometry,capacity,shared=false,kind='partial24'}){
 if(!isCompactLayoutProfile8(geometry,geometry?.keyWords)||!['partial24','partial16'].includes(kind))throw RangeError('unsupported index-partial geometry/layout');
 const entryWords=kind==='partial24'?6:4,entryBytes=entryWords*4;
 validateConnect4CacheCapacity32(capacity,entryWords);
 if(capacity<8||capacity>2**28)throw RangeError('index-partial capacity exceeds native index range');
 const BufferType=shared?SharedArrayBuffer:ArrayBuffer;
 return attachIndexPartialCache32({mask:capacity-1,indexBits:Math.log2(capacity),entryBytes,entryWords,kind,shared,
  entries:new Uint32Array(new BufferType(capacity*entryBytes)),stats:new Uint32Array(new BufferType(12)),
  layout:{kind,entryBytes,entryWords}});
}
export function attachIndexPartialCache32(cache){
 const capacity=cache.mask+1,entryWords=cache.kind==='partial24'?6:4;validateConnect4CacheCapacity32(capacity,entryWords);
 if(!['partial24','partial16'].includes(cache.kind)||cache.indexBits!==Math.log2(capacity)||capacity<8||capacity>2**28||
  cache.entryWords!==entryWords||cache.entryBytes!==entryWords*4||!(cache.entries instanceof Uint32Array)||
  cache.entries.byteOffset!==0||cache.entries.buffer.byteLength!==capacity*entryWords*4||
  (cache.shared&&!(cache.entries.buffer instanceof SharedArrayBuffer)))throw RangeError('invalid index-partial cache');
 if(cache.entries.length!==capacity*entryWords)cache.entries=new Uint32Array(cache.entries.buffer);
 return cache;
}
export function probeIndexPartial24Local32(cache,words,offset,hash,packed=packIndexPartial24Support32(words,offset)){
 const keys=cache.entries,record=(hash&cache.mask)*6,value=keys[record];
 return value&&keys[record+1]===(hash>>>cache.indexBits)&&keys[record+2]===packed&&
  keys[record+3]===words[offset+8]&&keys[record+4]===words[offset+9]&&keys[record+5]===words[offset+11]?value:0;
}
export function storeIndexPartial24Local32(cache,words,offset,value,hash,packed=packIndexPartial24Support32(words,offset)){
 const keys=cache.entries,record=(hash&cache.mask)*6;
 keys[record+1]=hash>>>cache.indexBits;keys[record+2]=packed;
 keys[record+3]=words[offset+8];keys[record+4]=words[offset+9];keys[record+5]=words[offset+11];keys[record]=value;
 return value;
}
export function probeIndexPartial24Shared32(cache,words,offset,hash,packed=packIndexPartial24Support32(words,offset)){
 const keys=cache.entries,record=(hash&cache.mask)*6,before=Atomics.load(keys,record);
 if(!before||(before&1))return 0;
 const proof=Atomics.load(keys,record+1);
 if((proof&0x1fffffff)!==(hash>>>cache.indexBits)||Atomics.load(keys,record+2)!==packed||
  Atomics.load(keys,record+3)!==words[offset+8]||Atomics.load(keys,record+4)!==words[offset+9]||
  Atomics.load(keys,record+5)!==words[offset+11])return 0;
 const after=Atomics.load(keys,record);
 return before===after&&!(after&1)?proof>>>29:0;
}
export function storeIndexPartial24Shared32(cache,words,offset,value,hash,packed=packIndexPartial24Support32(words,offset)){
 const keys=cache.entries,record=(hash&cache.mask)*6,current=Atomics.load(keys,record);
 if(current&1)return value;
 const odd=(current+1)>>>0;
 if(Atomics.compareExchange(keys,record,current,odd)!==current)return value;
 Atomics.store(keys,record+1,(hash>>>cache.indexBits)|(value<<29));Atomics.store(keys,record+2,packed);
 Atomics.store(keys,record+3,words[offset+8]);Atomics.store(keys,record+4,words[offset+9]);Atomics.store(keys,record+5,words[offset+11]);
 Atomics.store(keys,record,(odd+1)>>>0);return value;
}
// Shared banks preserve each unchanged row's entire locator. Bank choice uses
// high bits, which remain redundantly stored in the per-bank partial key.
export function createBankedIndexPartialCache32({geometry,capacity,bankCapacity=2**28}){
 const plan=prepareBankedSharedCapacity32(capacity,bankCapacity);
 if(!isCompactLayoutProfile8(geometry,geometry?.keyWords)||bankCapacity<8||bankCapacity>2**28)
  throw RangeError('banked partial key exceeds native range');
 const banks=Array.from({length:plan.bankCount},()=>createIndexPartialCache32({geometry,capacity:bankCapacity,shared:true}));
 return attachBankedIndexPartialCache32({kind:'partial24Banked',mask:capacity-1,bankShift:plan.bankShift,bankMask:plan.bankMask,
  banks,shared:true,stats:new Uint32Array(new SharedArrayBuffer(12)),payloadBytes:capacity*24,logicalEntries:capacity,
  layout:{kind:'partial24',entryBytes:24,entryWords:6}});
}
export function attachBankedIndexPartialCache32(cache){
 // Factory topology and whole-object clones only. SAB object identity cannot
 // authenticate arbitrary manually assembled backing-handle aliases.
 const plan=prepareBankedSharedCapacity32(cache.mask+1,2**cache.bankShift),banks=cache.banks;
 if(cache.kind!=='partial24Banked'||cache.shared!==true||cache.bankMask!==plan.bankMask||plan.bankCapacity<8||plan.bankCapacity>2**28||
  !Array.isArray(banks)||banks.length!==plan.bankCount||cache.payloadBytes!==plan.capacity*24||cache.logicalEntries!==plan.capacity||
  cache.layout?.kind!=='partial24'||cache.layout.entryWords!==6||cache.layout.entryBytes!==24||
  !(cache.stats instanceof Uint32Array)||cache.stats.length!==3||cache.stats.byteOffset!==0||
  cache.stats.buffer.byteLength!==12||!(cache.stats.buffer instanceof SharedArrayBuffer))throw RangeError('invalid banked partial topology');
 const buffers=new Set([cache.stats.buffer]);
 for(const bank of banks){
  if(bank.kind!=='partial24'||bank.shared!==true||bank.mask+1!==plan.bankCapacity||bank.banks!==undefined)
   throw RangeError('invalid banked partial row layout');
  attachIndexPartialCache32(bank);
  if(buffers.has(bank.entries.buffer))throw RangeError('aliased partial banks');
  buffers.add(bank.entries.buffer);bank.stats=cache.stats;
 }
 return cache;
}
export function probeBankedIndexPartial24Shared32(cache,words,offset,hash,packed){
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return probeIndexPartial24Shared32(bank,words,offset,hash,packed);
}
export function storeBankedIndexPartial24Shared32(cache,words,offset,value,hash,packed){
 const bank=cache.banks[(hash>>>cache.bankShift)&cache.bankMask];
 return storeIndexPartial24Shared32(bank,words,offset,value,hash,packed);
}
// Narrow-domain key: omitted lane11 is bijective given retained lane8/heights
// and zero lanes9/10/12/13. Prepared workers prove that by n<=32 before calls.
export function packIndexPartial16Heights32(words,offset){
 return (words[offset]|(words[offset+1]<<3)|(words[offset+2]<<6)|
  (words[offset+3]<<9)|(words[offset+4]<<12)|(words[offset+5]<<15)|(words[offset+6]<<18))>>>0;
}
export function packIndexPartial16Support32(words,offset){
 if(words[offset+9]|words[offset+10]|words[offset+12]|words[offset+13])return -1;
 return packIndexPartial16Heights32(words,offset);
}
export function probeIndexPartial16Local32(cache,words,offset,hash,packed=packIndexPartial16Support32(words,offset)){
 if(packed<0)return 0;
 const keys=cache.entries,record=(hash&cache.mask)*4,value=keys[record];
 return value&&keys[record+1]===(hash>>>cache.indexBits)&&keys[record+2]===packed&&keys[record+3]===words[offset+8]?value:0;
}
export function storeIndexPartial16Local32(cache,words,offset,value,hash,packed=packIndexPartial16Support32(words,offset)){
 if(packed<0)return value;
 const keys=cache.entries,record=(hash&cache.mask)*4;
 keys[record+1]=hash>>>cache.indexBits;keys[record+2]=packed;keys[record+3]=words[offset+8];keys[record]=value;return value;
}
export function probeIndexPartial16Shared32(cache,words,offset,hash,packed=packIndexPartial16Support32(words,offset)){
 if(packed<0)return 0;
 const keys=cache.entries,record=(hash&cache.mask)*4,before=Atomics.load(keys,record);
 if(!before||(before&1))return 0;
 const proof=Atomics.load(keys,record+1);
 if((proof&0x1fffffff)!==(hash>>>cache.indexBits)||Atomics.load(keys,record+2)!==packed||Atomics.load(keys,record+3)!==words[offset+8])return 0;
 const after=Atomics.load(keys,record);return before===after&&!(after&1)?proof>>>29:0;
}
export function storeIndexPartial16Shared32(cache,words,offset,value,hash,packed=packIndexPartial16Support32(words,offset)){
 if(packed<0)return value;
 const keys=cache.entries,record=(hash&cache.mask)*4,current=Atomics.load(keys,record);
 if(current&1)return value;
 const odd=(current+1)>>>0;
 if(Atomics.compareExchange(keys,record,current,odd)!==current)return value;
 Atomics.store(keys,record+1,(hash>>>cache.indexBits)|(value<<29));Atomics.store(keys,record+2,packed);Atomics.store(keys,record+3,words[offset+8]);
 Atomics.store(keys,record,(odd+1)>>>0);return value;
}
// Full-coverage mixed cache: narrowN plus wideN/2. These are separate collision
// domains determined by support, not two alternative probes for the same q.
export function createMixedIndexPartialCache32({geometry,capacity,shared=false}){
 if(capacity<16)throw RangeError('mixed partial cache requires at least16 primary slots');
 const narrow=createIndexPartialCache32({geometry,capacity,shared,kind:'partial16'}),
  wide=createIndexPartialCache32({geometry,capacity:capacity/2,shared,kind:'partial24'});
 wide.entries.fill(0); // Warm the secondary pool before READY as well.
 return attachMixedIndexPartialCache32({kind:'partialMixed',narrow,wide,entries:narrow.entries,stats:narrow.stats,shared,
  payloadBytes:narrow.entries.byteLength+wide.entries.byteLength,logicalEntries:capacity+capacity/2});
}
export function attachMixedIndexPartialCache32(cache){
 const narrow=attachIndexPartialCache32(cache.narrow),wide=attachIndexPartialCache32(cache.wide);
 if(cache.kind!=='partialMixed'||narrow.kind!=='partial16'||wide.kind!=='partial24'||
  narrow.mask+1!==2*(wide.mask+1)||narrow.shared!==wide.shared||cache.shared!==narrow.shared||
  cache.entries.buffer!==narrow.entries.buffer||wide.entries.buffer===narrow.entries.buffer||
  cache.payloadBytes!==narrow.entries.byteLength+wide.entries.byteLength||cache.logicalEntries!==(narrow.mask+1)+(wide.mask+1))throw RangeError('invalid mixed partial topology');
 cache.entries=narrow.entries;cache.stats=narrow.stats;return cache;
}
export function probeIndexPartialMixedLocal32(cache,words,offset,hash,packed){
 return packed<0?probeIndexPartial24Local32(cache.wide,words,offset,hash,packed&0x7fffffff):probeIndexPartial16Local32(cache.narrow,words,offset,hash,packed);
}
export function storeIndexPartialMixedLocal32(cache,words,offset,value,hash,packed){
 return packed<0?storeIndexPartial24Local32(cache.wide,words,offset,value,hash,packed&0x7fffffff):storeIndexPartial16Local32(cache.narrow,words,offset,value,hash,packed);
}
export function probeIndexPartialMixedShared32(cache,words,offset,hash,packed){
 return packed<0?probeIndexPartial24Shared32(cache.wide,words,offset,hash,packed&0x7fffffff):probeIndexPartial16Shared32(cache.narrow,words,offset,hash,packed);
}
export function storeIndexPartialMixedShared32(cache,words,offset,value,hash,packed){
 return packed<0?storeIndexPartial24Shared32(cache.wide,words,offset,value,hash,packed&0x7fffffff):storeIndexPartial16Shared32(cache.narrow,words,offset,value,hash,packed);
}
