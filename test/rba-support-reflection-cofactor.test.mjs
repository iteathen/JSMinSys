import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {connect4RbaSupportCanonicalize as planned} from '../addons/rba-connect4-coordinate-support-reflection.mjs';
import {connect4RbaPreparedCanonicalize as original} from '../addons/rba-connect4-coordinate-prepared.mjs';
import {connect4RbaClosurePreparedSpanCofactorKnownHeight as cofactor} from '../addons/rba-connect4-coordinate-closure-prepared.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('cofactor handle drives exact reflection with owner ties, offsets and poisoned unused scratch',()=>{
 let checks=0,ties=0,reflections=0;
 for(const [columns,rows] of [[4,4],[7,5],[7,6]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),p=prepareConnect4RbaExecutionProfile(g);
  g.supportBasisPlans=prepareSupportBasisPlans32(g,1024*2**20,true,true);assert.ok(g.supportBasisPlans?.mirrorMap);
  const histories=[[0,1,0,1,2,1,2,3,2,3,2],[3%columns,3%columns,3%columns,3%columns,3%columns]];
  for(const history of histories)for(let length=0;length<=history.length;length++)for(const canonical of [false,true]){
   if(history.slice(0,length).some(c=>history.slice(0,length).filter(v=>v===c).length>rows))continue;
   const q=connect4RbaFromMoves(history.slice(0,length),{geometry:g,canonical});if(q.words[g.metaOffset]&3)continue;
   for(let c=0;c<columns;c++)if(q.words[c]<rows){
    const words=new Uint32Array(g.keyWords+7).fill(0xa5a5a5a5),basis=new Uint32Array(g.maxBasis+7).fill(0xffffffff),s=prepareConnect4RbaCoordinateScratch(g);
    s.map.fill(0xffffffff);s.inverse.fill(0xffffffff);s.seen.fill(0x12345678);
    const term=cofactor(g,p,q.words,0,q.basis,0,q.basis.length,c,q.words[c],words,3,basis,4,s.seen,s.size,0,s.map,s.inverse);
    if(term)continue;
    const before=words.slice(),beforeBasis=basis.slice(),expected=words.slice(),expectedBasis=basis.slice(),expectedScratch=prepareConnect4RbaCoordinateScratch(g);
    const expectedRef=original(g,p,expected,3,expectedBasis,4,s.size[0],expectedScratch);
    s.inverse.fill(0xffffffff);s.mirrorBasis.fill(0xffffffff); // obsolete reconstruction inputs are poisoned
    const actualRef=planned(g,p,words,3,basis,4,s.size[0],s);
    assert.equal(actualRef,expectedRef);assert.deepEqual(words,expected);assert.deepEqual(basis,expectedBasis);
    assert.ok(s.seen.every(v=>v===0x12345678));assert.ok(s.inverse.every(v=>v===0xffffffff));assert.ok(s.mirrorBasis.every(v=>v===0xffffffff));
    assert.equal(words[2],before[2]);assert.equal(basis[3],beforeBasis[3]);
    if(Array.from(before.slice(3,3+columns)).every((v,i)=>v===before[3+columns-1-i]))ties++;
    reflections+=actualRef;checks++;
   }
  }
 }
 assert.ok(checks>500&&ties>0&&reflections>0);console.log(JSON.stringify({checks,ties,reflections}));
});

test('four-worker reflection plan has cold budget fallback and clean exact result',async()=>{
 for(const budget of [1,16*2**20]){
  const result=await runLazySmpConnect4Rba32([0,1,0,1,0,2],{geometry:prepareConnect4RbaGeometry({columns:4,rows:4}),workers:4,workerMode:'minimal',
   sharedProofBounds:true,supportBasisPlanBudgetBytes:budget,supportClosurePlan:true,supportReflectionPlan:true,sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:5000});
  assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,1);assert.equal(result.move,0);assert.equal(result.supportReflectionPlan,budget>1);assert.equal(result.workersExited,4);assert.equal(result.cleanup,true);
 }
});
