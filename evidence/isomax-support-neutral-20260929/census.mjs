// Allocating offline observer ONLY. Never imported by production/search.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch,connect4RbaShapeSubset} from '../../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../../addons/rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownHeight} from '../../addons/rba-connect4-coordinate.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';

export function describe(g,words,basis){
  const minima=[[],[]];let active=0;
  for(let p=0;p<2;p++){
    const off=p?g.p1Offset:g.p0Offset;
    for(let i=0;i<basis.length;i++)if(words[off+(i>>>5)]&(1<<(i&31))){
      const id=basis[i];
      if(minima[p].some(sub=>connect4RbaShapeSubset(g,sub,id)))continue;
      minima[p].push(id);
      for(let j=0;j<g.shapeSize[id];j++)active|=1<<g.cellColumn[g.shapeCells[id*4+j]];
    }
  }
  let neutralCapacity=0;
  const heights=[];
  for(let c=0;c<g.columns;c++){
    if(active&(1<<c))heights.push(words[c]);
    else{heights.push(-1);neutralCapacity+=g.rows-words[c];}
  }
  const key=JSON.stringify([words[g.metaOffset],heights,neutralCapacity,minima]);
  // Deliberately UNSAFE raw-bit variant is measured as a falsifier, not used.
  const naive=JSON.stringify([words[g.metaOffset],heights,neutralCapacity,Array.from(words.slice(g.p0Offset))]);
  return {active,neutralCapacity,minima,key,naive};
}

