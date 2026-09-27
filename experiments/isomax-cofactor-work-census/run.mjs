import assert from 'node:assert/strict';
const movesText=process.argv[2]??'353335714';
const {prepareConnect4RbaGeometry,connect4RbaFromMoves,prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY}=await import('../../addons/index.mjs');
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
const root=connect4RbaFromMoves(Array.from(movesText,ch=>ch.charCodeAt(0)-49),{geometry:g});
const state=prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:1048576,
  sharedExactCache:null,sharedSampleMask:0,cpcFrontierResponse:false,cpcProjectedAdvisory:false});
const result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
if(movesText==='353335714'){assert.equal(result.value,1);assert.equal(result.relative,1);}
else{assert.equal(result.value,3);assert.equal(result.relative,1);assert.equal(result.move,3);}
const s=globalThis.__ISOMAX_COF_WORK_CENSUS;if(!s)throw Error('work census hook inactive');
const trim=a=>Array.from(a).map((v,i)=>[i,v]).filter(x=>x[1]);
console.log(JSON.stringify({
  kind:'isomax-cofactor-work-census-v1',fixture:movesText,result:{value:result.value,relative:result.relative,move:result.move},
  metrics:result.metrics,
  calls:s.calls,deepCalls:s.deepCalls,sumN:s.sumN,sumCN:s.sumCN,maxN:s.maxN,maxCN:s.maxCN,
  meanN:s.deepCalls?s.sumN/s.deepCalls:null,meanCN:s.deepCalls?s.sumCN/s.deepCalls:null,
  guardImages:s.guardImages,preGuardPlayers:s.preGuardPlayers,absorbedImages:s.absorbedImages,
  expandedImages:s.expandedImages,expandedPlayers:s.expandedPlayers,
  absorbedFraction:s.guardImages?s.absorbedImages/s.guardImages:null,
  meanExpandedImagesPerDeep:s.deepCalls?s.expandedImages/s.deepCalls:null,
  subsetTests:s.subsetTests,meanSubsetTestsPerDeep:s.deepCalls?s.subsetTests/s.deepCalls:null,
  meanSubsetTestsPerExpansion:s.expandedImages?s.subsetTests/s.expandedImages:null,
  hypotheticalThreeWordClosureOrs:s.expandedPlayers*3,
  rankDeepCalls:trim(s.rankDeepCalls),rankN:trim(s.rankN),rankCN:trim(s.rankCN),
  rankGuardImages:trim(s.rankGuardImages),rankExpandedImages:trim(s.rankExpandedImages),
  rankSubsetTests:trim(s.rankSubsetTests),
  warning:'instrumented diagnostic only; no elapsed-time claim'
},null,2));
