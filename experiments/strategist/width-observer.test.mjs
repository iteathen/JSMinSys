import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32,CPC_EXACT} from '../../addons/cpc-connect4.mjs';
import {createConnect4RbaSharedExactCache32,storeConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';

test('strategist frontier widths match independent root ingress enumeration and preserve TT',async()=>{
  const {prepareWidthObserver,stepWidthObserver}=await import('./width-observer.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  for(const moves of [[],[1],[2]]){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const cache=createConnect4RbaSharedExactCache32({capacity:16,keyWords:g.keyWords});
    const before=Object.fromEntries(['sequence','keys','value','stats'].map(k=>[k,cache[k].slice()]));
    const observer=prepareWidthObserver(g,root,cache,{capacity:128,batch:2});
    let sequences=[moves];
    for(let depth=1;depth<=3;depth++){
      const next=[],keys=new Set(),cpc=prepareConnect4CpcScratch(g);
      for(const sequence of sequences){
        const parent=connect4RbaFromMoves(sequence,{geometry:g});
        if(parent.words[g.metaOffset]&3)continue;
        if(evaluateConnect4CpcNonterminal32(g,parent.words,0,parent.basis,0,parent.basis.length,cpc)===CPC_EXACT)continue;
        const forced=cpc.forcedColumn[0],mask=cpc.preemptionCount[0]>1?cpc.preemptionMask32[0]:-1;
        for(let col=0;col<g.columns;col++){
          const canonical=parent.reflected?g.columns-1-col:col;
          if(parent.words[canonical]>=g.rows||(forced>=0&&canonical!==forced)||!(mask&(1<<canonical)))continue;
          const childMoves=[...sequence,col],child=connect4RbaFromMoves(childMoves,{geometry:g});
          if(child.words[g.metaOffset]&3)continue;
          if(evaluateConnect4CpcNonterminal32(g,child.words,0,child.basis,0,child.basis.length,cpc)===CPC_EXACT)continue;
          const key=[...child.words].join(',');
          if(!keys.has(key)){keys.add(key);next.push(childMoves);}
        }
      }
      let steps=0;
      while(observer.depth<depth&&steps++<1000)stepWidthObserver(observer);
      assert.equal(observer.depth,depth);assert.equal(observer.width,keys.size);
      sequences=next;
    }
    for(const key of ['sequence','keys','value','stats'])assert.deepEqual(cache[key],before[key]);
  }
});

test('capacity is incomplete evidence, never a fabricated collapse',async()=>{
  const {prepareWidthObserver,stepWidthObserver}=await import('./width-observer.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([],{geometry:g});
  const cache=createConnect4RbaSharedExactCache32({capacity:4,keyWords:g.keyWords});
  const observer=prepareWidthObserver(g,root,cache,{capacity:2,batch:2});
  for(let i=0;i<30&&!observer.capacityRejections;i++)stepWidthObserver(observer);
  assert.ok(observer.capacityRejections>0);assert.equal(observer.width,2);
  assert.equal(observer.depth,1);assert.equal(observer.complete,false);
});

test('read-only exact lookup rejects collisions and odd publication; accepted proof shrinks frontier',async()=>{
  const {prepareWidthObserver,stepWidthObserver,readExactWidth}=await import('./width-observer.mjs');
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),root=connect4RbaFromMoves([1],{geometry:g});
  const cache=createConnect4RbaSharedExactCache32({capacity:1,keyWords:g.keyWords});
  const observer=prepareWidthObserver(g,root,cache,{capacity:128});
  const exact=solveConnect4RbaAlphaBeta(root,{state:prepareConnect4RbaAlphaBeta({geometry:g}),reflected:root.reflected});
  storeConnect4RbaSharedExactCache32(cache,root.words,0,exact.value);
  const stats=[...cache.stats];assert.equal(readExactWidth(cache,root.words,0),exact.value);
  const other=connect4RbaFromMoves([0],{geometry:g});assert.equal(readExactWidth(cache,other.words,0),0);
  const version=cache.sequence[0];Atomics.store(cache.sequence,0,version|1);
  assert.equal(readExactWidth(cache,root.words,0),0);Atomics.store(cache.sequence,0,version);
  stepWidthObserver(observer);assert.equal(observer.width,0);assert.equal(observer.complete,true);
  assert.deepEqual([...cache.stats],stats);
});
