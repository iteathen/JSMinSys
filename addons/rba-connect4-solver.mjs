import {prepareConnect4RbaCoordinateScratch} from './rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';
import {connect4RbaBasisFromSupport,connect4RbaCofactor,connect4RbaCanonicalize,connect4RbaTerminal,connect4RbaRank} from './rba-connect4-coordinate.mjs';
import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront,RBA_BOUNDARY_INCOMPLETE,RBA_BOUNDARY_CAPACITY} from './rba-connect4-front.mjs';
import {rbaTtPublishPrepared32,rbaTtPublishSurplus32,rbaTtPublishExactOwned32,rbaTtAttachDependencies32,rbaTtManagerAttachDependencies32,rbaTtReconcile32,rbaTtSignalParents32,rbaTtEnqueueDependencies32,rbaTtDetachDependencies32,rbaTtMarkDone32,rbaTtSetPositionCode32,RBA_TT_ROOT,RBA_TT_PHASE_PENDING_ATTACH,RBA_TT_PHASE_ATTACHED,RBA_TT_STOP} from './rba-tt32.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4Cpc32,CPC_EXACT,CPC_BOUND,CPC_RESTRICT} from './cpc-connect4.mjs';

export const RBA_EXACT_P1=1,RBA_EXACT_DRAW=2,RBA_EXACT_P0=3,RBA_BRANCH=4;
export const RBA_QUERY_UNCOVERED=8,RBA_INTERRUPTED=9;

function positionCodeEmpty64(g,outLo,outHi,index){
  if(!g.positionMode){outLo[index]=0;outHi[index]=0;return 0;}
  outLo[index]=g.positionEmptyLo;outHi[index]=g.positionEmptyHi;return 1;
}

function advancePositionCode64(g,lo,hi,column,height,player,outLo,outHi,index){
  const bit=g.positionBitBase[column]+height+player;
  if(bit<32){
    const delta=(1<<bit)>>>0,next=(lo+delta)>>>0;
    outLo[index]=next;outHi[index]=(hi+(next<lo?1:0))>>>0;
  }else{
    outLo[index]=lo>>>0;outHi[index]=(hi+((1<<(bit-32))>>>0))>>>0;
  }
}

function extractLane64(lo,hi,bit,width,mask){
  if(bit>=32)return (hi>>>(bit-32))&mask;
  if(bit+width<=32)return (lo>>>bit)&mask;
  return ((lo>>>bit)|(hi<<(32-bit)))&mask;
}

function reflectPositionCode64(g,lo,hi,outLo,outHi,index){
  if(!g.positionMode){outLo[index]=0;outHi[index]=0;return 0;}
  if(g.positionMode===49){
    const l0=lo&127,l1=(lo>>>7)&127,l2=(lo>>>14)&127,l3=(lo>>>21)&127,
      l4=((lo>>>28)|(hi<<4))&127,l5=(hi>>>3)&127,l6=(hi>>>10)&127;
    outLo[index]=(l6|(l5<<7)|(l4<<14)|(l3<<21)|(l2<<28))>>>0;
    outHi[index]=((l2>>>4)|(l1<<3)|(l0<<10))>>>0;
    return 1;
  }
  const stride=g.positionStride,mask=(1<<stride)-1;
  let reflectedLo=0,reflectedHi=0;
  for(let c=0;c<g.columns;c+=1){
    const source=g.mirrorColumn[c],lane=extractLane64(lo,hi,g.positionBitBase[source],stride,mask),
      bit=g.positionBitBase[c];
    if(bit>=32)reflectedHi|=(lane<<(bit-32))>>>0;
    else{
      reflectedLo|=(lane<<bit)>>>0;
      if(bit+stride>32)reflectedHi|=lane>>>(32-bit);
    }
  }
  outLo[index]=reflectedLo>>>0;outHi[index]=reflectedHi>>>0;return 1;
}

