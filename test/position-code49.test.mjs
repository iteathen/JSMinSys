import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4PositionCode64FromMoves,connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';

const g=prepareConnect4RbaGeometry({columns:7,rows:6});

function referenceCode(moves,reflect=0){
  const heights=new Uint32Array(7),owners=new Uint8Array(42);
  for(let ply=0;ply<moves.length;ply+=1){
    const c=moves[ply],r=heights[c]++;
    owners[r*7+c]=ply&1;
  }
  let code=0n;
  for(let c=0;c<7;c+=1){
    const source=reflect?6-c:c,h=heights[source];
    for(let r=0;r<h;r+=1)if(owners[r*7+source])code|=1n<<BigInt(c*7+r);
    code|=1n<<BigInt(c*7+h);
  }
  return code;
}
function pairCode(p){return (BigInt(p.hi) << 32n)|BigInt(p.lo);}
function boardSignature(moves){
  const heights=new Uint8Array(7),cells=new Int8Array(42);cells.fill(-1);
  for(let ply=0;ply<moves.length;ply+=1){const c=moves[ply],r=heights[c]++;cells[r*7+c]=ply&1;}
  return Array.from(cells).join(',');
}

test('49-bit position code matches independent board encoding and reflection',()=>{
  const samples=[[],[3],[3,2],[3,2,4,2,5],[0,6,1,5,2,4],[6,0,6,0,5,1]];
  for(const moves of samples){
    const a=connect4PositionCode64FromMoves(moves,{geometry:g});
    const b=connect4PositionCode64FromMoves(moves,{geometry:g,reflected:1});
    assert.equal(pairCode(a),referenceCode(moves,0));
    assert.equal(pairCode(b),referenceCode(moves,1));
    assert.ok(pairCode(a)<(1n<<49n));
    assert.ok(pairCode(b)<(1n<<49n));
  }
});

test('49-bit position code is collision-free across all gravity-valid sequences through ply 6',()=>{
  const codeToBoard=new Map(),boardToCode=new Map(),moves=[],heights=new Uint8Array(7);
  let visited=0;
  function walk(depth){
    const code=pairCode(connect4PositionCode64FromMoves(moves,{geometry:g})).toString();
    const board=boardSignature(moves);
    const oldBoard=codeToBoard.get(code);
    if(oldBoard!==undefined)assert.equal(oldBoard,board,'position-code collision');
    else codeToBoard.set(code,board);
    const oldCode=boardToCode.get(board);
    if(oldCode!==undefined)assert.equal(oldCode,code,'same board produced different position code');
    else boardToCode.set(board,code);
    visited+=1;
    if(depth===6)return;
    for(let c=0;c<7;c+=1)if(heights[c]<6){
      heights[c]+=1;moves.push(c);walk(depth+1);moves.pop();heights[c]-=1;
    }
  }
  walk(0);
  assert.equal(visited,137257);
});

test('RBA root reflection carries the same canonical physical position code for mirrored roots',()=>{
  const moves=[1,5,2,4,3,4];
  const mirror=moves.map(c=>6-c);
  const a=connect4RbaFromMoves(moves,{geometry:g});
  const b=connect4RbaFromMoves(mirror,{geometry:g});
  assert.deepEqual(a.words,b.words);
  assert.equal(a.positionLo,b.positionLo);
  assert.equal(a.positionHi,b.positionHi);
  assert.equal(pairCode({lo:a.positionLo,hi:a.positionHi}),referenceCode(moves,a.reflected));
});
