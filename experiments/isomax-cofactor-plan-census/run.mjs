import assert from 'node:assert/strict';
import {cpus} from 'node:os';

const movesText=process.argv[2]??'353335714';
if(movesText!=='353335714'&&movesText!=='45461667')throw new RangeError('undeclared census fixture');
const {
  prepareConnect4RbaGeometry,connect4RbaFromMoves,prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY
}=await import('../../addons/index.mjs');
const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
const moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49);
const root=connect4RbaFromMoves(moves,{geometry});
const solver=prepareConnect4RbaAlphaBeta({geometry,mode:RBA_AB_CPC_ONLY,cacheCapacity:1048576,
  sharedExactCache:null,sharedSampleMask:0,cpcFrontierResponse:false,cpcProjectedAdvisory:false});
const result=solveConnect4RbaAlphaBeta(root,{state:solver,reflected:root.reflected});
if(movesText==='353335714'){assert.equal(result.value,1);assert.equal(result.relative,1);}
else{assert.equal(result.value,3);assert.equal(result.relative,1);assert.equal(result.move,3);}

const s=globalThis.__ISOMAX_COF_PLAN_CENSUS;
if(!s)throw new Error('census hook not active');
const bins=[
  [1,1,'1'],[2,2,'2'],[3,4,'3-4'],[5,8,'5-8'],[9,16,'9-16'],
  [17,32,'17-32'],[33,64,'33-64'],[65,256,'65-256'],[257,0xffffffff,'257+']
];
const histogram=Object.fromEntries(bins.map(x=>[x[2],{keys:0,calls:0}]));
let maxCalls=0,maxKey=-1;
for(let key=0;key<s.planCounts.length;key++){
  const count=s.planCounts[key];if(!count)continue;
  if(count>maxCalls){maxCalls=count;maxKey=key;}
  for(const [lo,hi,name] of bins)if(count>=lo&&count<=hi){histogram[name].keys++;histogram[name].calls+=count;break;}
}
const decode=key=>{
  if(key<0)return null;
  const column=key%7;let code=(key-column)/7;const heights=[];
  for(let c=0;c<7;c+=1){heights.push(code%7);code=Math.floor(code/7);}
  return {column,heights};
};
const trim=a=>Array.from(a).map((v,i)=>[i,v]).filter(x=>x[1]);
console.log(JSON.stringify({
  kind:'isomax-cofactor-plan-census-v1',
  fixture:movesText,node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model??null,
  result:{value:result.value,relative:result.relative,move:result.move},metrics:result.metrics,
  totalCalls:s.totalCalls,uniqueSupports:s.uniqueSupports,uniquePlanKeys:s.uniquePlans,
  repeatedCalls:s.repeatedCalls,repeatedFraction:s.totalCalls?s.repeatedCalls/s.totalCalls:null,
  deepCalls:s.deepCalls,uniqueDeepPlanKeys:s.uniqueDeepPlans,deepRepeatedCalls:s.deepRepeatedCalls,
  deepRepeatedFraction:s.deepCalls?s.deepRepeatedCalls/s.deepCalls:null,
  maxPlanCalls:maxCalls,maxPlan:decode(maxKey),reuseHistogram:histogram,
  rankCalls:trim(s.rankCalls),rankRepeated:trim(s.rankRepeated),
  rankDeepCalls:trim(s.rankDeepCalls),rankDeepRepeated:trim(s.rankDeepRepeated),
  childBasisSizeCalls:trim(s.childSizeCalls),childBasisSizeFirstPlans:trim(s.childSizeFirst),
  warning:'instrumented diagnostic only; elapsed time is not performance evidence'
},null,2));
