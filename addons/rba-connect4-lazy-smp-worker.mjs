import {workerData} from 'node:worker_threads';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownHeight} from './rba-connect4-coordinate.mjs';

const CONTROL_STOP=0,CONTROL_DONE=1,CONTROL_WAKE=3,CONTROL_WINNER=4,
  RESULT_STRIDE=4,METRIC_WIDTH=15,CANCELLED=-2,
  index=workerData.workerIndex,g=workerData.geometry,
  profile=prepareConnect4RbaExecutionProfile(g),
  control=workerData.control,resultWords=workerData.resultWords,
  metrics=new Float64Array(workerData.metricBuffer),
  words=new Uint32Array((g.cellCount+1)*g.keyWords),
  basis=new Uint32Array((g.cellCount+1)*g.maxBasis),
  basisSize=new Uint32Array(g.cellCount+1),
  seen=new Uint32Array(g.shapeWordCount),
  orderOffset=index%g.columns;

words.set(workerData.root.words);
basis.set(workerData.root.basis);
basisSize[0]=workerData.root.basis.length;

let nodes=0,cutoffs=0,bestMove=-1;

function relativeTerminal(value,mover){
  return value===2?0:value===(mover?1:3)?1:-1;
}

function relativeToAbsolute(value,mover){
  return value===0?2:mover===0?value+2:2-value;
}

function negamax(depth,n,mover,alpha,beta){
  if(Atomics.load(control,CONTROL_STOP))return CANCELLED;
  nodes+=1;
  const src=depth*g.keyWords,bi=depth*g.maxBasis,
    dst=src+g.keyWords,ci=bi+g.maxBasis;
  let best=-2;

  for(let oi=0;oi<g.columns;oi+=1){
    const column=g.actionOrder[(oi+orderOffset)%g.columns],
      height=words[src+column];
    if(height>=g.rows)continue;

    const term=connect4RbaCofactorKnownHeight(
      g,profile,words,src,basis,bi,n,column,height,
      words,dst,basis,ci,seen,basisSize,depth+1,
    );
    let value;
    if(term)value=relativeTerminal(term,mover);
    else{
      value=negamax(depth+1,basisSize[depth+1],mover^1,-beta,-alpha);
      if(value===CANCELLED)return CANCELLED;
      value=-value;
    }

    if(value>best){
      best=value;
      if(depth===0)bestMove=column;
    }
    if(value>alpha)alpha=value;
    if(alpha>=beta){cutoffs+=1;break;}
  }
  return best;
}

const meta=words[g.metaOffset],mover=(meta>>>2)&1,terminal=meta&3,
  relative=terminal?relativeTerminal(terminal,mover):negamax(0,basisSize[0],mover,-2,2);

if(relative!==CANCELLED){
  const resultBase=index*RESULT_STRIDE,metricBase=index*METRIC_WIDTH,
    value=terminal||relativeToAbsolute(relative,mover),
    move=bestMove<0?-1:workerData.rootReflected?g.mirrorColumn[bestMove]:bestMove;

  metrics[metricBase]=nodes;
  metrics[metricBase+1]=cutoffs;

  Atomics.store(resultWords,resultBase,value);
  Atomics.store(resultWords,resultBase+1,relative);
  Atomics.store(resultWords,resultBase+2,move);
  Atomics.store(resultWords,resultBase+3,1);

  if(Atomics.compareExchange(control,CONTROL_WINNER,-1,index)===-1){
    Atomics.store(control,CONTROL_DONE,1);
    Atomics.add(control,CONTROL_WAKE,1);
    Atomics.notify(control,CONTROL_WAKE);
  }
}
