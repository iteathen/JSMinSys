// STRATEGIST ONLY. No evaluator imports this module. No clocks, TT mutation,
// scheduling or move ordering: output is the existing SHALLOW/DEEP flag payload.
export function createPendingPolicy({oneBand=false,trigger='sustained'}={}){
  if(!['sustained','growth','relative25','density'].includes(trigger))throw RangeError('pending trigger');
  return {oneBand,trigger,flags:0,scope:0,revision:0,previous:null,growth:0,startBands:0,startBandCompleted:0,
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
  const growing=prev&&prev.mode===0&&prev.horizonStops===sample.horizonStops&&sample.width>prev.width;
  p.growth=growing?p.growth+1:0;
  // STRATEGIST ONLY: density discounts width added simply by a deeper stack.
  // It is a proxy across snapshots, not proof of same-q frontier expansion.
  const fire=p.trigger==='sustained'?p.growth>=2:growing&&(
    p.trigger==='growth'||p.trigger==='relative25'&&4*(sample.width-prev.width)>=prev.width||
    p.trigger==='density'&&prev.frames>0&&sample.frames>0&&
      (sample.width-1)*prev.frames>(prev.width-1)*sample.frames);
  p.previous=sample;
  if(fire){
    p.flags=p.oneBand?522:10; // Optional pre-authorized single band (bit 9).
    p.startBandCompleted=sample.bandCompleted;
    p.startBands=sample.completedBands;p.triggers++;p.previous=null;p.growth=0;
  }
  return p.flags;
}
