import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import * as liveApi from '../addons/connect4-live-line-evaluator.mjs';
const orderApi=await import('../addons/connect4-live-line-order.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});

test('three-word live update matches general update in-place and disjoint',()=>{
  assert.equal(typeof liveApi.advanceConnect4LiveLineState3x32,'function');
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),p=liveApi.prepareConnect4LiveLineEvaluator32(g);
  const a=new Uint32Array(18),b=new Uint32Array(18);liveApi.resetConnect4LiveLineState32(p,a,0);b.set(a);
  for(let cell=0;cell<g.cellCount;cell++)for(const mover of [0,1]){
    liveApi.advanceConnect4LiveLineState32(p,a,0,mover,cell,a,6);
    liveApi.advanceConnect4LiveLineState3x32(p,b,0,mover,cell,b,6);assert.deepEqual(b,a);
    liveApi.advanceConnect4LiveLineState32(p,a,0,mover,cell,a,0);
    liveApi.advanceConnect4LiveLineState3x32(p,b,0,mover,cell,b,0);assert.deepEqual(b,a);
  }
});

test('live-line ordering equals physical line counts across frames and dimensions',()=>{
  assert.equal(typeof orderApi.prepareConnect4LiveLineOrder32,'function');
  for(const [W,H] of [[7,6],[7,5],[4,4],[3,3],[33,4]]){
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),center=(W-1)/2;
    const ties=Uint32Array.from(Array.from({length:W},(_,i)=>i).sort((a,b)=>Math.abs(a-center)-Math.abs(b-center)||b-a));
    const moves=[0,W-1,0],cells=new Int8Array(W*H).fill(-1),heights=new Uint32Array(W);
    for(let i=0;i<moves.length;i++){const c=moves[i];cells[heights[c]++*W+c]=i&1;}
    const o=orderApi.prepareConnect4LiveLineOrder32(g,ties,moves);
    assert.equal(o.profile.wordCount,(g.lineCount+31)>>>5);
    const generic={...o,scores:new Uint32Array((g.cellCount+1)*W)};
    for(const orientation of [0,1])for(const mover of [0,1]){
      const words=new Uint32Array(g.keyWords);
      for(let c=0;c<W;c++)words[c]=heights[orientation?W-1-c:c];
      const expected=[];
      for(const c of ties){
        const r=words[c];if(r>=H)continue;
        const physical=orientation?W-1-c:c;let score=0;
        for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
          const ex=x+3*dx,ey=y+3*dy;if(ex<0||ex>=W||ey<0||ey>=H)continue;
          let includes=false,blocked=false;
          for(let k=0;k<4;k++){const xx=x+k*dx,yy=y+k*dy;includes||=xx===physical&&yy===r;blocked||=cells[yy*W+xx]===(mover^1);}
          if(includes&&!blocked)score++;
        }
        expected.push({c,score});
      }
      expected.sort((a,b)=>b.score-a.score);
      const count=o.order(o,words,0,mover,orientation,0,W);
      assert.deepEqual(Array.from(o.ordered.subarray(W,W+count),x=>x&o.mask),expected.map(x=>x.c));
      const plainCount=orderApi.orderConnect4LiveLineGeneral32(generic,words,0,mover,orientation,0,W);
      assert.deepEqual(Array.from(generic.ordered.subarray(W,W+plainCount)),expected.map(x=>x.c));
      for(let c=0;c<W;c++){
        const pc=orientation?W-1-c:c,cell=words[c]*W+pc;if(words[c]>=H)continue;
        assert.equal(o.score(o.profile.through,cell*o.profile.wordCount,o.state,mover*o.profile.wordCount,o.profile.wordCount),expected.find(x=>x.c===c).score);
      }
    }
  }
});