function prepared(columns,rows){
  const g=prepareConnect4RbaGeometry({columns,rows}),base=prepareConnect4RbaExecutionProfile(g);
  const shapeColumns=new Uint32Array(g.shapeCount);
  for(let id=0;id<g.shapeCount;id++)for(let j=0;j<g.shapeSize[id];j++)
    shapeColumns[id]|=1<<g.cellColumn[g.shapeCells[id*4+j]];
  return {g,base,shapeColumns};
}
function childOf(g,profile,q,column){
  const words=new Uint32Array(g.keyWords),basis=new Uint32Array(g.maxBasis),s=prepareConnect4RbaCoordinateScratch(g);
  const term=connect4RbaCofactorKnownHeight(g,profile,q.words,0,q.basis,0,q.basis.length,column,q.words[column],words,0,basis,0,s.seen,s.size,0,s.map,s.inverse);
  return {words,basis:basis.slice(0,s.size[0]),term};
}
export function qualifyGraph(columns,rows){
  const {g,base}=prepared(columns,rows),seen=new Map(),groups=new Map(),naiveGroups=new Map();
  let transitionMismatches=0,valueMismatches=0,extraMerges=0,naiveAliases=0,neutralMoves=0,witness=null;
  let nonterminalMerges=0,changedCoordinateMerges=0,encodingWitness=null;
  function visit(q){
    const full=Array.from(q.words).join(',');
    if(seen.has(full))return seen.get(full);
    const meta=q.words[g.metaOffset],terminal=meta&3,rank=meta>>>2;
    const d=describe(g,q.words,q.basis),mapped=[];
    let value=terminal?terminal-2:(rank&1?2:-2);
    if(!terminal)for(let c=0;c<columns;c++)if(q.words[c]<rows){
      const ch=childOf(g,base,q,c),cv=visit(ch);
      value=rank&1?Math.min(value,cv):Math.max(value,cv);
      const label=d.active&(1<<c)?String(c):'N';if(label==='N')neutralMoves++;
      mapped.push(label+':'+describe(g,ch.words,ch.basis).key);
    }
    const successor=JSON.stringify([...new Set(mapped)].sort());
    const prior=groups.get(d.key);
    if(prior){extraMerges++;if(!terminal){nonterminalMerges++;if(prior.naive!==d.naive){changedCoordinateMerges++;encodingWitness??={prior:prior.full,full,key:d.key};}}
      if(prior.successor!==successor){transitionMismatches++;witness??={prior:prior.full,full,key:d.key,successor,priorSuccessor:prior.successor};}
      if(prior.value!==value)valueMismatches++;
    }else groups.set(d.key,{full,successor,value,naive:d.naive});
    const nk=naiveGroups.get(d.naive);if(nk&&nk!==d.key)naiveAliases++;else naiveGroups.set(d.naive,d.key);
    seen.set(full,value);return value;
  }
  const root=connect4RbaFromMoves([],{geometry:g,canonical:false}),rootWdl=visit(root);
  return {geometry:[columns,rows],states:seen.size,classes:groups.size,extraMerges,nonterminalMerges,changedCoordinateMerges,encodingWitness,transitionMismatches,valueMismatches,naiveAliases,neutralMoves,rootWdl,witness};
}
export function sampleTransitions(columns,rows,games){
  const {g,base,shapeColumns}=prepared(columns,rows),ranks=Array.from({length:g.cellCount+1},()=>({transitions:0,insertions:0,retirements:0,overstated:0}));
  const reducedToFull=new Map(),naiveKeys=new Map();
  let seed=0x174c0fac;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
  let transitions=0,insertions=0,retirements=0,retiredColumns=0,overstatedMasks=0,understatedMasks=0,additionalCollapses=0,naiveAliases=0,witness=null,sparseEligible=0;
  const retirementHistogram=Array(columns+1).fill(0),sparseFixtures=[];
  for(let game=0;game<games;game++){
    let q=connect4RbaFromMoves([],{geometry:g,canonical:false});const moves=[];
    for(let rank=0;rank<g.cellCount;rank++){
      const parent=describe(g,q.words,q.basis),legal=[];
      for(let c=0;c<columns;c++)if(q.words[c]<rows)legal.push(c);
      if(!legal.length)break;
      const column=legal[random()%legal.length],emitted=[];
      const profile={...base,prepareSubset(geometry,id){emitted.push(id);return base.prepareSubset(geometry,id);}};
      moves.push(column);
      const child=childOf(g,profile,q,column);transitions++;ranks[rank].transitions++;
      insertions+=emitted.length;ranks[rank].insertions+=emitted.length;
      if(child.term)break;
      const d=describe(g,child.words,child.basis);let fused=0;
      let sparse=true;
      for(let p=0;p<2;p++){let count=0;for(let w=0;w<g.coordWords;w++){let bits=child.words[(p?g.p1Offset:g.p0Offset)+w];while(bits){bits&=bits-1;count++;}}if(count>1)sparse=false;}
      let inactive=((1<<columns)-1)&~d.active;
      if(sparse&&(inactive&(inactive-1))){sparseEligible++;if(sparseFixtures.length<24)sparseFixtures.push(moves.slice());}
      for(const id of emitted)fused|=shapeColumns[id];
      if(fused&~d.active){overstatedMasks++;ranks[rank].overstated++;witness??={rank,column,parentWords:Array.from(q.words),parentBasis:Array.from(q.basis),childWords:Array.from(child.words),childBasis:Array.from(child.basis),emitted,fused,active:d.active,minima:d.minima};}
      if(d.active&~fused)understatedMasks++;
      assert.equal(d.active&~parent.active,0,'a minimal residual column reactivated');
      const retired=parent.active&~d.active;
      if(retired){retirements++;ranks[rank].retirements++;let bits=retired,k=0;while(bits){bits&=bits-1;k++;}retiredColumns+=k;retirementHistogram[k]++;}
      const full=Array.from(child.words).join(',');let fs=reducedToFull.get(d.key);
      if(!fs){fs=new Set();reducedToFull.set(d.key,fs);}if(fs.size&&!fs.has(full))additionalCollapses++;fs.add(full);
      const nk=naiveKeys.get(d.naive);if(nk&&nk!==d.key)naiveAliases++;else naiveKeys.set(d.naive,d.key);
      q=child;
    }
  }
  return {geometry:[columns,rows],games,seed:'0x174c0fac',sampling:'deterministic uniformly chosen legal moves until first terminal; NOT solver visit distribution',transitions,insertions,insertionsPerChild:insertions/transitions,retirements,retiredColumns,retirementHistogram,overstatedMasks,understatedMasks,additionalCollapses,naiveAliases,sparseEligible,sparseFixtures,ranks,witness};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result={bounded:qualifyGraph(4,4),standard:sampleTransitions(7,6,2000)};
  writeFileSync(new URL('./census-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({bounded:result.bounded,standard:{...result.standard,ranks:undefined,witness:undefined}}));
}
