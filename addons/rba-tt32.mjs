import { mixSpan32Locator32, publishSpan32 } from '../src/widekey32.mjs';
import { atomicTryClaim32, atomicReleaseNoNotify32 } from '../src/atomic32.mjs';
import {
  intrusiveEnqueueTailStamped32,
  intrusiveEnqueueOnceTailStamped32,
  intrusiveRemove32,
  intrusivePopHeadStamped32,
} from '../src/intrusive32.mjs';

export const RBA_TT_LOCK=0,RBA_TT_ERROR=1,RBA_TT_STOP=2,RBA_TT_FREE=3,RBA_TT_LIVE=4;
export const RBA_TT_READY_HEAD=5,RBA_TT_READY_TAIL=6,RBA_TT_READY_COUNT=7;
export const RBA_TT_EVENT_HEAD=8,RBA_TT_EVENT_TAIL=9,RBA_TT_EVENT_COUNT=10;
export const RBA_TT_DONE=11,RBA_TT_ROOT=12,RBA_TT_ROOT_GENERATION=13,RBA_TT_WAKE=14;
export const RBA_TT_EXACT_POSITION_MERGES=15;
export const RBA_TT_CONTROL_WORDS=16;
export const RBA_TT_EXECUTION_FREE=0,RBA_TT_EXECUTION_QUEUED=1;
export const RBA_TT_PHASE_NEW=0,RBA_TT_PHASE_PENDING_ATTACH=2,RBA_TT_PHASE_ATTACHED=3,RBA_TT_PHASE_DETACHED=4;
export const RBA_TT_ERR_CAPACITY=1,RBA_TT_ERR_CONFLICT=2,RBA_TT_ERR_GENERATION=3,RBA_TT_ERR_CONTRACT=4;
const RBA_TT_BUCKET_NONE=0xffffffff;

export function createRbaTt32({
  capacity=4096,bucketCount=4096,keyWords,basisCapacity,edgeCapacity,
}={}) {
  if(!Number.isSafeInteger(capacity)||capacity<1||capacity>0x1000000||
     !Number.isSafeInteger(bucketCount)||bucketCount<1||bucketCount>0x1000000||
     (bucketCount&(bucketCount-1))||
     !Number.isSafeInteger(keyWords)||keyWords<1||
     !Number.isSafeInteger(basisCapacity)||basisCapacity<0||
     !Number.isSafeInteger(edgeCapacity)||edgeCapacity<1) throw new RangeError('invalid RBA TT configuration');
  const u32=n=>new Uint32Array(new SharedArrayBuffer(n*4));
  const i32=n=>new Int32Array(new SharedArrayBuffer(n*4));
  const t={capacity,bucketMask:bucketCount-1,keyWords,basisCapacity,edgeCapacity,
    control:i32(RBA_TT_CONTROL_WORDS),fault:i32(4),buckets:i32(bucketCount),keys:u32(capacity*keyWords),locator:u32(capacity),
    basis:u32(capacity*basisCapacity),basisSize:u32(capacity),generation:u32(capacity),
    live:u32(capacity),refs:u32(capacity),execution:u32(capacity),exact:u32(capacity),
    lower:u32(capacity),upper:u32(capacity),phase:u32(capacity),priority:i32(capacity),redirect:i32(capacity),
    inspectGeneration:u32(capacity),
    link:i32(capacity),bucket:u32(capacity),
    readyNext:i32(capacity),readyPrev:i32(capacity),readyMember:u32(capacity),readyGeneration:u32(capacity),
    eventNext:i32(capacity),eventPrev:i32(capacity),eventMember:u32(capacity),eventGeneration:u32(capacity),
    count:u32(capacity),parentHead:i32(capacity),
    child:i32(capacity*edgeCapacity),childGeneration:u32(capacity*edgeCapacity),
    edgeNext:i32(capacity*edgeCapacity),edgePrev:i32(capacity*edgeCapacity),
    edgeLabel:u32(capacity*edgeCapacity),edgeAttached:u32(capacity*edgeCapacity),
    edgeLower:u32(capacity*edgeCapacity),edgeUpper:u32(capacity*edgeCapacity)};
  t.buckets.fill(-1);t.parentHead.fill(-1);t.child.fill(-1);t.redirect.fill(-1);t.readyNext.fill(-1);t.readyPrev.fill(-1);
  t.eventNext.fill(-1);t.eventPrev.fill(-1);t.edgeNext.fill(-1);t.edgePrev.fill(-1);
  t.control[RBA_TT_READY_HEAD]=t.control[RBA_TT_READY_TAIL]=-1;
  t.control[RBA_TT_EVENT_HEAD]=t.control[RBA_TT_EVENT_TAIL]=-1;t.control[RBA_TT_ROOT]=-1;
  for(let q=0;q<capacity;q+=1)t.link[q]=q+1;t.link[capacity-1]=-1;
  return t;
}
export function rbaTtEnter32(t,owner){if(Atomics.load(t.control,RBA_TT_STOP))return 0;return atomicTryClaim32(t.control,RBA_TT_LOCK,0,owner)?1:0;}
export function rbaTtLeave32(t){atomicReleaseNoNotify32(t.control,RBA_TT_LOCK,0);}
export function rbaTtFail32(t,code){Atomics.compareExchange(t.control,RBA_TT_ERROR,0,code);Atomics.store(t.control,RBA_TT_STOP,1);Atomics.add(t.control,RBA_TT_WAKE,1);Atomics.notify(t.control,RBA_TT_WAKE);return 0;}
export function rbaTtValid32(t,q,g){return q>=0&&q<t.capacity&&t.live[q]&&t.generation[q]===g?1:0;}
export function rbaTtSetRoot32(t,q){if(!t.live[q])return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);t.control[RBA_TT_ROOT]=q;t.control[RBA_TT_ROOT_GENERATION]=t.generation[q];return q;}
function unlinkBucketRow32(t,q){
  const tag=t.bucket[q],position=t.live[q]===2;
  if(!position&&tag===RBA_TT_BUCKET_NONE)return 1;
  const slot=(position?t.locator[q]:tag)&t.bucketMask;let prev=-1,scan=t.buckets[slot];
  while(scan!==q&&scan!==-1){prev=scan;scan=t.link[scan];}
  if(scan===-1)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
  if(prev===-1)t.buckets[slot]=t.link[q];else t.link[prev]=t.link[q];
  t.link[q]=-1;return 1;
}
function positionBucket32(t,q){return t.live[q]===2?1:0;}
export function rbaTtHasPositionCode32(t,q){return positionBucket32(t,q);}
export function rbaTtPositionHi32(t,q){return positionBucket32(t,q)?t.bucket[q]>>>0:0;}
export function rbaTtSetPositionCode32(t,q,lo,hi){
  if(!t.live[q]||!(lo|hi))return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
  if(!unlinkBucketRow32(t,q))return -1;
  t.locator[q]=lo>>>0;t.bucket[q]=hi>>>0;t.live[q]=2;
  const slot=(lo>>>0)&t.bucketMask;
  t.link[q]=t.buckets[slot];t.buckets[slot]=q;
  return q;
}

