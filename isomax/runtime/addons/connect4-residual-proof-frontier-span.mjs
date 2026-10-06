// Current-run private threshold proofs ordered by full residual ideals.
// Complete support/closure/reflection plans fix literal coordinate frames.
// No solved geometry data, persistent cache, action witness or hot telemetry.
export function prepareConnect4ResidualProofFrontierSpan32(g){
  const plan=g.supportBasisPlans,Z=g.coordWords,recordWords=2+2*Z,
    limit=Math.floor(2097152/(recordWords*8));
  function inactiveResidualProof32(){return 0;}
  if(!plan?.closures||!plan.mirrorMap||!plan.mirrorProfiles||limit<1)
    return {initialize:inactiveResidualProof32,child:inactiveResidualProof32,
      probe:inactiveResidualProof32,store:inactiveResidualProof32,
      frames:null,entries:null,capacity:0,recordWords,payloadBytes:0,frameBytes:0};
  let capacity=1;while(capacity*2<=limit)capacity*=2;
  const mask=capacity-1,pairWords=recordWords*2,
    entries=new Uint32Array(capacity*pairWords),frames=new Uint32Array((g.cellCount+1)*2),
    sizes=plan.sizes,strides=plan.strides,mirrors=plan.mirrorProfiles,
    columns=g.columns,p0=g.p0Offset,p1=g.p1Offset;
  entries.fill(0);frames.fill(0);

  function setResidualProofFrame32(handle,depth){
    const at=depth*2,bucket=Math.imul(handle^(handle>>>16),0x9e3779b1)&mask;
    frames[at]=handle;frames[at+1]=bucket*pairWords;
  }
  function initializeResidualProof32(words,src){
    let handle=0;for(let c=0;c<columns;c++)handle+=words[src+c]*strides[c];
    setResidualProofFrame32(handle,0);
  }
  function childResidualProof32(handle,reflected,depth){
    setResidualProofFrame32(reflected?mirrors[handle]:handle,depth);
  }
  function queryAboveResidualProof32(words,src,record,n){
    const active=(n+31)>>>5,tail=0xffffffff>>>((-n)&31);
    for(let w=0;w<active;w++){
      const valid=w+1===active?tail:0xffffffff;
      if(entries[record+2+w]&~(words[src+p0+w]&valid))return 0;
      if((words[src+p1+w]&valid)&~entries[record+2+Z+w])return 0;
    }
    return 1;
  }
  function residualProofAboveQuery32(words,src,record,n){
    const active=(n+31)>>>5,tail=0xffffffff>>>((-n)&31);
    for(let w=0;w<active;w++){
      const valid=w+1===active?tail:0xffffffff;
      if((words[src+p0+w]&valid)&~entries[record+2+w])return 0;
      if(entries[record+2+Z+w]&~(words[src+p1+w]&valid))return 0;
    }
    return 1;
  }
  function probeResidualProof32(words,src,depth,mover){
    if(!depth)return 0;
    const at=depth*2,handle=frames[at],key=handle+1,base=frames[at+1],n=sizes[handle],
      upper=base+recordWords;
    let lower0=0,upper0=0;
    if(entries[base]===key&&queryAboveResidualProof32(words,src,base,n)){
      if(entries[base+1]===3)return 3;lower0=1;
    }
    if(entries[upper]===key&&residualProofAboveQuery32(words,src,upper,n)){
      if(entries[upper+1]===1)return 1;upper0=1;
    }
    return lower0?(upper0?2:mover?5:4):upper0?(mover?4:5):0;
  }
  function saveResidualProof32(words,src,record,key,value,n){
    const active=(n+31)>>>5,tail=0xffffffff>>>((-n)&31);
    for(let w=0;w<Z;w++){
      const valid=w<active?(w+1===active?tail:0xffffffff):0;
      entries[record+2+w]=words[src+p0+w]&valid;
      entries[record+2+Z+w]=words[src+p1+w]&valid;
    }
    entries[record+1]=value;entries[record]=key;
  }
  function storeLowerResidualProof32(words,src,record,key,value,n){
    if(entries[record]===key){
      const old=entries[record+1];
      if(old>value||(old===value&&queryAboveResidualProof32(words,src,record,n)))return;
    }
    saveResidualProof32(words,src,record,key,value,n);
  }
  function storeUpperResidualProof32(words,src,record,key,value,n){
    if(entries[record]===key){
      const old=entries[record+1];
      if(old<value||(old===value&&residualProofAboveQuery32(words,src,record,n)))return;
    }
    saveResidualProof32(words,src,record,key,value,n);
  }
  function storeResidualProof32(words,src,depth,tag,mover){
    if(!depth)return;
    const at=depth*2,handle=frames[at],key=handle+1,base=frames[at+1],n=sizes[handle];
    if(tag===3)storeLowerResidualProof32(words,src,base,key,3,n);
    else if(tag===1)storeUpperResidualProof32(words,src,base+recordWords,key,1,n);
    else if(tag===2){
      storeLowerResidualProof32(words,src,base,key,2,n);
      storeUpperResidualProof32(words,src,base+recordWords,key,2,n);
    }else if(tag===4||tag===5){
      if((tag===4)!==(mover===1))storeLowerResidualProof32(words,src,base,key,2,n);
      else storeUpperResidualProof32(words,src,base+recordWords,key,2,n);
    }
  }
  return {initialize:initializeResidualProof32,child:childResidualProof32,
    probe:probeResidualProof32,store:storeResidualProof32,frames,entries,
    capacity,recordWords,payloadBytes:entries.byteLength,frameBytes:frames.byteLength};
}
