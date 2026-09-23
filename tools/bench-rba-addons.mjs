import {performance} from 'node:perf_hooks';
import {createRbaTt32,rbaTtIntern32} from '../addons/rba-tt32.mjs';
import {createMetricViews32,sumMetricViews32} from '../addons/branch-manager-host.mjs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';

const WARMUP=2,REPEATS=7;

function measure(name,fn){
  let checksum=0;
  for(let i=0;i<WARMUP;i+=1)checksum^=fn()|0;
  const samples=new Float64Array(REPEATS);
  for(let i=0;i<REPEATS;i+=1){
    const start=performance.now();checksum^=fn()|0;samples[i]=performance.now()-start;
  }
  samples.sort();
  return {name,warmMedianMs:samples[REPEATS>>>1],warmMinMs:samples[0],checksum};
}

function key27(tag){
  const q=new Uint32Array(27);
  q[0]=tag>>>0;q[3]=Math.imul(tag,0x9e3779b1)>>>0;q[10]=((tag&63)<<2)>>>0;
  q[11]=(tag+0x13579bdf)>>>0;q[19]=(tag^0xa5a5a5a5)>>>0;q[26]=Math.imul(tag+1,0x85ebca6b)>>>0;
  return q;
}
const basis=Uint32Array.from({length:12},(_,i)=>i+1);

const hitTable=createRbaTt32({capacity:64,bucketCount:64,keyWords:27,basisCapacity:238,edgeCapacity:10});
const hitKey=key27(7);const hitQ=rbaTtIntern32(hitTable,hitKey,0,basis,0,basis.length);
const TT_HIT_ITERS=100000;
function benchTtHit(){
  let x=0;
  for(let i=0;i<TT_HIT_ITERS;i+=1)x^=rbaTtIntern32(hitTable,hitKey,0,basis,0,basis.length);
  return x^hitQ;
}

const collisionTable=createRbaTt32({capacity:64,bucketCount:1,keyWords:27,basisCapacity:238,edgeCapacity:10});
const collisionKeys=Array.from({length:32},(_,i)=>key27(i+100));
for(const q of collisionKeys)rbaTtIntern32(collisionTable,q,0,basis,0,basis.length);
const collisionKey=collisionKeys[0];
const TT_COLLISION_ITERS=25000;
function benchTtCollisionTail(){
  let x=0;
  for(let i=0;i<TT_COLLISION_ITERS;i+=1)x^=rbaTtIntern32(collisionTable,collisionKey,0,basis,0,basis.length);
  return x;
}

const metricViews=createMetricViews32(8,16),metricOut=new Float64Array(16);
for(let w=0;w<metricViews.length;w+=1)for(let i=0;i<16;i+=1)metricViews[w][i]=(w+1)*(i+1);
const METRIC_ITERS=50000;
function benchMetricSum(){
  let x=0;
  for(let i=0;i<METRIC_ITERS;i+=1){sumMetricViews32(metricViews,16,metricOut);x^=metricOut[i&15]|0;}
  return x;
}

function benchGeometry7x6(){
  let x=0;for(let i=0;i<3;i+=1){const g=prepareConnect4RbaGeometry({columns:7,rows:6});x^=g.shapeCount^g.specializationBytes;}return x;
}
function benchGeometry10x10(){
  const g=prepareConnect4RbaGeometry({columns:10,rows:10});return g.shapeCount^g.keyWords^g.specializationBytes;
}

const rows=[
  measure('tt-hit-27w',benchTtHit),
  measure('tt-collision-tail-27w',benchTtCollisionTail),
  measure('metric-sum-8x16',benchMetricSum),
  measure('geometry-7x6-init-x3',benchGeometry7x6),
  measure('geometry-10x10-init',benchGeometry10x10),
];
console.log(JSON.stringify({kind:'rba-addon-bench-v1',warmup:WARMUP,repeats:REPEATS,rows},null,2));
