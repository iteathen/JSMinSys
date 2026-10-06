import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
test('diagnostic forwards the requested basis-view flag to the actual solver entry point',async()=>{
 const source=readFileSync(new URL('../evidence/c4-inspired-optimization-20261005/probes/diagnostic.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 for(const requested of ['0','1']){
 let options;const context={process:{env:{JMS_BENCH_BASIS_VIEWS:requested},version:'test',versions:{v8:'test'}},console:{log(){}},prepareConnect4RbaGeometry:o=>o,runLazySmpConnect4Rba32:async(moves,o)=>{assert.deepEqual(Array.from(moves),[]);options=o;return {cleanup:true,workersExited:4};}};
 await runInNewContext('(async()=>{'+source+'})()',context);assert.equal(options.supportBasisViews,requested==='1');
 }
});
