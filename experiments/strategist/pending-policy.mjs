// STRATEGIST ONLY. No evaluator imports this module. No clocks, TT mutation,
// scheduling or move ordering: output is the existing SHALLOW/DEEP flag payload.
export function createPendingPolicy({oneBand=false}={}){
  return {oneBand,flags:0,scope:0,revision:0,previous:null,growth:0,startBands:0,startBandCompleted:0,
    triggers:0,releases:0,lastBurstBands:0,maxBurstBands:0};
}
export function advancePendingPolicy(p,sample){
  if(!sample)return p.flags;
  if(sample.scope!==p.scope){
    p.scope=sample.scope;p.revision=0;p.previous=null;p.growth=0;p.flags=0;
  }
  if(sample.revision<=p.revision)return p.flags;
  p.revision=sample.revision;
  if(p.flags){
    // A command is not an acknowledgement. Do not interpret a stale DEEP
    // snapshot as work performed by the requested SHALLOW action.
    if(p.oneBand?sample.bandCompleted>p.startBandCompleted:sample.mode===1&&sample.completedBands>p.startBands){
      p.lastBurstBands=sample.completedBands-p.startBands;
      p.maxBurstBands=Math.max(p.maxBurstBands,p.lastBurstBands);
      p.flags=0;p.releases++;p.previous=null;p.growth=0;
    }
    return p.flags;
  }
  if(sample.mode!==0){p.previous=null;p.growth=0;return 0;}
  const prev=p.previous;
  p.growth=prev&&prev.mode===0&&prev.horizonStops===sample.horizonStops&&sample.width>prev.width?p.growth+1:0;
  p.previous=sample;
  if(p.growth>=2){
    p.flags=p.oneBand?522:10; // Optional pre-authorized single band (bit 9).
    p.startBandCompleted=sample.bandCompleted;
    p.startBands=sample.completedBands;p.triggers++;p.previous=null;p.growth=0;
  }
  return p.flags;
}
