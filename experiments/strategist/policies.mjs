import {encodeControls} from './controls.mjs';

// Strategist-only observation: bounded read-only sample of committed rows.
// No probe helper is used because that would mutate the TT hit counter.
export function observeProofCache(cache,columns,cellCount){
  let occupied=0,useful=0,minRank=cellCount;
  const sampled=Math.min(256,cache.mask+1);
  for(let i=0;i<sampled;i++){
    const slot=(i*509)&cache.mask,before=Atomics.load(cache.sequence,slot);
    if(!before||(before&1))continue;
    let rank=0;
    for(let c=0;c<columns;c++)rank+=Atomics.load(cache.keys,slot*cache.keyWords+c);
    const value=Atomics.load(cache.value,slot),after=Atomics.load(cache.sequence,slot);
    if(before!==after||!value||value>3)continue;
    occupied++;if(rank<minRank)minRank=rank;
    if(cellCount-rank>=8)useful++;
  }
  return {occupied,useful,sampled,minRank};
}

export function advancePolicy(state,{stores,useful}){
  if(useful>=2)state.harvested=true;
  if(stores>=256&&useful>=1)state.retired=true;
}

export const STRATEGIES=['anchor-private','wide-private','harvest','wide-harvest','seed-retire','wide-seed','thin-sharing','dispatch-pulse'];

export function policyFlags(name,index,d,state){
  if(name==='dispatch-pulse')return encodeControls({shareExponent:state.tick&1?4:0});
  if(name==='thin-sharing')return encodeControls({shareExponent:8});
  const wide=name.startsWith('wide-');
  const rotation=wide?(Math.floor(index*d.columns/d.workers)-index+d.columns)%d.columns:null;
  if((name==='seed-retire'||name==='wide-seed')&&index&&state.retired)return 1;
  const shareExponent=!index||name==='seed-retire'||name==='wide-seed'||
    ((name==='harvest'||name==='wide-harvest')&&state.harvested)?0:4;
  return encodeControls({rotation,shareExponent});
}
