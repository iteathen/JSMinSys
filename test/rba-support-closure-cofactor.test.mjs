import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {connect4RbaPreparedCofactorKnownHeight as normal} from '../addons/rba-connect4-coordinate-prepared.mjs';
import {connect4RbaClosurePreparedSpanCofactorKnownHeight as sparse,connect4RbaClosurePreparedSpanCofactorNonWinningKnownHeight as sparseNonWinning} from '../addons/rba-connect4-coordinate-closure-prepared.mjs';
import {connect4RbaClosureDenseSpanCofactorKnownHeight as dense,connect4RbaClosureDenseSpanCofactorNonWinningKnownHeight as denseNonWinning} from '../addons/rba-connect4-coordinate-closure-dense.mjs';
import {connect4RbaClosureDense3CofactorKnownHeight as dense3,connect4RbaClosureDense3CofactorNonWinningKnownHeight as dense3NonWinning} from '../addons/rba-connect4-coordinate-closure-dense.mjs';
import {connect4RbaClosurePrepared3CofactorKnownHeight as sparse3,connect4RbaClosurePrepared3CofactorNonWinningKnownHeight as sparse3NonWinning} from '../addons/rba-connect4-coordinate-closure-prepared.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('closure-planned cofactors preserve original projection, reflection frames, poisoned scratch and first-terminal ordering',()=>{
 let checks=0,draws=0,wins=0;
 for(const [columns,rows] of [[3,3],[4,4],[7,5],[7,6]])for(const specializationBudgetBytes of [0,2097152]){
  const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes}),p=prepareConnect4RbaExecutionProfile(g);
  g.supportBasisPlans=prepareSupportBasisPlans32(g,1024*2**20,true);assert.ok(g.supportBasisPlans);assert.equal(g.supportBasisPlans.membership,null);
  const history=columns===3?[0,1,2,0,1,2,0,1]:[0,1,0,1,2,1,2,3,2,3,2];
  for(let length=0;length<=history.length;length++)for(const canonical of [false,true]){
   const q=connect4RbaFromMoves(history.slice(0,length),{geometry:g,canonical});
   if(q.words[g.metaOffset]&3)continue;
   for(let c=0;c<columns;c++)if(q.words[c]<rows){
    function apply(fn){
     const words=new Uint32Array(g.keyWords*2+7).fill(0xa5a5a5a5),basis=new Uint32Array(g.maxBasis*2+7).fill(0xffffffff),s=prepareConnect4RbaCoordinateScratch(g),size=new Uint32Array(2);
     words.set(q.words,2);basis.set(q.basis,3);s.inverse.fill(0xffffffff);s.map.fill(0xffffffff);s.seen.fill(0x12345678);
     const term=fn(g,p,words,2,basis,3,q.basis.length,c,q.words[c],words,g.keyWords+4,basis,g.maxBasis+4,s.seen,size,1,s.map,s.inverse);
     if(fn!==normal)assert.ok(s.seen.every(v=>v===0x12345678),'closure path must not copy obsolete membership');
     assert.deepEqual(words.slice(2,2+g.keyWords),q.words);assert.deepEqual(basis.slice(3,3+q.basis.length),q.basis);
     assert.equal(words[g.keyWords+3],0xa5a5a5a5);assert.equal(basis[g.maxBasis+3],0xffffffff);
     return {term,words:words.slice(g.keyWords+4,g.keyWords*2+4),basis:basis.slice(g.maxBasis+4,g.maxBasis+4+size[1])};
    }
    const expected=apply(normal);
    for(const fn of g.removeByCell===null?[sparse]:[sparse,dense,...(g.coordWords===3?[sparse3,dense3]:[])]){assert.deepEqual(apply(fn),expected);checks++;}
    if(![1,3].includes(expected.term))for(const fn of g.removeByCell===null?[sparseNonWinning]:[sparseNonWinning,denseNonWinning,...(g.coordWords===3?[sparse3NonWinning,dense3NonWinning]:[])]){assert.deepEqual(apply(fn),expected);checks++;}
    if(expected.term===2)draws++;if([1,3].includes(expected.term))wins++;
   }
  }
 }
 assert.ok(checks>1000);assert.ok(draws>0);assert.ok(wins>0);
});

test('four-worker host admits a complete closure plan or falls back cold without changing exact semantics',async()=>{
 for(const budget of [1,8*2**20]){
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:4}),moves=[0,1,0,1,0,2];
  const result=await runLazySmpConnect4Rba32(moves,{geometry,workers:4,workerMode:'minimal',sharedProofBounds:true,
   supportBasisPlanBudgetBytes:budget,supportClosurePlan:true,localCacheCapacity:256,sharedCacheCapacity:256,timeoutMs:5000});
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,1);assert.equal(result.move,0);
  assert.equal(result.supportBasisPlanBytes>0,budget>1);assert.equal(result.supportClosurePlan,budget>1);assert.equal(result.workersExited,4);assert.equal(result.cleanup,true);
 }
});
