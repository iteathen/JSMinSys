// Geometry/support volume only, not a game solve or runtime visitation estimate.
import {writeFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../../addons/rba-connect4-support-basis-plan.mjs';
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),plan=prepareSupportBasisPlans32(g,2**28,false,false),
 rows=Array.from({length:43},(_,rank)=>({rank,profiles:0,narrowProfiles:0,minBasis:69,maxBasis:0}));
for(let h=0;h<plan.profiles;h++){
 let rank=0;for(let c=0;c<7;c++)rank+=Math.floor(h/plan.strides[c])%7;
 const n=plan.sizes[h],r=rows[rank];r.profiles++;if(n<=32)r.narrowProfiles++;
 r.minBasis=Math.min(r.minBasis,n);r.maxBasis=Math.max(r.maxBasis,n);
}
writeFileSync(new URL('./support-domain.json',import.meta.url),JSON.stringify({geometry:'7x6',profiles:plan.profiles,includesUnreachableSupports:true,solvedOutcomesQueried:false,rows},null,2));
console.log(JSON.stringify(rows.filter(r=>[0,10,20,25,30,35,40,42].includes(r.rank))));
