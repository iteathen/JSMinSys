// Candidate only. Frozen native-field layout; consumer access selected once cold.
import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';
export function isCompactLayoutProfile8(geometry,keyWords){
  return geometry!==null&&geometry!==undefined&&
    geometry.columns===7&&geometry.rows===6&&geometry.coordWords===3&&
    (geometry.lineCount-((geometry.coordWords-1)<<5))===5&&
    keyWords===14&&geometry.keyWords===14&&
    geometry.metaOffset===7&&geometry.p0Offset===8&&geometry.p1Offset===11;
}
export function compactLayoutSupportProfile8(words,offset){
  return (words[offset+2]|(words[offset+3]<<3)|(words[offset+4]<<6)|
    (words[offset+5]<<9)|(words[offset+6]<<12)|((words[offset+7]&3)<<15))>>>0;
}
export function compactLayoutTailProfile8(words,offset){
  return ((words[offset+10]&31)|((words[offset+13]&31)<<5))>>>0;
}

// Widths are selected from the prepared geometry. Hot fields retain native values.
export function prepareSharedCacheLayout(geometry,keyWords){
  if(!Number.isSafeInteger(keyWords)||keyWords<1)throw RangeError('invalid shared exact key width');
  if(geometry===null||geometry===undefined){
    const entryWords=keyWords+2,entryBytes=entryWords*4;
    if(!Number.isSafeInteger(entryBytes))throw RangeError('invalid shared exact byte width');
    return Object.freeze({kind:'fullspan',entryBytes,entryWords,keyWords});
  }
  if(!Number.isSafeInteger(geometry.columns)||geometry.columns<1||
     !Number.isSafeInteger(geometry.rows)||geometry.rows<1||geometry.rows>0xffffffff||
     !Number.isSafeInteger(geometry.coordWords)||geometry.coordWords<0||
     geometry.metaOffset!==geometry.columns||geometry.p0Offset!==geometry.columns+1||
     geometry.p1Offset!==geometry.p0Offset+geometry.coordWords||
     geometry.keyWords!==keyWords||keyWords!==geometry.p1Offset+geometry.coordWords)
    throw RangeError('shared cache requires matching prepared geometry');
  if(isCompactLayoutProfile8(geometry,keyWords))return Object.freeze({kind:'compact32',entryBytes:32,entryWords:8});
  const heightBytes=geometry.rows<=255?1:geometry.rows<=65535?2:4,
    coordinateOffset=Math.ceil((12+geometry.columns*heightBytes)/4),
    entryBytes=Math.ceil((coordinateOffset+2*geometry.coordWords)*4/32)*32;
  if(!Number.isSafeInteger(entryBytes))throw RangeError('invalid shared exact byte width');
  return Object.freeze({kind:'direct',entryBytes,entryWords:entryBytes/4,heightBytes,
    heightStride:entryBytes/heightBytes,heightOffset:12/heightBytes,
    columns:geometry.columns,metaOffset:geometry.metaOffset,p0Offset:geometry.p0Offset,
    coordinateWords:2*geometry.coordWords,coordinateOffset});
}

export function createConnect4RbaSharedLayoutCache32({capacity=65536,keyWords,geometry=null}={}){
  const layout=prepareSharedCacheLayout(geometry,keyWords),
    stride=layout.kind==='compact32'?16:layout.kind==='direct'?layout.heightStride:layout.entryWords;
  validateConnect4CacheCapacity32(capacity,stride);
  const bytes=capacity*layout.entryBytes;
  if(!Number.isSafeInteger(bytes))throw RangeError('invalid shared exact backing span');
  return attachConnect4RbaSharedLayoutCache32({mask:capacity-1,keyWords,
    storedKeyWords:layout.kind==='compact32'?8:keyWords,compact8:layout.kind==='compact32'?1:0,layout,
    entries:new Uint32Array(new SharedArrayBuffer(bytes)),stats:new Uint32Array(new SharedArrayBuffer(12))});
}

