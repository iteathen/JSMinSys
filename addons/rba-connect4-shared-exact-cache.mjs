import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {popcount32} from '../src/word32.mjs';

const DIAG_VALUE=0,DIAG_RANK=3,DIAG_DENSITY=46,DIAG_LEGAL=51,DIAG_WIDTH=59;

export function createConnect4RbaSharedExactCache32({
  capacity=65536,keyWords,
  diagnosticWorkers=0,diagnosticMetaOffset=0,diagnosticP0Offset=0,
  diagnosticCoordWords=0,diagnosticColumns=0,diagnosticRows=0,
}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1||
     !Number.isInteger(diagnosticWorkers)||diagnosticWorkers<0||diagnosticWorkers>64)
    throw new RangeError('invalid shared exact cache');
  const diagnostic=diagnosticWorkers>0;
  if(diagnostic&&(
    !Number.isInteger(diagnosticMetaOffset)||diagnosticMetaOffset<0||
    !Number.isInteger(diagnosticP0Offset)||diagnosticP0Offset<0||
    !Number.isInteger(diagnosticCoordWords)||diagnosticCoordWords<1||
    !Number.isInteger(diagnosticColumns)||diagnosticColumns<1||
    !Number.isInteger(diagnosticRows)||diagnosticRows<1))
    throw new RangeError('invalid shared exact cache diagnostics');
  return {
    mask:capacity-1,
    keyWords,
    workerIndex:-1,
    diagnosticWorkers,
    diagnosticMetaOffset,
    diagnosticP0Offset,
    diagnosticCoordWords,
    diagnosticColumns,
    diagnosticRows,
    sequence:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    value:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),
    keys:new Uint32Array(new SharedArrayBuffer(capacity*keyWords*Uint32Array.BYTES_PER_ELEMENT)),
    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),
    diagnosticSlot:diagnostic
      ?new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT))
      :null,
    diagnosticStores:diagnostic
      ?new Uint32Array(new SharedArrayBuffer(DIAG_WIDTH*Uint32Array.BYTES_PER_ELEMENT))
      :null,
    diagnosticCrossHits:diagnostic
      ?new Uint32Array(new SharedArrayBuffer(diagnosticWorkers*DIAG_WIDTH*Uint32Array.BYTES_PER_ELEMENT))
      :null,
  };
}

export function probeConnect4RbaSharedExactCache32(cache,words,offset){
  const hash=mixSpan32Locator32(words,offset,cache.keyWords)&0xffffffff,
    slot=hash&cache.mask,
    before=Atomics.load(cache.sequence,slot);
  if(!before||(before&1))return 0;
  const base=slot*cache.keyWords;
  for(let w=0;w<cache.keyWords;w+=1)
    if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;
  const value=Atomics.load(cache.value,slot),
    feature=cache.diagnosticSlot?Atomics.load(cache.diagnosticSlot,slot):0,
    after=Atomics.load(cache.sequence,slot);
  if(before!==after||(after&1)||!value)return 0;
  Atomics.add(cache.stats,0,1);
  if(feature&&cache.diagnosticCrossHits&&cache.workerIndex>=0){
    const owner=((feature>>>15)&127)-1;
    if(owner!==cache.workerIndex){
      const out=cache.workerIndex*DIAG_WIDTH,
        valueBin=feature&3,
        rank=(feature>>>2)&63,
        density=(feature>>>8)&7,
        legal=(feature>>>11)&15;
      Atomics.add(cache.diagnosticCrossHits,out+DIAG_VALUE+valueBin,1);
      Atomics.add(cache.diagnosticCrossHits,out+DIAG_RANK+rank,1);
      Atomics.add(cache.diagnosticCrossHits,out+DIAG_DENSITY+density,1);
      Atomics.add(cache.diagnosticCrossHits,out+DIAG_LEGAL+legal,1);
    }
  }
  return value;
}

export function storeConnect4RbaSharedExactCache32(cache,words,offset,value){
  const hash=mixSpan32Locator32(words,offset,cache.keyWords)&0xffffffff,
    slot=hash&cache.mask,
    current=Atomics.load(cache.sequence,slot);
  if(current&1){Atomics.add(cache.stats,2,1);return value;}
  const odd=(current+1)>>>0;
  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){
    Atomics.add(cache.stats,2,1);return value;
  }
  const base=slot*cache.keyWords;
  let feature=0;
  if(cache.diagnosticSlot&&cache.workerIndex>=0){
    const rank=words[offset+cache.diagnosticMetaOffset]>>>2;
    let density=0;
    for(let w=0;w<2*cache.diagnosticCoordWords;w+=1)
      density+=popcount32(words[offset+cache.diagnosticP0Offset+w]);
    const densityBin=density<4?0:density<8?1:density<16?2:density<32?3:4;
    let legal=0;
    for(let c=0;c<cache.diagnosticColumns;c+=1)
      if(words[offset+c]<cache.diagnosticRows)legal+=1;
    feature=((value-1)&3)|(rank<<2)|(densityBin<<8)|(legal<<11)|((cache.workerIndex+1)<<15);
    Atomics.store(cache.diagnosticSlot,slot,feature);
  }
  for(let w=0;w<cache.keyWords;w+=1)Atomics.store(cache.keys,base+w,words[offset+w]);
  Atomics.store(cache.value,slot,value);
  Atomics.store(cache.sequence,slot,(odd+1)>>>0);
  Atomics.add(cache.stats,1,1);
  if(feature&&cache.diagnosticStores){
    const valueBin=feature&3,
      rank=(feature>>>2)&63,
      density=(feature>>>8)&7,
      legal=(feature>>>11)&15;
    Atomics.add(cache.diagnosticStores,DIAG_VALUE+valueBin,1);
    Atomics.add(cache.diagnosticStores,DIAG_RANK+rank,1);
    Atomics.add(cache.diagnosticStores,DIAG_DENSITY+density,1);
    Atomics.add(cache.diagnosticStores,DIAG_LEGAL+legal,1);
  }
  return value;
}
