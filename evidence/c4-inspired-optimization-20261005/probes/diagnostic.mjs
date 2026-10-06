// Separate, explicitly partial diagnostic. Never used as performance evidence.
import {prepareConnect4RbaGeometry} from '../../../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../../../addons/rba-connect4-lazy-smp-host.mjs';
const result=await runLazySmpConnect4Rba32([],{
 geometry:prepareConnect4RbaGeometry({columns:7,rows:6}),workers:4,workerMode:'minimal',
 sharedCacheCapacity:Number(process.env.JMS_BENCH_SHARED_CAPACITY??134217728),localCacheCapacity:Number(process.env.JMS_BENCH_LOCAL_CAPACITY??33554432),sharedProofBounds:true,
 localCacheLayout:process.env.JMS_BENCH_LOCAL_TT_LAYOUT??'split',
 supportBasisPlanBudgetBytes:Number(process.env.JMS_BENCH_SUPPORT_PLAN_BUDGET??0),
 supportClosurePlan:process.env.JMS_BENCH_SUPPORT_CLOSURES==='1',supportReflectionPlan:process.env.JMS_BENCH_SUPPORT_REFLECTION==='1',supportBasisViews:process.env.JMS_BENCH_BASIS_VIEWS==='1',sharedSampleMask:0,
 timeoutMs:10000,preparedEmptyTiming:true
});
console.log(JSON.stringify({purpose:'diagnostic-only-partial-empty-search',runtime:process.version,v8:process.versions.v8,result},null,2));
if(!result.cleanup||result.workersExited!==4)process.exitCode=1;
