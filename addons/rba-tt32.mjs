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
export const RBA_TT_CONTROL_WORDS=16;
export const RBA_TT_EXECUTION_FREE=0,RBA_TT_EXECUTION_QUEUED=1;
export const RBA_TT_PHASE_NEW=0,RBA_TT_PHASE_PENDING_ATTACH=2,RBA_TT_PHASE_ATTACHED=3,RBA_TT_PHASE_DETACHED=4;
export const RBA_TT_ERR_CAPACITY=1,RBA_TT_ERR_CONFLICT=2,RBA_TT_ERR_GENERATION=3,RBA_TT_ERR_CONTRACT=4;

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
    control:i32(RBA_TT_CONTROL_WORDS),buckets:i32(bucketCount),keys:u32(capacity*keyWords),
    basis:u32(capacity*basisCapacity),basisSize:u32(capacity),generation:u32(capacity),
    live:u32(capacity),refs:u32(capacity),execution:u32(capacity),exact:u32(capacity),
    lower:u32(capacity),upper:u32(capacity),phase:u32(capacity),link:i32(capacity),bucket:u32(capacity),
    readyNext:i32(capacity),readyPrev:i32(capacity),readyMember:u32(capacity),readyGeneration:u32(capacity),
    eventNext:i32(capacity),eventPrev:i32(capacity),eventMember:u32(capacity),eventGeneration:u32(capacity),
    count:u32(capacity),parentHead:i32(capacity),
    child:i32(capacity*edgeCapacity),childGeneration:u32(capacity*edgeCapacity),
    edgeNext:i32(capacity*edgeCapacity),edgePrev:i32(capacity*edgeCapacity),
    edgeLabel:u32(capacity*edgeCapacity),edgeAttached:u32(capacity*edgeCapacity),
    edgeLower:u32(capacity*edgeCapacity),edgeUpper:u32(capacity*edgeCapacity)};
  t.buckets.fill(-1);t.parentHead.fill(-1);t.child.fill(-1);t.readyNext.fill(-1);t.readyPrev.fill(-1);
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

