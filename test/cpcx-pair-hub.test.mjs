import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
const api=await import('../addons/connect4-cpcx-pair-hub.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});

test('CPCX pair hub prepares native endpoint fields without a board-size fork',()=>{
  assert.equal(typeof api.prepareConnect4CpcxPairHub32,'function');
  for(const [columns,bytes] of [[7,1],[257,2],[65537,4]]){
    // Synthetic prepared geometry isolates field widths, not game outcomes.
    const g={columns,rows:1,cellCount:2,coordWords:1,p0Offset:columns+1,p1Offset:columns+2,
      pairShapeStart:0,tripleShapeStart:2,shapeCells:Uint32Array.of(0,1,0,0,0,2,0,0),
      cellColumn:Uint32Array.of(0,columns-1,1),cellRow:Uint32Array.of(0,0,0)};
    const p=api.prepareConnect4CpcxPairHub32(g),words=new Uint32Array(columns+3),basis=Uint32Array.of(0,1);
    assert.equal(p.fieldBytes,bytes);words[g.p0Offset]=3;
    assert.equal((p.collect(words,0,basis,0,2,0,0),p.find(words,0,basis,0,2,0,-1,0)),0);
    assert.equal((p.collect(words,0,basis,0,2,0,0),p.find(words,0,basis,0,2,0,1,0)),-1,'forced blocker cannot be ignored');
    words[g.p0Offset]=1;
    assert.equal((p.collect(words,0,basis,0,2,0,0),p.find(words,0,basis,0,2,0,-1,0)),-1,'scratch must reset');
    assert.equal((p.collect(words,0,basis,0,0,0,0),p.find(words,0,basis,0,0,0,0,-1,0)),-1,'poisoned bits outside empty basis ignored');
  }
});

test('pair hub rejects duplicate demands, unsupported completion and exposed counterwin',()=>{
  assert.equal(typeof api.prepareConnect4CpcxPairHub32,'function');
  const g={columns:3,rows:2,cellCount:6,coordWords:1,p0Offset:4,p1Offset:5,pairShapeStart:6,tripleShapeStart:8,
    shapeCells:new Uint32Array(32),cellColumn:Uint32Array.of(0,1,2,0,1,2),cellRow:Uint32Array.of(0,0,0,1,1,1)};
  g.shapeCells.set([0,1,0,0,0,2,0,0],24);
  const source=Uint32Array.of(0,0,0,0,6,1),basis=Uint32Array.of(3,6,7),p=api.prepareConnect4CpcxPairHub32(g);
  assert.equal((p.collect(source,0,basis,0,3,0,0),p.find(source,0,basis,0,3,0,-1,0)),-1,'opponent singleton above hub supersedes fork');
  source[5]=0;assert.equal((p.collect(source,0,basis,0,3,0,0),p.find(source,0,basis,0,3,0,-1,0)),0);
  g.shapeCells[28+1]=1;
  const duplicate=api.prepareConnect4CpcxPairHub32(g);
  assert.equal((duplicate.collect(source,0,basis,0,3,0,0),duplicate.find(source,0,basis,0,3,0,-1,0)),-1,'two descriptions of one completion are one demand');
  g.shapeCells[28+1]=5;
  const hidden=api.prepareConnect4CpcxPairHub32(g);
  assert.equal((hidden.collect(source,0,basis,0,3,0,0),hidden.find(source,0,basis,0,3,0,-1,0)),-1,'unsupported second completion cannot consume a response');
});

function board(W,H){
  const cells=new Int8Array(W*H).fill(-1),heights=new Uint32Array(W),lines=[];let rank=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])
    if(x+3*dx>=0&&x+3*dx<W&&y+3*dy>=0&&y+3*dy<H)lines.push(Array.from({length:4},(_,i)=>(y+i*dy)*W+x+i*dx));
  const b={cells,heights,lines,get rank(){return rank;},push(c){cells[heights[c]++*W+c]=(rank++)&1;},pop(c){cells[--heights[c]*W+c]=-1;rank--;},
    winner(){for(const line of lines){const p=cells[line[0]];if(p>=0&&line.every(c=>cells[c]===p))return p;}return -1;},
    legal(){return Array.from({length:W},(_,c)=>c).filter(c=>heights[c]<H);},
    immediate(p){const out=[];for(const c of b.legal()){const at=heights[c]*W+c;cells[at]=p;if(b.winner()===p)out.push(c);cells[at]=-1;}return out;},
  };return b;
}

