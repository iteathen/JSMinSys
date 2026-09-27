import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';
import {orderFeatures,labelRanks,makeCorpus} from './move-confidence.mjs';
import {Worker} from 'node:worker_threads';

test('offline worker accepts signed-zero draw while retaining losing alternatives',async()=>{
  const messages=[];
  await new Promise((resolve,reject)=>{
    const w=new Worker(new URL('./move-confidence-label-worker.mjs',import.meta.url),{workerData:{moves:[1,2,2,2,6,2,0,1,6,5,6,6,4,0,3,0,5,0,6,6,1,5,0,0]}});
    w.on('message',m=>messages.push(m));w.on('error',reject);w.on('exit',code=>code?reject(Error('worker exit '+code)):resolve());
  });
  const result=messages.find(m=>m.type==='complete');assert.ok(result);assert.equal(result.ranks.best,0);
  assert.equal(result.ranks.firstOptimalRank,4);assert.equal(result.ranks.firstCorrect,false);
});

test('gap bins and optimal ties do not privilege one arbitrary winning witness',()=>{
  const f={ordered:[{column:2,score:5},{column:1,score:5},{column:0,score:3}],raw:[{column:2,score:5},{column:1,score:5},{column:0,score:3}]};
  assert.deepEqual(labelRanks(f,[-1,1,1]),{best:1,firstCorrect:true,rawFirstCorrect:true,firstOptimalRank:1,optimalCount:2,allEquivalent:false});
  assert.equal(labelRanks(f,[1,0,-1]).firstOptimalRank,3);
  assert.equal(labelRanks(f,[-1,-1,-1]).allEquivalent,true);
});

test('features reproduce actual native root ordering, including reflection and CPC',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const corpus=makeCorpus(g,{plies:[10,12],perPly:8,seed:0x5021});
  for(const {moves} of corpus){
    for(const seq of [moves,moves.map(c=>3-c)]){
      const root=connect4RbaFromMoves(seq,{geometry:g}),f=orderFeatures(g,root);
      const state=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024});
      solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
      assert.deepEqual(f.ordered.map(x=>x.column),Array.from(state.moveOrder.subarray(0,f.ordered.length)));
      const board=new Int8Array(16).fill(-1),height=new Uint8Array(4);
      seq.forEach((c,p)=>{board[height[c]++*4+c]=p&1;});
      for(const a of f.raw){let score=0;const cell=height[a.column]*4+a.column;
        for(let line=0;line<g.lineCount;line++){
          let through=false,blocked=false;
          for(let k=0;k<4;k++){const at=g.lineRow[line*4+k]*4+g.lineColumn[line*4+k];through||=at===cell;blocked||=board[at]===1-(seq.length&1);}
          if(through&&!blocked)score++;
        }
        assert.equal(a.score,score,'independent physical line count');
      }
      assert.equal(f.topTies,f.ordered.filter(a=>a.score===f.ordered[0].score).length);
    }
  }
});

test('all-action labeling agrees with independent physical minimax',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),state=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:1024});
  const terminal=(b,p)=>{for(let l=0;l<g.lineCount;l++){const cells=Array.from({length:4},(_,k)=>g.lineRow[l*4+k]*4+g.lineColumn[l*4+k]);
    if(cells.every(c=>b[c]===0))return 3;if(cells.every(c=>b[c]===1))return 1;}return p===16?2:0;};
  function exact(b,h,p){const t=terminal(b,p);if(t)return t;let best=p&1?4:0;
    for(let c=0;c<4;c++)if(h[c]<4){const at=h[c]++*4+c;b[at]=p&1;const v=exact(b,h,p+1);b[at]=-1;h[c]--;best=p&1?Math.min(best,v):Math.max(best,v);}return best;}
  for(const {moves} of makeCorpus(g,{plies:[12],perPly:16,seed:0x7031})){
    const b=new Int8Array(16).fill(-1),h=new Uint8Array(4);moves.forEach((c,p)=>b[h[c]++*4+c]=p&1);
    const root=connect4RbaFromMoves(moves,{geometry:g}),f=orderFeatures(g,root),values=Array(4).fill(null);
    for(const {column:c} of f.raw){const at=h[c]++*4+c;b[at]=moves.length&1;
      const expected=exact(b,h,moves.length+1);b[at]=-1;h[c]--;
      const child=connect4RbaFromMoves([...moves,c],{geometry:g});
      const r=solveConnect4RbaAlphaBeta(child,{state,reflected:child.reflected});
      assert.equal(r.value,expected);values[c]=moves.length&1?2-r.value:r.value-2;
    }
    assert.equal(labelRanks(f,values).best,(moves.length&1)?2-exact(b,h,moves.length):exact(b,h,moves.length)-2);
  }
});
