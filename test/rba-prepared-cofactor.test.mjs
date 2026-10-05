import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaCofactorKnownHeight as optional,connect4RbaCanonicalize as canonicalize} from '../addons/rba-connect4-coordinate.mjs';
import {connect4RbaPreparedCofactorKnownHeight as prepared,connect4RbaCanonicalize as preparedCanonicalize,connect4RbaPreparedCanonicalize as preparedOnlyCanonicalize} from '../addons/rba-connect4-coordinate-prepared.mjs';
import {connect4RbaDenseCofactorKnownHeight as dense,connect4RbaCanonicalize as denseCanonicalize,connect4RbaPreparedCanonicalize as denseOnlyCanonicalize} from '../addons/rba-connect4-coordinate-dense.mjs';
import * as preparedApi from '../addons/rba-connect4-coordinate-prepared.mjs';
import * as denseApi from '../addons/rba-connect4-coordinate-dense.mjs';

test('nonwinning prepared cofactors match physical transitions under the explicit precondition',()=>{
  const pn=preparedApi.connect4RbaPreparedCofactorNonWinningKnownHeight,dn=denseApi.connect4RbaDenseCofactorNonWinningKnownHeight;
  assert.equal(typeof pn,'function');assert.equal(typeof dn,'function');let checked=0,draws=0;
  for(const budget of [0,2097152])for(const [columns,rows] of [[7,6],[7,5],[4,4],[3,3],[33,4],[4,33]]){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget}),p=prepareConnect4RbaExecutionProfile(g),oracle=oracleGeometry(g);
    const history=columns===3?[0,1,2,0,1,2,0,1]:[0,1,0,1,2,1,2];
    for(let length=0;length<=history.length;length++)for(const reflected of [false,true]){
      const moves=history.slice(0,length).map(c=>reflected?columns-1-c:c),q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
      if(q.words[g.metaOffset]&3)continue;
      for(let c=0;c<columns;c++)if(q.words[c]<rows){
        const expected=physicalChild(g,oracle,moves,c);if(expected.term===1||expected.term===3)continue;
        for(const fn of g.removeByCell===null?[pn]:[pn,dn]){
          assert.deepEqual(apply(g,p,fn,q,c),expected);checked++;if(expected.term===2)draws++;
        }
      }
    }
  }
  assert.ok(checked>1000);assert.ok(draws>0);
});

function oracleGeometry(g){
  const shapes=new Map();
  for(let id=0;id<g.shapeCount;id++)shapes.set(Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id])).join(','),id);
  const lines=[];
  for(let r=0;r<g.rows;r++)for(let c=0;c<g.columns;c++)for(const [dc,dr] of [[1,0],[0,1],[1,1],[1,-1]])
    if(c+3*dc<g.columns&&r+3*dr>=0&&r+3*dr<g.rows)
      lines.push(Array.from({length:4},(_,i)=>(r+i*dr)*g.columns+c+i*dc).sort((a,b)=>a-b));
  return {shapes,lines};
}

function physicalChild(g,oracle,moves,column){
  const heights=new Uint32Array(g.columns),board=new Int8Array(g.cellCount).fill(-1);
  for(let ply=0;ply<moves.length;ply++){const c=moves[ply];board[heights[c]++*g.columns+c]=ply&1;}
  const mover=moves.length&1;board[heights[column]++*g.columns+column]=mover;
  const term=oracle.lines.some(line=>line.every(cell=>board[cell]===mover))?(mover?1:3):moves.length+1===g.cellCount?2:0;
  const words=new Uint32Array(g.keyWords);words.set(heights);words[g.metaOffset]=((moves.length+1)<<2)|term;
  if(term)return {term,words,basis:new Uint32Array(0)};
  const ids=new Set(),requirements=[new Set(),new Set()];
  for(const line of oracle.lines){
    const empty=line.filter(cell=>board[cell]===-1),key=empty.join(',');
    if(empty.length)ids.add(oracle.shapes.get(key));
    for(let p=0;p<2;p++)if(line.every(cell=>board[cell]!== (p^1)))requirements[p].add(key);
  }
  assert.ok(!ids.has(undefined));
  const basis=Uint32Array.from(Array.from(ids).sort((a,b)=>a-b));
  for(let i=0;i<basis.length;i++){
    const id=basis[i],cells=Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id])),active=[false,false];
    // Enumerate at most fifteen subsets, independently of the compiled plan.
    for(let mask=1;mask<(1<<cells.length);mask++){
      const subset=cells.filter((_,j)=>mask&(1<<j)).join(',');
      for(let p=0;p<2;p++)if(requirements[p].has(subset))active[p]=true;
    }
    for(let p=0;p<2;p++)if(active[p])words[(p?g.p1Offset:g.p0Offset)+(i>>>5)]|=1<<(i&31);
  }
  return {term,words,basis};
}

