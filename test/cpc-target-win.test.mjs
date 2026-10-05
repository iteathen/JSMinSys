import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {evaluateConnect4CpcWin32 as inherited} from '../addons/cpc-connect4.mjs';
const api=await import('../addons/connect4-cpc-target-win.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});

// Independent physical board and literal response strategy. No RBA shape,
// coordinate, parity helper or candidate table is reused for this oracle.
function physical(W,H){
  const cells=new Int8Array(W*H).fill(-1),height=new Uint32Array(W),lines=[];
  let rank=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
    const xx=x+3*dx,yy=y+3*dy;
    if(xx>=0&&xx<W&&yy>=0&&yy<H)lines.push(Array.from({length:4},(_,j)=>(y+j*dy)*W+x+j*dx));
  }
  const memo=new Map();
  const b={cells,height,lines,get rank(){return rank;},
    push(c){cells[height[c]++*W+c]=(rank++)%2;},
    pop(c){cells[--height[c]*W+c]=-1;rank--;},
    winner(){for(const l of lines){const p=cells[l[0]];if(p>=0&&l.every(c=>cells[c]===p))return p;}return -1;},
    certificate(controller,reflected){
      if(b.winner()>=0||controller===rank%2)return 0;
      const board=Array.from(cells),heights=Array.from(height);
      if(reflected){for(let y=0;y<H;y++)for(let x=0;x<W;x++)board[y*W+x]=cells[y*W+W-1-x];heights.reverse();}
      for(let target=0;target<W*H;target++){
        const tc=target%W,tr=Math.floor(target/W);
        if(tr<=heights[tc])continue;
        if(!lines.some(l=>l.includes(target)&&l.every(c=>c===target||board[c]===controller)))continue;
        const caps=Array(W).fill(H);caps[tc]=tr+1;
        if(caps.reduce((sum,cap,c)=>sum+cap-heights[c],0)%2)continue;
        const fixed=new Set(),pairs=[],odd=[];
        for(let c=0;c<W;c++){
          let first=heights[c];if((caps[c]-first)%2){odd.push(first*W+c);first++;}
          for(let r=first;r+1<caps[c];r+=2){pairs.push([r*W+c,(r+1)*W+c]);fixed.add((r+1)*W+c);}
        }
        if(odd.length%2)continue;
        for(let i=0;i<odd.length;i+=2)pairs.push([odd[i],odd[i+1]]);
        if(!fixed.has(target))continue;
        let denied=true;
        for(const l of lines)if(l.every(c=>board[c]!==controller)){
          const empty=l.filter(c=>board[c]<0);
          // Above-target cells require an event after the guaranteed first win.
          if(empty.some(c=>Math.floor(c/W)>=caps[c%W]))continue;
          if(!empty.some(c=>fixed.has(c))&&!pairs.some(([a,b])=>empty.includes(a)&&empty.includes(b))){denied=false;break;}
        }
        if(denied)return 1;
      }
      return 0;
    },
    exact(){
      const winner=b.winner();if(winner>=0)return winner===rank%2?1:-1;
      if(rank===W*H)return 0;
      const key=cells.join(',');if(memo.has(key))return memo.get(key);
      let best=-2;
      for(let c=0;c<W;c++)if(height[c]<H){b.push(c);const value=-b.exact();b.pop(c);if(value>best)best=value;if(best===1)break;}
      memo.set(key,best);return best;
    },
  };return b;
}

test('target-reservoir CPC equals literal guarded policy and physical exact game on bounded carriers',()=>{
  assert.equal(typeof api.prepareConnect4CpcTargetWin32,'function');
  assert.equal(typeof api.evaluateConnect4CpcTargetDenseWin32,'function');
  assert.equal(typeof api.evaluateConnect4CpcTargetGeneralWin32,'function');
  let checked=0,positive=0,added=0;
  for(const [W,H] of [[4,3],[3,4]]){
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),p=api.prepareConnect4CpcTargetWin32(g),generic=api.prepareConnect4CpcTargetWin32(g,{planBudgetBytes:0}),b=physical(W,H),seen=new Set(),moves=[];
    function visit(){
      if(b.winner()>=0||b.rank===W*H)return;
      const key=b.cells.join(',');if(seen.has(key))return;seen.add(key);
      for(const canonical of [false,true]){
        const q=connect4RbaFromMoves(moves,{geometry:g,canonical}),controller=1-b.rank%2;
        const actual=p.evaluate(p,q.words,0,q.basis,0,q.basis.length,controller);
        assert.equal(actual,generic.evaluate(generic,q.words,0,q.basis,0,q.basis.length,controller));
        if(actual&&!inherited(g,q.words,0,q.basis,0,q.basis.length,controller))added++;
        assert.equal(actual,b.certificate(controller,q.reflected),JSON.stringify({W,H,moves,canonical}));
        if(actual){positive++;assert.equal(b.exact(),-1);}
        checked++;
      }
      for(let c=0;c<W;c++)if(b.height[c]<H){b.push(c);moves.push(c);visit();moves.pop();b.pop(c);}
    }
    visit();
  }
  assert.ok(checked>1000);assert.ok(positive>0);
  console.log(JSON.stringify({kind:'cpc-target-exhaustive-small-physical-policy',checked,positive,added}));
});

test('target-reservoir CPC preserves literal policy across general geometry, frames and support',()=>{
  assert.equal(typeof api.prepareConnect4CpcTargetWin32,'function');
  let seed=274291,checked=0,positive=0,added=0;
  const rand=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
  for(const [W,H] of [[4,4],[7,5],[7,6],[8,4],[33,4],[4,33],[3,3]]){
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),p=api.prepareConnect4CpcTargetWin32(g),generic=api.prepareConnect4CpcTargetWin32(g,{planBudgetBytes:0});
    for(let trial=0;trial<30;trial++){
      const b=physical(W,H),moves=[];
      while(b.rank<W*H){
        for(const canonical of [false,true]){
          const q=connect4RbaFromMoves(moves,{geometry:g,canonical}),controller=1-b.rank%2;
          const actual=p.evaluate(p,q.words,0,q.basis,0,q.basis.length,controller);
          assert.equal(actual,generic.evaluate(generic,q.words,0,q.basis,0,q.basis.length,controller));
        if(actual&&!inherited(g,q.words,0,q.basis,0,q.basis.length,controller))added++;
          assert.equal(actual,b.certificate(controller,q.reflected),JSON.stringify({W,H,moves,canonical}));
          assert.equal(p.evaluate(p,q.words,0,q.basis,0,q.basis.length,1-controller),0);
          if(actual){positive++;if(W===4&&H===4)assert.equal(b.exact(),-1);}
          checked++;
        }
        const legal=[];for(let c=0;c<W;c++)if(b.height[c]<H)legal.push(c);
        const c=legal[rand(legal.length)];b.push(c);moves.push(c);
        if(b.winner()>=0)break;
      }
    }
  }
  assert.ok(checked>1000);
  console.log(JSON.stringify({kind:'cpc-target-general-physical-policy',checked,positive,added}));
});