export function connect4PositionCode64FromMoves(moves,{geometry,reflected=0}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  const g=geometry,heights=new Uint32Array(g.columns),
    loOut=new Uint32Array(1),hiOut=new Uint32Array(1);
  if(!positionCodeEmpty64(g,loOut,hiOut,0))return {lo:0,hi:0};
  let lo=loOut[0],hi=hiOut[0],rank=0;
  for(const column of moves){
    if(!Number.isInteger(column)||column<0||column>=g.columns||heights[column]>=g.rows)
      throw new RangeError('invalid position-code move');
    advancePositionCode64(g,lo,hi,column,heights[column],rank&1,loOut,hiOut,0);
    lo=loOut[0];hi=hiOut[0];heights[column]+=1;rank+=1;
  }
  if(reflected){reflectPositionCode64(g,lo,hi,loOut,hiOut,0);lo=loOut[0];hi=hiOut[0];}
  return {lo,hi};
}

export function prepareConnect4RbaEvaluator({geometry,boundaryDepth=2,boundaryCapacity=256,boundaryBudget=100000}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  const g=geometry,profile=prepareConnect4RbaExecutionProfile(g);
  return {g,profile,scratch:prepareConnect4RbaCoordinateScratch(g),
    boundary:prepareConnect4RbaFrontArena(g,{depth:boundaryDepth,capacity:boundaryCapacity,budget:boundaryBudget,profile}),
    keys:new Uint32Array(g.columns*g.keyWords),childBasis:new Uint32Array(g.columns*g.maxBasis),
    childBasisSize:new Uint32Array(g.columns),actions:new Uint32Array(g.columns),
    actionLower:new Uint32Array(g.columns),actionUpper:new Uint32Array(g.columns),
    childPresent:new Uint32Array(g.columns),childPositionLo:new Uint32Array(g.columns),childPositionHi:new Uint32Array(g.columns),
    lower:1,upper:3,count:0,witness:-1,
    boundaryCalls:0,boundaryClosures:0,boundarySteps:0,boundaryFailures:0,
    transitions:0,actionClosures:0,actionsPruned:0};
}
export function assertConnect4RbaTtCompatibility(t,g){
  if(t.keyWords!==g.keyWords||t.basisCapacity<g.maxBasis||t.edgeCapacity<g.columns)
    throw new RangeError('RBA TT/profile mismatch');
  return 1;
}

export function connect4RbaFromMoves(moves,{geometry,canonical=true}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  const g=geometry,profile=prepareConnect4RbaExecutionProfile(g),words=new Uint32Array(g.keyWords*2),basis=new Uint32Array(g.maxBasis*2),scratch=prepareConnect4RbaCoordinateScratch(g);
  let src=0,dst=g.keyWords,bi=0,ci=g.maxBasis;
  let n=connect4RbaBasisFromSupport(g,words,src,basis,bi,scratch.seen);
  for(let p=0;p<2;p+=1){const off=src+(p?g.p1Offset:g.p0Offset);for(let i=0;i<n;i+=1)words[off+(i>>>5)]|=1<<(i&31);}
  for(const column of moves){
    if(!Number.isInteger(column)||column<0||column>=g.columns)throw new RangeError('invalid column');
    if(connect4RbaTerminal(g,words,src))throw new RangeError('move after terminal');
    if(words[src+column]>=g.rows)throw new RangeError('column full');
    connect4RbaCofactor(g,profile,words,src,basis,bi,n,column,words,dst,basis,ci,scratch.seen,scratch.size,0,scratch.map);
    const oldSrc=src;src=dst;dst=oldSrc;const oldBi=bi;bi=ci;ci=oldBi;n=scratch.size[0];
  }
  const result=words.slice(src,src+g.keyWords),rootBasis=basis.slice(bi,bi+n);
  const reflected=canonical?connect4RbaCanonicalize(g,profile,result,0,rootBasis,0,n,scratch):0;
  const position=connect4PositionCode64FromMoves(moves,{geometry:g,reflected});
  return {words:result,basis:rootBasis,reflected,positionLo:position.lo,positionHi:position.hi};
}
function bothCoordinatesEmpty(g,words,base){
  const p0=base+g.p0Offset,p1=base+g.p1Offset;
  for(let w=0;w<g.coordWords;w+=1)if(words[p0+w]|words[p1+w])return 0;
  return 1;
}
function rootCanonicalColumn(g,orderIndex,reflected){const caller=g.actionOrder[orderIndex];return reflected?g.mirrorColumn[caller]:caller;}

