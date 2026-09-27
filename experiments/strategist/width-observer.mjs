import {mixSpan32Locator32,probeSpan32IdSlot32,publishSpanIdSlot32,publishSpan32} from '../../src/widekey32.mjs';
import {prepareConnect4RbaCoordinateScratch} from '../../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../../addons/rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownHeight,connect4RbaCanonicalize} from '../../addons/rba-connect4-coordinate.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32,CPC_EXACT} from '../../addons/cpc-connect4.mjs';

// Strategist-only read of the existing public cache layout. The regular probe
// increments shared hit statistics, so it cannot serve as a read-only observer.
// Full identity and a stable publication bracket are required; hash locates only.
export function readExactWidth(cache,words,offset){
  const slot=mixSpan32Locator32(words,offset,cache.keyWords)&cache.mask;
  const before=Atomics.load(cache.sequence,slot);
  if(!before||(before&1))return 0;
  const base=slot*cache.keyWords;
  for(let w=0;w<cache.keyWords;w++)if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;
  const value=Atomics.load(cache.value,slot),after=Atomics.load(cache.sequence,slot);
  return before===after&&value>=1&&value<=3?value:0;
}

export function prepareWidthObserver(g,root,cache,{capacity=512,batch=64}={}){
  if(!Number.isInteger(capacity)||capacity<2||capacity>8192||(capacity&(capacity-1))||
    !Number.isInteger(batch)||batch<1||batch>capacity||g.columns>32||cache.keyWords!==g.keyWords)
    throw RangeError('width observer profile');
  const arena=()=>({words:new Uint32Array(capacity*g.keyWords),basis:new Uint32Array(capacity*g.maxBasis),sizes:new Uint32Array(capacity)});
  const current=arena(),next=arena();
  publishSpan32(current.words,0,root.words,0,g.keyWords);
  publishSpan32(current.basis,0,root.basis,0,root.basis.length);current.sizes[0]=root.basis.length;
  return {g,cache,capacity,batch,current,next,profile:prepareConnect4RbaExecutionProfile(g),
    coord:prepareConnect4RbaCoordinateScratch(g),cpc:prepareConnect4CpcScratch(g),
    child:new Uint32Array(g.keyWords),childBasis:new Uint32Array(g.maxBasis),size:new Uint32Array(1),
    slots:new Uint32Array(capacity*2).fill(0xffffffff),
    width:root.words[g.metaOffset]&3?0:1,depth:0,scope:1,revision:1,complete:true,
    phase:0,cursor:0,kept:0,nextCount:0,blockedAt:-1,capacityRejections:0,
    expanded:0,generated:0,duplicates:0,exactRemoved:0};
}

// PRIVATE STRATEGIST execution. No evaluator import or shared write. Bounded
// chunks retain only RBA coordinates/bases; no physical board or ingress replay.
// Width counts distinct canonical unresolved q at a completed projected layer.
// It is not worker-private pending width or an atomic snapshot of the whole TT.
export function stepWidthObserver(s){
  s.complete=false;
  if(!s.width)return 0;
  const g=s.g,a=s.current,b=s.next,end=Math.min(s.width,s.cursor+s.batch);
  if(s.phase===0){
    for(;s.cursor<end;s.cursor++){
      const i=s.cursor,key=i*g.keyWords,basis=i*g.maxBasis;
      if(readExactWidth(s.cache,a.words,key)||
        evaluateConnect4CpcNonterminal32(g,a.words,key,a.basis,basis,a.sizes[i],s.cpc)===CPC_EXACT){s.exactRemoved++;continue;}
      if(s.kept!==i){
        publishSpan32(a.words,s.kept*g.keyWords,a.words,key,g.keyWords);
        publishSpan32(a.basis,s.kept*g.maxBasis,a.basis,basis,a.sizes[i]);a.sizes[s.kept]=a.sizes[i];
      }
      s.kept++;
    }
    if(s.cursor<s.width)return 0;
    const count=s.kept;s.width=count;s.cursor=0;s.kept=0;s.revision++;s.complete=true;
    if(count&&count!==s.blockedAt){s.phase=1;s.nextCount=0;s.slots.fill(0xffffffff);}
    return 1;
  }
  for(;s.cursor<end;s.cursor++){
    const i=s.cursor,key=i*g.keyWords,basis=i*g.maxBasis,n=a.sizes[i];
    if(readExactWidth(s.cache,a.words,key)||
      evaluateConnect4CpcNonterminal32(g,a.words,key,a.basis,basis,n,s.cpc)===CPC_EXACT){s.exactRemoved++;continue;}
    const forced=s.cpc.forcedColumn[0],mask=s.cpc.preemptionCount[0]>1?s.cpc.preemptionMask32[0]:-1;
    s.expanded++;
    for(let col=0;col<g.columns;col++){
      const height=a.words[key+col];
      if(height>=g.rows||(forced>=0&&col!==forced)||!(mask&(1<<col)))continue;
      s.generated++;
      const terminal=connect4RbaCofactorKnownHeight(g,s.profile,a.words,key,a.basis,basis,n,col,height,
        s.child,0,s.childBasis,0,s.coord.seen,s.size,0,s.coord.map,s.coord.inverse);
      if(terminal)continue;
      const cn=s.size[0];connect4RbaCanonicalize(g,s.profile,s.child,0,s.childBasis,0,cn,s.coord);
      if(readExactWidth(s.cache,s.child,0)||
        evaluateConnect4CpcNonterminal32(g,s.child,0,s.childBasis,0,cn,s.cpc)===CPC_EXACT){s.exactRemoved++;continue;}
      const hash=mixSpan32Locator32(s.child,0,g.keyWords),slotMask=s.slots.length-1;
      const slot=probeSpan32IdSlot32(s.slots,b.words,slotMask,hash&slotMask,s.child,0,g.keyWords,0xffffffff);
      if(slot>=0){s.duplicates++;continue;}
      if(s.nextCount===s.capacity){
        // Abandon only the partial NEXT layer. Last complete width survives.
        s.capacityRejections++;s.blockedAt=s.width;s.phase=0;s.cursor=0;s.kept=0;s.nextCount=0;
        return -1;
      }
      const id=s.nextCount++;
      publishSpanIdSlot32(b.words,s.slots,~slot,id,s.child,0,g.keyWords);
      publishSpan32(b.basis,id*g.maxBasis,s.childBasis,0,cn);b.sizes[id]=cn;
    }
  }
  if(s.cursor<s.width)return 0;
  s.current=b;s.next=a;s.width=s.nextCount;s.depth++;s.revision++;s.complete=true;
  s.phase=0;s.cursor=0;s.kept=0;s.nextCount=0;s.blockedAt=-1;
  return 1;
}