// Restore complete aliased views after structured clone. Never copy or grow.
export function attachConnect4RbaSharedLayoutCache32(cache){
  const entries=cache.entries,p=cache.layout,capacity=cache.mask+1;
  if(!p||!['compact32','direct','fullspan'].includes(p.kind)||
     !Number.isSafeInteger(cache.keyWords)||cache.keyWords<1||
     !Number.isSafeInteger(p.entryWords)||p.entryWords<1||p.entryBytes!==p.entryWords*4)
    throw RangeError('invalid shared exact layout');
  if(p.kind==='compact32'){
    if(p.entryWords!==8||cache.keyWords!==14||cache.storedKeyWords!==8||cache.compact8!==1)
      throw RangeError('invalid shared compact layout');
  }else{
    if(cache.storedKeyWords!==cache.keyWords||cache.compact8!==0)
      throw RangeError('invalid shared direct key width');
    if(p.kind==='fullspan'){
      if(p.keyWords!==cache.keyWords||p.entryWords!==cache.keyWords+2)
        throw RangeError('invalid shared full-span layout');
    }else if(!Number.isSafeInteger(p.columns)||p.columns<1||
      !Number.isSafeInteger(p.coordinateWords)||p.coordinateWords<0||(p.coordinateWords%2)||
      p.metaOffset!==p.columns||p.p0Offset!==p.columns+1||cache.keyWords!==p.columns+1+p.coordinateWords||
      ![1,2,4].includes(p.heightBytes)||p.heightStride!==p.entryBytes/p.heightBytes||
      p.heightOffset!==12/p.heightBytes||p.coordinateOffset!==Math.ceil((12+p.columns*p.heightBytes)/4)||
      p.entryBytes!==Math.ceil((p.coordinateOffset+p.coordinateWords)*4/32)*32)
        throw RangeError('invalid shared direct field layout');
  }
  const stride=p.kind==='compact32'?16:p.kind==='direct'?p.heightStride:p.entryWords;
  validateConnect4CacheCapacity32(capacity,stride);
  const bytes=capacity*p.entryBytes;
  if(!Number.isSafeInteger(bytes)||!(entries instanceof Uint32Array)||
     !(entries.buffer instanceof SharedArrayBuffer)||entries.byteOffset!==0||entries.buffer.byteLength!==bytes)
    throw RangeError('invalid shared exact backing');
  if(entries.length!==bytes/4)cache.entries=new Uint32Array(entries.buffer);
  if(p.kind==='compact32')cache.halves=new Uint16Array(entries.buffer);
  else if(p.kind==='direct'){
    const Type=p.heightBytes===1?Uint8Array:p.heightBytes===2?Uint16Array:Uint32Array;
    cache.heights=new Type(entries.buffer);
  }
  Object.freeze(p);
  return cache;
}

// Bind at worker initialization. These selected functions require knownHash;
// public optional-hash entry points below preserve the existing support API.
export function prepareSharedCacheAccess(cache,{counted=false}={}){
  if(cache.layout.kind==='compact32')return counted
    ?{probe:probeCompactSharedCacheCounted32,store:storeCompactSharedCacheCounted32}
    :{probe:probeCompactSharedCache32,store:storeCompactSharedCache32};
  if(cache.layout.kind==='direct')return counted
    ?{probe:probeDirectSharedCacheCounted32,store:storeDirectSharedCacheCounted32}
    :{probe:probeDirectSharedCache32,store:storeDirectSharedCache32};
  return counted?{probe:probeFullSpanSharedCacheCounted32,store:storeFullSpanSharedCacheCounted32}
    :{probe:probeFullSpanSharedCache32,store:storeFullSpanSharedCache32};
}

export function probeConnect4RbaSharedLayoutCache32(cache,words,offset,knownHash){
  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash;
  if(cache.layout.kind==='compact32')return probeCompactSharedCacheCounted32(cache,words,offset,hash);
  if(cache.layout.kind==='direct')return probeDirectSharedCacheCounted32(cache,words,offset,hash);
  return probeFullSpanSharedCacheCounted32(cache,words,offset,hash);
}
export function storeConnect4RbaSharedLayoutCache32(cache,words,offset,value,knownHash){
  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash;
  if(cache.layout.kind==='compact32')return storeCompactSharedCacheCounted32(cache,words,offset,value,hash);
  if(cache.layout.kind==='direct')return storeDirectSharedCacheCounted32(cache,words,offset,value,hash);
  return storeFullSpanSharedCacheCounted32(cache,words,offset,value,hash);
}
// Bytes: seq[0..3], support[4..7], four full coordinates[8..23],
// heights 0/1[24..27], tail[28..29], exact value[30..31].
// Every field has a disjoint address range, including narrow atomic accesses.
// Full-size 2^27-slot table: halfword index <= 2^31-1. Byte indices exceeded
// V8's Smi range and boxed at Atomics calls. Native halfwords need no decoding.
// Exact shared values are only 1/2/3; the sequence counter remains full uint32.
export function probeCompactSharedCache32(cache,words,offset,knownHash){
  const slot=knownHash&cache.mask,record=slot*8,
    before=Atomics.load(cache.entries,record);
  if(!before||(before&1))return 0;
  const keys=cache.entries,half=slot*16,halves=cache.halves;
  if(Atomics.load(halves,half+12)!==words[offset]||
     Atomics.load(halves,half+13)!==words[offset+1]||
     Atomics.load(keys,record+1)!==compactLayoutSupportProfile8(words,offset)||
     Atomics.load(keys,record+2)!==words[offset+8]||
     Atomics.load(keys,record+3)!==words[offset+9]||
     Atomics.load(keys,record+4)!==words[offset+11]||
     Atomics.load(keys,record+5)!==words[offset+12]||
     Atomics.load(halves,half+14)!==compactLayoutTailProfile8(words,offset))return 0;
  const value=Atomics.load(halves,half+15),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  return value;
}

