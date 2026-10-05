import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../addons/connect4-residual-proof-frontier.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
import {prepareConnect4ResidualProofFrontierSpan32} from '../addons/connect4-residual-proof-frontier-span.mjs';

// Synthetic native-coordinate controls only. These are not physical game
// certificates; independent complete-carrier tests supply that qualification.
function profile(){
 const profiles=100000,sizes=new Uint16Array(profiles).fill(33),mirrorProfiles=Uint32Array.from({length:profiles},(_,i)=>i);
 return {columns:1,rows:profiles-1,cellCount:profiles-1,coordWords:3,p0Offset:2,p1Offset:5,
  supportBasisPlans:{profiles,sizes,strides:new Uint32Array([1]),mirrorProfiles,
   closures:new Uint32Array(1),mirrorMap:new Uint32Array(1)}};
}
function q(p0,p1){const out=new Uint32Array(8);out[2]=p0;out[5]=p1;return out;}

test('residual proof frontier cold admission, native dimensions and frame transport',()=>{
 assert.equal(typeof api.prepareConnect4ResidualProofFrontier32,'function');
 const inactive=api.prepareConnect4ResidualProofFrontier32({columns:1,rows:4,cellCount:4,coordWords:1,p0Offset:2,p1Offset:3});
 assert.equal(inactive.payloadBytes,0);assert.equal(inactive.probe(q(0,0),0,1,0),0);
 const g=profile(),p=api.prepareConnect4ResidualProofFrontier32(g);
 assert.equal(p.recordWords,8);assert.equal(p.capacity,32768);assert.equal(p.payloadBytes,2097152);
 const words=q(0,0);words[0]=17;p.initialize(words,0);assert.equal(p.frames[0],17);
 g.supportBasisPlans.mirrorProfiles[17]=23;p.child(17,1,1);assert.equal(p.frames[2],23);
 p.child(17,0,2);assert.equal(p.frames[4],17);assert.equal(p.frames[2],23);
 p.store(q(0,0),0,0,3,0);assert.equal(p.probe(q(0,0),0,0,0),0,'root cannot transfer without an action witness');
});

test('residual threshold transfer preserves both gauges, bit31 and poisoned tails',()=>{
 assert.equal(typeof api.prepareConnect4ResidualProofFrontier32,'function');
 const p=api.prepareConnect4ResidualProofFrontier32(profile()),weaker=q(0x80000000,1),stronger=q(0x80000001,0),
  incomparable=q(1,0x80000000),empty=q(0,0);
 p.child(0,0,1);
 const reset=()=>p.entries.fill(0);
 reset();p.store(weaker,0,1,3,0);assert.equal(p.probe(stronger,0,1,0),3);assert.equal(p.probe(incomparable,0,1,0),0);
 reset();p.store(stronger,0,1,1,1);assert.equal(p.probe(weaker,0,1,1),1);assert.equal(p.probe(incomparable,0,1,0),1);
 for(const mover of [0,1]){
  reset();p.store(weaker,0,1,mover?5:4,mover);
  assert.equal(p.probe(stronger,0,1,0),4);assert.equal(p.probe(stronger,0,1,1),5);
  reset();p.store(stronger,0,1,mover?4:5,mover);
  assert.equal(p.probe(weaker,0,1,0),5);assert.equal(p.probe(weaker,0,1,1),4);
 }
 reset();p.store(empty,0,1,2,0);assert.equal(p.probe(empty,0,1,0),2);
 const padded=new Uint32Array(18).fill(0xffffffff);padded.set(weaker,5);
 padded[8]=0xfffffffe;padded[9]=0xffffffff;padded[11]=0xfffffffe;padded[12]=0xffffffff;
 reset();p.store(padded,5,1,3,0);assert.equal(p.probe(stronger,0,1,0),3,'inactive/tail poison cannot inhibit or fabricate containment');
});

test('frontier replacement retains broad proofs and isolates exact support collisions',()=>{
 assert.equal(typeof api.prepareConnect4ResidualProofFrontier32,'function');
 const p=api.prepareConnect4ResidualProofFrontier32(profile()),weak=q(0x80000000,1),strong=q(0x80000001,0);
 p.child(0,0,1);p.store(weak,0,1,3,0);p.store(strong,0,1,3,0);assert.equal(p.probe(weak,0,1,0),3);
 p.entries.fill(0);p.store(strong,0,1,3,0);p.store(weak,0,1,3,0);assert.equal(p.probe(weak,0,1,0),3);
 p.entries.fill(0);p.store(strong,0,1,1,0);p.store(weak,0,1,1,0);assert.equal(p.probe(strong,0,1,0),1);
 p.child(0,0,1);const base=p.frames[3];let collision=-1;
 for(let row=1;row<100000;row++){p.child(row,0,2);if(p.frames[5]===base){collision=row;break;}}
 assert.ok(collision>0);p.entries.fill(0);p.store(weak,0,1,3,0);
 assert.equal(p.probe(weak,0,2,0),0,'different exact handle never hits');
 p.store(weak,0,2,3,0);assert.equal(p.probe(weak,0,1,0),0,'lane collision replaces, never conflates');
  assert.equal(p.probe(weak,0,2,0),3);
});

test('generated native3 frontier equals span authority at every valid count and mask boundary',()=>{
 const g=profile();for(let n=0;n<=96;n++)g.supportBasisPlans.sizes[n]=n;
 const native=api.prepareConnect4ResidualProofFrontier32(g),span=prepareConnect4ResidualProofFrontierSpan32(g);
 let seed=7319,checked=0;const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
 for(let n=0;n<=96;n++){
  native.child(n,0,1);span.child(n,0,1);const base=native.frames[3];
  for(const mover of [0,1])for(const tag of [1,2,3,4,5]){
   native.entries.fill(0,base,base+16);span.entries.fill(0,base,base+16);
   const stored=q(0,0);for(let w=2;w<8;w++)stored[w]=next();
   native.store(stored,0,1,tag,mover);span.store(stored,0,1,tag,mover);
   assert.deepEqual(native.entries.subarray(base,base+16),span.entries.subarray(base,base+16));
   for(let i=0;i<16;i++){
    const query=q(0,0);for(let w=2;w<8;w++)query[w]=next();
    assert.equal(native.probe(query,0,1,mover),span.probe(query,0,1,mover));checked++;
   }
  }
 }
 console.log(JSON.stringify({kind:'C54-native3-span-boundary-agreement',checked,counts:97,seed}));
});
