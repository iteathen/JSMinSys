import {performance} from 'node:perf_hooks';
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
  measure('metric-sum-8x16',benchMetricSum),
  measure('geometry-7x6-init-x3',benchGeometry7x6),
  measure('geometry-10x10-init',benchGeometry10x10),
];
console.log(JSON.stringify({kind:'rba-addon-bench-v1',warmup:WARMUP,repeats:REPEATS,rows},null,2));
