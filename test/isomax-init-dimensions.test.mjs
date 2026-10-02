import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../experiments/isomax-lean/host.mjs';
import {prepareLeanExecutionProfile} from '../experiments/isomax-lean/execution-profile.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../addons/worker-behavior.mjs';
import {encodeRootFrontier32} from '../addons/worker-root-frontier.mjs';
import * as baseline from '../addons/rba-connect4-frontier.mjs';
import * as oldTT from '../addons/rba-connect4-shared-exact-cache.mjs';
import * as newTT from '../experiments/isomax-lean/shared-cache.mjs';
import * as oldCpc from '../addons/cpc-connect4.mjs';
import * as generalCpc from '../experiments/isomax-lean/cpc-general.mjs';
import * as wideCpc from '../experiments/isomax-lean/cpc-wide.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Test-only independent physical-board oracle. No RBA/CPC/TT premises.
function boardOracle(columns,rows,moves){
  const board=new Uint8Array(columns*rows),height=new Uint32Array(columns),memo=new Map();
  function win(c,r,p){
    for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
      let n=1;
      for(const sign of [-1,1])for(let k=1;k<4;k++){
        const x=c+sign*k*dx,y=r+sign*k*dy;
        if(x<0||x>=columns||y<0||y>=rows||board[y*columns+x]!==p)break;
        n++;
      }
      if(n>=4)return true;
    }
    return false;
  }
  for(let i=0;i<moves.length;i++){
    const c=moves[i],r=height[c]++;assert.ok(r<rows);board[r*columns+c]=1+(i&1);
    assert.equal(win(c,r,1+(i&1)),false,'fixture must stop before first win');
  }
  function solve(p,rank){
    if(rank===board.length)return 0;
    const key=board.join('');if(memo.has(key))return memo.get(key);
    let best=-1;
    for(let c=0;c<columns;c++)if(height[c]<rows){
      const r=height[c]++;board[r*columns+c]=p;
      const v=win(c,r,p)?1:-solve(3-p,rank+1);
      board[r*columns+c]=0;height[c]--;
      if(v>best)best=v;if(best===1)break;
    }
    memo.set(key,best);return best;
  }
  const p=1+(moves.length&1),values=new Map();
  for(let c=0;c<columns;c++)if(height[c]<rows){
    const r=height[c]++;board[r*columns+c]=p;
    values.set(c,win(c,r,p)?1:-solve(3-p,moves.length+1));
    board[r*columns+c]=0;height[c]--;
  }
  return {relative:Math.max(...values.values()),values};
}

function fixtures(columns,rows,count=3,remaining=6){
  let seed=23271+columns*97+rows;
  const next=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const result=[];
  for(let attempt=0;attempt<400&&result.length<count;attempt++){
    const moves=[],board=new Uint8Array(columns*rows),heights=new Uint32Array(columns);
    while(moves.length<columns*rows-remaining){
      const legal=[];
      for(let c=0;c<columns;c++)if(heights[c]<rows){
        const r=heights[c],p=1+(moves.length&1);board[r*columns+c]=p;
        let won=false;
        for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
          let n=1;
          for(const sign of [-1,1])for(let k=1;k<4;k++){
            const x=c+sign*k*dx,y=r+sign*k*dy;
            if(x<0||x>=columns||y<0||y>=rows||board[y*columns+x]!==p)break;
            n++;
          }
          if(n>=4)won=true;
        }
        board[r*columns+c]=0;if(!won)legal.push(c);
      }
      if(!legal.length)break;
      const c=legal[Math.floor(next()/0x100000000*legal.length)];board[heights[c]++*columns+c]=1+(moves.length&1);moves.push(c);
    }
    if(moves.length===columns*rows-remaining)result.push(moves);
  }
  assert.equal(result.length,count);return result;
}

function stateFor(api,g,order,reference){
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,reference?encodeRootFrontier32({release:true}):0);
  const shared=(reference?oldTT:newTT).createConnect4RbaSharedExactCache32({capacity:256,keyWords:g.keyWords,geometry:g});
  return {words,state:api.prepareConnect4RbaFrontier({geometry:g,cacheCapacity:256,
    sharedExactCache:shared,orderOffset:order,behavior:new BehaviorWorker(0,words,0,memory)})};
}

function compareShared(a,b){
  const p=b.layout;assert.equal(p.kind,'direct');
  const keys=new Uint32Array(a.keys.length),seq=new Uint32Array(a.sequence.length),values=new Uint32Array(a.value.length);
  for(let i=0;i<=b.mask;i++){
    const record=i*p.entryWords,base=i*b.keyWords;
    seq[i]=b.entries[record];values[i]=b.entries[record+1];
    for(let c=0;c<p.columns;c++)keys[base+c]=b.heights[i*p.heightStride+p.heightOffset+c];
    keys[base+p.metaOffset]=b.entries[record+2];
    for(let w=0;w<p.coordinateWords;w++)keys[base+p.p0Offset+w]=b.entries[record+p.coordinateOffset+w];
  }
  assert.deepEqual(keys,a.keys);assert.deepEqual(seq,a.sequence);assert.deepEqual(values,a.value);
  return values.filter(Boolean).length;
}

