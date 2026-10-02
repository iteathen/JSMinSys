import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile as prepareReference} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownHeight as reference,connect4RbaBasisFromSupport} from '../addons/rba-connect4-coordinate.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaExecutionProfile as prepareCandidate} from '../experiments/isomax-lean/profile-supersets.mjs';
import * as csr from '../experiments/isomax-lean/coordinate-supersets.mjs';
import * as constants from '../experiments/isomax-lean/coordinate-constants.mjs';
import * as masks from '../experiments/isomax-lean/coordinate-masks.mjs';

function transition(g,profile,fn,q,column,poison=0,tailId=-1,tailIndex=0){
  const src=3,bi=5,dst=4,ci=7;
  const source=new Uint32Array(src+g.keyWords+2).fill(0xdeadbeef);
  const parent=new Uint32Array(bi+g.maxBasis+2).fill(0xdeadbeef);
  source.set(q.words,src);parent.set(q.basis,bi);
  const words=new Uint32Array(dst+g.keyWords+2).fill(0xa5a5a5a5);
  const basis=new Uint32Array(ci+g.maxBasis+2).fill(0xffffffff);
  const scratch=prepareConnect4RbaCoordinateScratch(g),sizes=new Uint32Array(3).fill(999);
  scratch.inverse.fill(poison);
  if(tailId>=0){scratch.inverse[tailId]=tailIndex;basis[ci+tailIndex]=tailId;}
  const term=fn(g,profile,source,src,parent,bi,q.basis.length,column,q.words[column],
    words,dst,basis,ci,scratch.seen,sizes,1,scratch.map,scratch.inverse);
  assert.deepEqual(source.slice(src,src+g.keyWords),q.words,'source remains unchanged');
  assert.deepEqual(parent.slice(bi,bi+q.basis.length),q.basis,'parent basis remains unchanged');
  assert.equal(words[dst-1],0xa5a5a5a5);assert.equal(words[dst+g.keyWords],0xa5a5a5a5);
  assert.equal(sizes[0],999);assert.equal(sizes[2],999);
  return {term,words:words.slice(dst,dst+g.keyWords),basis:basis.slice(ci,ci+sizes[1])};
}

for(const [label,api] of Object.entries({csr,constants,masks})){
const {connect4RbaCofactorKnownHeight:candidate,connect4RbaCanonicalize}=api;
test(label+': cofactors match every legal child along deterministic walks and reflected gauges',()=>{
  let checked=0,terminals=0,seed=0x510ca7e;
  const random=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  for(const budget of [0,2097152]){
    const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes:budget});
    const base=prepareReference(g),fast=prepareCandidate(g);
    for(let game=0;game<4;game++){
      let moves=[];
      for(let ply=0;ply<32;ply++){
        const natural=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
        if(natural.words[g.metaOffset]&3)break;
        for(const reflected of [false,true]){
          const history=reflected?moves.map(c=>6-c):moves;
          const q=connect4RbaFromMoves(history,{geometry:g,canonical:false});
          for(let column=0;column<g.columns;column++)if(q.words[column]<g.rows){
            const expected=transition(g,base,reference,q,column);
            for(const poison of [0,0xffffffff]){
              const actual=transition(g,fast,candidate,q,column,poison);
              assert.deepEqual(actual,expected,`budget=${budget} game=${game} ply=${ply} reflected=${reflected} column=${column} poison=${poison}`);
              if(!actual.term){
                const scratch=prepareConnect4RbaCoordinateScratch(g);
                connect4RbaCanonicalize(g,fast,actual.words,0,actual.basis,0,actual.basis.length,scratch);
                const ingress=connect4RbaFromMoves([...history,column],{geometry:g});
                assert.deepEqual(actual.words,ingress.words);
                assert.deepEqual(actual.basis,ingress.basis);
              }else{
                terminals++;
                assert.equal(actual.basis.length,0);
                assert.ok(actual.words.slice(g.p0Offset).every(x=>x===0));
              }
              checked++;
            }
          }
        }
        const legal=Array.from({length:7},(_,c)=>c).filter(c=>natural.words[c]<g.rows);
        moves.push(legal[random()%legal.length]);
      }
    }
  }
  assert.ok(checked>1000);assert.ok(terminals>0);
});

test(label+': excludes absent supersets even when inverse scratch points to a matching stale tail',()=>{
  let exercised=0;
  for(const budget of [0,2097152]){
    const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes:budget});
    const base=prepareReference(g),fast=prepareCandidate(g);
    const q=connect4RbaFromMoves([3,2,3,2,4,1,4,1],{geometry:g,canonical:false});
    for(let column=0;column<7;column++){
      const expected=transition(g,base,reference,q,column);
      if(expected.term)continue;
      const cell=q.words[column]*7+column,remove=base.prepareRemove(g,cell),player=(q.words[g.metaOffset]>>>2)&1;
      for(let i=0;i<q.basis.length;i++){
        const id=q.basis[i],image=base.removePrepared(g,id,remove);
        if(image<0)continue;
        const bit=1<<(i&31),word=i>>>5;
        const active0=(q.words[g.p0Offset+word]&bit)&&(player===0||image===id);
        const active1=(q.words[g.p1Offset+word]&bit)&&(player===1||image===id);
        if(!active0&&!active1)continue;
        const absent=Array.from(fast.supersetIds.slice(fast.supersetOffsets[image],fast.supersetOffsets[image+1]))
          .find(s=>!expected.basis.includes(s));
        if(absent===undefined)continue;
        // Without j < cn, equality against retained basis memory would accept
        // this absent shape and set a coordinate bit beyond the current basis.
        const actual=transition(g,fast,candidate,q,column,0,absent,expected.basis.length);
        assert.deepEqual(actual,expected);exercised++;break;
      }
    }
  }
  assert.ok(exercised>=2,'directed fixture must exercise the stale-tail case');
});

test(label+': preserves both players first wins and full-board draw/win precedence',()=>{
  for(const budget of [0,2097152]){
    const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes:budget});
    const base=prepareReference(g),fast=prepareCandidate(g);
    for(const [moves,column,value] of [[[0,1,0,1,0,2],0,3],[[0,1,0,1,2,1,2],1,1]]){
      const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
      const actual=transition(g,fast,candidate,q,column,0xffffffff);
      assert.deepEqual(actual,transition(g,base,reference,q,column));
      assert.equal(actual.term,value);assert.equal(actual.basis.length,0);
    }
    // Directed coordinate-contract states with one legal cell remaining.
    // Rank 41 makes player 1 move; a singleton win must precede the draw.
    for(const win of [false,true]){
      const words=new Uint32Array(g.keyWords);words.fill(6,0,7);words[6]=5;words[g.metaOffset]=41<<2;
      const out=new Uint32Array(g.maxBasis),seen=new Uint32Array(g.shapeWordCount);
      const n=connect4RbaBasisFromSupport(g,words,0,out,0,seen),basis=out.slice(0,n);
      assert.deepEqual(Array.from(basis),[41]);
      if(win)words[g.p1Offset]=1;
      const q={words,basis},actual=transition(g,fast,candidate,q,6,0xffffffff);
      assert.deepEqual(actual,transition(g,base,reference,q,6));
      assert.equal(actual.term,win?1:2);assert.equal(actual.words[g.metaOffset],(42<<2)|(win?1:2));
      assert.equal(actual.basis.length,0);assert.ok(actual.words.slice(g.p0Offset).every(x=>x===0));
    }
  }
});
}
