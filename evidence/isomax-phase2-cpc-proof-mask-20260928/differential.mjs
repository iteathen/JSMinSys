// Cold correctness control, never imported by a worker or timing sample.
// Requires the fixed baseline commit in Git; no source copy becomes production.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import * as candidate from '../../addons/cpc-connect4.mjs';

const baseline='be7c2887defcefb37080fa61de7ce1dc38dc2990';
const source=execFileSync('git',['show',baseline+':addons/cpc-connect4.mjs'],{encoding:'utf8'})
  .replace("'../src/word32.mjs'",JSON.stringify(new URL('../../src/word32.mjs',import.meta.url).href));
const reference=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let seed=0x118,checks=0;const masks=new Set(),kinds=new Set();
for(const [columns,rows] of [[4,4],[7,6],[8,5]]){
  const g=prepareConnect4RbaGeometry({columns,rows});
  for(const frontierResponse of [false,true])for(const projectedAdvisory of [false,true]){
    const options={frontierResponse,projectedAdvisory},
      a=reference.prepareConnect4CpcScratch(g,options),b=candidate.prepareConnect4CpcScratch(g,options);
    for(let trial=0;trial<100;trial++){
      const moves=[],heights=new Uint32Array(columns);
      for(let ply=0;ply<=g.cellCount;ply++){
        const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
        const ka=reference.evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,a),
          kb=candidate.evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,b);
        assert.equal(kb,ka);
        let mask=0;for(let v=a.interval[0];v<=a.interval[1];v++)mask|=1<<(3-v);
        assert.ok([1,2,3,4,6,7].includes(mask));assert.equal(b.proofMask[0],mask);
        for(const key of Object.keys(a))if(key!=='interval')assert.deepEqual(b[key],a[key],key);
        masks.add(mask);kinds.add(kb);checks++;
        if(q.words[g.metaOffset]&3)break;
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        let c=seed%columns;while(heights[c]>=rows)c=(c+1)%columns;
        heights[c]++;moves.push(c);
      }
    }
  }
}
console.log(JSON.stringify({baseline,status:'PASS',checks,masks:[...masks].sort(),kinds:[...kinds].sort(),
  geometry:[[4,4],[7,6],[8,5]],frontierResponse:[false,true],projectedAdvisory:[false,true]}));