test('public solver initializes a nonstandard board and completes through real workers',async()=>{
  const geometry=prepareConnect4RbaGeometry({columns:4,rows:4});
  const result=await runLazySmpConnect4Rba32([0,1,0,1,0,2],{
    geometry,workers:2,sharedCacheCapacity:1024,localCacheCapacity:1024,timeoutMs:10000,
  });
  assert.equal(result.status,'EXACT',JSON.stringify(result.errors));
  assert.equal(result.rootWdl,1);
  assert.equal(result.move,0);
  assert.equal(result.cleanup,true);
  assert.equal(result.workersExited,2);
});

for(const [columns,rows] of [[4,4],[4,5],[5,4],[8,4],[4,8],[8,6],[7,5],[33,1],[1,256]]){
  test(`initialized ${columns}x${rows}: exact physical oracle, reference traversal/TT, workers`,async t=>{
    const g=prepareConnect4RbaGeometry({columns,rows}),profile=prepareLeanExecutionProfile(g);
    const api=await import('../experiments/isomax-lean/'+profile.solver.slice(2));
    const samples=fixtures(columns,rows),records=[];
    let publications=0;
    for(let order=0;order<Math.min(columns,4);order++){
      const a=stateFor(baseline,g,order,true).state,b=stateFor(api,g,order,false).state;
      for(const sequence of samples)for(const mirror of [false,true]){
        const moves=sequence.map(c=>mirror?columns-1-c:c),root=connect4RbaFromMoves(moves,{geometry:g});
        const oracle=boardOracle(columns,rows,moves);
        const expected=baseline.solveConnect4RbaFrontier(root,{state:a,reflected:root.reflected});
        const actual=api.solveConnect4RbaFrontier(root,{state:b,reflected:root.reflected});
        assert.deepEqual([actual.status,actual.value,actual.relative,actual.move],
          [expected.status,expected.value,expected.relative,expected.move]);
        assert.equal(actual.relative,oracle.relative||0);
        if(!(root.words[g.metaOffset]&3)){
          assert.ok(oracle.values.has(actual.move),'selected move must be legal');
          assert.equal(oracle.values.get(actual.move)||0,oracle.relative||0);
        }
        for(const field of ['keys','tag'])assert.deepEqual(b.cache[field],a.cache[field]);
        publications+=compareShared(a.cache.shared,b.cache.shared);
      }
    }
    for(const moves of samples){
      const oracle=boardOracle(columns,rows,moves);
      const result=await runLazySmpConnect4Rba32(moves,{geometry:g,workers:2,
        sharedCacheCapacity:256,localCacheCapacity:256,timeoutMs:10000});
      assert.equal(result.status,'EXACT',JSON.stringify(result.errors));
      assert.equal(result.rootWdl,oracle.relative*(moves.length&1?-1:1)||0);
      const root=connect4RbaFromMoves(moves,{geometry:g});
      if(!(root.words[g.metaOffset]&3)){
        assert.ok(oracle.values.has(result.move),'worker-selected move must be legal');
        assert.equal(oracle.values.get(result.move)||0,oracle.relative||0);
      }
      assert.deepEqual(result.executionProfile,profile);
      assert.equal(result.cleanup,true);assert.equal(result.workersExited,2);
      records.push({moves,wdl:result.rootWdl,move:result.move});
    }
    t.diagnostic(JSON.stringify({columns,rows,keyWords:g.keyWords,coordWords:g.coordWords,
      entryBytes:newTT.prepareSharedCacheLayout(g,g.keyWords).entryBytes,profile,publications,records}));
  });
}

test('general CPC preserves guards and results across the 32-column boundary',()=>{
  for(const [columns,rows] of [[4,4],[7,5],[8,6],[32,1],[33,1]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),api=columns>32?wideCpc:generalCpc;
    const a=oldCpc.prepareConnect4CpcScratch(g),b=api.prepareConnect4CpcScratch(g);
    for(const moves of fixtures(columns,rows))for(let n=0;n<=moves.length;n++){
      const root=connect4RbaFromMoves(moves.slice(0,n),{geometry:g});
      const args=[g,root.words,0,root.basis,0,root.basis.length];
      assert.equal(api.evaluateConnect4Cpc32(...args,b),oldCpc.evaluateConnect4Cpc32(...args,a));
      for(const field of ['interval','forcedColumn','preemptionCount','preemptionMask32'])assert.deepEqual(b[field],a[field]);
    }
  }
});

test('general cancellation and state reuse preserve exact result',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),api=await import('../experiments/isomax-lean/solver-general.mjs');
  const {state,words}=stateFor(api,g,0,false),root=connect4RbaFromMoves([],{geometry:g});
  const load=state.behaviorLoad;let calls=0;
  state.behaviorLoad=()=>{if(++calls===8)publishWorkerBehavior32(words,0,1);return load();};
  assert.equal(api.solveConnect4RbaFrontier(root,{state,reflected:root.reflected}).status,'CANCELLED');
  state.behaviorLoad=load;publishWorkerBehavior32(words,0,0);
  assert.equal(api.solveConnect4RbaFrontier(root,{state,reflected:root.reflected}).relative,0);
});

