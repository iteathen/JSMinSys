import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32,loadSupportClosureBasis32} from '../addons/rba-connect4-support-basis-plan.mjs';

test('empty residual geometry still reserves a support handle output slot',()=>{
 const g=prepareConnect4RbaGeometry({columns:3,rows:3});assert.equal(g.maxBasis,0);
 g.supportBasisPlans=prepareSupportBasisPlans32(g,2097152,true,true);
 const sc=prepareConnect4RbaCoordinateScratch(g),words=new Uint32Array(g.keyWords);words[1]=1;
 assert.equal(sc.map.length,1,'support index metadata survives even with no residual coordinate slots');
 assert.equal(loadSupportClosureBasis32(g,words,0,new Uint32Array(0),0,sc.seen,sc.map,sc.inverse),0);
 assert.equal(sc.map[0],g.supportBasisPlans.strides[1]);
 const standard=prepareConnect4RbaGeometry({columns:7,rows:6});assert.equal(prepareConnect4RbaCoordinateScratch(standard).map.length,standard.maxBasis);
});
