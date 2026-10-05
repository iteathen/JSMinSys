import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import * as api from '../addons/rba-connect4-support-basis-plan.mjs';

test('combined transform compiler equals independent separate builders byte for byte',()=>{
 assert.equal(typeof api.compileSupportTransforms32,'function');
 for(const [columns,rows] of [[1,4],[4,1],[4,4],[6,4],[2,10],[10,1]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),p=api.prepareSupportBasisPlans32(g,32*2**20,true,true,true),
   profile=prepareConnect4RbaExecutionProfile(g),membership=new Uint32Array(p.profiles*g.shapeWordCount);
  for(let h=0;h<p.profiles;h++)for(let i=0;i<p.sizes[h];i++){
   const id=p.basis[h*g.maxBasis+i];membership[h*g.shapeWordCount+(id>>>5)]|=1<<(id&31);
  }
  const closures=new Uint32Array(p.closures.length),mirrorMap=new p.mirrorMap.constructor(p.mirrorMap.length),
   mirrorProfiles=new Uint32Array(p.mirrorProfiles.length),transitions=new p.transitions.constructor(p.transitions.length).fill(p.transitionDead);
  api.compileSupportClosures32(g,p.basis,p.sizes,membership,closures,p.profiles);
  api.compileSupportReflection32(g,p.basis,p.sizes,p.strides,mirrorMap,mirrorProfiles,p.profiles,p.radix);
  api.compileSupportTransitions32(g,profile,p.basis,p.sizes,p.strides,p.transitionOffsets,transitions,p.profiles,p.radix);
  assert.deepEqual(p.closures,closures);assert.deepEqual(p.mirrorMap,mirrorMap);
  assert.deepEqual(p.mirrorProfiles,mirrorProfiles);assert.deepEqual(p.transitions,transitions);
  for(const reflected of [false,true])for(const projected of [false,true]){
   const c=new Uint32Array(closures.length),m=reflected?new mirrorMap.constructor(mirrorMap.length):null,
    r=reflected?new Uint32Array(mirrorProfiles.length):null,
    t=projected?new transitions.constructor(transitions.length).fill(p.transitionDead):null;
   api.compileSupportTransforms32(g,profile,p.basis,p.sizes,membership,p.strides,c,m,r,p.transitionOffsets,t,p.profiles,p.radix);
   assert.deepEqual(c,closures);if(m){assert.deepEqual(m,mirrorMap);assert.deepEqual(r,mirrorProfiles);}if(t)assert.deepEqual(t,transitions);
  }
 }
});
