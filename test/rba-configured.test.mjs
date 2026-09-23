import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront} from '../addons/rba-connect4-front.mjs';
import {connect4RbaFromMoves,prepareConnect4RbaEvaluator,evaluateConnect4RbaTt32,publishConnect4RbaEvaluation32,reconcileConnect4RbaEvent32,assertConnect4RbaTtCompatibility} from '../addons/rba-connect4-solver.mjs';
import {createRbaTt32,rbaTtIntern32,rbaTtSetRoot32,rbaTtEnqueue32,rbaTtTake32,rbaTtTakeEvent32,RBA_TT_DONE,RBA_TT_STOP} from '../addons/rba-tt32.mjs';

function lines(columns,rows){
  const out=[];for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]])
    if(c+3*dc<columns&&r+3*dr>=0&&r+3*dr<rows)out.push(Array.from({length:4},(_,i)=>(r+i*dr)*columns+c+i*dc));
  return out;
}
function position(columns,rows,moves=[]){
  const win=lines(columns,rows),board=new Int32Array(columns*rows).fill(-1),heights=new Uint32Array(columns);let ply=0,terminal=0;
  for(const c of moves){if(terminal||c<0||c>=columns||heights[c]>=rows)throw Error('illegal');const p=ply&1;board[heights[c]++*columns+c]=p;ply++;
    if(win.some(line=>line.every(cell=>board[cell]===p)))terminal=p?1:3;else if(ply===columns*rows)terminal=2;}
  return {board,heights,ply,terminal,win};
}
function residuals(pos,player){return pos.win.filter(line=>line.every(cell=>pos.board[cell]!==(player^1))).map(line=>line.filter(cell=>pos.board[cell]===-1));}
function exact(columns,rows,moves){
  const p=position(columns,rows,moves);if(p.terminal)return {value:p.terminal,move:-1};
  const order=Array.from({length:columns},(_,c)=>c).sort((a,b)=>Math.abs(a-(columns-1)/2)-Math.abs(b-(columns-1)/2)||a-b);
  let best=p.ply&1?4:0,move=-1;
  for(const c of order)if(p.heights[c]<rows){const v=exact(columns,rows,[...moves,c]).value;if(p.ply&1?v<best:v>best){best=v;move=c;}if(best===(p.ply&1?1:3))break;}
  return {value:best,move};
}
function bounds(columns,rows,moves,depth){
  const p=position(columns,rows,moves);if(p.terminal)return [p.terminal,p.terminal];if(!depth)return [1,3];
  let lo=p.ply&1?4:0,hi=lo;
  for(let c=0;c<columns;c++)if(p.heights[c]<rows){const v=bounds(columns,rows,[...moves,c],depth-1);lo=p.ply&1?Math.min(lo,v[0]):Math.max(lo,v[0]);hi=p.ply&1?Math.min(hi,v[1]):Math.max(hi,v[1]);}
  return [lo,hi];
}
function shapeCells(g,id){const out=[];for(let i=0;i<g.shapeSize[id];i++)out.push(g.shapeCells[id*4+i]);return out;}

test('geometry derives different native carrier sizes for 4x4 and 10x10',()=>{
  const a=prepareConnect4RbaGeometry({columns:4,rows:4}),b=prepareConnect4RbaGeometry({columns:10,rows:10});
  assert.equal(a.lineCount,10);assert.equal(a.edgeCapacity,4);assert.equal(a.coordWords,1);assert.equal(a.keyWords,7);
  assert.equal(b.lineCount,238);assert.equal(b.edgeCapacity,10);assert.equal(b.coordWords,8);assert.equal(b.keyWords,27);assert.ok(b.shapeCount>625);
});

test('configured RBA coordinates match independent physical residuals on 4x4 and 10x10',()=>{
  for(const [columns,rows,moves] of [[4,4,[0,1,0,1,2]],[10,10,[4,5,4,5,3,6,2,7,1]]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),r=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),p=position(columns,rows,moves);
    assert.equal(r.words[g.metaOffset]>>>2,p.ply);assert.equal(r.words[g.metaOffset]&3,p.terminal);
    for(let player=0;player<2;player++){const req=residuals(p,player),coord=player?g.p1Offset:g.p0Offset;
      for(let i=0;i<r.basis.length;i++){const members=shapeCells(g,r.basis[i]);const expected=req.some(a=>a.every(cell=>members.includes(cell)));
        assert.equal(!!(r.words[coord+(i>>>5)]&(1<<(i&31))),expected,columns+'x'+rows+' p'+player+' i'+i);}}
  }
});

test('configured reflection canonicalizes mirrored 4x4 and 10x10 roots identically',()=>{
  for(const [columns,rows,moves] of [[4,4,[0,1,0,2]],[10,10,[1,8,2,7,3,6,4]]]){
    const g=prepareConnect4RbaGeometry({columns,rows});
    const a=connect4RbaFromMoves(moves,{geometry:g}),b=connect4RbaFromMoves(moves.map(c=>columns-1-c),{geometry:g});
    assert.deepEqual(a.words,b.words);
  }
});

test('configured four-front bounds match independent physical propagation',()=>{
  for(const [columns,rows,moves] of [[4,4,[0,1,0]],[10,10,[4,5,4,5,3]]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
    for(const depth of [1,2]){const a=prepareConnect4RbaFrontArena(g,{depth,capacity:4096,budget:4000000});
      assert.equal(buildConnect4RbaFourFront(g,a,q.words,0,q.basis,0,q.basis.length),0);
      const packed=queryConnect4RbaFourFront(g,a,0,q.words,0);assert.deepEqual([packed&3,packed>>>2],bounds(columns,rows,moves,depth));}
  }
});

test('4x4 depth-zero shared-q traversal solves without a physical-state fallback',()=>{
  const columns=4,rows=4,moves=[0,1,0,1,2,3,2,3],g=prepareConnect4RbaGeometry({columns,rows}),root=connect4RbaFromMoves(moves,{geometry:g}),oracle=exact(columns,rows,moves);
  const t=createRbaTt32({capacity:65536,bucketCount:65536,keyWords:g.keyWords,basisCapacity:g.maxBasis,edgeCapacity:g.columns});
  assertConnect4RbaTtCompatibility(t,g);const rootQ=rbaTtIntern32(t,root.words,0,root.basis,0,root.basis.length);rbaTtSetRoot32(t,rootQ);rbaTtEnqueue32(t,rootQ);
  const state=prepareConnect4RbaEvaluator({geometry:g,boundaryDepth:0,boundaryCapacity:512,boundaryBudget:100000}),witness=new Int32Array(1);witness[0]=-2;
  let current=-1,steps=0;
  while(!Atomics.load(t.control,RBA_TT_DONE)&&!Atomics.load(t.control,RBA_TT_STOP)&&steps++<200000){
    if(current<0)current=rbaTtTake32(t,2);
    if(current>=0){const q=current,code=evaluateConnect4RbaTt32(t,q,state,rootQ,root.reflected);current=publishConnect4RbaEvaluation32(t,q,2,state,code,rootQ,witness);}
    let event;while((event=rbaTtTakeEvent32(t))>=0)reconcileConnect4RbaEvent32(t,event,g,root.reflected,witness);
    if(current<0&&t.control[5]===-1&&t.control[8]===-1)break;
  }
  assert.equal(Atomics.load(t.control,RBA_TT_STOP),0);assert.equal(Atomics.load(t.control,RBA_TT_DONE),1);
  assert.equal(t.exact[rootQ],oracle.value);assert.equal(witness[0],oracle.move);
});