export function evaluateConnect4RbaTt32(t,q,state,rootQ=-1,rootReflected=0){
  if(Atomics.load(t.control,RBA_TT_STOP))return RBA_INTERRUPTED;
  const g=state.g,base=q*t.keyWords,basisBase=q*t.basisCapacity,terminal=connect4RbaTerminal(g,t.keys,base);
  state.count=0;state.witness=-1;
  if(terminal)return terminal;
  const n=t.basisSize[q];if(!g.lineCount||!n)return RBA_EXACT_DRAW;
  if(bothCoordinatesEmpty(g,t.keys,base))return RBA_EXACT_DRAW;

  state.boundaryCalls+=1;
  const outcome=buildConnect4RbaFourFront(g,state.boundary,t.keys,base,t.basis,basisBase,n);
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

  let count=0,childBase=0,childBi=0;
  for(let oi=0;oi<g.columns;oi+=1){
    const column=q===rootQ?rootCanonicalColumn(g,oi,rootReflected):g.actionOrder[oi];
    if(t.keys[base+column]>=g.rows)continue;
    const action=state.boundary.depth?queryConnect4RbaFourFront(g,state.boundary,state.boundary.actionBase+column*4,t.keys,base):13;
    let lo=action&3,hi=action>>>2;state.actions[count]=column;state.childPresent[count]=0;
    if(lo===hi)state.actionClosures+=1;
    else if(mover?lo>state.upper:hi<state.lower)state.actionsPruned+=1;
    else{
      const term=connect4RbaCofactor(g,state.profile,t.keys,base,t.basis,basisBase,n,column,state.keys,childBase,state.childBasis,childBi,state.scratch.seen,state.childBasisSize,count,state.scratch.map);
      state.transitions+=1;
      if(term<0||(term&&(term<lo||term>hi)))return RBA_QUERY_UNCOVERED;
      if(term){lo=term;hi=term;state.actionClosures+=1;}
      else{connect4RbaCanonicalize(g,state.profile,state.keys,childBase,state.childBasis,childBi,state.childBasisSize[count],state.scratch);state.childPresent[count]=1;}
    }
    state.actionLower[count]=lo;state.actionUpper[count]=hi;count+=1;
    childBase+=g.keyWords;childBi+=g.maxBasis;
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
  const value=t.exact[root],minimize=connect4RbaRank(g,t.keys,base)&1,edgeBase=root*t.edgeCapacity,count=t.count[root];
  // Root dependencies are published in initialization action priority order.
  // The first edge that can still attain the exact root value therefore owns
  // deterministic witness priority; if it is not exact yet, no later edge may
  // supersede it until more evidence arrives.
  for(let i=0;i<count;i+=1){const e=edgeBase+i,lo=t.edgeLower[e],hi=t.edgeUpper[e];
    if(minimize?lo>value:hi<value)continue;
    const label=t.edgeLabel[e],caller=reflected?g.mirrorColumn[label]:label;
    return minimize?(hi===value?caller:-2):(lo===value?caller:-2);
  }
  return -2;
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


export function prepareConnect4CpcRbaEvaluator({
  geometry,
  cpcFrontierResponse=false,
  cpcProjectedAdvisory=false,
}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  const g=geometry,profile=prepareConnect4RbaExecutionProfile(g);
  return {
    g,profile,
    scratch:prepareConnect4RbaCoordinateScratch(g),
    cpc:prepareConnect4CpcScratch(g,{frontierResponse:cpcFrontierResponse,projectedAdvisory:cpcProjectedAdvisory}),
    keys:new Uint32Array(g.columns*g.keyWords),
    childBasis:new Uint32Array(g.columns*g.maxBasis),
    childBasisSize:new Uint32Array(g.columns),
    actions:new Uint32Array(g.columns),
    actionLower:new Uint32Array(g.columns),
    actionUpper:new Uint32Array(g.columns),
    actionPriority:new Int32Array(g.columns),
    childPresent:new Uint32Array(g.columns),
    childPositionLo:new Uint32Array(g.columns),childPositionHi:new Uint32Array(g.columns),
    lower:1,upper:3,count:0,witness:-1,
    cpcCalls:0,cpcExact:0,cpcBounds:0,cpcRestrictions:0,cpcForced:0,
    cpcPrecursors:0,cpcProjectedForks:0,transitions:0,
  };
}

export function evaluateConnect4CpcRbaTt32(t,q,state,rootQ=-1,rootReflected=0){
  if(Atomics.load(t.control,RBA_TT_STOP))return RBA_INTERRUPTED;
  const g=state.g,base=q*t.keyWords,basisBase=q*t.basisCapacity,
    terminal=connect4RbaTerminal(g,t.keys,base);
  state.count=0;state.witness=-1;
  if(terminal)return terminal;

  const n=t.basisSize[q];
  if(!g.lineCount||!n||bothCoordinatesEmpty(g,t.keys,base))return RBA_EXACT_DRAW;
  const rank=connect4RbaRank(g,t.keys,base),mover=rank&1;

  state.cpcCalls+=1;
  const kind=evaluateConnect4Cpc32(g,t.keys,base,t.basis,basisBase,n,state.cpc);
  state.lower=state.cpc.interval[0];state.upper=state.cpc.interval[1];
  state.cpcPrecursors+=state.cpc.precursorCount[0];
  if(state.cpc.projectedAdvisory)
    state.cpcProjectedForks+=state.cpc.projectedForks[0]+state.cpc.projectedForks[1];
  if(kind===CPC_EXACT)state.cpcExact+=1;
  else if(kind===CPC_BOUND)state.cpcBounds+=1;
  else if(kind===CPC_RESTRICT)state.cpcRestrictions+=1;

  const forced=state.cpc.forcedColumn[0],
    preemptCount=state.cpc.preemptionCount[0],
    preemptMask=state.cpc.preemptionMask32[0],
    usePreempt=preemptCount>1&&g.columns<=32;
  if(forced>=0)state.cpcForced+=1;

  // Non-root exact CPC evidence needs no dependency topology. Root exact value
  // still needs child evidence unless it is already terminal, because caller-
  // frame deterministic witness selection is a separate obligation.
  if(kind===CPC_EXACT&&q!==rootQ)return state.lower;

  let count=0,childBase=0,childBi=0;
  const forcedCaller=forced<0?-1:
    q===rootQ&&rootReflected?g.mirrorColumn[forced]:forced,
    actionStart=forcedCaller>=0?g.priorityByColumn[forcedCaller]:0,
    actionEnd=forcedCaller>=0?actionStart+1:g.columns;

  for(let oi=actionStart;oi<actionEnd;oi+=1){
    const caller=g.actionOrder[oi],
      column=q===rootQ&&rootReflected?g.mirrorColumn[caller]:caller;
    if(t.keys[base+column]>=g.rows)continue;
    if(usePreempt&&!(preemptMask&((1<<column)>>>0)))continue;

    state.actions[count]=column;
    state.childPresent[count]=0;
    let lo=1,hi=3;

    const term=connect4RbaCofactor(
      g,state.profile,
      t.keys,base,t.basis,basisBase,n,column,
      state.keys,childBase,state.childBasis,childBi,
      state.scratch.seen,state.childBasisSize,count,state.scratch.map,
    );
    state.transitions+=1;
    if(term<0){childBase+=g.keyWords;childBi+=g.maxBasis;continue;}

    if(term){
      lo=hi=term;
    }else{
      const parentLo=t.positionLo[q],parentHi=t.positionHi[q],height=t.keys[base+column];
      const coded=(parentLo|parentHi)!==0;
      if(coded)advancePositionCode64(g,parentLo,parentHi,column,height,mover,state.childPositionLo,state.childPositionHi,count);
      else {state.childPositionLo[count]=0;state.childPositionHi[count]=0;}
      const childReflected=connect4RbaCanonicalize(
        g,state.profile,state.keys,childBase,
        state.childBasis,childBi,state.childBasisSize[count],state.scratch,
      );
      if(coded&&childReflected)reflectPositionCode64(
        g,state.childPositionLo[count],state.childPositionHi[count],
        state.childPositionLo,state.childPositionHi,count,
      );
      state.cpcCalls+=1;
      const childKind=evaluateConnect4Cpc32(
        g,state.keys,childBase,state.childBasis,childBi,state.childBasisSize[count],state.cpc,
      );
      lo=state.cpc.interval[0];hi=state.cpc.interval[1];
      state.cpcPrecursors+=state.cpc.precursorCount[0];
      if(state.cpc.projectedAdvisory)
        state.cpcProjectedForks+=state.cpc.projectedForks[0]+state.cpc.projectedForks[1];
      if(childKind===CPC_EXACT)state.cpcExact+=1;
      else{
        if(childKind===CPC_BOUND)state.cpcBounds+=1;
        else if(childKind===CPC_RESTRICT)state.cpcRestrictions+=1;
        state.childPresent[count]=1;
      }
    }

    state.actionLower[count]=lo;
    state.actionUpper[count]=hi;
    const primary=mover?4-lo:hi,secondary=mover?4-hi:lo,certainty=2-(hi-lo);
    state.actionPriority[count]=(primary<<24)|(secondary<<20)|(certainty<<18)|((rank+1)<<8)|(g.columns-oi);
    count+=1;
    childBase+=g.keyWords;
    childBi+=g.maxBasis;
  }

  if(!count)return RBA_QUERY_UNCOVERED;
  state.count=count;
  return RBA_BRANCH;
}


export function publishConnect4CpcRbaEvaluation32(t,q,owner,state,code,rootQ,rootWitnessOut,witnessIndex=0){
  if(code>=1&&code<=3){
    if(!rbaTtPublishExactOwned32(t,q,owner,code))return -1;
    if(q===rootQ&&(connect4RbaTerminal(state.g,t.keys,q*t.keyWords)||state.witness>=0)){
      rootWitnessOut[witnessIndex]=state.witness;rbaTtMarkDone32(t);
    }
    return -1;
  }
  if(code!==RBA_BRANCH)return -1;
  const next=rbaTtPublishSurplus32(
    t,q,owner,state.lower,state.upper,
    state.keys,0,state.childBasis,0,state.g.maxBasis,
    state.childBasisSize,state.actions,state.actionLower,state.actionUpper,
    state.childPresent,state.actionPriority,state.count,
  );
  const edgeBase=q*t.edgeCapacity;
  for(let i=0;i<state.count;i+=1){
    const child=t.child[edgeBase+i];
    if(child>=0&&state.childPresent[i]&&(state.childPositionLo[i]|state.childPositionHi[i]))
      rbaTtSetPositionCode32(t,child,state.childPositionLo[i],state.childPositionHi[i]);
  }
  return next;
}

export function reconcileConnect4CpcRbaEvent32(
  t,q,g,rootReflected,rootWitnessOut,resetTargets,witnessIndex=0,
){
  if(t.phase[q]===RBA_TT_PHASE_PENDING_ATTACH)
    if(!rbaTtManagerAttachDependencies32(t,q,resetTargets))return -1;
  if(t.phase[q]===RBA_TT_PHASE_ATTACHED){
    rbaTtReconcile32(t,q,connect4RbaRank(g,t.keys,q*t.keyWords)&1);
    if(Atomics.load(t.control,RBA_TT_STOP))return -1;
  }
  rbaTtSignalParents32(t,q);
  if(t.exact[q]){
    if(q===t.control[RBA_TT_ROOT]){
      const witness=selectConnect4RbaRootWitness32(t,g,q,rootReflected);
      if(witness>=-1){
        rootWitnessOut[witnessIndex]=witness;
        if(t.count[q])rbaTtDetachDependencies32(t,q);
        rbaTtMarkDone32(t);
        return 1;
      }
      return 0;
    }
    if(t.count[q])rbaTtDetachDependencies32(t,q);
  }
  return 0;
}