function equalKeyXor32(words,a,b,n){
  if(n===14)return (((words[a]^words[b])|
    (words[a+1]^words[b+1])|(words[a+2]^words[b+2])|(words[a+3]^words[b+3])|
    (words[a+4]^words[b+4])|(words[a+5]^words[b+5])|(words[a+6]^words[b+6])|
    (words[a+7]^words[b+7])|(words[a+8]^words[b+8])|(words[a+9]^words[b+9])|
    (words[a+10]^words[b+10])|(words[a+11]^words[b+11])|(words[a+12]^words[b+12])|
    (words[a+13]^words[b+13]))===0)?1:0;
  if(n===7)return (((words[a]^words[b])|(words[a+1]^words[b+1])|
    (words[a+2]^words[b+2])|(words[a+3]^words[b+3])|(words[a+4]^words[b+4])|
    (words[a+5]^words[b+5])|(words[a+6]^words[b+6]))===0)?1:0;
  let diff=0;
  for(let w=0;w<n;w+=1)diff|=words[a+w]^words[b+w];
  return diff===0?1:0;
}

export function rbaTtAllocate32(t,words,offset,basis,basisOffset,basisSize,priority=0){
  const keyWords=t.keyWords,basisCapacity=t.basisCapacity;
  if(basisSize<0||(basisCapacity&&basisSize>basisCapacity)||(basisSize|0)!==basisSize||(priority|0)!==priority){
    rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;
  }
  const hash=mixSpan32Locator32(words,offset,keyWords),bucket=hash&t.bucketMask,q=t.control[RBA_TT_FREE];
  if(q<0){rbaTtFail32(t,RBA_TT_ERR_CAPACITY);return -1;}
  if(t.generation[q]===0xffffffff){rbaTtFail32(t,RBA_TT_ERR_GENERATION);return -1;}
  t.control[RBA_TT_FREE]=t.link[q];
  publishSpan32(t.keys,q*keyWords,words,offset,keyWords);t.locator[q]=hash;
  if(basisSize&&basisCapacity)publishSpan32(t.basis,q*basisCapacity,basis,basisOffset,basisSize);
  t.basisSize[q]=basisSize;t.generation[q]+=1;t.live[q]=1;t.refs[q]=1;t.execution[q]=0;
  t.exact[q]=0;t.lower[q]=1;t.upper[q]=3;t.phase[q]=0;t.priority[q]=priority;t.redirect[q]=-1;
  t.count[q]=0;t.parentHead[q]=-1;t.readyMember[q]=0;t.eventMember[q]=0;
  t.bucket[q]=bucket;t.link[q]=t.buckets[bucket];t.buckets[bucket]=q;t.control[RBA_TT_LIVE]+=1;return q;
}
export function rbaTtAllocateUnindexed32(t,words,offset,basis,basisOffset,basisSize,priority=0,positionLo=0,positionHi=0){
  const keyWords=t.keyWords,basisCapacity=t.basisCapacity,q=t.control[RBA_TT_FREE],
    coded=(positionLo|positionHi)!==0;
  if(basisSize<0||(basisCapacity&&basisSize>basisCapacity)||(basisSize|0)!==basisSize||(priority|0)!==priority){
    rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;
  }
  if(q<0){rbaTtFail32(t,RBA_TT_ERR_CAPACITY);return -1;}
  if(t.generation[q]===0xffffffff){rbaTtFail32(t,RBA_TT_ERR_GENERATION);return -1;}
  t.control[RBA_TT_FREE]=t.link[q];
  publishSpan32(t.keys,q*keyWords,words,offset,keyWords);
  t.locator[q]=coded?positionLo>>>0:words[offset+primaryWord32(keyWords)];
  if(basisSize&&basisCapacity)publishSpan32(t.basis,q*basisCapacity,basis,basisOffset,basisSize);
  t.basisSize[q]=basisSize;t.generation[q]+=1;t.live[q]=coded?2:1;t.refs[q]=1;t.execution[q]=0;
  t.exact[q]=0;t.lower[q]=1;t.upper[q]=3;t.phase[q]=0;t.priority[q]=priority;t.redirect[q]=-1;
  t.count[q]=0;t.parentHead[q]=-1;t.readyMember[q]=0;t.eventMember[q]=0;
  if(coded){
    const slot=(positionLo>>>0)&t.bucketMask;
    t.bucket[q]=positionHi>>>0;
    t.link[q]=t.buckets[slot];t.buckets[slot]=q;
  }else{t.bucket[q]=RBA_TT_BUCKET_NONE;t.link[q]=-1;}
  t.control[RBA_TT_LIVE]+=1;
  return q;
}
export function rbaTtIntern32(t,words,offset,basis,basisOffset,basisSize,priority=0){
  const keyWords=t.keyWords,hash=mixSpan32Locator32(words,offset,keyWords),bucket=hash&t.bucketMask;
  for(let q=t.buckets[bucket];q!==-1;q=t.link[q]){
    if(!t.live[q]||t.redirect[q]>=0||t.locator[q]!==hash)continue;
    const base=q*keyWords;let diff=0;
    if(keyWords===14)diff=(t.keys[base]^words[offset])|
      (t.keys[base+1]^words[offset+1])|(t.keys[base+2]^words[offset+2])|
      (t.keys[base+3]^words[offset+3])|(t.keys[base+4]^words[offset+4])|
      (t.keys[base+5]^words[offset+5])|(t.keys[base+6]^words[offset+6])|
      (t.keys[base+7]^words[offset+7])|(t.keys[base+8]^words[offset+8])|
      (t.keys[base+9]^words[offset+9])|(t.keys[base+10]^words[offset+10])|
      (t.keys[base+11]^words[offset+11])|(t.keys[base+12]^words[offset+12])|
      (t.keys[base+13]^words[offset+13]);
    else for(let w=0;w<keyWords;w+=1)diff|=t.keys[base+w]^words[offset+w];
    if(diff===0){
      if(t.refs[q]===0xffffffff){rbaTtFail32(t,RBA_TT_ERR_CAPACITY);return -1;}
      t.refs[q]+=1;if(priority>t.priority[q])t.priority[q]=priority;return q;
    }
  }
  return rbaTtAllocate32(t,words,offset,basis,basisOffset,basisSize,priority);
}
export function rbaTtFindEquivalent32(t,q){
  if(!t.live[q]||t.redirect[q]>=0)return -1;
  const hash=t.locator[q],keyWords=t.keyWords,base=q*keyWords,bucket=t.bucket[q];
  let best=q;
  for(let scan=t.buckets[bucket];scan!==-1;scan=t.link[scan]){
    if(scan===q||!t.live[scan]||t.redirect[scan]>=0||t.locator[scan]!==hash)continue;
    const other=scan*keyWords;
    if(equalKeyXor32(t.keys,other,base,keyWords)&&(t.exact[scan]>t.exact[best]||
      (t.exact[scan]===t.exact[best]&&scan<best)))best=scan;
  }
  return best===q?-1:best;
}
export function rbaTtRetain32(t,q,g){if(!rbaTtValid32(t,q,g))return 0;if(t.refs[q]===0xffffffff)return rbaTtFail32(t,RBA_TT_ERR_CAPACITY);t.refs[q]+=1;return 1;}
export function rbaTtUnqueueReady32(t,q){if(!t.readyMember[q])return 0;intrusiveRemove32(t.control,RBA_TT_READY_HEAD,RBA_TT_READY_TAIL,RBA_TT_READY_COUNT,t.readyNext,t.readyPrev,t.readyMember,q);if(t.execution[q]===RBA_TT_EXECUTION_QUEUED)t.execution[q]=0;return 1;}
function unqueueEvent(t,q){if(!t.eventMember[q])return 0;intrusiveRemove32(t.control,RBA_TT_EVENT_HEAD,RBA_TT_EVENT_TAIL,RBA_TT_EVENT_COUNT,t.eventNext,t.eventPrev,t.eventMember,q);return 1;}
export function rbaTtRecycle32(t,q){
  if(!t.live[q]||t.refs[q]||t.execution[q]||t.readyMember[q]||t.eventMember[q]||t.count[q]||t.parentHead[q]!==-1)return 0;
  const redirect=t.redirect[q],bucket=t.bucket[q],position=positionBucket32(t,q);
  if(position||bucket!==RBA_TT_BUCKET_NONE){
    const slot=(position?t.locator[q]:bucket)&t.bucketMask;
    let prev=-1,scan=t.buckets[slot];
    while(scan!==q&&scan!==-1){prev=scan;scan=t.link[scan];}
    if(scan===-1)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
    if(prev===-1)t.buckets[slot]=t.link[q];else t.link[prev]=t.link[q];
  }
  t.live[q]=0;t.redirect[q]=-1;t.link[q]=t.control[RBA_TT_FREE];t.control[RBA_TT_FREE]=q;t.control[RBA_TT_LIVE]-=1;
  if(redirect>=0&&redirect<t.capacity&&t.live[redirect]&&t.refs[redirect])t.refs[redirect]-=1;
  return 1;
}
export function rbaTtRelease32(t,q,g){if(!rbaTtValid32(t,q,g)||!t.refs[q])return 0;const refs=t.refs[q]-1;t.refs[q]=refs;if(refs)return 1;if(t.readyMember[q])rbaTtUnqueueReady32(t,q);if(t.count[q])rbaTtSignal32(t,q);rbaTtRecycle32(t,q);return 1;}
export function rbaTtEnqueue32(t,q){
  if(!t.live[q]||!t.refs[q]||t.execution[q]!==0||t.exact[q]||t.phase[q]!==0||t.readyMember[q])return 0;
  t.execution[q]=1;intrusiveEnqueueTailStamped32(t.control,RBA_TT_READY_HEAD,RBA_TT_READY_TAIL,RBA_TT_READY_COUNT,t.readyNext,t.readyPrev,t.readyMember,t.readyGeneration,t.generation,q);return 1;
}
export function rbaTtTake32(t,owner){
  for(;;){const q=t.control[RBA_TT_READY_HEAD];if(q===-1)return -1;
    if(t.readyGeneration[q]!==t.generation[q]||t.execution[q]!==1){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
    intrusivePopHeadStamped32(t.control,RBA_TT_READY_HEAD,RBA_TT_READY_TAIL,RBA_TT_READY_COUNT,t.readyNext,t.readyPrev,t.readyMember);
    if(t.refs[q]&&!t.exact[q]){t.execution[q]=owner;return q;}
    t.execution[q]=0;if(!t.refs[q])rbaTtRecycle32(t,q);}
}
export function rbaTtReleaseExecution32(t,q,owner){if(t.execution[q]!==owner){t.fault[0]=1;t.fault[1]=q;t.fault[2]=owner;t.fault[3]=t.execution[q];return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);}t.execution[q]=0;if(!t.refs[q])rbaTtRecycle32(t,q);return 1;}
export function rbaTtSignal32(t,q){if(!t.live[q])return 0;return intrusiveEnqueueOnceTailStamped32(t.control,RBA_TT_EVENT_HEAD,RBA_TT_EVENT_TAIL,RBA_TT_EVENT_COUNT,t.eventNext,t.eventPrev,t.eventMember,t.eventGeneration,t.generation,q);}
export function rbaTtTakeEvent32(t){const q=t.control[RBA_TT_EVENT_HEAD];if(q===-1)return -1;if(t.eventGeneration[q]!==t.generation[q]||!t.live[q]){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}return intrusivePopHeadStamped32(t.control,RBA_TT_EVENT_HEAD,RBA_TT_EVENT_TAIL,RBA_TT_EVENT_COUNT,t.eventNext,t.eventPrev,t.eventMember);}
export function rbaTtTighten32(t,q,lo,hi){
  if(lo<1||hi>3||lo>hi||(lo|0)!==lo||(hi|0)!==hi)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
  const oldLo=t.lower[q],oldHi=t.upper[q];
  if(lo<oldLo)lo=oldLo;if(hi>oldHi)hi=oldHi;
  if(lo>hi)return rbaTtFail32(t,RBA_TT_ERR_CONFLICT);
  if(lo===oldLo&&hi===oldHi)return 1;t.lower[q]=lo;t.upper[q]=hi;if(lo===hi)t.exact[q]=lo;rbaTtSignal32(t,q);return 1;
}
export function rbaTtSetExact32(t,q,v){return rbaTtTighten32(t,q,v,v);}
function releaseEdge(t,e){const child=t.child[e];if(child<0)return 0;if(t.edgeAttached[e]){const p=t.edgePrev[e],n=t.edgeNext[e];if(p===-1)t.parentHead[child]=n;else t.edgeNext[p]=n;if(n!==-1)t.edgePrev[n]=p;t.edgeAttached[e]=0;}t.child[e]=-1;rbaTtRelease32(t,child,t.childGeneration[e]);return 1;}