// Independent literal current-line criterion. Extra valid quotient witnesses
// may exist; every reported move is checked by a physical three-ply proof.
function physicalPairMoves(b,W,mover,forced){
  const out=[];
  for(const c of b.legal()){
    if(forced>=0&&c!==forced)continue;
    const trigger=b.heights[c]*W+c,completions=new Set();
    for(const line of b.lines){
      if(line.some(at=>b.cells[at]===1-mover))continue;
      const empty=line.filter(at=>b.cells[at]<0);
      if(empty.length!==2||!empty.includes(trigger))continue;
      const other=empty.find(at=>at!==trigger),col=other%W,row=Math.floor(other/W);
      if(row===b.heights[col]+(col===c?1:0))completions.add(col);
    }
    if(completions.size<2)continue;
    b.push(c);const unsafe=b.immediate(1-mover).length>0;b.pop(c);
    if(!unsafe)out.push(c);
  }
  return out;
}

test('CPCX pair hub positives pass independent physical reply proofs and general frames',()=>{
  assert.equal(typeof api.prepareConnect4CpcxPairHub32,'function');
  let seed=528321,checked=0,positive=0,literalPositive=0,forcedCases=0;
  const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
  // Sealed formula geometries3x6 and5x3 are deliberately absent.
  for(const [W,H,trials] of [[4,4,300],[7,5,300],[7,6,300],[8,4,80],[4,8,80],[33,4,12],[1,4,12],[4,1,12],[10,10,12]]){
    const g=prepareConnect4RbaGeometry({columns:W,rows:H}),p=api.prepareConnect4CpcxPairHub32(g);
    for(let t=0;t<trials;t++){
      const b=board(W,H),moves=[];
      while(b.rank<W*H){
        const mover=b.rank&1,own=b.immediate(mover),opp=b.immediate(1-mover);
        if(!own.length&&opp.length<2){
          const forced=opp.length?opp[0]:-1,literal=physicalPairMoves(b,W,mover,forced);
          if(forced>=0)forcedCases++;
          for(const canonical of [false,true]){
            const q=connect4RbaFromMoves(moves,{geometry:g,canonical}),source=new Uint32Array(g.keyWords+5),basis=new Uint32Array(q.basis.length+5).fill(0xffffffff);
            source.set(q.words,2);basis.set(q.basis,3);
            const n=q.basis.length,aw=(n+31)>>>5;
            if(aw&&(n&31))source[2+(mover?g.p1Offset:g.p0Offset)+aw-1]|=0xffffffff<<(n&31);
            const before=Array.from(source),basisBefore=Array.from(basis),fc=q.reflected&&forced>=0?W-1-forced:forced;
            assert.equal(p.collect(source,2,basis,3,n,mover,0),fc);
            const found=p.find(source,2,basis,3,n,mover,fc,0),physical=q.reflected&&found>=0?W-1-found:found;
            assert.deepEqual(Array.from(source),before);assert.deepEqual(Array.from(basis),basisBefore);
            if(literal.length){literalPositive++;assert.ok(found>=0,'literal pair hub must be admitted');}
            if(found>=0){
              positive++;assert.ok(b.legal().includes(physical));if(forced>=0)assert.equal(physical,forced);
              b.push(physical);
              assert.ok(b.winner()<0||b.winner()===mover);
              if(b.winner()<0){
                assert.ok(b.immediate(mover).length>=2,'distinct playable completion capacity');
                assert.equal(b.immediate(1-mover).length,0,'opponent counterterminal guard');
                for(const reply of b.legal()){
                  b.push(reply);assert.notEqual(b.winner(),1-mover);
                  assert.ok(b.immediate(mover).length>=1,'every reply leaves a first-win witness');b.pop(reply);
                }
              }
              b.pop(physical);
            }
            checked++;
          }
        }
        const legal=b.legal(),c=legal[random(legal.length)];b.push(c);moves.push(c);
        if(b.winner()>=0)break;
      }
    }
  }
  assert.ok(checked>1000);assert.ok(positive>0);assert.ok(literalPositive>0);assert.ok(forcedCases>0);
  console.log(JSON.stringify({kind:'cpcx-pair-hub-physical-proof',checked,positive,literalPositive,forcedCases,seed}));
});