export function rbaTtIntern32(t,words,offset,basis,basisOffset,basisSize){
  const keyWords=t.keyWords,basisCapacity=t.basisCapacity;
  if(basisSize<0||basisSize>basisCapacity||(basisSize|0)!==basisSize){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
  const hash=mixSpan32Locator32(words,offset,keyWords),bucket=hash&t.bucketMask;
  for(let q=t.buckets[bucket];q!==-1;q=t.link[q]){
    const base=q*keyWords;let w=0;
    while(w<keyWords&&t.keys[base+w]===words[offset+w])w+=1;
    if(w===keyWords){if(t.refs[q]===0xffffffff){rbaTtFail32(t,RBA_TT_ERR_CAPACITY);return -1;}t.refs[q]+=1;return q;}
  }
  const q=t.control[RBA_TT_FREE];
  if(q<0){rbaTtFail32(t,RBA_TT_ERR_CAPACITY);return -1;}
  if(t.generation[q]===0xffffffff){rbaTtFail32(t,RBA_TT_ERR_GENERATION);return -1;}
  t.control[RBA_TT_FREE]=t.link[q];
  publishSpan32(t.keys,q*keyWords,words,offset,keyWords);
  if(basisSize)publishSpan32(t.basis,q*basisCapacity,basis,basisOffset,basisSize);
  t.basisSize[q]=basisSize;t.generation[q]+=1;t.live[q]=1;t.refs[q]=1;t.execution[q]=0;
  t.exact[q]=0;t.lower[q]=1;t.upper[q]=3;t.phase[q]=0;t.count[q]=0;t.parentHead[q]=-1;
  t.readyMember[q]=0;t.eventMember[q]=0;t.bucket[q]=bucket;t.link[q]=t.buckets[bucket];t.buckets[bucket]=q;
  t.control[RBA_TT_LIVE]+=1;return q;
}
export function rbaTtRetain32(t,q,g){if(!rbaTtValid32(t,q,g))return 0;if(t.refs[q]===0xffffffff)return rbaTtFail32(t,RBA_TT_ERR_CAPACITY);t.refs[q]+=1;return 1;}
function unqueueReady(t,q){if(!t.readyMember[q])return 0;intrusiveRemove32(t.control,RBA_TT_READY_HEAD,RBA_TT_READY_TAIL,RBA_TT_READY_COUNT,t.readyNext,t.readyPrev,t.readyMember,q);t.execution[q]=0;return 1;}
export function rbaTtRecycle32(t,q){
  if(!t.live[q]||t.refs[q]||t.execution[q]||t.readyMember[q]||t.eventMember[q]||t.count[q]||t.parentHead[q]!==-1)return 0;
  const bucket=t.bucket[q];let prev=-1,scan=t.buckets[bucket];
  while(scan!==q&&scan!==-1){prev=scan;scan=t.link[scan];}
  if(scan===-1)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
  if(prev===-1)t.buckets[bucket]=t.link[q];else t.link[prev]=t.link[q];
  t.live[q]=0;t.link[q]=t.control[RBA_TT_FREE];t.control[RBA_TT_FREE]=q;t.control[RBA_TT_LIVE]-=1;return 1;
}
export function rbaTtRelease32(t,q,g){if(!rbaTtValid32(t,q,g)||!t.refs[q])return 0;const refs=t.refs[q]-1;t.refs[q]=refs;if(refs)return 1;if(t.readyMember[q])unqueueReady(t,q);if(t.count[q])rbaTtSignal32(t,q);rbaTtRecycle32(t,q);return 1;}
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
export function rbaTtReleaseExecution32(t,q,owner){if(t.execution[q]!==owner)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);t.execution[q]=0;if(!t.refs[q])rbaTtRecycle32(t,q);return 1;}
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
  const edgeBase=q*t.edgeCapacity;
  for(let i=0;i<count;i+=1){let child=-1;const lo=actionLo[i],hi=actionHi[i];
    if(lo<1||hi>3||lo>hi){rbaTtFail32(t,RBA_TT_ERR_CONTRACT);return -1;}
    if(childPresent[i]){child=rbaTtIntern32(t,keys,keyOffset+i*t.keyWords,basis,basisOffset+i*basisStride,basisSizes[i]);if(child<0)return -1;if(!rbaTtTighten32(t,child,lo,hi))return -1;}
    const e=edgeBase+i;t.child[e]=child;t.childGeneration[e]=child<0?0:t.generation[child];t.edgeLabel[e]=labels[i];t.edgeLower[e]=lo;t.edgeUpper[e]=hi;t.edgeAttached[e]=0;t.edgeNext[e]=-1;t.edgePrev[e]=-1;t.count[q]=i+1;
  }
  t.phase[q]=2;rbaTtSignal32(t,q);let next=-1;
  for(let i=0;i<count;i+=1){const child=t.child[edgeBase+i];if(child>=0&&t.execution[child]===0&&!t.exact[child]&&t.phase[child]===0){t.execution[child]=owner;next=child;break;}}
  rbaTtReleaseExecution32(t,q,owner);return next;
}
export function rbaTtPublishExactOwned32(t,q,owner,v){if(t.execution[q]!==owner)return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);if(!rbaTtSetExact32(t,q,v))return 0;return rbaTtReleaseExecution32(t,q,owner);}
export function rbaTtAttachDependencies32(t,q){
  if(t.phase[q]!==2)return 0;const base=q*t.edgeCapacity,count=t.count[q];
  for(let i=0;i<count;i+=1){const e=base+i,child=t.child[e];if(child<0)continue;if(!rbaTtValid32(t,child,t.childGeneration[e]))return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
    const head=t.parentHead[child];t.edgeNext[e]=head;t.edgePrev[e]=-1;if(head!==-1)t.edgePrev[head]=e;t.parentHead[child]=e;t.edgeAttached[e]=1;}
  t.phase[q]=3;return 1;
}
export function rbaTtReconcile32(t,q,minimize){
  if(t.phase[q]!==3||(minimize!==0&&minimize!==1))return rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
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
