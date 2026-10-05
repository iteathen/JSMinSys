import {prepareConnect4RbaGeometry} from '../../../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../../../addons/rba-connect4-support-basis-plan.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),p=prepareSupportBasisPlans32(g,256*2**20);
const basisSlots=p.sizes.reduce((s,n)=>s+n,0);
console.log(JSON.stringify({profiles:p.profiles,maxBasis:g.maxBasis,basisSlots,meanBasis:basisSlots/p.profiles,paddedRecordBytes:p.profiles*g.maxBasis*g.columns*2,packedRecordBytes:basisSlots*g.columns*2,prefixBytes:(p.profiles+1)*4}));
