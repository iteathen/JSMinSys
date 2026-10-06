import {isCompactLayoutProfile8} from './rba-connect4-shared-exact-cache-layout.mjs';
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';

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
 if(!isCompactLayoutProfile8(geometry,geometry?.keyWords)||kind!=='partial24')throw RangeError('unsupported index-partial geometry/layout');
 validateConnect4CacheCapacity32(capacity,6);
 if(capacity<8||capacity>2**28)throw RangeError('index-partial capacity exceeds native index range');
 const BufferType=shared?SharedArrayBuffer:ArrayBuffer;
 return attachIndexPartialCache32({mask:capacity-1,indexBits:Math.log2(capacity),entryBytes:24,entryWords:6,kind,shared,
  entries:new Uint32Array(new BufferType(capacity*24)),stats:new Uint32Array(new BufferType(12)),
  layout:{kind,entryBytes:24,entryWords:6}});
}
export function attachIndexPartialCache32(cache){
 const capacity=cache.mask+1;validateConnect4CacheCapacity32(capacity,6);
 if(cache.kind!=='partial24'||cache.indexBits!==Math.log2(capacity)||capacity<8||capacity>2**28||
  cache.entryWords!==6||cache.entryBytes!==24||!(cache.entries instanceof Uint32Array)||
  cache.entries.byteOffset!==0||cache.entries.buffer.byteLength!==capacity*24||
  (cache.shared&&!(cache.entries.buffer instanceof SharedArrayBuffer)))throw RangeError('invalid index-partial cache');
 if(cache.entries.length!==capacity*6)cache.entries=new Uint32Array(cache.entries.buffer);
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
