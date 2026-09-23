import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from './rba-connect4-geometry.mjs';
import {connect4RbaBasisFromSupport,connect4RbaCofactor,connect4RbaCanonicalize,connect4RbaTerminal,connect4RbaRank} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront,RBA_BOUNDARY_INCOMPLETE,RBA_BOUNDARY_CAPACITY} from './rba-connect4-front.mjs';
import {rbaTtPublishPrepared32,rbaTtPublishExactOwned32,rbaTtAttachDependencies32,rbaTtReconcile32,rbaTtSignalParents32,rbaTtEnqueueDependencies32,rbaTtDetachDependencies32,rbaTtMarkDone32,RBA_TT_ROOT,RBA_TT_PHASE_PENDING_ATTACH,RBA_TT_PHASE_ATTACHED,RBA_TT_STOP} from './rba-tt32.mjs';

export const RBA_EXACT_P1=1,RBA_EXACT_DRAW=2,RBA_EXACT_P0=3,RBA_BRANCH=4;
export const RBA_QUERY_UNCOVERED=8,RBA_INTERRUPTED=9;

export function prepareConnect4RbaEvaluator({geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),boundaryDepth=2,boundaryCapacity=256,boundaryBudget=100000}={}){
  const g=geometry;
  return {g,scratch:prepareConnect4RbaCoordinateScratch(g),
    boundary:prepareConnect4RbaFrontArena(g,{depth:boundaryDepth,capacity:boundaryCapacity,budget:boundaryBudget}),
    keys:new Uint32Array(g.columns*g.keyWords),childBasis:new Uint32Array(g.columns*g.maxBasis),
    childBasisSize:new Uint32Array(g.columns),actions:new Uint32Array(g.columns),
    actionLower:new Uint32Array(g.columns),actionUpper:new Uint32Array(g.columns),
    childPresent:new Uint32Array(g.columns),lower:1,upper:3,count:0,witness:-1,
    boundaryCalls:0,boundaryClosures:0,boundarySteps:0,boundaryFailures:0,
    transitions:0,actionClosures:0,actionsPruned:0};
}
export function assertConnect4RbaTtCompatibility(t,g){
  if(t.keyWords!==g.keyWords||t.basisCapacity<g.maxBasis||t.edgeCapacity<g.columns)
    throw new RangeError('RBA TT/profile mismatch');
  return 1;
}

export function connect4RbaFromMoves(moves,{geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),canonical=true}={}){
  const g=geometry,words=new Uint32Array(g.keyWords*2),basis=new Uint32Array(g.maxBasis*2),scratch=prepareConnect4RbaCoordinateScratch(g);
  let src=0,dst=g.keyWords,bi=0,ci=g.maxBasis;
  let n=connect4RbaBasisFromSupport(g,words,src,basis,bi,scratch.seen);
  for(let p=0;p<2;p+=1){const off=src+(p?g.p1Offset:g.p0Offset);for(let i=0;i<n;i+=1)words[off+(i>>>5)]|=1<<(i&31);}
  for(const column of moves){
    if(!Number.isInteger(column)||column<0||column>=g.columns)throw new RangeError('invalid column');
    if(connect4RbaTerminal(g,words,src))throw new RangeError('move after terminal');
    if(words[src+column]>=g.rows)throw new RangeError('column full');
    connect4RbaCofactor(g,words,src,basis,bi,n,column,words,dst,basis,ci,scratch.seen,scratch.size,0);
    const oldSrc=src;src=dst;dst=oldSrc;const oldBi=bi;bi=ci;ci=oldBi;n=scratch.size[0];
  }
  const result=words.slice(src,src+g.keyWords),rootBasis=basis.slice(bi,bi+n);
  const reflected=canonical?connect4RbaCanonicalize(g,result,0,rootBasis,0,n,scratch):0;
  return {words:result,basis:rootBasis,reflected};
}
function bothCoordinatesEmpty(g,words,base){
  let any=0;for(let w=0;w<g.coordWords;w+=1)any|=words[base+g.p0Offset+w]|words[base+g.p1Offset+w];return any===0;
}
function rootCanonicalColumn(g,orderIndex,reflected){const caller=g.actionOrder[orderIndex];return reflected?g.mirrorColumn[caller]:caller;}