function apply(g,profile,fn,q,column,{optionalScratch=false,poison=0xffffffff}={}){
  const src=3,dst=src+g.keyWords+2,bi=2,ci=bi+g.maxBasis+2;
  const words=new Uint32Array(dst+g.keyWords+2).fill(0xa5a5a5a5),basis=new Uint32Array(ci+g.maxBasis+2).fill(0xffffffff);
  words.set(q.words,src);basis.set(q.basis,bi);
  const seen=new Uint32Array(g.shapeWordCount+2).fill(0x12345678),sizes=new Uint32Array(3).fill(99);
  const removed=optionalScratch?null:new Uint32Array(g.maxBasis).fill(poison);
  const inverse=optionalScratch?null:new Uint32Array(g.shapeCount).fill(poison);
  const term=fn(g,profile,words,src,basis,bi,q.basis.length,column,q.words[column],words,dst,basis,ci,seen,sizes,1,removed,inverse);
  assert.deepEqual(words.slice(src,src+g.keyWords),q.words);assert.deepEqual(basis.slice(bi,bi+q.basis.length),q.basis);
  assert.equal(words[dst-1],0xa5a5a5a5);assert.equal(words[dst+g.keyWords],0xa5a5a5a5);
  assert.equal(sizes[0],99);assert.equal(sizes[2],99);
  assert.equal(seen[g.shapeWordCount],0x12345678);assert.equal(seen[g.shapeWordCount+1],0x12345678);
  if(term)assert.ok(seen.every(word=>word===0x12345678));
  else{
    const expectedSet=new Uint32Array(g.shapeWordCount);
    for(let i=0;i<sizes[1];i++){const id=basis[ci+i];expectedSet[id>>>5]|=1<<(id&31);}
    assert.deepEqual(seen.slice(0,g.shapeWordCount),expectedSet);
  }
  return {term,words:words.slice(dst,dst+g.keyWords),basis:basis.slice(ci,ci+sizes[1])};
}

test('optional and generated prepared/dense cofactors match independent physical residuals',()=>{
  let checked=0,denseChecks=0,sparseChecks=0,terminals=0;
  const fixtures=[
    [7,5,[3,2,3,2,4,1]], [7,6,[0,1,0,1,0,2]], [7,6,[0,1,0,1,2,1,2]],
    [4,4,[0,1,0,2,1]], [3,3,[0,1,2,0,1,2,0,1]], [1,4,[0,0,0]],
    [33,4,[32,0,31,1,32,0]], [4,33,[3,0,3,1,2,0]],
  ];
  for(const budget of [0,2097152])for(const [columns,rows,history] of fixtures){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:budget});
    const profile=prepareConnect4RbaExecutionProfile(g),oracle=oracleGeometry(g);
    // Dense selection happens once for this initialized geometry, never in a
    // recursive kernel. Sparse configurations must use the prepared variant.
    const kernels=[['optional',optional],['prepared',prepared]];
    if(g.removeByCell!==null)kernels.push(['dense',dense]);
    for(const length of new Set([0,1,history.length]))for(const mirror of [false,true]){
      const moves=history.slice(0,length).map(c=>mirror?columns-1-c:c);
      const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false});
      const columnsToCheck=columns>7?[0,1,15,31,32]:Array.from({length:columns},(_,c)=>c);
      for(const column of columnsToCheck)if(column<columns&&q.words[column]<rows){
        const expected=physicalChild(g,oracle,moves,column);
        for(const [name,fn] of kernels)for(const poison of [0,0xffffffff]){
          const actual=apply(g,profile,fn,q,column,{poison});
          assert.deepEqual(actual,expected,`${columns}x${rows} budget=${budget} ply=${length} mirror=${mirror} column=${column} kernel=${name}`);
          checked++;if(name==='dense')denseChecks++;if(g.removeByCell===null)sparseChecks++;if(actual.term)terminals++;
        }
        assert.deepEqual(apply(g,profile,optional,q,column,{optionalScratch:true}),expected);
      }
    }
  }
  assert.ok(checked>1000);assert.ok(denseChecks>100);assert.ok(sparseChecks>100);assert.ok(terminals>0);
});

test('dense kernel uses the cold removal table directly and preserves last-cell terminal precedence',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6});
  assert.ok(g.removeByCell instanceof Int32Array);
  const profile=prepareConnect4RbaExecutionProfile(g),q=connect4RbaFromMoves([3,2,4],{geometry:g,canonical:false});
  const directProfile={...profile,prepareRemove(){throw Error('unexpected removal dispatch');},removePrepared(){throw Error('unexpected removal dispatch');}};
  assert.deepEqual(apply(g,directProfile,dense,q,5),apply(g,profile,optional,q,5));
  for(const win of [false,true])for(const fn of [optional,prepared,dense]){
    const words=new Uint32Array(g.keyWords);words.fill(6,0,7);words[6]=5;words[g.metaOffset]=41<<2;
    if(win)words[g.p1Offset]=1;
    const actual=apply(g,profile,fn,{words,basis:Uint32Array.of(41)},6);
    assert.equal(actual.term,win?1:2);assert.equal(actual.words[g.metaOffset],(42<<2)|(win?1:2));
    assert.equal(actual.basis.length,0);assert.ok(actual.words.slice(g.p0Offset).every(word=>word===0));
  }
});

