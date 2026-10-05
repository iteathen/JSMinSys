import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaCofactorKnownHeight as generic} from '../addons/rba-connect4-coordinate.mjs';
import {connect4RbaPreparedCofactorKnownHeight as prepared} from '../addons/rba-connect4-coordinate-prepared.mjs';
import {connect4RbaDenseCofactorKnownHeight as dense} from '../addons/rba-connect4-coordinate-dense.mjs';

test('cofactor ignores non-basis coordinate tail bits and preserves empty owner channels',()=>{
 for(const [columns,rows] of [[3,3],[4,4],[7,5],[7,6],[10,10]])for(const budget of [0,2097152]){
  const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget}),p=prepareConnect4RbaExecutionProfile(g),
   root=connect4RbaFromMoves([],{geometry:g,canonical:false}),n=root.basis.length;
  for(const fn of g.removeByCell===null?[generic,prepared]:[generic,prepared,dense]){
   function apply(poison,gray){
    const source=root.words.slice(),target=new Uint32Array(g.keyWords),basis=new Uint32Array(g.maxBasis),size=new Uint32Array(1),s=prepareConnect4RbaCoordinateScratch(g);
    if(gray)source.fill(0,g.p0Offset);
    if(poison)for(let i=n;i<g.coordWords*32;i++)for(const offset of [g.p0Offset,g.p1Offset])source[offset+(i>>>5)]|=1<<(i&31);
    const term=fn(g,p,source,0,root.basis,0,n,0,0,target,0,basis,0,s.seen,size,0,s.map,s.inverse);
    return {term,words:target,basis:basis.slice(0,size[0])};
   }
   for(const gray of [false,true])assert.deepEqual(apply(true,gray),apply(false,gray),`${columns}x${rows} budget${budget} gray${gray}`);
  }
 }
});
