import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4Cpc32,CPC_EXACT} from '../addons/cpc-connect4.mjs';

test('CPC kind owns exact-interval classification across legal prefixes and optional policies',()=>{
  let seed=0x431701;
  for(const [columns,rows] of [[4,4],[7,6],[8,5]]){
    const g=prepareConnect4RbaGeometry({columns,rows});
    const scratch=[false,true].map(frontierResponse=>prepareConnect4CpcScratch(g,{frontierResponse,projectedAdvisory:true}));
    for(let game=0;game<128;game++){
      const moves=[],heights=new Uint8Array(columns);
      while(true){
        const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
        for(const s of scratch){
          const k=evaluateConnect4Cpc32(g,q.words,0,q.basis,0,q.basis.length,s);
          assert.equal(k===CPC_EXACT,s.interval[0]===s.interval[1]);
        }
        if(q.words[g.metaOffset]&3)break;
        const legal=[];for(let c=0;c<columns;c++)if(heights[c]<rows)legal.push(c);
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const c=legal[seed%legal.length];moves.push(c);heights[c]++;
      }
    }
  }
});
