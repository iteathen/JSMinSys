// Optional experiment storage; one writer per worker region. No TT authority.
export function createPendingObservation(workers,columns,rows){
  if(!Number.isInteger(workers)||workers<1||workers>16||!Number.isInteger(columns)||columns<1||columns>32||
    !Number.isInteger(rows)||rows<1||columns*rows>1024)throw RangeError('observation profile');
  const levels=columns*rows+1,rowWords=columns+1,stride=Math.ceil((12+levels*rowWords)/32)*32;
  return {words:new Uint32Array(new SharedArrayBuffer(workers*stride*4)),workers,columns,levels,rowWords,stride};
}
export function bindPendingObservation(state,memory,index){
  if(memory.columns!==state.g.columns||memory.levels!==state.g.cellCount+1||
    !Number.isInteger(index)||index<0||index>=memory.workers)throw RangeError('observation binding');
  if(Atomics.load(memory.words,index*memory.stride)!==0)throw RangeError('observation slot must be fresh');
  state.observeWords=memory.words;state.observeBase=index*memory.stride;
  state.observeSequence=0;state.observePublications=0;state.observeWordsCopied=0;
}

// HOT only on an accepted request, at a branch-before-child boundary.
// DO NOT REMOVE: raw numeric copying only, NO width/delta/policy calculation.
// No allocation, strings, messages, clocks, wait, TT writes or state replay.
// Existing raw counts/statuses are copied on request, never every node.
// Two sequence stores bracket fixed header and variable live-frame stores.
export function publishPendingObservation(state,top){
  if(state.observeSequence>=0xfffffffe){state.observePending=0;return;}
  const words=state.observeWords,base=state.observeBase,columns=state.g.columns,rowWords=columns+1;
  const sequence=state.observeSequence+2;
  Atomics.store(words,base,sequence-1);
  Atomics.store(words,base+1,state.observeEpoch);
  Atomics.store(words,base+2,state.observeRequest);
  Atomics.store(words,base+3,top);
  Atomics.store(words,base+4,state.searchShallow);
  Atomics.store(words,base+5,state.horizonStops);
  Atomics.store(words,base+6,state.nodes);
  Atomics.store(words,base+7,state.modePasses);
  Atomics.store(words,base+8,state.modeRegions);
  Atomics.store(words,base+9,state.modeRootPasses);
  let copied=10;
  for(let depth=0;depth<=top;depth++){
    const count=state.observeCounts[depth],out=base+12+depth*rowWords;
    Atomics.store(words,out,count);copied++;
    if(depth===0){
      for(let i=0;i<count;i++){Atomics.store(words,out+1+i,state.modeRootValues[i]);copied++;}
    }else{
      const offset=depth*columns;
      for(let i=0;i<count;i++){Atomics.store(words,out+1+i,state.modeResolved[offset+i]);copied++;}
    }
  }
  Atomics.store(words,base,sequence);
  state.observeSequence=sequence;state.observePending=0;
  state.observePublications++;state.observeWordsCopied+=copied+1;
}

// Strategist only. A failed read may alter scratch; consume it only on return 1.
export function readPendingObservation(memory,index,scratch){
  const base=index*memory.stride,words=memory.words,before=Atomics.load(words,base);
  if(!before||(before&1))return 0;
  for(let i=1;i<10;i++)scratch[i]=Atomics.load(words,base+i);
  const top=scratch[3];if(top>=memory.levels)return 0;
  for(let depth=0;depth<=top;depth++){
    const offset=12+depth*memory.rowWords,count=Atomics.load(words,base+offset);
    if(count>memory.columns)return 0;
    scratch[offset]=count;
    for(let i=0;i<count;i++)scratch[offset+1+i]=Atomics.load(words,base+offset+1+i);
  }
  if(Atomics.load(words,base)!==before)return 0;
  scratch[0]=before;return 1;
}

// Strategist calculation. Nested active frames refine one pending alternative
// of their parent: width = sum(unresolved per frame) - (active frames - 1).
// These are query obligations, not globally deduplicated game positions.
export function measurePendingObservation(memory,snapshot){
  let pending=0,frames=0;
  for(let depth=0;depth<=snapshot[3];depth++){
    const offset=12+depth*memory.rowWords,count=snapshot[offset];
    if(!count)continue;
    let unresolved=0;
    for(let i=0;i<count;i++){
      const value=snapshot[offset+1+i];
      if(depth===0?value===0xfffffffe:value===0)unresolved++;
    }
    if(!unresolved)throw Error('snapshot contains a closed active frame');
    pending+=unresolved;frames++;
  }
  if(!frames)throw Error('snapshot has no active branch');
  return {revision:snapshot[0],scope:snapshot[1],request:snapshot[2],depth:snapshot[3],mode:snapshot[4],
    horizonStops:snapshot[5],nodes:snapshot[6],width:pending-frames+1,frames,
    modePasses:snapshot[7],modeRegions:snapshot[8],modeRootPasses:snapshot[9],
    completedBands:snapshot[7]-snapshot[8]+snapshot[9]-1};
}
