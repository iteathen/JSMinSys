import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {resetConnect4LiveLineState32,advanceConnect4LiveLineState32} from '../addons/connect4-live-line-evaluator.mjs';

// Expose the real restricted recursion for directed-window tests without adding
// a public production entry point or altering its body.
const url=new URL('../addons/rba-connect4-alphabeta.mjs',import.meta.url);
const source=readFileSync(url,'utf8').replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,url).href}'`);
const api=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {searchCpcOnly};').toString('base64'));
function prepared(g,moves){
  const root=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),s=api.prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:65536});
  s.words.set(root.words);s.basis.set(root.basis);s.basisSize[0]=root.basis.length;
  resetConnect4LiveLineState32(s.live,s.liveState,0);
  for(let ply=0;ply<moves.length;ply++){
    const c=moves[ply],cell=s.liveHeights[c]++*g.columns+c;
    advanceConnect4LiveLineState32(s.live,s.liveState,0,ply&1,cell,s.liveState,0);
  }
  return {root,s};
}
const search=(g,moves,a,b)=>{
  const {root,s}=prepared(g,moves);
  const value=api.searchCpcOnly(s,0,0,0,root.basis.length,moves.length&1,0,0,0,a,b);
  return {value,cached:api.probeConnect4RbaExactCache32(s.cache,root.words,0),s};
};
test('a recursive fail-high win publishes exact current-q WDL',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),moves=[3,4,3,5,0,5,5,6];
  const r=search(g,moves,0,1);
  assert.equal(r.value,1);assert.ok(r.s.nodes>1);
  assert.equal(r.cached,3,'V>=1 is exact; recursive endpoint must survive the cutoff');
});

test('directed narrow windows and cached q values agree with an independent physical 4x4 oracle',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),lines=[],memo=new Map();
  for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]]){
    if(c+3*dc>=4||r+3*dr<0||r+3*dr>=4)continue;
    let mask=0;for(let i=0;i<4;i++)mask|=1<<((r+i*dr)*4+c+i*dc);lines.push(mask);
  }
  const terminal=(p0,p1)=>lines.some(m=>(p0&m)===m)?3:lines.some(m=>(p1&m)===m)?1:(p0|p1)===65535?2:0;
  function oracle(p0,p1,heights,ply){
    const t=terminal(p0,p1);if(t)return t;
    const key=p0+p1*65536,hit=memo.get(key);if(hit!==undefined)return hit;
    const player=ply&1;let best=player?4:0;
    for(let c=0;c<4;c++)if(heights[c]<4){
      const bit=1<<(heights[c]++*4+c),v=oracle(player?p0:p0|bit,player?p1|bit:p1,heights,ply+1);heights[c]--;
      best=player?Math.min(best,v):Math.max(best,v);if(best===(player?1:3))break;
    }
    memo.set(key,best);return best;
  }
  let seed=55129,checked=0,forced=0,endpointHits=0;const values=new Set();
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
  for(let game=0;game<40;game++){
    let p0=0,p1=0;const heights=[0,0,0,0],moves=[];
    for(let ply=0;ply<6+game%7;ply++){
      const legal=[0,1,2,3].filter(c=>heights[c]<4),c=legal[random()%legal.length],bit=1<<(heights[c]++*4+c);
      if(ply&1)p1|=bit;else p0|=bit;moves.push(c);if(terminal(p0,p1))break;
    }
    if(terminal(p0,p1))continue;
    const absolute=oracle(p0,p1,heights,moves.length),expected=(moves.length&1)?2-absolute:absolute-2;values.add(absolute);
    for(const history of [moves,moves.map(c=>3-c)])for(const [a,b] of [[-2,2],[-1,0],[0,1],[-2,-1],[1,2]]){
      const r=search(g,history,a,b);
      if(r.value<=a)assert.ok(expected<=r.value);
      else if(r.value>=b)assert.ok(expected>=r.value);
      else assert.equal(r.value+0,expected+0);
      if(r.cached){assert.equal(r.cached,absolute);if(r.cached!==2)endpointHits++;}
      if(r.s.cpc.forcedTotal)forced++;checked++;
    }
  }
  assert.ok(checked>=200);assert.ok(forced>0);assert.ok(endpointHits>0);assert.equal(values.size,3);
});
