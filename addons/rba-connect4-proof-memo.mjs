import {mixSpan32Locator32} from '../src/widekey32.mjs';
import {
  compactSupportProfile8,
  compactTailProfile8,
  isCompactProfile8,
} from './rba-connect4-shared-exact-cache.mjs';

// COLD/PREPARED. Single-owner proof memo: collisions are safe cache replacement,
// never semantic equality. A zero value means empty/miss.
export function prepareConnect4RbaProofMemo32({capacity=4194304,keyWords,geometry=null}={}){
  if(!Number.isInteger(capacity)||capacity<1||(capacity&(capacity-1))||
     !Number.isInteger(keyWords)||keyWords<1)
    throw new RangeError('invalid RBA proof memo');
  if(geometry!==null&&geometry!==undefined&&geometry.keyWords!==keyWords)
    throw new RangeError('RBA proof memo/profile mismatch');
  const compact8=isCompactProfile8(geometry,keyWords)?1:0,
    storedKeyWords=compact8?10:keyWords+2;
  return {
    mask:capacity-1,
    keyWords,
    storedKeyWords,
    compact8,
    value:new Uint32Array(capacity),
    keys:new Uint32Array(capacity*storedKeyWords),
  };
}

// E1 trusted key mixer. Caller owns guardMask/horizon domain validation.
// q identity remains the existing exact RBA words; side state is mixed only
// into addressing, never substituted for equality.
export function mixConnect4RbaProofMemoKey32(words,offset,keyWords,guardMask,horizon){
  let hash=mixSpan32Locator32(words,offset,keyWords),
    x=(hash^(guardMask>>>0))>>>0;
  hash=Math.imul(x^(x>>>16),0x7feb352d)>>>0;
  x=(hash^(horizon>>>0))>>>0;
  return Math.imul(x^(x>>>16),0x7feb352d)>>>0;
}

// E1 trusted probe. Exact equality owns hits. Direct-map collisions are misses.
export function probeConnect4RbaProofMemo32(memo,words,offset,guardMask,horizon,hash){
  const slot=hash&memo.mask,
    value=memo.value[slot];
  if(!value)return 0;
  const base=slot*memo.storedKeyWords,
    keys=memo.keys;
  if(memo.compact8){
    if(keys[base]!==words[offset]||
       keys[base+1]!==words[offset+1]||
       keys[base+2]!==compactSupportProfile8(words,offset)||
       keys[base+3]!==words[offset+8]||
       keys[base+4]!==words[offset+9]||
       keys[base+5]!==words[offset+11]||
       keys[base+6]!==words[offset+12]||
       keys[base+7]!==compactTailProfile8(words,offset)||
       keys[base+8]!== (guardMask>>>0)||
       keys[base+9]!== (horizon>>>0))return 0;
    return value;
  }
  for(let w=0;w<memo.keyWords;w+=1)
    if(keys[base+w]!==words[offset+w])return 0;
  if(keys[base+memo.keyWords]!== (guardMask>>>0)||
     keys[base+memo.keyWords+1]!== (horizon>>>0))return 0;
  return value;
}

// E1 trusted store. Key is published before nonzero value. This memo is
// deliberately single-owner; do not share it across workers without a
// publication protocol.
export function storeConnect4RbaProofMemo32(memo,words,offset,guardMask,horizon,hash,value){
  const slot=hash&memo.mask,
    base=slot*memo.storedKeyWords,
    keys=memo.keys;
  if(memo.compact8){
    keys[base]=words[offset];
    keys[base+1]=words[offset+1];
    keys[base+2]=compactSupportProfile8(words,offset);
    keys[base+3]=words[offset+8];
    keys[base+4]=words[offset+9];
    keys[base+5]=words[offset+11];
    keys[base+6]=words[offset+12];
    keys[base+7]=compactTailProfile8(words,offset);
    keys[base+8]=guardMask>>>0;
    keys[base+9]=horizon>>>0;
  }else{
    for(let w=0;w<memo.keyWords;w+=1)keys[base+w]=words[offset+w];
    keys[base+memo.keyWords]=guardMask>>>0;
    keys[base+memo.keyWords+1]=horizon>>>0;
  }
  memo.value[slot]=value>>>0;
  return value>>>0;
}