test('prepared module canonicalization exports retain selectedSet and offset behavior',()=>{
  assert.equal(preparedCanonicalize,canonicalize);assert.equal(denseCanonicalize,canonicalize);
  for(const [columns,rows] of [[7,5],[7,6],[3,3],[33,4],[4,33]]){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:0}),profile=prepareConnect4RbaExecutionProfile(g);
    for(const column of [0,columns-1])for(const fn of [preparedCanonicalize,denseCanonicalize]){
      const q=connect4RbaFromMoves([column],{geometry:g,canonical:false}),offset=3,bi=2,setOffset=4;
      const words=new Uint32Array(offset+g.keyWords),basis=new Uint32Array(bi+q.basis.length);
      words.set(q.words,offset);basis.set(q.basis,bi);
      const selected=new Uint32Array(setOffset+g.shapeWordCount+2).fill(0x12345678);
      const reflected=fn(g,profile,words,offset,basis,bi,q.basis.length,prepareConnect4RbaCoordinateScratch(g),selected,setOffset);
      assert.equal(reflected,column===0?1:0);
      const expected=connect4RbaFromMoves([column],{geometry:g});
      assert.deepEqual(words.slice(offset),expected.words);assert.deepEqual(basis.slice(bi),expected.basis);
      if(reflected){
        const set=new Uint32Array(g.shapeWordCount);for(const id of expected.basis)set[id>>>5]|=1<<(id&31);
        assert.deepEqual(selected.slice(setOffset,setOffset+g.shapeWordCount),set);
      }else assert.ok(selected.every(word=>word===0x12345678));
      assert.ok(selected.slice(0,setOffset).every(word=>word===0x12345678));
      assert.ok(selected.slice(setOffset+g.shapeWordCount).every(word=>word===0x12345678));
    }
  }
});

test('prepared-only canonicalization matches the optional API without selected-set work',()=>{
  assert.equal(denseOnlyCanonicalize,preparedOnlyCanonicalize);
  assert.notEqual(preparedOnlyCanonicalize,canonicalize);
  assert.doesNotMatch(preparedOnlyCanonicalize.toString(),/selectedSet/);
  let reflections=0,symmetricReflections=0,unchanged=0;
  for(const [columns,rows] of [[7,5],[7,6],[3,3],[33,4],[4,33]]){
    const g=prepareConnect4RbaGeometry({columns,rows,specializationBudgetBytes:0}),profile=prepareConnect4RbaExecutionProfile(g);
    const histories=[[],[0],[columns-1],[0,columns-1],[columns-1,0],[0,columns-1,1,columns-2]];
    if(columns>=4&&rows>=4)histories.push([0,1,0,1,0,2,0]);
    for(const moves of histories){
      const q=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),offset=3,bi=2;
      const source=new Uint32Array(offset+g.keyWords+2).fill(0xa5a5a5a5),sourceBasis=new Uint32Array(bi+q.basis.length+2).fill(0xa5a5a5a5);
      source.set(q.words,offset);sourceBasis.set(q.basis,bi);
      const expected=source.slice(),expectedBasis=sourceBasis.slice();
      const reference=canonicalize(g,profile,expected,offset,expectedBasis,bi,q.basis.length,prepareConnect4RbaCoordinateScratch(g));
      if(reference){
        reflections++;
        if(Array.from(q.words.slice(0,columns)).every((h,c)=>h===q.words[columns-1-c]))symmetricReflections++;
      }else unchanged++;
      for(const fn of [preparedOnlyCanonicalize,denseOnlyCanonicalize]){
        const actual=source.slice(),basis=sourceBasis.slice(),scratch=prepareConnect4RbaCoordinateScratch(g);
        for(const value of Object.values(scratch))value.fill(0xffffffff);
        const selectedSet=new Uint32Array(g.shapeWordCount+4).fill(0x12345678);
        const reflected=fn(g,profile,actual,offset,basis,bi,q.basis.length,scratch,selectedSet,2);
        assert.equal(reflected,reference);assert.deepEqual(actual,expected);assert.deepEqual(basis,expectedBasis);
        assert.ok(selectedSet.every(word=>word===0x12345678),'prepared contract does not publish an optional selected set');
      }
    }
  }
  assert.ok(reflections>0);assert.ok(symmetricReflections>0);assert.ok(unchanged>0);
});
