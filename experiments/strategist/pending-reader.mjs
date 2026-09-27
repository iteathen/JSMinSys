import {readPendingObservation,measurePendingObservation} from './pending-observation.mjs';

// Strategist only: interpretation, scope checks and deltas never reach workers.
export function preparePendingReaders(memory){
  return Array.from({length:memory.workers},()=>({scratch:new Uint32Array(memory.stride),last:null,
    samples:0,minWidth:Infinity,maxWidth:0,positive:0,negative:0,flat:0}));
}
export function pollPendingReader(memory,index,reader){
  if(!readPendingObservation(memory,index,reader.scratch)||reader.scratch[0]===reader.last?.revision)return null;
  const sample=measurePendingObservation(memory,reader.scratch),previous=reader.last;
  sample.delta=previous&&previous.scope===sample.scope&&previous.mode===sample.mode&&
    previous.horizonStops===sample.horizonStops?sample.width-previous.width:null;
  reader.samples++;reader.minWidth=Math.min(reader.minWidth,sample.width);reader.maxWidth=Math.max(reader.maxWidth,sample.width);
  if(sample.delta>0)reader.positive++;else if(sample.delta<0)reader.negative++;else if(sample.delta===0)reader.flat++;
  reader.last=sample;return sample;
}
