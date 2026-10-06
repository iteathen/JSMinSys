import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry as geom,prepareConnect4RbaCoordinateScratch as scratch} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile as profile} from '../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves as ingress} from '../addons/rba-connect4-ingress.mjs';
import {connect4RbaPreparedCofactorKnownHeight as prepared,connect4RbaPreparedCanonicalize as canonical} from '../addons/rba-connect4-coordinate-prepared.mjs';
import {connect4RbaClosureDense3CofactorKnownHeight as dense3,connect4RbaClosureDenseSpanCofactorKnownHeight as denseSpan} from '../addons/rba-connect4-coordinate-closure-dense.mjs';
import {connect4RbaClosurePrepared3CofactorKnownHeight as sparse3,connect4RbaClosurePreparedSpanCofactorKnownHeight as sparseSpan} from '../addons/rba-connect4-coordinate-closure-prepared.mjs';
import {connect4RbaSupportCanonicalize as plannedCanonical} from '../addons/rba-connect4-coordinate-support-reflection.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';

const api=Object.assign({},...await Promise.all(['../addons/rba-connect4-support-basis-view.mjs','../addons/rba-connect4-support-handle-view.mjs','../addons/rba-connect4-coordinate-closure-handle-view-dense.mjs','../addons/rba-connect4-coordinate-closure-handle-view-prepared.mjs','../addons/rba-connect4-coordinate-support-reflection-view.mjs'].map(path=>import(path).catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;}))));
const readonly=array=>new Proxy(array,{set(){assert.fail('immutable support basis was written');},get(t,k){const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;}});
Object.assign(api,...await Promise.all(['../addons/rba-connect4-support-search-view.mjs','../addons/rba-connect4-coordinate-closure-search-view-dense.mjs','../addons/rba-connect4-coordinate-closure-search-view-prepared.mjs'].map(path=>import(path).catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;}))));
test('incremental support handles reproduce physical transitions and reflection across all100 dimensions',()=>{
 assert.equal(typeof api.initializeSupportBasisHandle32,'function');
 assert.equal(typeof api.prepareSupportBasisViewScratch32,'function');
 assert.equal(typeof api.findSupportBasisSlot32,'function');
 let viewChildren=0,viewReflections=0;
 let seed=784129,states=0,children=0,geometries=0,plans=0;
 const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
 for(let W=1;W<=10;W++)for(let H=1;H<=10;H++){
  const g=geom({columns:W,rows:H}),p=profile(g),lines=[],catalog=new Map();
  g.supportBasisPlans=prepareSupportBasisPlans32(g,8*2**20,true,true);geometries++;if(g.supportBasisPlans){plans++;g.supportBasisPlans={...g.supportBasisPlans,basis:readonly(g.supportBasisPlans.basis)};}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])if(x+3*dx<W&&y+3*dy>=0&&y+3*dy<H)lines.push(Array.from({length:4},(_,i)=>(y+i*dy)*W+x+i*dx).sort((a,b)=>a-b));
  for(let id=0;id<g.shapeCount;id++)catalog.set(Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id])).join(','),id);
 function encode(moves){
  const cells=new Int8Array(W*H).fill(-1),h=new Uint32Array(W);for(let i=0;i<moves.length;i++)cells[h[moves[i]]++*W+moves[i]]=i&1;
  const winner=lines.find(l=>cells[l[0]]>=0&&l.every(c=>cells[c]===cells[l[0]])),term=winner?(cells[winner[0]]?1:3):moves.length===W*H?2:0;
  const words=new Uint32Array(g.keyWords);words.set(h);words[g.metaOffset]=(moves.length<<2)|term;
  if(term)return {words,basis:new Uint32Array(0),cells,h};
  const ids=new Set(),requirements=[new Set(),new Set()];for(const line of lines){const empty=line.filter(c=>cells[c]<0);if(!empty.length)continue;ids.add(catalog.get(empty.join(',')));for(let player=0;player<2;player++)if(line.every(c=>cells[c]!==1-player))requirements[player].add(empty.join(','));}
  assert.ok(!ids.has(undefined));const basis=Uint32Array.from([...ids].sort((a,b)=>a-b));
  for(let i=0;i<basis.length;i++){const id=basis[i],ss=Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id]));for(let mask=1;mask<(1<<ss.length);mask++){const key=ss.filter((_,j)=>mask&(1<<j)).join(',');for(let player=0;player<2;player++)if(requirements[player].has(key))words[(player?g.p1Offset:g.p0Offset)+(i>>>5)]|=1<<(i&31);}}
  return {words,basis,cells,h};
 }
  // Rule/terminal/quotient checks only; never solve a research holdout's W/D/L.
  for(let trial=0;trial<2;trial++){
   const moves=[];
   for(let ply=0;ply<=Math.min(W*H,16);ply++){
    const expected=encode(moves),q=ingress(moves,{geometry:g,canonical:false});states++;
    assert.deepEqual(q.words,expected.words,`${W}x${H} ingress`);assert.deepEqual(q.basis,expected.basis);
    if(expected.words[g.metaOffset]&3)break;
    const legal=Array.from({length:W},(_,c)=>c).filter(c=>expected.h[c]<H);
    const cw=q.words.slice(),cb=q.basis.slice(),sc=scratch(g);
    if(g.supportBasisPlans){let handle=0;for(let c=0;c<W;c++)handle+=q.words[c]*g.supportBasisPlans.strides[c];sc.map[0]=handle;}
    const ref=(g.supportBasisPlans?plannedCanonical:canonical)(g,p,cw,0,cb,0,cb.length,sc),mirror=encode(moves.map(c=>W-1-c));
    assert.deepEqual(cw,ref?mirror.words:q.words);assert.deepEqual(cb,ref?mirror.basis:q.basis);
    const fns=[prepared];
    if(g.supportBasisPlans){fns.push(sparseSpan);if(g.removeByCell!==null)fns.push(denseSpan);
     if(g.coordWords===3){fns.push(sparse3);if(g.removeByCell!==null)fns.push(dense3);}}
    for(const c of legal){const child=encode([...moves,c]);
     for(const fn of fns){
      const out=new Uint32Array(g.keyWords),outBasis=new Uint32Array(g.maxBasis),sc=scratch(g);sc.inverse.fill(0xffffffff);sc.seen.fill(0xdeadbeef);
      const term=fn(g,p,q.words,0,q.basis,0,q.basis.length,c,expected.h[c],out,0,outBasis,0,sc.seen,sc.size,0,sc.map,sc.inverse);
      assert.equal(term,child.words[g.metaOffset]&3);assert.deepEqual(out,child.words,`${W}x${H} ${fn.name}`);assert.deepEqual(outBasis.slice(0,sc.size[0]),child.basis);children++;
     }
    }
    if(g.supportBasisPlans){
      const rootHandle=api.initializeSupportBasisHandle32(g,q.words,0,q.basis,0,q.basis.length),rootBi=rootHandle*g.maxBasis,vb=g.supportBasisPlans.basis;
      const kinds=['PreparedSpan',...(g.removeByCell!==null?['DenseSpan']:[]),...(g.coordWords===3?['Prepared3',...(g.removeByCell!==null?['Dense3']:[])]:[])];
      for(const c of legal){const child=encode([...moves,c]);
        for(const search of [false,true])for(const kind of kinds)for(const nonWinning of [false,true]){
          if(nonWinning&&(child.words[g.metaOffset]&3)!==0&&(child.words[g.metaOffset]&3)!==2)continue;
          const fn=api[(search?'connect4RbaClosureSearchView':'connect4RbaClosureHandleView')+kind+'Cofactor'+(nonWinning?'NonWinning':'')+'KnownHeight'];assert.equal(typeof fn,'function');
          const out=new Uint32Array(g.keyWords+8).fill(0xdeadbeef),sc=api.prepareSupportBasisViewScratch32(g),sizes=new Uint32Array(1);
          sc.inverse.fill(0xffffffff);const forbiddenInverse=new Proxy({},{get(){assert.fail('inverse accessed');},set(){assert.fail('inverse written');}});
          const term=fn(g,p,q.words,0,vb,rootBi,q.basis.length,c,expected.h[c],out,3,vb,0,undefined,sizes,0,sc.map,search?forbiddenInverse:sc.inverse,rootHandle);
          assert.equal(term,child.words[g.metaOffset]&3);assert.deepEqual(out.slice(3,3+g.keyWords),child.words);
          assert.equal(out[2],0xdeadbeef);assert.equal(out[3+g.keyWords],0xdeadbeef);
          if(!term){
            assert.deepEqual(Array.from(vb.subarray(sc.map[0]*g.maxBasis,sc.map[0]*g.maxBasis+sizes[0])),Array.from(child.basis));
            const ref=api.connect4RbaSupportCanonicalizeView(g,p,out,3,vb,0,sizes[0],sc),mirrorChild=encode([...moves,c].map(c=>W-1-c));
            assert.deepEqual(out.slice(3,3+g.keyWords),ref?mirrorChild.words:child.words);
            let handle=0;for(let x=0;x<W;x++)handle+=out[3+x]*g.supportBasisPlans.strides[x];assert.equal(sc.map[0],handle,'canonical handle published once');
            assert.deepEqual(Array.from(vb.subarray(handle*g.maxBasis,handle*g.maxBasis+sizes[0])),Array.from(ref?mirrorChild.basis:child.basis));
            viewReflections+=ref;
          }
          viewChildren++;
        }
      }
    }
    moves.push(legal[trial?random(legal.length):0]);
   }
  }
 }
 assert.equal(geometries,100);assert.ok(states>1000);assert.ok(children>5000);assert.ok(plans>0&&plans<100);
 console.log(JSON.stringify({kind:'fast100-dimension-rule-transition-check',geometries,states,children,plans,viewChildren,viewReflections,seed,solvedOutcomesQueried:false}));
});