export function rbaTtPublishPrepared32(t,q,owner,stateLo,stateHi,keys,keyOffset,basis,basisOffset,basisStride,basisSizes,labels,actionLo,actionHi,childPresent,count){
  if(t.execution[q]!==owner||count<1||count>t.edgeCapacity||(count|0)!==count){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
  if(!rbaTtTighten32(t,q,stateLo,stateHi))return -1;
  const edgeBase=q*t.edgeCapacity,keyStride=t.keyWords;
  let childKey=keyOffset,childBasis=basisOffset;
  for(let i=0;i<count;i+=1){let child=-1;const lo=actionLo[i],hi=actionHi[i];
    if(lo<1||hi>3||lo>hi){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
    if(childPresent[i]){child=rbaTtIntern32(t,keys,childKey,basis,childBasis,basisSizes[i]);if(child<0)return -1;if(!rbaTtTighten32(t,child,lo,hi))return -1;}
    const e=edgeBase+i;t.child[e]=child;t.childGeneration[e]=child<0?0:t.generation[child];t.edgeLabel[e]=labels[i];t.edgeLower[e]=lo;t.edgeUpper[e]=hi;t.edgeAttached[e]=0;t.edgeNext[e]=-1;t.edgePrev[e]=-1;t.count[q]=i+1;
    childKey+=keyStride;childBasis+=basisStride;
  }
  t.phase[q]=2;rbaTtSignal32(t,q);let next=-1;
  for(let i=0;i<count;i+=1){const child=t.child[edgeBase+i];if(child>=0&&t.execution[child]===0&&!t.exact[child]&&t.phase[child]===0){t.execution[child]=owner;next=child;break;}}
  rbaTtReleaseExecution32(t,q,owner);return next;
}
export function rbaTtPublishSurplus32(t,q,owner,stateLo,stateHi,keys,keyOffset,basis,basisOffset,basisStride,basisSizes,labels,actionLo,actionHi,childPresent,priorities,count,positionLo=null,positionHi=null){
  if(t.execution[q]!==owner||count<1||count>t.edgeCapacity||(count|0)!==count){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
  if(!rbaTtTighten32(t,q,stateLo,stateHi))return -1;
  const edgeBase=q*t.edgeCapacity,keyStride=t.keyWords,coded=positionLo!==null&&positionHi!==null;
  let childKey=keyOffset,childBasis=basisOffset;
  for(let i=0;i<count;i+=1){
    let child=-1;const lo=actionLo[i],hi=actionHi[i],priority=priorities?priorities[i]|0:0;
    if(lo<1||hi>3||lo>hi){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
    if(childPresent[i]){
      child=rbaTtAllocateUnindexed32(t,keys,childKey,basis,childBasis,basisSizes[i],priority,
        coded?positionLo[i]:0,coded?positionHi[i]:0);
      if(child<0)return -1;
      if(!rbaTtTighten32(t,child,lo,hi))return -1;
    }
    const e=edgeBase+i;t.child[e]=child;t.childGeneration[e]=child<0?0:t.generation[child];
    t.edgeLabel[e]=labels[i];t.edgeLower[e]=lo;t.edgeUpper[e]=hi;t.edgeAttached[e]=0;
    t.edgeNext[e]=-1;t.edgePrev[e]=-1;t.count[q]=i+1;
    childKey+=keyStride;childBasis+=basisStride;
  }
  t.phase[q]=RBA_TT_PHASE_PENDING_ATTACH;rbaTtSignal32(t,q);
  let next=-1;
  for(let i=0;i<count;i+=1){
    const child=t.child[edgeBase+i];
    if(child<0||t.exact[child]||t.phase[child]!==RBA_TT_PHASE_NEW)continue;
    if(next<0){t.execution[child]=owner;next=child;}
    else rbaTtEnqueue32(t,child);
  }
  rbaTtReleaseExecution32(t,q,owner);
  return next;
}

function managerRedirectAttachedParents(t,duplicate,canonical){
  let e=t.parentHead[duplicate],moved=0;
  while(e!==-1){
    const next=t.edgeNext[e],head=t.parentHead[canonical];
    if(t.refs[canonical]===0xffffffff)return rbaTtFail32(t,RBA_TT_ERR_CAPACITY);
    t.refs[canonical]+=1;
    if(t.refs[duplicate])t.refs[duplicate]-=1;
    t.child[e]=canonical;t.childGeneration[e]=t.generation[canonical];
    t.edgePrev[e]=-1;t.edgeNext[e]=head;if(head!==-1)t.edgePrev[head]=e;
    t.parentHead[canonical]=e;moved+=1;e=next;
  }
  t.parentHead[duplicate]=-1;
  return moved;
}

function managerMergeKnownDuplicate32(t,duplicate,canonical,resetTargets){
  if(duplicate<0||canonical<0||duplicate===canonical||!t.live[duplicate]||!t.live[canonical])return 0;
  if(t.redirect[duplicate]>=0)return t.redirect[duplicate]===canonical?1:0;
  if(t.lower[duplicate]>t.lower[canonical]||t.upper[duplicate]<t.upper[canonical])
    if(!rbaTtTighten32(t,canonical,t.lower[duplicate],t.upper[duplicate]))return 0;
  if(t.priority[duplicate]>t.priority[canonical])t.priority[canonical]=t.priority[duplicate];

  managerRedirectAttachedParents(t,duplicate,canonical);
  const wasQueued=t.readyMember[duplicate]?1:0;
  if(wasQueued)rbaTtUnqueueReady32(t,duplicate);
  if(t.eventMember[duplicate])unqueueEvent(t,duplicate);

  const owner=t.execution[duplicate];
  if(owner>RBA_TT_EXECUTION_QUEUED&&resetTargets&&owner-2<resetTargets.length)
    Atomics.store(resetTargets,owner-2,-1);

  if(t.refs[canonical]===0xffffffff)return rbaTtFail32(t,RBA_TT_ERR_CAPACITY);
  t.refs[canonical]+=1; // redirect owns a temporary canonical lifetime pin
  t.redirect[duplicate]=canonical;
  if((wasQueued||owner>RBA_TT_EXECUTION_QUEUED)&&
     t.execution[canonical]===RBA_TT_EXECUTION_FREE&&!t.exact[canonical]&&
     t.phase[canonical]===RBA_TT_PHASE_NEW&&!t.readyMember[canonical])rbaTtEnqueue32(t,canonical);

  if(!t.execution[duplicate]&&!t.refs[duplicate]&&t.count[duplicate])
    rbaTtDetachDependencies32(t,duplicate);
  if(!t.execution[duplicate]&&!t.refs[duplicate])rbaTtRecycle32(t,duplicate);
  return 1;
}

export function rbaTtManagerMergeDuplicate32(t,duplicate,canonical,resetTargets){
  if(duplicate<0||canonical<0||duplicate===canonical||!t.live[duplicate]||!t.live[canonical])return 0;
  if(t.redirect[duplicate]>=0)return t.redirect[duplicate]===canonical?1:0;
  if(t.locator[duplicate]!==t.locator[canonical])return 0;
  const keyWords=t.keyWords,a=duplicate*keyWords,b=canonical*keyWords;
  if(!equalKeyXor32(t.keys,a,b,keyWords))return 0;
  return managerMergeKnownDuplicate32(t,duplicate,canonical,resetTargets);
}

export function rbaTtManagerAttachDependencies32(t,q,resetTargets){
  if(t.phase[q]!==RBA_TT_PHASE_PENDING_ATTACH)return 0;
  const base=q*t.edgeCapacity,count=t.count[q];
  for(let i=0;i<count;i+=1){
    const e=base+i;let child=t.child[e];
    if(child<0)continue;
    while(t.redirect[child]>=0)child=t.redirect[child];
    let equivalent=-1;
    if((positionBucket32(t,child)||t.bucket[child]!==RBA_TT_BUCKET_NONE)&&
       t.inspectGeneration[child]!==t.generation[child]){
      t.inspectGeneration[child]=t.generation[child];
      equivalent=positionBucket32(t,child)?
        rbaTtFindEquivalentPosition32(t,child):rbaTtFindEquivalent32(t,child);
    }
    if(equivalent>=0){
      const original=t.child[e],generation=t.childGeneration[e];
      if(positionBucket32(t,child))managerMergeKnownDuplicate32(t,child,equivalent,resetTargets);
      else rbaTtManagerMergeDuplicate32(t,child,equivalent,resetTargets);
      child=equivalent;
      if(t.child[e]===original){
        if(t.refs[child]===0xffffffff)return rbaTtFail32(t,RBA_TT_ERR_CAPACITY);
        t.refs[child]+=1;
        if(rbaTtValid32(t,original,generation)&&t.refs[original])t.refs[original]-=1;
        t.child[e]=child;t.childGeneration[e]=t.generation[child];
        if(!t.refs[original]&&!t.execution[original]&&t.count[original])rbaTtDetachDependencies32(t,original);
        if(!t.refs[original]&&!t.execution[original])rbaTtRecycle32(t,original);
      }
    }else if(child!==t.child[e]){
      const original=t.child[e],generation=t.childGeneration[e];
      if(t.refs[child]===0xffffffff)return rbaTtFail32(t,RBA_TT_ERR_CAPACITY);
      t.refs[child]+=1;
      if(rbaTtValid32(t,original,generation)&&t.refs[original])t.refs[original]-=1;
      t.child[e]=child;t.childGeneration[e]=t.generation[child];
    }
    if(!rbaTtValid32(t,child,t.childGeneration[e])){t.fault[0]=2;t.fault[1]=q;t.fault[2]=child;t.fault[3]=t.childGeneration[e];return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);}
    const head=t.parentHead[child];t.edgeNext[e]=head;t.edgePrev[e]=-1;
    if(head!==-1)t.edgePrev[head]=e;t.parentHead[child]=e;t.edgeAttached[e]=1;
  }
  t.phase[q]=RBA_TT_PHASE_ATTACHED;return 1;
}

function rbaTtFindEquivalentPosition32(t,q){
  if(!t.live[q]||t.redirect[q]>=0||!positionBucket32(t,q))return -1;
  const lo=t.locator[q],hi=t.bucket[q]>>>0,slot=lo&t.bucketMask;
  let best=q;
  for(let scan=t.buckets[slot];scan!==-1;scan=t.link[scan]){
    if(scan===q||!t.live[scan]||t.redirect[scan]>=0||!positionBucket32(t,scan)||
       t.locator[scan]!==lo||(t.bucket[scan]>>>0)!==hi)continue;
    if(t.exact[scan]>t.exact[best]||
       (t.exact[scan]===t.exact[best]&&scan<best))best=scan;
  }
  return best===q?-1:best;
}

function managerNormalizePositionBucket32(t,seed,resetTargets){
  if(seed<0||seed>=t.capacity||!t.live[seed]||t.redirect[seed]>=0||!positionBucket32(t,seed))return 0;
  const lo=t.locator[seed],hi=t.bucket[seed]>>>0,slot=lo&t.bucketMask;
  let canonical=seed;
  for(let scan=t.buckets[slot];scan!==-1;scan=t.link[scan]){
    if(!t.live[scan]||t.redirect[scan]>=0||!positionBucket32(t,scan)||
       t.locator[scan]!==lo||(t.bucket[scan]>>>0)!==hi)continue;
    if(t.exact[scan]>t.exact[canonical]||
       (t.exact[scan]===t.exact[canonical]&&scan<canonical))canonical=scan;
  }
  let merged=0;
  for(let scan=t.buckets[slot];scan!==-1;){
    const next=t.link[scan];
    if(scan!==canonical&&t.live[scan]&&t.redirect[scan]<0&&positionBucket32(t,scan)&&
       t.locator[scan]===lo&&(t.bucket[scan]>>>0)===hi){
      t.inspectGeneration[scan]=t.generation[scan];
      merged+=managerMergeKnownDuplicate32(t,scan,canonical,resetTargets);
      t.control[RBA_TT_EXACT_POSITION_MERGES]+=1;
    }
    scan=next;
  }
  t.inspectGeneration[canonical]=t.generation[canonical];
  return merged;
}

function managerNormalizeEquivalentGroup32(t,seed,resetTargets){
  if(seed<0||seed>=t.capacity||!t.live[seed]||t.redirect[seed]>=0)return 0;
  const hash=t.locator[seed],keyWords=t.keyWords,base=seed*keyWords,bucket=t.bucket[seed];
  let canonical=-1;
  for(let scan=t.buckets[bucket];scan!==-1;scan=t.link[scan]){
    if(!t.live[scan]||t.redirect[scan]>=0||t.locator[scan]!==hash||
       !equalKeyXor32(t.keys,scan*keyWords,base,keyWords))continue;
    if(canonical<0||t.exact[scan]>t.exact[canonical]||
       (t.exact[scan]===t.exact[canonical]&&scan<canonical))canonical=scan;
  }
  if(canonical<0)return 0;
  let merged=0;
  for(let scan=t.buckets[bucket];scan!==-1;){
    const next=t.link[scan];
    if(t.live[scan]&&t.redirect[scan]<0&&t.locator[scan]===hash&&
       equalKeyXor32(t.keys,scan*keyWords,base,keyWords)){
      t.inspectGeneration[scan]=t.generation[scan];
      if(scan!==canonical)merged+=rbaTtManagerMergeDuplicate32(t,scan,canonical,resetTargets);
    }
    scan=next;
  }
  return merged;
}

function primaryWord32(keyWords){
  return keyWords===14?8:keyWords===7?5:0;
}

function primaryValue32(t,q,keyWords,primary){
  return !positionBucket32(t,q)&&t.bucket[q]===RBA_TT_BUCKET_NONE?t.locator[q]:t.keys[q*keyWords+primary];
}

function equalKeyPrimaryFirst32(words,a,b,n,primary){
  if(words[a+primary]!==words[b+primary])return 0;
  if(n===14&&primary===8)return (((words[a]^words[b])|
    (words[a+1]^words[b+1])|(words[a+2]^words[b+2])|(words[a+3]^words[b+3])|
    (words[a+4]^words[b+4])|(words[a+5]^words[b+5])|(words[a+6]^words[b+6])|
    (words[a+7]^words[b+7])|
    (words[a+9]^words[b+9])|(words[a+10]^words[b+10])|(words[a+11]^words[b+11])|
    (words[a+12]^words[b+12])|(words[a+13]^words[b+13]))===0)?1:0;
  if(n===7&&primary===5)return (((words[a]^words[b])|
    (words[a+1]^words[b+1])|(words[a+2]^words[b+2])|(words[a+3]^words[b+3])|
    (words[a+4]^words[b+4])|(words[a+6]^words[b+6]))===0)?1:0;
  return equalKeyXor32(words,a,b,n);
}

function managerBuildPrimaryRoutes32(t,scratch,groups,keyWords,primary,routeHeads,routeNext){
  routeHeads.fill(-1);
  for(let i=0;i<groups;i+=1){
    const q=scratch[i],slot=primaryValue32(t,q,keyWords,primary)&255;
    routeNext[i]=routeHeads[slot];routeHeads[slot]=i;
  }
}

function managerNormalizeLinearBatch32(t,resetTargets,scratch,count,routeHeads,routeNext){
  const keyWords=t.keyWords,primary=primaryWord32(keyWords);
  let groups=0,merged=0;

  // Fresh q are a tiny batch. Collapse duplicates inside the batch first so
  // each exact state gets one group before touching the large TT.
  for(let i=0;i<count;i+=1){
    const seed=scratch[i];
    if(!t.live[seed]||t.redirect[seed]>=0||t.inspectGeneration[seed]===t.generation[seed])continue;
    const seedBase=seed*keyWords,seedPrimary=primaryValue32(t,seed,keyWords,primary);
    let known=0;
    for(let j=0;j<groups;j+=1){
      const representative=scratch[j];
      if(!t.live[representative]||t.redirect[representative]>=0||
         seedPrimary!==primaryValue32(t,representative,keyWords,primary))continue;
      if(equalKeyPrimaryFirst32(t.keys,seedBase,representative*keyWords,keyWords,primary)){
        known=1;break;
      }
    }
    if(!known){scratch[groups]=seed;groups+=1;}
  }
  if(!groups)return 0;

  // The route table is ephemeral manager scratch, not TT identity. One low-byte
  // mask routes most streamed rows to no candidate at all, while locator[] is
  // reused as the contiguous discriminator cache for unindexed surplus rows.
  managerBuildPrimaryRoutes32(t,scratch,groups,keyWords,primary,routeHeads,routeNext);

  // Pass 1 selects the final canonical for every group.
  for(let scan=0;scan<t.capacity;scan+=1){
    if(!t.live[scan]||t.redirect[scan]>=0)continue;
    const scanPrimary=primaryValue32(t,scan,keyWords,primary);
    for(let i=routeHeads[scanPrimary&255];i!==-1;i=routeNext[i]){
      const canonical=scratch[i];
      if(!t.live[canonical]||t.redirect[canonical]>=0||
         scanPrimary!==primaryValue32(t,canonical,keyWords,primary))continue;
      const scanBase=scan*keyWords,canonicalBase=canonical*keyWords;
      if(!equalKeyPrimaryFirst32(t.keys,scanBase,canonicalBase,keyWords,primary))continue;
      if(t.exact[scan]>t.exact[canonical]||
         (t.exact[scan]===t.exact[canonical]&&scan<canonical))scratch[i]=scan;
      break;
    }
  }

  // Canonical ids may have changed but their primary values cannot. Rebuild the
  // tiny routes once, then bulk-redirect all exact members directly.
  managerBuildPrimaryRoutes32(t,scratch,groups,keyWords,primary,routeHeads,routeNext);
  for(let scan=0;scan<t.capacity;scan+=1){
    if(!t.live[scan]||t.redirect[scan]>=0)continue;
    const scanPrimary=primaryValue32(t,scan,keyWords,primary);
    for(let i=routeHeads[scanPrimary&255];i!==-1;i=routeNext[i]){
      const canonical=scratch[i];
      if(scan===canonical||!t.live[canonical]||t.redirect[canonical]>=0||
         scanPrimary!==primaryValue32(t,canonical,keyWords,primary))continue;
      const scanBase=scan*keyWords,canonicalBase=canonical*keyWords;
      if(!equalKeyPrimaryFirst32(t.keys,scanBase,canonicalBase,keyWords,primary))continue;
      t.inspectGeneration[scan]=t.generation[scan];
      merged+=managerMergeKnownDuplicate32(t,scan,canonical,resetTargets);
      break;
    }
  }
  for(let i=0;i<groups;i+=1){
    const canonical=scratch[i];
    if(t.live[canonical]&&t.redirect[canonical]<0)
      t.inspectGeneration[canonical]=t.generation[canonical];
  }
  return merged;
}

function managerFindEquivalentLinear32(t,q){
  if(!t.live[q]||t.redirect[q]>=0)return -1;
  const keyWords=t.keyWords,primary=primaryWord32(keyWords),base=q*keyWords;
  const primaryValue=primaryValue32(t,q,keyWords,primary);
  let best=q;
  for(let scan=0;scan<t.capacity;scan+=1){
    if(scan===q||!t.live[scan]||t.redirect[scan]>=0)continue;
    const other=scan*keyWords;
    if(primaryValue32(t,scan,keyWords,primary)!==primaryValue)continue;
    if(!equalKeyPrimaryFirst32(t.keys,other,base,keyWords,primary))continue;
    if(t.exact[scan]>t.exact[best]||
       (t.exact[scan]===t.exact[best]&&scan<best))best=scan;
  }
  return best===q?-1:best;
}

export function rbaTtManagerInspectReady32(t,resetTargets,budget=64,scratch=null,routeHeads=null,routeNext=null){
  const linearLimit=scratch&&routeHeads&&routeNext?Math.min(budget,scratch.length,routeNext.length):0;
  let q=t.control[RBA_TT_READY_TAIL],seen=0,linearCount=0,merged=0;
  let best=-1,bestPriority=-2147483648;

  while(q!==-1&&seen<budget){
    const previous=t.readyPrev[q];
    if(!t.live[q]||!t.refs[q]||t.exact[q]||t.phase[q]!==RBA_TT_PHASE_NEW||t.redirect[q]>=0){
      if(t.live[q]&&t.readyMember[q])rbaTtUnqueueReady32(t,q);
    }else{
      if(t.inspectGeneration[q]!==t.generation[q]){
        if(positionBucket32(t,q)){
          merged+=managerNormalizePositionBucket32(t,q,resetTargets);
        }else if(t.bucket[q]===RBA_TT_BUCKET_NONE){
          if(scratch&&linearCount<linearLimit){
            scratch[linearCount]=q;linearCount+=1;
          }else if(!scratch){
            t.inspectGeneration[q]=t.generation[q];
            const equivalent=managerFindEquivalentLinear32(t,q);
            if(equivalent>=0)merged+=managerMergeKnownDuplicate32(t,q,equivalent,resetTargets);
          }
        }else{
          const before=merged;
          merged+=managerNormalizeEquivalentGroup32(t,q,resetTargets);
          if(merged===before&&t.live[q]&&t.redirect[q]<0){
            const equivalent=managerFindEquivalentLinear32(t,q);
            if(equivalent>=0&&!positionBucket32(t,equivalent)&&t.bucket[equivalent]===RBA_TT_BUCKET_NONE)
              merged+=managerMergeKnownDuplicate32(t,q,equivalent,resetTargets);
          }
        }
      }
      if(t.live[q]&&t.redirect[q]<0&&t.readyMember[q]&&t.priority[q]>bestPriority){
        best=q;bestPriority=t.priority[q];
      }
    }
    q=previous;seen+=1;
  }

  if(linearCount)
    merged+=managerNormalizeLinearBatch32(t,resetTargets,scratch,linearCount,routeHeads,routeNext);

  if(best>=0&&(!t.live[best]||t.redirect[best]>=0||!t.readyMember[best]))best=-1;
  if(best>=0&&best!==t.control[RBA_TT_READY_HEAD]){
    const p=t.readyPrev[best],n=t.readyNext[best],head=t.control[RBA_TT_READY_HEAD];
    if(p!==-1)t.readyNext[p]=n;if(n!==-1)t.readyPrev[n]=p;else t.control[RBA_TT_READY_TAIL]=p;
    t.readyPrev[best]=-1;t.readyNext[best]=head;if(head!==-1)t.readyPrev[head]=best;
    else t.control[RBA_TT_READY_TAIL]=best;t.control[RBA_TT_READY_HEAD]=best;
  }
  return merged;
}

export function rbaTtManagerClean32(t,resetTargets,start=0,budget=64){
  let q=start,seen=0;
  while(seen<budget){
    if(q>=t.capacity)q=0;
    if(t.live[q]){
      if(t.redirect[q]<0&&t.phase[q]===RBA_TT_PHASE_NEW&&
         t.inspectGeneration[q]!==t.generation[q]){
        if(positionBucket32(t,q)){
          t.inspectGeneration[q]=t.generation[q];
          const equivalent=rbaTtFindEquivalentPosition32(t,q);
          if(equivalent>=0){
            managerMergeKnownDuplicate32(t,q,equivalent,resetTargets);
            t.control[RBA_TT_EXACT_POSITION_MERGES]+=1;
          }
        }else if(t.bucket[q]===RBA_TT_BUCKET_NONE){
          // Queued surplus is normalized only by the bounded bulk scan.
          // The fallback exists solely for a worker-retained q that otherwise
          // has no ready-queue seed to expose its equivalence group.
          if(t.execution[q]>RBA_TT_EXECUTION_QUEUED){
            t.inspectGeneration[q]=t.generation[q];
            const equivalent=managerFindEquivalentLinear32(t,q);
            if(equivalent>=0)managerMergeKnownDuplicate32(t,q,equivalent,resetTargets);
          }
        }else{
          t.inspectGeneration[q]=t.generation[q];
          const equivalent=rbaTtFindEquivalent32(t,q);
          if(equivalent>=0)rbaTtManagerMergeDuplicate32(t,q,equivalent,resetTargets);
        }
      }
      if(t.live[q]&&t.exact[q]&&q!==t.control[RBA_TT_ROOT]&&t.readyMember[q])rbaTtUnqueueReady32(t,q);
      if(t.live[q]&&t.redirect[q]>=0&&!t.execution[q]&&!t.refs[q]&&t.count[q])rbaTtDetachDependencies32(t,q);
      if(t.live[q]&&!t.execution[q]&&!t.refs[q]&&!t.count[q]&&t.parentHead[q]===-1){
        if(t.readyMember[q])rbaTtUnqueueReady32(t,q);
        if(t.eventMember[q])unqueueEvent(t,q);
        rbaTtRecycle32(t,q);
      }
    }
    q+=1;seen+=1;
  }
  return q>=t.capacity?0:q;
}
export function rbaTtPublishExactOwned32(t,q,owner,v){if(t.execution[q]!==owner)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);if(!rbaTtSetExact32(t,q,v))return 0;return rbaTtReleaseExecution32(t,q,owner);}
export function rbaTtAttachDependencies32(t,q){
  if(t.phase[q]!==2)return 0;const base=q*t.edgeCapacity,count=t.count[q];
  for(let i=0;i<count;i+=1){const e=base+i,child=t.child[e];if(child<0)continue;if(!rbaTtValid32(t,child,t.childGeneration[e]))return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
    const head=t.parentHead[child];t.edgeNext[e]=head;t.edgePrev[e]=-1;if(head!==-1)t.edgePrev[head]=e;t.parentHead[child]=e;t.edgeAttached[e]=1;}
  t.phase[q]=3;return 1;
}
export function rbaTtReconcile32(t,q,minimize){
  if(t.phase[q]!==3||(minimize!==0&&minimize!==1)){t.fault[0]=3;t.fault[1]=q;t.fault[2]=t.phase[q];t.fault[3]=minimize;return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);}
  const base=q*t.edgeCapacity,count=t.count[q],qLo=t.lower[q],qHi=t.upper[q];let lo=minimize?4:0,hi=lo;
  for(let i=0;i<count;i+=1){const e=base+i,child=t.child[e];let a=t.edgeLower[e],b=t.edgeUpper[e];
    if(child>=0){if(t.lower[child]>a)a=t.lower[child];if(t.upper[child]<b)b=t.upper[child];}
    if(minimize){if(qLo>a)a=qLo;}else if(qHi<b)b=qHi;
    if(a>b)return rbaTtFail32(t,RBA_TT_ERR_CONFLICT);t.edgeLower[e]=a;t.edgeUpper[e]=b;
    if(minimize){if(a<lo)lo=a;if(b<hi)hi=b;}else{if(a>lo)lo=a;if(b>hi)hi=b;}
    if(child>=0&&!rbaTtTighten32(t,child,a,b))return 0;
  }
  if(!rbaTtTighten32(t,q,lo,hi))return 0;
  const tightenedLo=t.lower[q],tightenedHi=t.upper[q];
  for(let i=0;i<count;i+=1){const e=base+i,child=t.child[e];if(child<0)continue;const a=t.edgeLower[e],b=t.edgeUpper[e];if(a===b||(minimize?a>tightenedHi:b<tightenedLo))releaseEdge(t,e);}
  return t.exact[q];
}
export function rbaTtEnqueueDependencies32(t,q){const base=q*t.edgeCapacity,count=t.count[q];let n=0;for(let i=0;i<count;i+=1){const child=t.child[base+i];if(child>=0)n+=rbaTtEnqueue32(t,child);}return n;}
export function rbaTtSignalParents32(t,q){let n=0;for(let e=t.parentHead[q];e!==-1;e=t.edgeNext[e])n+=rbaTtSignal32(t,(e/t.edgeCapacity)|0);return n;}
export function rbaTtDetachDependencies32(t,q){const base=q*t.edgeCapacity,n=t.count[q];t.count[q]=0;for(let i=0;i<n;i+=1)releaseEdge(t,base+i);t.phase[q]=4;if(!t.refs[q])rbaTtRecycle32(t,q);return n;}
export function rbaTtMarkDone32(t){Atomics.store(t.control,RBA_TT_DONE,1);Atomics.add(t.control,RBA_TT_WAKE,1);Atomics.notify(t.control,RBA_TT_WAKE);return 1;}
