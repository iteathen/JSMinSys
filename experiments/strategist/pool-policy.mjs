// STRATEGIST ONLY. Prepared standby admission; running workers remain DEEP.
export function createPoolPolicy(capacity,initial){
  if(!Number.isInteger(capacity)||capacity<1||!Number.isInteger(initial)||initial<1||initial>capacity)
    throw RangeError('pool profile');
  return {capacity,active:initial,readers:Array.from({length:capacity},()=>({previous:null,growth:0})),events:[]};
}
export function advancePoolPolicy(p,samples){
  if(p.active===p.capacity)return -1;
  for(let i=0;i<p.active;i++){
    const sample=samples[i];if(!sample)continue;
    const r=p.readers[i],prev=r.previous;
    if(prev&&sample.scope===prev.scope&&sample.revision<=prev.revision)continue;
    r.growth=prev&&sample.scope===prev.scope&&sample.mode===0&&prev.mode===0&&
      sample.horizonStops===prev.horizonStops&&sample.width>prev.width?r.growth+1:0;
    r.previous=sample;
    if(r.growth>=2){
      r.growth=0;const index=p.active++;
      p.events.push({index,source:i,revision:sample.revision,width:sample.width,nodes:sample.nodes});
      return index;
    }
  }
  return -1;
}