export function storeCompactSharedCache32(cache,words,offset,value,knownHash){
  const slot=knownHash&cache.mask,record=slot*8,current=Atomics.load(cache.entries,record);
  if(current&1)return value;
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.entries,record,current,odd)!==current)return value;
  const keys=cache.entries,half=slot*16,halves=cache.halves;
  Atomics.store(halves,half+12,words[offset]);
  Atomics.store(halves,half+13,words[offset+1]);
  Atomics.store(keys,record+1,compactLayoutSupportProfile8(words,offset));
  Atomics.store(keys,record+2,words[offset+8]);
  Atomics.store(keys,record+3,words[offset+9]);
  Atomics.store(keys,record+4,words[offset+11]);
  Atomics.store(keys,record+5,words[offset+12]);
  Atomics.store(halves,half+14,compactLayoutTailProfile8(words,offset));
  Atomics.store(halves,half+15,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  return value;
}

// Wider boards retain full coordinates and metadata, with one native integer
// height per column. Field widths and offsets were decided at initialization.
export function probeDirectSharedCache32(cache,words,offset,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    before=Atomics.load(keys,record);
  if(!before||(before&1))return 0;
  const height=slot*p.heightStride+p.heightOffset;
  if(Atomics.load(keys,record+2)!==words[offset+p.metaOffset])return 0;
  for(let c=0;c<p.columns;c++)if(Atomics.load(cache.heights,height+c)!==words[offset+c])return 0;
  const base=record+p.coordinateOffset;
  for(let w=0;w<p.coordinateWords;w++)if(Atomics.load(keys,base+w)!==words[offset+p.p0Offset+w])return 0;
  const value=Atomics.load(keys,record+1),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  return value;
}

export function storeDirectSharedCache32(cache,words,offset,value,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    current=Atomics.load(keys,record);
  if(current&1)return value;
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(keys,record,current,odd)!==current)return value;
  const height=slot*p.heightStride+p.heightOffset;
  Atomics.store(keys,record+2,words[offset+p.metaOffset]);
  for(let c=0;c<p.columns;c++)Atomics.store(cache.heights,height+c,words[offset+c]);
  const base=record+p.coordinateOffset;
  for(let w=0;w<p.coordinateWords;w++)Atomics.store(keys,base+w,words[offset+p.p0Offset+w]);
  Atomics.store(keys,record+1,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  return value;
}

// No geometry: preserve every uint32 key lane without narrow-field assumptions.
export function probeFullSpanSharedCache32(cache,words,offset,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    before=Atomics.load(keys,record);
  if(!before||(before&1))return 0;
  for(let w=0;w<cache.keyWords;w++)if(Atomics.load(keys,record+2+w)!==words[offset+w])return 0;
  const value=Atomics.load(keys,record+1),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  return value;
}
export function storeFullSpanSharedCache32(cache,words,offset,value,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    current=Atomics.load(keys,record);
  if(current&1)return value;
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(keys,record,current,odd)!==current)return value;
  for(let w=0;w<cache.keyWords;w++)Atomics.store(keys,record+2+w,words[offset+w]);
  Atomics.store(keys,record+1,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  return value;
}
// Reporting variants duplicate the exact protocol; uncounted access has no stats branch.
// Bytes: seq[0..3], support[4..7], four full coordinates[8..23],
// heights 0/1[24..27], tail[28..29], exact value[30..31].
// Every field has a disjoint address range, including narrow atomic accesses.
// Full-size 2^27-slot table: halfword index <= 2^31-1. Byte indices exceeded
// V8's Smi range and boxed at Atomics calls. Native halfwords need no decoding.
// Exact shared values are only 1/2/3; the sequence counter remains full uint32.
export function probeCompactSharedCacheCounted32(cache,words,offset,knownHash){
  const slot=knownHash&cache.mask,record=slot*8,
    before=Atomics.load(cache.entries,record);
  if(!before||(before&1))return 0;
  const keys=cache.entries,half=slot*16,halves=cache.halves;
  if(Atomics.load(halves,half+12)!==words[offset]||
     Atomics.load(halves,half+13)!==words[offset+1]||
     Atomics.load(keys,record+1)!==compactLayoutSupportProfile8(words,offset)||
     Atomics.load(keys,record+2)!==words[offset+8]||
     Atomics.load(keys,record+3)!==words[offset+9]||
     Atomics.load(keys,record+4)!==words[offset+11]||
     Atomics.load(keys,record+5)!==words[offset+12]||
     Atomics.load(halves,half+14)!==compactLayoutTailProfile8(words,offset))return 0;
  const value=Atomics.load(halves,half+15),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  return value;
}