test('root support view rejects reordered or truncated nonterminal ingress and accepts terminal unused basis',()=>{
 assert.equal(typeof api.initializeSupportBasisHandle32,'function');const g=geom({columns:4,rows:3});g.supportBasisPlans=prepareSupportBasisPlans32(g,8*2**20,true,true);
 for(const Id of [Uint8Array,Uint16Array,Uint32Array]){
  g.supportBasisPlans={...g.supportBasisPlans,basis:readonly(Id.from(g.supportBasisPlans.basis))};
  const q=ingress([],{geometry:g,canonical:false}),bi=api.initializeSupportBasisHandle32(g,q.words,0,q.basis,0,q.basis.length);assert.equal(bi,0);
  const bad=q.basis.slice();[bad[0],bad[1]]=[bad[1],bad[0]];
  assert.throws(()=>api.initializeSupportBasisHandle32(g,q.words,0,bad,0,bad.length),/basis|ingress/);
  assert.throws(()=>api.initializeSupportBasisHandle32(g,q.words,0,q.basis,0,q.basis.length-1),/basis|ingress/);
  const terminal=ingress([0,0,1,1,2,2,3],{geometry:g,canonical:false});assert.ok(terminal.words[g.metaOffset]&3);
  assert.ok(Number.isInteger(api.initializeSupportBasisHandle32(g,terminal.words,0,terminal.basis,0,terminal.basis.length)));
 }
});


test('known-handle loader never scans child heights or copies shared basis',()=>{
 assert.equal(typeof api.loadSupportBasisKnownHandle32,'function');
 const g=geom({columns:4,rows:3});g.supportBasisPlans=prepareSupportBasisPlans32(g,8*2**20,true,true);
 const q=ingress([0,1,0],{geometry:g}),handle=api.initializeSupportBasisHandle32(g,q.words,0,q.basis,0,q.basis.length);
 let expected=0;for(let c=0;c<g.columns;c++)expected+=q.words[c]*g.supportBasisPlans.strides[c];assert.equal(handle,expected);assert.ok(handle>0);
 const sc=api.prepareSupportBasisViewScratch32(g),forbidden=new Proxy({}, {get(){assert.fail('unused child height/basis was read');},set(){assert.fail('shared basis was written');}});
 const n=api.loadSupportBasisKnownHandle32(g,forbidden,0,forbidden,0,undefined,sc.map,sc.inverse,handle);
 assert.equal(n,q.basis.length);assert.equal(sc.map[0],handle);
 for(let i=0;i<n;i++)assert.equal(sc.inverse[q.basis[i]],i);
});
