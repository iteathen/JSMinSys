import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch,connect4RbaShapeSubset,connect4RbaShapeContains} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaCofactorKnownLegal,connect4RbaBasisFromSupport} from '../addons/rba-connect4-coordinate.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';

test('completed principal upset absorbs later images without repeated expansion',()=>{
  for(const budget of [0,2097152])for(const player of [0,1]){
    const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes:budget});
    const q=connect4RbaFromMoves([3,2,3,2,4,1,4,1],{geometry:g,canonical:false});
    const column=0,cell=q.words[column]*g.columns+column;
    const seed=Array.from(q.basis).find(id=>g.shapeSize[id]===2&&connect4RbaShapeContains(g,id,cell)<0&&
      Array.from(q.basis).some(other=>other!==id&&connect4RbaShapeSubset(g,id,other)));
    assert.notEqual(seed,undefined,'fixture needs a nonterminal principal upset');
    q.words.fill(0,g.p0Offset);
    const coord=player?g.p1Offset:g.p0Offset;
    for(let i=0;i<q.basis.length;i++)if(connect4RbaShapeSubset(g,seed,q.basis[i]))q.words[coord+(i>>>5)]|=1<<(i&31);
    const base=prepareConnect4RbaExecutionProfile(g);let expansions=0;
    const profile={...base,prepareSubset(g,id){expansions++;return base.prepareSubset(g,id);}};
    const scratch=prepareConnect4RbaCoordinateScratch(g),words=new Uint32Array(g.keyWords),basis=new Uint32Array(g.maxBasis),size=new Uint32Array(1);
    assert.equal(connect4RbaCofactorKnownLegal(g,profile,q.words,0,q.basis,0,q.basis.length,column,
      words,0,basis,0,scratch.seen,size,0,scratch.map,scratch.inverse),0);
    for(let i=0;i<size[0];i++){
      assert.equal(!!(words[coord+(i>>>5)]&(1<<(i&31))),!!connect4RbaShapeSubset(g,seed,basis[i]));
      assert.equal(words[(player?g.p0Offset:g.p1Offset)+(i>>>5)],0,'other player must remain separate');
    }
    assert.equal(expansions,1,'one generator requires only one completed subset expansion');
  }
});

test('absorbed native transitions match physical residuals across players, bases and profiles',()=>{
  let seed=0x51f25eed;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
  let checked=0,terminals=0;
  for(const [columns,rows] of [[4,4],[7,6],[10,10]])for(const budget of [0,2097152]){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget}),profile=prepareConnect4RbaExecutionProfile(g);
    const lines=[];
    for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]])
      if(c+3*dc<columns&&r+3*dr>=0&&r+3*dr<rows)lines.push(Array.from({length:4},(_,i)=>(r+i*dr)*columns+c+i*dc));
    for(let game=0;game<12;game++){
      const root=connect4RbaFromMoves([],{geometry:g,canonical:false}),words=new Uint32Array(2*g.keyWords),basis=new Uint32Array(2*g.maxBasis);
      words.set(root.words);basis.set(root.basis);
      const board=new Int8Array(columns*rows).fill(-1),heights=new Uint32Array(columns),scratch=prepareConnect4RbaCoordinateScratch(g),size=new Uint32Array(1),expectedBasis=new Uint32Array(g.maxBasis);
      let src=0,dst=g.keyWords,bi=0,ci=g.maxBasis,n=root.basis.length;
      for(let ply=0;ply<columns*rows;ply++){
        const legal=Array.from({length:columns},(_,c)=>c).filter(c=>heights[c]<rows),column=legal[random()%legal.length],player=ply&1;
        board[heights[column]++*columns+column]=player;
        const expectedTerminal=lines.some(line=>line.every(cell=>board[cell]===player))?(player?1:3):(ply+1===board.length?2:0);
        const fast=game&1;
        const actual=connect4RbaCofactorKnownLegal(g,profile,words,src,basis,bi,n,column,words,dst,basis,ci,scratch.seen,size,0,fast?scratch.map:null,fast?scratch.inverse:null);
        assert.equal(actual,expectedTerminal);assert.equal(words[dst+g.metaOffset],((ply+1)<<2)|expectedTerminal);
        assert.deepEqual(words.slice(dst,dst+columns),heights);checked++;
        if(actual){terminals++;assert.equal(size[0],0);break;}
        const bn=connect4RbaBasisFromSupport(g,heights,0,expectedBasis,0,scratch.seen);
        assert.equal(size[0],bn);assert.deepEqual(basis.slice(ci,ci+bn),expectedBasis.slice(0,bn));
        for(let p=0;p<2;p++){
          const requirements=lines.filter(line=>line.every(cell=>board[cell]!== (p^1))).map(line=>line.filter(cell=>board[cell]===-1));
          const offset=dst+(p?g.p1Offset:g.p0Offset);
          for(let i=0;i<bn;i++){
            const id=basis[ci+i],cells=Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id]));
            const expected=requirements.some(req=>req.every(cell=>cells.includes(cell)));
            assert.equal(!!(words[offset+(i>>>5)]&(1<<(i&31))),expected,`${columns}x${rows} game${game} ply${ply} p${p} i${i}`);
          }
        }
        [src,dst]=[dst,src];[bi,ci]=[ci,bi];n=size[0];
      }
    }
  }
  assert.ok(checked>1000);assert.ok(terminals>50);
});