test('valid small geometries with no winning lines initialize as exact draws',async()=>{
  for(const [columns,rows] of [[1,1],[2,3],[3,3]]){
    const geometry=prepareConnect4RbaGeometry({columns,rows});
    const result=await runLazySmpConnect4Rba32([],{geometry,workers:2,
      sharedCacheCapacity:16,localCacheCapacity:16,timeoutMs:10000});
    assert.equal(result.status,'EXACT',JSON.stringify(result.errors));
    assert.equal(result.rootWdl,0);assert.equal(result.cleanup,true);
  }
});

test('unpacked fallback preserves ordering, weak/exact TT rows, and result',async t=>{
  // Exercise the emitted fallback algorithm on affordable real positions.
  // The public cold guard still requires true overflow before choosing it.
  // Only prepared order representation changes in these test-owned states.
  for(const [columns,rows] of [[4,4],[33,1]]){
    const g=prepareConnect4RbaGeometry({columns,rows}),wide=columns>32;
    const packed=await import(`../experiments/isomax-lean/solver-general${wide?'-wide':''}.mjs`);
    const unpacked=await import(`../experiments/isomax-lean/solver-general${wide?'-wide':''}-unpacked.mjs`);
    let recursiveSorts=0;
    for(const moves of fixtures(columns,rows,wide?12:3,wide?10:6)){
      const a=stateFor(baseline,g,0,true).state,b=stateFor(packed,g,0,false).state;
      a.movePackShift=b.movePackShift=-1;a.moveOrderMask=b.moveOrderMask=0xffffffff;
      a.moveOrder.fill(0xffffffff);b.moveOrder.fill(0xffffffff);
      const root=connect4RbaFromMoves(moves,{geometry:g});
      const expected=baseline.solveConnect4RbaFrontier(root,{state:a,reflected:root.reflected});
      const actual=unpacked.solveConnect4RbaFrontier(root,{state:b,reflected:root.reflected});
      assert.deepEqual([actual.status,actual.value,actual.relative,actual.move],
        [expected.status,expected.value,expected.relative,expected.move]);
      for(const field of ['keys','tag'])assert.deepEqual(b.cache[field],a.cache[field]);
      compareShared(a.cache.shared,b.cache.shared);
      for(let row=columns;row<b.moveOrder.length;row+=columns)
        if(b.moveOrder[row]!==0xffffffff&&b.moveOrder[row+1]!==0xffffffff)recursiveSorts++;
      const memory=createWorkerBehaviorMemory32(1);
      const args={geometry:g,sharedExactCache:b.cache.shared,behavior:new BehaviorWorker(0,
        new Uint32Array(memory.buffer),0,memory)};
      assert.throws(()=>unpacked.prepareConnect4RbaFrontier(args),/packing\/profile/);
    }
    assert.ok(recursiveSorts>0,`${columns}x${rows} must execute recursive multi-action unpacked ordering`);
    t.diagnostic(JSON.stringify({columns,rows,recursiveSorts}));
  }
});

test('geometry choices are cold; qualified standard hot files are unchanged',()=>{
  const base='4e7af0e74b82b6bb70fef94a211196b4235a4039';
  for(const file of ['solver','cpc','coordinate','fixed-ops','shared-cache','worker']){
    const path='experiments/isomax-lean/'+file+'.mjs';
    const before=execFileSync('git',['show',base+':'+path],{encoding:'utf8'}).replaceAll('\r\n','\n');
    const after=readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll('\r\n','\n').replace(/from '\.\/coordinate-(?:supersets|constants|masks)\.mjs'/,"from './coordinate.mjs'").replace("from './profile-supersets.mjs'","from '../../addons/rba-connect4-profile.mjs'");
    assert.equal(createHash('sha256').update(after).digest('hex'),createHash('sha256').update(before).digest('hex'),path);
  }
  for(const wide of [false,true])for(const packed of [true,false]){
    // Huge synthetic layout metadata exercises selection/overflow without
    // pretending to allocate an impractically large board.
    const profile=prepareLeanExecutionProfile({columns:wide?33:4,rows:8,keyWords:23,lineCount:packed?100:0xffffffff});
    assert.equal(profile.wide,wide);assert.equal(profile.packed,packed);
    const src=readFileSync(new URL('../experiments/isomax-lean/'+profile.solver.slice(2),import.meta.url),'utf8');
    const hot=src.slice(src.indexOf('function searchCpcOnlyFrontier'),src.indexOf('export function solveConnect4RbaFrontier')).replace(/\/\/[^\n]*/g,'');
    assert.doesNotMatch(hot,/if\(movePackShift|live\.wordCount===|cache\.compact8|sharedSampleBits|nodeCounts|cacheHits|horizon|performance|Date\.|console\./);
    if(wide)assert.doesNotMatch(src,/actionMask|preemptCount|preemptMask/);
  }
});
