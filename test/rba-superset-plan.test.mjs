import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,connect4RbaShapeSubset,shareConnect4RbaGeometry32} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaCofactorKnownHeight,connect4RbaBasisFromSupport} from '../addons/rba-connect4-coordinate.mjs';

test('prepared grouped supersets are exact across configured geometry and global word 255',()=>{
  for(const [columns,rows,budget] of [[7,5,0],[7,6,2097152],[3,3,0],[64,16,0],[16,64,0]]){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget});
    const profile=prepareConnect4RbaExecutionProfile(g);
    for(const field of ['supersetWordOffsets','supersetWords','supersetMasks']){
      assert.ok(g[field] instanceof Uint32Array,`${columns}x${rows}: ${field} must not truncate global word indices`);
      assert.equal(profile[field],g[field],'profile must reuse the cold geometry plan');
    }
    const offsets=g.supersetWordOffsets,words=g.supersetWords,masks=g.supersetMasks;
    assert.equal(offsets.length,g.shapeCount+1);assert.equal(offsets[0],0);
    assert.equal(offsets[g.shapeCount],words.length);assert.equal(words.length,masks.length);
    for(let a=0;a<g.shapeCount;a++){
      assert.ok(offsets[a]<=offsets[a+1]);
      let previous=-1;
      for(let at=offsets[a];at<offsets[a+1];at++){
        assert.ok(words[at]>previous&&words[at]<g.shapeWordCount,'groups are sorted and unique');
        assert.notEqual(masks[at],0);previous=words[at];
      }
    }
    if(columns===64||rows===64){
      assert.ok(g.shapeCount>8192);
      assert.ok(words.some(word=>word>255),'fixture must expose a Uint8 truncation bug');
    }
    // A small number of complete relation rows provides an independent oracle
    // without a quadratic all-shapes comparison on the large configurations.
    const samples=new Set([0,1,g.cellCount-1,g.pairShapeStart,g.pairShapeStart+1,
      g.tripleShapeStart-1,g.tripleShapeStart,g.quadShapeStart-1,g.quadShapeStart,g.shapeCount-1]);
    for(const a of samples){
      if(a<0||a>=g.shapeCount)continue;
      const expected=[];
      for(let b=0;b<g.shapeCount;b++)if(a!==b&&connect4RbaShapeSubset(g,a,b))expected.push(b);
      const actual=[];
      for(let at=offsets[a];at<offsets[a+1];at++){
        let bits=masks[at];
        while(bits){const bit=31-Math.clz32(bits&-bits);actual.push(words[at]*32+bit);bits&=bits-1;}
      }
      assert.deepEqual(actual,expected,`${columns}x${rows}: shape ${a}`);
    }
    if(g.shapeCount===0){assert.equal(words.length,0);assert.deepEqual(Array.from(offsets),[0]);}
    if(columns===7&&rows===5){
      const shared=shareConnect4RbaGeometry32(g),sharedProfile=prepareConnect4RbaExecutionProfile(shared);
      for(const field of ['supersetWordOffsets','supersetWords','supersetMasks']){
        assert.ok(shared[field].buffer instanceof SharedArrayBuffer);
        assert.deepEqual(shared[field],g[field]);assert.equal(sharedProfile[field],shared[field]);
      }
    }
  }
});

function physicalChild(g,moves,column){
  const heights=new Uint32Array(g.columns),board=new Int8Array(g.cellCount).fill(-1);
  for(let ply=0;ply<moves.length;ply++){const c=moves[ply];board[heights[c]++*g.columns+c]=ply&1;}
  const mover=moves.length&1;board[heights[column]++*g.columns+column]=mover;
  const lines=[];
  // Enumerate physical winning lines independently from the prepared tables.
  for(let r=0;r<g.rows;r++)for(let c=0;c<g.columns;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]]){
    if(c+3*dc<g.columns&&r+3*dr>=0&&r+3*dr<g.rows)
      lines.push(Array.from({length:4},(_,i)=>(r+i*dr)*g.columns+c+i*dc));
  }
  const term=lines.some(line=>line.every(cell=>board[cell]===mover))?(mover?1:3):
    moves.length+1===g.cellCount?2:0;
  const words=new Uint32Array(g.keyWords);words.set(heights);words[g.metaOffset]=((moves.length+1)<<2)|term;
  if(term)return {term,words,basis:new Uint32Array(0)};
  const out=new Uint32Array(g.maxBasis),seen=new Uint32Array(g.shapeWordCount);
  const n=connect4RbaBasisFromSupport(g,heights,0,out,0,seen),basis=out.slice(0,n);
  for(let p=0;p<2;p++){
    const requirements=lines.filter(line=>line.every(cell=>board[cell]!== (p^1)))
      .map(line=>line.filter(cell=>board[cell]===-1));
    for(let i=0;i<n;i++){
      const id=basis[i],cells=new Set(g.shapeCells.slice(id*4,id*4+g.shapeSize[id]));
      if(requirements.some(requirement=>requirement.every(cell=>cells.has(cell))))
        words[(p?g.p1Offset:g.p0Offset)+(i>>>5)]|=1<<(i&31);
    }
  }
  return {term,words,basis};
}