export function evaluateConnect4RbaTt32(t,q,state,rootQ=-1,rootReflected=0){
  if(Atomics.load(t.control,RBA_TT_STOP))return RBA_INTERRUPTED;
  const g=state.g,base=q*t.keyWords,terminal=connect4RbaTerminal(g,t.keys,base);
  state.count=0;state.witness=-1;state.childPresent.fill(0);
  if(terminal)return terminal;
  if(!g.lineCount||bothCoordinatesEmpty(g,t.keys,base))return RBA_EXACT_DRAW;
  const n=t.basisSize[q];if(!n)return RBA_EXACT_DRAW;

  state.boundaryCalls+=1;
  const outcome=buildConnect4RbaFourFront(g,state.boundary,t.keys,base,t.basis,q*t.basisCapacity,n);
  state.boundarySteps+=state.boundary.steps;if(outcome){state.boundaryFailures+=1;return outcome;}
  const interval=queryConnect4RbaFourFront(g,state.boundary,0,t.keys,base);
  state.lower=interval&3;state.upper=interval>>>2;const mover=connect4RbaRank(g,t.keys,base)&1;

  if(state.lower===state.upper){
    const value=state.lower;
    if(q!==rootQ){state.boundaryClosures+=1;return value;}
    for(let oi=0;oi<g.columns;oi+=1){const caller=g.actionOrder[oi],column=rootReflected?g.mirrorColumn[caller]:caller;
      if(t.keys[base+column]>=g.rows)continue;
      const action=state.boundary.depth?queryConnect4RbaFourFront(g,state.boundary,state.boundary.actionBase+column*4,t.keys,base):13;
      const lo=action&3,hi=action>>>2;if(mover?lo>value:hi<value)continue;
      if(mover?hi===value:lo===value){state.witness=caller;state.boundaryClosures+=1;return value;}break;
    }
  }

  let count=0;
  for(let oi=0;oi<g.columns;oi+=1){
    const column=q===rootQ?rootCanonicalColumn(g,oi,rootReflected):g.actionOrder[oi];
    if(t.keys[base+column]>=g.rows)continue;
    const action=state.boundary.depth?queryConnect4RbaFourFront(g,state.boundary,state.boundary.actionBase+column*4,t.keys,base):13;
    let lo=action&3,hi=action>>>2;state.actions[count]=column;
    if(lo===hi)state.actionClosures+=1;
    else if(mover?lo>state.upper:hi<state.lower)state.actionsPruned+=1;
    else{
      const childBase=count*g.keyWords,childBi=count*g.maxBasis;
      const term=connect4RbaCofactor(g,t.keys,base,t.basis,q*t.basisCapacity,n,column,state.keys,childBase,state.childBasis,childBi,state.scratch.seen,state.childBasisSize,count);
      state.transitions+=1;
      if(term<0||(term&&(term<lo||term>hi)))return RBA_QUERY_UNCOVERED;
      if(term){lo=term;hi=term;state.actionClosures+=1;}
      else{connect4RbaCanonicalize(g,state.keys,childBase,state.childBasis,childBi,state.childBasisSize[count],state.scratch);state.childPresent[count]=1;}
    }
    state.actionLower[count]=lo;state.actionUpper[count]=hi;count+=1;
  }
  if(!count)return RBA_QUERY_UNCOVERED;state.count=count;return RBA_BRANCH;
}

export function publishConnect4RbaEvaluation32(t,q,owner,state,code,rootQ,rootWitnessOut,witnessIndex=0){
  if(code>=1&&code<=3){
    if(!rbaTtPublishExactOwned32(t,q,owner,code))return -1;
    if(q===rootQ&&(connect4RbaTerminal(state.g,t.keys,q*t.keyWords)||state.witness>=0)){
      rootWitnessOut[witnessIndex]=state.witness;rbaTtMarkDone32(t);
    }
    return -1;
  }
  if(code!==RBA_BRANCH)return -1;
  return rbaTtPublishPrepared32(t,q,owner,state.lower,state.upper,state.keys,0,state.childBasis,0,state.g.maxBasis,
    state.childBasisSize,state.actions,state.actionLower,state.actionUpper,state.childPresent,state.count);
}

export function selectConnect4RbaRootWitness32(t,g,root,reflected){
  if(!t.exact[root])return -2;const base=root*t.keyWords;if(connect4RbaTerminal(g,t.keys,base))return -1;
  const value=t.exact[root],minimize=connect4RbaRank(g,t.keys,base)&1,edgeBase=root*t.edgeCapacity;
  let bestPriority=g.columns,result=-2;
  for(let i=0;i<t.count[root];i+=1){const e=edgeBase+i,lo=t.edgeLower[e],hi=t.edgeUpper[e],label=t.edgeLabel[e];
    const caller=reflected?g.mirrorColumn[label]:label,possible=minimize?lo<=value:hi>=value;if(!possible)continue;
    const priority=g.priorityByColumn[caller];if(priority<bestPriority){bestPriority=priority;result=minimize?(hi===value?caller:-2):(lo===value?caller:-2);}
  }
  return result;
}

export function reconcileConnect4RbaEvent32(t,q,g,rootReflected,rootWitnessOut,witnessIndex=0){
  if(t.phase[q]===RBA_TT_PHASE_PENDING_ATTACH)if(!rbaTtAttachDependencies32(t,q))return -1;
  if(t.phase[q]===RBA_TT_PHASE_ATTACHED){rbaTtReconcile32(t,q,connect4RbaRank(g,t.keys,q*t.keyWords)&1);if(Atomics.load(t.control,RBA_TT_STOP))return -1;}
  rbaTtSignalParents32(t,q);
  if(t.exact[q]){
    if(q===t.control[RBA_TT_ROOT]){
      const witness=selectConnect4RbaRootWitness32(t,g,q,rootReflected);
      if(witness>=-1){rootWitnessOut[witnessIndex]=witness;if(t.count[q])rbaTtDetachDependencies32(t,q);rbaTtMarkDone32(t);return 1;}
      rbaTtEnqueueDependencies32(t,q);return 0;
    }
    if(t.count[q])rbaTtDetachDependencies32(t,q);return 0;
  }
  rbaTtEnqueueDependencies32(t,q);return 0;
}
export {RBA_BOUNDARY_INCOMPLETE,RBA_BOUNDARY_CAPACITY};
