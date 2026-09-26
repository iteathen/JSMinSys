import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaCofactorKnownHeight,connect4RbaCofactorKnownNonwinningHeight} from '../addons/rba-connect4-coordinate.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32,CPC_EXACT} from '../addons/cpc-connect4.mjs';

test('CPC-certified nonwinning cofactor matches checked transition exactly',()=>{
  let comparisons=0,seed=71;
  for(const [columns,rows] of [[4,4],[7,6]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),p=prepareConnect4RbaExecutionProfile(g),cpc=prepareConnect4CpcScratch(g);
    const a=prepareConnect4RbaCoordinateScratch(g),b=prepareConnect4RbaCoordinateScratch(g);
    for(let game=0;game<8;game++){
      let moves=[];
      for(let ply=0;ply<Math.min(30,g.cellCount);ply++){
        const q=connect4RbaFromMoves(moves,{geometry:g,canonical:!!(game&1)});
        if(q.words[g.metaOffset]&3)break;
        const k=evaluateConnect4CpcNonterminal32(g,q.words,0,q.basis,0,q.basis.length,cpc);
        if(k!==CPC_EXACT)for(let col=0;col<columns;col++){
          const height=q.words[col];if(height===rows)continue;
          const aw=new Uint32Array(g.keyWords),bw=new Uint32Array(g.keyWords),ab=new Uint32Array(g.maxBasis),bb=new Uint32Array(g.maxBasis);
          const x=connect4RbaCofactorKnownHeight(g,p,q.words,0,q.basis,0,q.basis.length,col,height,aw,0,ab,0,a.seen,a.size,0,a.map,a.inverse);
          const y=connect4RbaCofactorKnownNonwinningHeight(g,p,q.words,0,q.basis,0,q.basis.length,col,height,bw,0,bb,0,b.seen,b.size,0,b.map,b.inverse);
          assert.equal(y,x);assert.deepEqual(bw,aw);assert.equal(b.size[0],a.size[0]);assert.deepEqual(bb.slice(0,b.size[0]),ab.slice(0,a.size[0]));comparisons++;
        }
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        let next=seed%columns,physical=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
        while(physical.words[next]===rows)next=(next+1)%columns;
        moves.push(next);
      }
    }
  }
  assert.ok(comparisons>200);
});

test('native CPC recursion uses the proved nonwinning transition; root retains checked witness path',()=>{
  const source=readFileSync(new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url),'utf8');
  const recursion=source.slice(source.indexOf('function searchCpcOnly('),source.indexOf('function search(state,'));
  assert.equal((recursion.match(/connect4RbaCofactorKnownNonwinningHeight\(/g)||[]).length,2);
  assert.equal(recursion.includes('connect4RbaCofactorKnownHeight('),false);
  assert.ok(source.slice(source.indexOf('export function solveConnect4RbaAlphaBeta(')).includes('connect4RbaCofactorKnownHeight('));
});