export function storeCompactSharedCacheCounted32(cache,words,offset,value,knownHash){
  const slot=knownHash&cache.mask,record=slot*8,current=Atomics.load(cache.entries,record);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.entries,record,current,odd)!==current){Atomics.add(cache.stats,2,1);return value;}
  const keys=cache.entries,half=slot*16,halves=cache.halves;
  Atomics.store(halves,half+12,words[offset]);
  Atomics.store(halves,half+13,words[offset+1]);
  Atomics.store(keys,record+1,compactLayoutSupportProfile8(words,offset));
  Atomics.store(keys,record+2,words[offset+8]);
  Atomics.store(keys,record+3,words[offset+9]);
  Atomics.store(keys,record+4,words[offset+11]);
  Atomics.store(keys,record+5,words[offset+12]);
  Atomics.store(halves,half+14,compactLayoutTailProfile8(words,offset));
  Atomics.store(halves,half+15,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  return value;
}

// Wider boards retain full coordinates and metadata, with one native integer
// height per column. Field widths and offsets were decided at initialization.
export function probeDirectSharedCacheCounted32(cache,words,offset,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    before=Atomics.load(keys,record);
  if(!before||(before&1))return 0;
  const height=slot*p.heightStride+p.heightOffset;
  if(Atomics.load(keys,record+2)!==words[offset+p.metaOffset])return 0;
  for(let c=0;c<p.columns;c++)if(Atomics.load(cache.heights,height+c)!==words[offset+c])return 0;
  const base=record+p.coordinateOffset;
  for(let w=0;w<p.coordinateWords;w++)if(Atomics.load(keys,base+w)!==words[offset+p.p0Offset+w])return 0;
  const value=Atomics.load(keys,record+1),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  return value;
}

export function storeDirectSharedCacheCounted32(cache,words,offset,value,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    current=Atomics.load(keys,record);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(keys,record,current,odd)!==current){Atomics.add(cache.stats,2,1);return value;}
  const height=slot*p.heightStride+p.heightOffset;
  Atomics.store(keys,record+2,words[offset+p.metaOffset]);
  for(let c=0;c<p.columns;c++)Atomics.store(cache.heights,height+c,words[offset+c]);
  const base=record+p.coordinateOffset;
  for(let w=0;w<p.coordinateWords;w++)Atomics.store(keys,base+w,words[offset+p.p0Offset+w]);
  Atomics.store(keys,record+1,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  return value;
}

// No geometry: preserve every uint32 key lane without narrow-field assumptions.
export function probeFullSpanSharedCacheCounted32(cache,words,offset,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    before=Atomics.load(keys,record);
  if(!before||(before&1))return 0;
  for(let w=0;w<cache.keyWords;w++)if(Atomics.load(keys,record+2+w)!==words[offset+w])return 0;
  const value=Atomics.load(keys,record+1),after=Atomics.load(keys,record);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  return value;
}
export function storeFullSpanSharedCacheCounted32(cache,words,offset,value,knownHash){
  const slot=knownHash&cache.mask,p=cache.layout,record=slot*p.entryWords,keys=cache.entries,
    current=Atomics.load(keys,record);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(keys,record,current,odd)!==current){Atomics.add(cache.stats,2,1);return value;}
  for(let w=0;w<cache.keyWords;w++)Atomics.store(keys,record+2+w,words[offset+w]);
  Atomics.store(keys,record+1,value);
  Atomics.store(keys,record,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  return value;
}
