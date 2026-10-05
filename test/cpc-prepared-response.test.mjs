import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {evaluateConnect4CpcWin32 as inherited} from '../addons/cpc-connect4.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
import {prepareConnect4CpcWin32} from '../addons/connect4-cpc-prepared-win.mjs';
const api={prepareConnect4CpcWin32,...await import('../addons/connect4-cpc-prepared-response.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;})};

test('four-worker minimal search agrees with a physically verified CPC win certificate',async()=>{
  const W=7,H=6,g=prepareConnect4RbaGeometry({columns:W,rows:H}),b=physical(W,H),
    moves=Array.from('24447434',c=>Number(c)-1);
  for(const c of moves)b.push(c);
  const result=await runLazySmpConnect4Rba32(moves,{geometry:g,workers:4,workerMode:'minimal',sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:5000});
  assert.equal(b.certificate(1,false),1);
  assert.equal(result.status,'EXACT',JSON.stringify(result));
  assert.equal(result.rootWdl,-1);assert.ok(result.move>=0&&b.height[result.move]<H);
  assert.equal(result.cleanup,true);assert.equal(result.workersExited,4);
});

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
      if(b.winner()>=0||controller===rank%2||(W*H-rank)%2)return 0;
      const board=Array.from(cells),heights=Array.from(height);
      if(reflected){for(let y=0;y<H;y++)for(let x=0;x<W;x++)board[y*W+x]=cells[y*W+W-1-x];heights.reverse();}
      const fixed=new Set(),pairs=[],odd=[];
      for(let c=0;c<W;c++){
        let start=heights[c];
        if((H-start)%2){odd.push(start*W+c);start++;}
        for(let r=start;r+1<H;r+=2){pairs.push([r*W+c,(r+1)*W+c]);fixed.add((r+1)*W+c);}
      }
      if(odd.length%2)return 0;
      for(let i=0;i<odd.length;i+=2)pairs.push([odd[i],odd[i+1]]);
      let ownWin=false;
      for(const l of lines){
        const empty=l.filter(c=>board[c]<0);
        if(l.every(c=>board[c]!==1-controller)&&empty.every(c=>fixed.has(c)))ownWin=true;
        if(l.every(c=>board[c]!==controller)&&!empty.some(c=>fixed.has(c))&&!pairs.some(([a,b])=>empty.includes(a)&&empty.includes(b)))return 0;
      }
      return ownWin?1:2;
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

test('prepared CPC equals literal guarded policy and physical exact game on bounded carriers',()=>{
  assert.equal(typeof api.prepareConnect4CpcWin32,'function');
  assert.equal(typeof api.evaluateConnect4PreparedCpcResponse32,'function');
  let checked=0,positive=0,nonloss=0;
  for(const [W,H] of [[4,3],[3,4]]){
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),p=api.prepareConnect4CpcWin32(g),b=physical(W,H),seen=new Set(),moves=[];
    function visit(){
      if(b.winner()>=0||b.rank===W*H)return;
      const key=b.cells.join(',');if(seen.has(key))return;seen.add(key);
      for(const canonical of [false,true]){
        const q=connect4RbaFromMoves(moves,{geometry:g,canonical}),controller=1-b.rank%2;
        const actual=api.evaluateConnect4PreparedCpcResponse32(p,q.words,0,q.basis,0,q.basis.length,controller);
        assert.equal(actual===1?1:0,inherited(g,q.words,0,q.basis,0,q.basis.length,controller));
        assert.equal(actual,b.certificate(controller,q.reflected),JSON.stringify({W,H,moves,canonical}));
        if(actual){positive++;if(actual===1)assert.equal(b.exact(),-1);else{nonloss++;assert.ok(b.exact()<=0);}}
        checked++;
      }
      for(let c=0;c<W;c++)if(b.height[c]<H){b.push(c);moves.push(c);visit();moves.pop();b.pop(c);}
    }
    visit();
  }
  assert.ok(checked>1000);assert.ok(positive>0);assert.ok(nonloss>0);
  console.log(JSON.stringify({kind:'cpc-response-exhaustive-small-physical-policy',checked,positive,nonloss}));
});

test('prepared CPC preserves literal policy across general geometry, frames and support',()=>{
  assert.equal(typeof api.prepareConnect4CpcWin32,'function');
  let seed=274291,checked=0,positive=0,nonloss=0;
  const rand=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
  for(const [W,H] of [[1,4],[4,1],[4,4],[7,5],[7,6],[8,4],[33,4],[10,10],[3,3]]){
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),p=api.prepareConnect4CpcWin32(g);
    for(let trial=0;trial<30;trial++){
      const b=physical(W,H),moves=[];
      while(b.rank<W*H){
        for(const canonical of [false,true]){
          const q=connect4RbaFromMoves(moves,{geometry:g,canonical}),controller=1-b.rank%2;
          const actual=api.evaluateConnect4PreparedCpcResponse32(p,q.words,0,q.basis,0,q.basis.length,controller);
          assert.equal(actual===1?1:0,inherited(g,q.words,0,q.basis,0,q.basis.length,controller));
          assert.equal(actual,b.certificate(controller,q.reflected),JSON.stringify({W,H,moves,canonical}));
          assert.equal(api.evaluateConnect4PreparedCpcResponse32(p,q.words,0,q.basis,0,q.basis.length,1-controller),0);
          const words=new Uint32Array(q.words.length+10).fill(0xffffffff),basis=new Uint32Array(q.basis.length+14).fill(0xffffffff);
          words.set(q.words,5);basis.set(q.basis,7);
          for(const owner of [g.p0Offset,g.p1Offset])for(let w=0;w<g.coordWords;w++){
            const valid=q.basis.length-(w<<5);
            if(valid<=0)words[5+owner+w]=0xffffffff;
            else if(valid<32)words[5+owner+w]|=0xffffffff<<valid;
          }
          assert.equal(api.evaluateConnect4PreparedCpcResponse32(p,words,5,basis,7,q.basis.length,controller),actual,'offset and poisoned inactive tails');
          words[5+g.metaOffset]|=2;
          assert.equal(api.evaluateConnect4PreparedCpcResponse32(p,words,5,basis,7,q.basis.length,controller),0,'terminal state is never a policy premise');
          if(actual){positive++;if(actual===2)nonloss++;if(W===4&&H<=4){if(actual===1)assert.equal(b.exact(),-1);else assert.ok(b.exact()<=0);}}
          checked++;
        }
        const legal=[];for(let c=0;c<W;c++)if(b.height[c]<H)legal.push(c);
        const c=legal[rand(legal.length)];b.push(c);moves.push(c);
        if(b.winner()>=0)break;
      }
    }
  }
  assert.ok(checked>1000);
  console.log(JSON.stringify({kind:'cpc-response-general-physical-policy',checked,positive,nonloss}));
});


