import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareConnect4RbaExecutionProfile} from '../addons/rba-connect4-profile.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {prepareSupportCompiledTransitions32} from '../addons/rba-connect4-support-compiled-transition.mjs';
test('native transition slots and stability match independent enumerated child rows',()=>{
 let images=0,dead=0,stable=0,bit31=0;
 for(const [columns,rows] of [[1,4],[4,1],[3,4],[4,3],[4,4],[5,6]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),p=prepareConnect4RbaExecutionProfile(g),base=prepareSupportBasisPlans32(g,16*2**20,true,true),
   bytes=base.profiles*g.columns*(g.maxBasis*(g.maxBasis<=255?1:g.maxBasis<=65535?2:4)+g.coordWords*4);
  assert.equal(prepareSupportCompiledTransitions32(g,base,bytes-1),null);
  const t=prepareSupportCompiledTransitions32(g,base,bytes);assert.ok(t);assert.equal(t.transitionPlanBytes,bytes);assert.equal(t.basis,base.basis);assert.equal(t.closures,base.closures);assert.equal(base.transitionSlots,undefined);
  for(let h=0;h<base.profiles;h++)for(let c=0;c<columns;c++){
   const height=Math.floor(h/base.strides[c])%base.radix,action=h*columns+c,slotBase=action*g.maxBasis,maskBase=action*g.coordWords;
   if(height===rows){for(let i=0;i<g.maxBasis;i++)assert.equal(t.transitionSlots[slotBase+i],t.transitionDead);continue;}
   const child=h+base.strides[c],childBase=child*g.maxBasis,ids=Array.from(base.basis.slice(childBase,childBase+base.sizes[child])),remove=p.prepareRemove(g,height*columns+c);
   for(let i=0;i<base.sizes[h];i++){
    const id=base.basis[h*g.maxBasis+i],raw=p.removePrepared(g,id,remove),image=raw===0xffffffff?-1:raw,slot=t.transitionSlots[slotBase+i],unchanged=(t.transitionStable[maskBase+(i>>>5)]&(1<<(i&31)))!==0;
    assert.equal(slot,image<0?t.transitionDead:ids.indexOf(image));assert.equal(unchanged,image>=0&&image===id);
    images++;if(image<0)dead++;if(unchanged)stable++;if((i&31)===31&&unchanged)bit31++;
   }
  }
 }
 assert.ok(images>1000&&dead&&stable&&bit31);console.log(JSON.stringify({images,dead,stable,bit31}));
});
test('native slot sentinel widths adapt to declared basis bounds before allocation',()=>{
 for(const [bound,Type,dead] of [[255,Uint8Array,255],[256,Uint16Array,65535],[65535,Uint16Array,65535],[65536,Uint32Array,0xffffffff]]){
  const g={...prepareConnect4RbaGeometry({columns:1,rows:4}),maxBasis:bound},p=prepareSupportBasisPlans32(g,32*2**20,true,true),t=prepareSupportCompiledTransitions32(g,p,32*2**20);
  assert.ok(t.transitionSlots instanceof Type);assert.equal(t.transitionDead,dead);
 }
 assert.throws(()=>prepareSupportCompiledTransitions32({},null,-1),/budget/);
});
test('compiled plan reuse preserves buffers and accounts only reachable transition planes',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:3}),base=prepareSupportBasisPlans32(g,8388608,true,true),
  first=prepareSupportCompiledTransitions32(g,base),again=prepareSupportCompiledTransitions32(g,first);
 assert.equal(base.bytes,5904);assert.equal(first.bytes,13072);
 assert.equal(again,first);assert.equal(again.transitionSlots,first.transitionSlots);assert.equal(again.transitionStable,first.transitionStable);
 assert.equal(prepareSupportCompiledTransitions32(g,first,first.transitionPlanBytes-1),null);
 const incomplete={...first,transitionSlots:new Uint8Array(0)},repaired=prepareSupportCompiledTransitions32(g,incomplete);
 assert.equal(repaired.bytes,13072);assert.equal(repaired.workingBytes,first.workingBytes);
 assert.equal(repaired.transitionSlots.length,first.transitionSlots.length);
});
