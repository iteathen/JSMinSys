// Offline C54 gate: physical enumeration/minimax is independent of RBA.
// No result from this file is imported by the timed solver.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry,prepareConnect4RbaCoordinateScratch} from '../../../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../../../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves} from '../../../addons/rba-connect4-ingress.mjs';
import {connect4RbaCofactorKnownHeight} from '../../../addons/rba-connect4-coordinate.mjs';
import {prepareSupportBasisPlans32} from '../../../addons/rba-connect4-support-basis-plan.mjs';
const withFrontier=process.argv.includes('--frontier'),frontierApi=withFrontier?
 await import('../../../addons/connect4-residual-proof-frontier.mjs'):null;

function dominates(a,b,g){
 for(let w=0;w<g.coordWords;w++){
  if(b.words[g.p0Offset+w]&~a.words[g.p0Offset+w])return false;
  if(a.words[g.p1Offset+w]&~b.words[g.p1Offset+w])return false;
 }
 return true;
}
assert.equal((0x80000000&~0x80000000)===0,true);
assert.equal((0x80000000&~0)===0,false);
const records=[];
for(const [W,H] of [[4,3],[3,4]]){
 const g=prepareConnect4RbaGeometry({columns:W,rows:H});
 if(withFrontier)g.supportBasisPlans=prepareSupportBasisPlans32(g,16777216,true,true);
 const profile=prepareConnect4RbaExecutionProfile(g),frontier=frontierApi?.prepareConnect4ResidualProofFrontier32(g),
  scratch=prepareConnect4RbaCoordinateScratch(g),out=new Uint32Array(g.keyWords),
  childBasis=new Uint32Array(g.maxBasis),sizes=new Uint32Array(1),
  board=new Int8Array(W*H).fill(-1),height=new Uint32Array(W),history=[],memo=new Map(),groups=new Map();
 let physicalEdges=0;
 function won(c,r,p){
  for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
   let n=1;
   for(const sign of [-1,1])for(let k=1;k<4;k++){
    const x=c+dx*sign*k,y=r+dy*sign*k;
    if(x<0||x>=W||y<0||y>=H||board[y*W+x]!==p)break;
    n++;
   }
   if(n>=4)return true;
  }
  return false;
 }
 function visit(){
  const rank=history.length,key=board.join(',');
  if(memo.has(key))return memo.get(key);
  const q=connect4RbaFromMoves(history,{geometry:g,canonical:false}),
   reflected=connect4RbaFromMoves(history.map(c=>W-1-c),{geometry:g,canonical:false}),
   state={q,reflected,children:new Array(W),value:rank&1?2:-2};
  memo.set(key,state);
  const support=height.join(',');if(!groups.has(support))groups.set(support,[]);groups.get(support).push(state);
  for(let c=0;c<W;c++){
   const r=height[c];if(r===H)continue;
   board[r*W+c]=rank&1;height[c]++;history.push(c);
   let child;
   if(won(c,r,rank&1))child={terminal:true,value:rank&1?-1:1};
   else if(rank+1===W*H)child={terminal:true,value:0};
   else child=visit();
   history.pop();height[c]--;board[r*W+c]=-1;
   state.children[c]=child;physicalEdges++;
   state.value=rank&1?Math.min(state.value,child.value):Math.max(state.value,child.value);
  }
  return state;
 }
 visit();
 // Check actual generic cofactor images against separately advanced physical
 // boards before testing order. First wins/full capacity are never recursed.
 for(const state of memo.values())for(let c=0;c<W;c++)if(state.children[c]){
  const q=state.q,child=state.children[c],term=connect4RbaCofactorKnownHeight(g,profile,q.words,0,q.basis,0,q.basis.length,c,q.words[c],out,0,childBasis,0,scratch.seen,sizes,0,scratch.map,scratch.inverse);
  if(child.terminal)assert.equal(term,child.value+2);
  else{
   assert.equal(term,0);assert.deepEqual(out,child.q.words);
   assert.deepEqual(childBasis.subarray(0,sizes[0]),child.q.basis);
  }
 }
 let pairs=0,comparable=0,nonidentical=0,edgeChecks=0,exactTransfers=0,zeroTransfers=0,frontierQueries=0;
 for(const group of groups.values()){
  for(const s of group)assert.deepEqual(s.q.basis,group[0].q.basis);
  if(frontier){
   const first=group[0].q,mover=(first.words[g.metaOffset]>>>2)&1;
   let handle=0;for(let c=0;c<W;c++)handle+=first.words[c]*g.supportBasisPlans.strides[c];
   for(const reflected of [false,true]){
    frontier.child(handle,reflected,1);const base=frontier.frames[3];
    for(const stored of group){
     const tags=[stored.value+2];
     if(stored.value>=0)tags.push(mover?5:4);
     if(stored.value<=0)tags.push(mover?4:5);
     for(const tag of tags){
      frontier.entries.fill(0,base,base+2*frontier.recordWords);
      const source=reflected?stored.reflected:stored.q;
      frontier.store(source.words,0,1,tag,mover);
      for(const query of group){
       const q=reflected?query.reflected:query.q,above=dominates(q,source,g),below=dominates(source,q,g);
       let expected=0;
       if(tag===3&&above)expected=3;
       else if(tag===1&&below)expected=1;
       else if(tag===2)expected=above?(below?2:mover?5:4):below?(mover?4:5):0;
       else if(tag>3){const lower=(tag===4)!==(mover===1);if(lower?above:below)expected=tag;}
       const hit=frontier.probe(q.words,0,1,mover);assert.equal(hit,expected,'exact support/order threshold transfer');
       if(hit===1)assert.equal(query.value,-1);
       else if(hit===2)assert.equal(query.value,0);
       else if(hit===3)assert.equal(query.value,1);
       else if(hit===4)assert.ok(mover?query.value<=0:query.value>=0);
       else if(hit===5)assert.ok(mover?query.value>=0:query.value<=0);
       frontierQueries++;
      }
     }
    }
   }
  }
  for(const a of group)for(const b of group){
   pairs++;if(!dominates(a.q,b.q,g))continue;
   comparable++;assert.ok(a.value>=b.value,'physical value violates residual order');
   assert.ok(dominates(a.reflected,b.reflected,g),'common physical reflection must preserve containment');
   const same=dominates(b.q,a.q,g);if(!same){
    nonidentical++;
    if(b.value===1||a.value===-1)exactTransfers++;
    if(b.value>=0||a.value<=0)zeroTransfers++;
   }
   for(let c=0;c<W;c++)if(a.children[c]){
    const ac=a.children[c],bc=b.children[c];assert.ok(bc);
    assert.ok(ac.value>=bc.value,'ordered legal child values');
    if(!ac.terminal&&!bc.terminal)assert.ok(dominates(ac.q,bc.q,g),'cofactor must preserve containment');
    edgeChecks++;
   }
  }
 }
 records.push({W,H,nonterminalStates:memo.size,supportGroups:groups.size,physicalEdges,pairs,comparable,nonidentical,edgeChecks,exactTransfers,zeroTransfers,...withFrontier?{frontierQueries}:{}});
 console.log(JSON.stringify(records.at(-1)));
}
writeFileSync(new URL('../raw/'+(withFrontier?'c54-frontier-physical':'c54-residual-dominance')+'.json',import.meta.url),JSON.stringify({kind:withFrontier?'C54-complete-physical-frontier-threshold-gate':'C54-complete-physical-residual-order-gate',runtime:process.version,records,passed:true,scope:'Bounded physical proof gate; no timed solver integration/performance qualification.'},null,2)+'\n');
