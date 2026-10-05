import {compactSupportProfile8,compactTailProfile8} from './rba-connect4-shared-exact-cache.mjs';

// Cold setup. Each queue has exactly one producer and one consumer. The two
// publication cursors occupy separate 64-byte regions. Values must be exact1/2/3.
export function createAsyncExactPublication32(cache,workers,{capacity=65536,batch=32}={}){
  if(!Number.isInteger(workers)||workers<1||!Number.isInteger(capacity)||capacity<1||capacity>0x40000000||
     (capacity&(capacity-1))||!Number.isInteger(batch)||batch<1||batch>capacity||(batch&(batch-1)))
    throw new RangeError('invalid asynchronous publication queues');
  const queues=[],recordWords=cache.storedKeyWords+2;
  let bytes=4;
  for(let i=0;i<workers;i+=1){
    const words=new Uint32Array(new SharedArrayBuffer(capacity*recordWords*4)),control=new Uint32Array(new SharedArrayBuffer(128));
    words.fill(0);control.fill(0);
    queues.push({words,control,capacity,mask:capacity-1,batch,recordWords,keyWords:cache.keyWords,compact8:cache.compact8});
    bytes+=words.byteLength+control.byteLength;
  }
  return {queues,ready:new Int32Array(new SharedArrayBuffer(4)),bytes};
}

export function prepareAsyncExactProducer32(queue){
  return {...queue,write:0,at:0,remaining:0,enqueue:queue.compact8?enqueueAsyncExact8:enqueueAsyncExactSpan};
}

function reserveAsyncExactRecord32(p){
  if(!p.remaining){
    const read=Atomics.load(p.control,16);
    if(((p.write-read)>>>0)>p.capacity-p.batch)return -1;
    p.at=(p.write&p.mask)*p.recordWords;p.remaining=p.batch;
  }
  return p.at;
}

function commitAsyncExactRecord32(p){
  p.at+=p.recordWords;p.remaining-=1;
  if(!p.remaining){p.write=(p.write+p.batch)>>>0;Atomics.store(p.control,0,p.write);}
}

// Ordinary payload writes become visible through the completed-batch release.
// The consumer releases a batch only after all its payload has been consumed.
// Thus neither side accesses a record while the other side may overwrite it.
export function enqueueAsyncExact8(p,source,src,value,hash){
  const at=reserveAsyncExactRecord32(p);if(at<0)return value;
  const out=p.words;
  out[at]=hash;out[at+1]=value;
  out[at+2]=source[src];out[at+3]=source[src+1];out[at+4]=compactSupportProfile8(source,src);
  out[at+5]=source[src+8];out[at+6]=source[src+9];out[at+7]=source[src+11];out[at+8]=source[src+12];
  out[at+9]=compactTailProfile8(source,src);
  commitAsyncExactRecord32(p);return value;
}

export function enqueueAsyncExactSpan(p,source,src,value,hash){
  const at=reserveAsyncExactRecord32(p);if(at<0)return value;
  const out=p.words;out[at]=hash;out[at+1]=value;
  for(let i=0;i<p.keyWords;i+=1)out[at+2+i]=source[src+i];
  commitAsyncExactRecord32(p);return value;
}

// Sole shared-TT writer contract: search workers enqueue instead of writing.
// Keep the existing atomic payload/seqlock reader protocol; only writer CAS is
// unnecessary. An interrupted odd slot is skipped, just as by the original writer.
function publishAsyncPacked8(cache,source,at,slot,value){
  const current=Atomics.load(cache.sequence,slot);if(current&1)return;
  const odd=(current+1)>>>0,base=slot*8,keys=cache.keys;
  // Only this helper writes the TT. Ordinary reads here cannot race a writer;
  // search readers still use the unchanged atomic seqlock protocol.
  if(current&&cache.value[slot]===value&&
     keys[base]===source[at]&&keys[base+1]===source[at+1]&&
     keys[base+2]===source[at+2]&&keys[base+3]===source[at+3]&&
     keys[base+4]===source[at+4]&&keys[base+5]===source[at+5]&&
     keys[base+6]===source[at+6]&&keys[base+7]===source[at+7])return;
  Atomics.store(cache.sequence,slot,odd);
  Atomics.store(keys,base,source[at]);Atomics.store(keys,base+1,source[at+1]);
  Atomics.store(keys,base+2,source[at+2]);Atomics.store(keys,base+3,source[at+3]);
  Atomics.store(keys,base+4,source[at+4]);Atomics.store(keys,base+5,source[at+5]);
  Atomics.store(keys,base+6,source[at+6]);Atomics.store(keys,base+7,source[at+7]);
  Atomics.store(cache.value,slot,value);Atomics.store(cache.sequence,slot,(odd+1)>>>0);
}

function publishAsyncPackedSpan(cache,source,at,slot,value){
  const current=Atomics.load(cache.sequence,slot);if(current&1)return;
  const odd=(current+1)>>>0,base=slot*cache.storedKeyWords,keys=cache.keys;
  if(current&&cache.value[slot]===value){
    let i=0;while(i<cache.storedKeyWords&&keys[base+i]===source[at+i])i+=1;
    if(i===cache.storedKeyWords)return;
  }
  Atomics.store(cache.sequence,slot,odd);
  for(let i=0;i<cache.storedKeyWords;i+=1)Atomics.store(keys,base+i,source[at+i]);
  Atomics.store(cache.value,slot,value);Atomics.store(cache.sequence,slot,(odd+1)>>>0);
}

export function prepareAsyncExactConsumer32(queue,cache){
  return {...queue,cache,read:0,publish:cache.compact8?publishAsyncPacked8:publishAsyncPackedSpan};
}

export function drainAsyncExactBatch32(c){
  if(Atomics.load(c.control,0)===c.read)return 0;
  const source=c.words,cache=c.cache,publish=c.publish;
  let at=(c.read&c.mask)*c.recordWords;
  for(let i=0;i<c.batch;i+=1,at+=c.recordWords)
    publish(cache,source,at+2,source[at]&cache.mask,source[at+1]);
  c.read=(c.read+c.batch)>>>0;Atomics.store(c.control,16,c.read);
  return 1;
}

export function runAsyncExactPublisher32(consumers,control,idle){
  while(!Atomics.load(control,0)){
    let worked=0;
    if(!idle)for(let i=0;i<consumers.length;i+=1)worked|=drainAsyncExactBatch32(consumers[i]);
    if(!worked)Atomics.wait(control,0,0,1);
  }
}