test('public cofactors preserve optional scratch, seen offsets, physical residuals and terminal ordering',()=>{
  let checks=0,terminals=0,draws=0;
  const fixtures=[
    [7,5,[3,2,3,2,4,1,4,1]],
    [7,6,[0,1,0,1,0,2]],
    [7,6,[0,1,0,1,2,1,2]],
    [3,3,[0,1,2,0,1,2,0,1]],
    [1,4,[0,0,0]],
  ];
  for(const budget of [0,2097152])for(const [columns,rows,history] of fixtures){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget});
    const profile=prepareConnect4RbaExecutionProfile(g);
    for(const length of new Set([0,1,history.length])){
      const moves=history.slice(0,length),q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
      assert.equal(q.words[g.metaOffset]&3,0);
      for(let column=0;column<columns;column++)if(q.words[column]<rows){
        const expected=physicalChild(g,moves,column);
        for(const withRemoved of [false,true])for(const withIndex of [false,true])for(const seenOffset of [0,4]){
          const src=3,dst=src+g.keyWords+3,bi=2,ci=bi+g.maxBasis+3;
          const words=new Uint32Array(dst+g.keyWords+2).fill(0xa5a5a5a5);
          const basis=new Uint32Array(ci+g.maxBasis+2).fill(0xffffffff);
          words.set(q.words,src);basis.set(q.basis,bi);
          const seen=new Uint32Array(seenOffset+g.shapeWordCount+3).fill(0x12345678);
          const sizes=new Uint32Array(3).fill(99);
          const removed=withRemoved?new Uint32Array(g.maxBasis).fill(0xffffffff):null;
          const index=withIndex?new Uint32Array(g.shapeCount).fill(0xffffffff):null;
          const term=connect4RbaCofactorKnownHeight(g,profile,words,src,basis,bi,q.basis.length,column,q.words[column],
            words,dst,basis,ci,seen,sizes,1,removed,index,seenOffset);
          assert.equal(term,expected.term);
          assert.deepEqual(words.slice(dst,dst+g.keyWords),expected.words);
          assert.deepEqual(basis.slice(ci,ci+sizes[1]),expected.basis);
          assert.deepEqual(words.slice(src,src+g.keyWords),q.words);
          assert.deepEqual(basis.slice(bi,bi+q.basis.length),q.basis);
          assert.equal(words[dst-1],0xa5a5a5a5);assert.equal(words[dst+g.keyWords],0xa5a5a5a5);
          assert.equal(sizes[0],99);assert.equal(sizes[2],99);
          assert.ok(seen.slice(0,seenOffset).every(x=>x===0x12345678));
          assert.ok(seen.slice(seenOffset+g.shapeWordCount).every(x=>x===0x12345678));
          if(term){assert.equal(sizes[1],0);terminals++;if(term===2)draws++;}
          else{
            const expectedSet=new Uint32Array(g.shapeWordCount);
            for(const id of expected.basis)expectedSet[id>>>5]|=1<<(id&31);
            assert.deepEqual(seen.slice(seenOffset,seenOffset+g.shapeWordCount),expectedSet);
          }
          checks++;
        }
      }
    }
  }
  assert.ok(checks>500);assert.ok(terminals>0);assert.ok(draws>0);
});

test('last-cell singleton wins still precede full-board draws',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6,specializationBudgetBytes:0});
  const profile=prepareConnect4RbaExecutionProfile(g);
  for(const win of [false,true]){
    // Directed valid-support coordinate states; history reachability is not
    // assumed. The transition contract must test the singleton before fullness.
    const source=new Uint32Array(g.keyWords);source.fill(6,0,7);source[6]=5;source[g.metaOffset]=41<<2;
    if(win)source[g.p1Offset]=1;
    const basis=Uint32Array.of(41),target=new Uint32Array(g.keyWords).fill(0xffffffff);
    const childBasis=new Uint32Array(g.maxBasis),seen=new Uint32Array(g.shapeWordCount+3).fill(0x12345678),size=new Uint32Array(1);
    const term=connect4RbaCofactorKnownHeight(g,profile,source,0,basis,0,1,6,5,target,0,childBasis,0,seen,size,0,null,null,3);
    assert.equal(term,win?1:2);assert.equal(target[g.metaOffset],(42<<2)|(win?1:2));
    assert.equal(size[0],0);assert.ok(target.slice(g.p0Offset).every(word=>word===0));
    assert.ok(seen.every(word=>word===0x12345678),'terminal paths return before basis scratch construction');
  }
});
