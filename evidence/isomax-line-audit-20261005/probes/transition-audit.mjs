import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry as geom,prepareConnect4RbaCoordinateScratch as scratch} from '../../../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile as profile} from '../../../addons/rba-connect4-profile.mjs';
import {connect4RbaFromMoves as ingress,connect4PositionCode64FromMoves as code} from '../../../addons/rba-connect4-ingress.mjs';
import {connect4RbaPreparedCofactorNonWinningKnownHeight as prepared,connect4RbaPreparedCanonicalize as canonical} from '../../../addons/rba-connect4-coordinate-prepared.mjs';
import {connect4RbaDenseCofactorNonWinningKnownHeight as dense} from '../../../addons/rba-connect4-coordinate-dense.mjs';
import {prepareConnect4CpcWin32 as c10prep,evaluateConnect4PreparedCpcWin32 as c10} from '../../../addons/connect4-cpc-prepared-win.mjs';
import {prepareConnect4CpcTargetWin32 as c12prep} from '../../../addons/connect4-cpc-target-win.mjs';
let seed=54812419,states=0,children=0,certificates=0,codes=0;
const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
for(const [W,H] of [[1,4],[2,6],[4,5],[5,4],[6,2],[4,7],[9,7],[2,30],[1,31],[3,3]])for(const budget of [0,2097152]){
 const g=geom({columns:W,rows:H,specializationBudgetBytes:budget}),p=profile(g),a=c10prep(g),b=c12prep(g),bs=c12prep(g,{planBudgetBytes:0}),lines=[],catalog=new Map();
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
 for(let trial=0;trial<12;trial++){
  const moves=[];for(let ply=0;ply<W*H;ply++){
   const expected=encode(moves),q=ingress(moves,{geometry:g,canonical:false});assert.deepEqual(q.words,expected.words);assert.deepEqual(q.basis,expected.basis);states++;
   if(expected.words[g.metaOffset]&3)break;
   const legal=Array.from({length:W},(_,c)=>c).filter(c=>expected.h[c]<H);
   const ctrl=1-(moves.length&1);const t=b.evaluate(b,q.words,0,q.basis,0,q.basis.length,ctrl);assert.equal(t,bs.evaluate(bs,q.words,0,q.basis,0,q.basis.length,ctrl));
   for(const reflection of [false,true]){
    const pos=code(moves,{geometry:g,reflected:reflection});let wide=0n;if(g.positionMode){for(let c=0;c<W;c++){let lane=1n<<BigInt(expected.h[c]);for(let r=0;r<expected.h[c];r++)if(expected.cells[r*W+c]===1)lane+=1n<<BigInt(r);wide|=lane<<BigInt((reflection?W-1-c:c)*(H+1));}}
    assert.equal((BigInt(pos.hi)<<32n)|BigInt(pos.lo),wide);codes++;
   }
   const canonWords=q.words.slice(),canonBasis=q.basis.slice(),ref=canonical(g,p,canonWords,0,canonBasis,0,canonBasis.length,scratch(g)),mirror=encode(moves.map(c=>W-1-c));assert.deepEqual(canonWords,ref?mirror.words:q.words);assert.deepEqual(canonBasis,ref?mirror.basis:q.basis);
   if(W*H-moves.length<=7&&(t||c10(a,q.words,0,q.basis,0,q.basis.length,ctrl))){
    const cells=expected.cells.slice(),h=expected.h.slice();const memo=new Map();function exact(rank){const win=lines.find(l=>cells[l[0]]>=0&&l.every(c=>cells[c]===cells[l[0]]));if(win)return cells[win[0]]===(rank&1)?1:-1;if(rank===W*H)return 0;const key=cells.join(',');if(memo.has(key))return memo.get(key);let best=-2;for(let c=0;c<W;c++)if(h[c]<H){cells[h[c]++*W+c]=rank&1;const value=-exact(rank+1);cells[--h[c]*W+c]=-1;best=Math.max(best,value);if(best===1)break;}memo.set(key,best);return best;}
    assert.equal(exact(moves.length),-1);certificates++;
   }
   for(const c of legal){const child=encode([...moves,c]);if([1,3].includes(child.words[g.metaOffset]&3))continue;for(const fn of g.removeByCell===null?[prepared]:[prepared,dense]){const out=new Uint32Array(g.keyWords),outBasis=new Uint32Array(g.maxBasis),s=scratch(g);s.inverse.fill(0xffffffff);const term=fn(g,p,q.words,0,q.basis,0,q.basis.length,c,expected.h[c],out,0,outBasis,0,s.seen,s.size,0,s.map,s.inverse);assert.equal(term,child.words[g.metaOffset]&3);assert.deepEqual(out,child.words);assert.deepEqual(outBasis.slice(0,s.size[0]),child.basis);children++;}}
   moves.push(legal[random(legal.length)]);
  }
 }
}
console.log(JSON.stringify({kind:'transition-extra-physical-audit',seed,states,children,certificates,codes}));
