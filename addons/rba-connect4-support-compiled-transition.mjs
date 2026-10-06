import {prepareConnect4RbaExecutionProfile} from './rba-connect4-profile.mjs';

// Geometry-only current-run compiler. No owners, values or selected play.
export function prepareSupportCompiledTransitions32(g,plan,budgetBytes=536870912){
 if(!Number.isSafeInteger(budgetBytes)||budgetBytes<0)throw new RangeError('invalid compiled transition budget');
 if(!plan?.closures||!plan?.mirrorMap)return null;
 const Slot=g.maxBasis<=255?Uint8Array:g.maxBasis<=65535?Uint16Array:Uint32Array,
  dead=Slot===Uint8Array?255:Slot===Uint16Array?65535:0xffffffff,
  actions=plan.profiles*g.columns,slotElements=actions*g.maxBasis,maskElements=actions*g.coordWords,
  bytes=slotElements*Slot.BYTES_PER_ELEMENT+maskElements*4;
 if(!Number.isSafeInteger(bytes)||bytes>budgetBytes||slotElements>0xffffffff||maskElements>0xffffffff)return null;
 const slots=new Slot(new SharedArrayBuffer(slotElements*Slot.BYTES_PER_ELEMENT)),
  stable=new Uint32Array(new SharedArrayBuffer(maskElements*4)),inverse=new Uint32Array(g.shapeCount),p=prepareConnect4RbaExecutionProfile(g);
 slots.fill(dead);
 for(let h=0;h<plan.profiles;h++)for(let c=0;c<g.columns;c++){
  const height=Math.floor(h/plan.strides[c])%plan.radix;if(height===g.rows)continue;
  const child=h+plan.strides[c],childBase=child*g.maxBasis,action=h*g.columns+c,
   slotBase=action*g.maxBasis,maskBase=action*g.coordWords,parentBase=h*g.maxBasis,remove=p.prepareRemove(g,height*g.columns+c);
  for(let i=0,n=plan.sizes[child];i<n;i++)inverse[plan.basis[childBase+i]]=i;
  for(let i=0,n=plan.sizes[h];i<n;i++){
   const id=plan.basis[parentBase+i],raw=p.removePrepared(g,id,remove),image=raw===0xffffffff?-1:raw;
   if(image<0)continue;
   const slot=inverse[image];
   if(slot>=plan.sizes[child]||plan.basis[childBase+slot]!==image)throw new Error('compiled image is not in child support basis');
   slots[slotBase+i]=slot;
   if(image===id)stable[maskBase+(i>>>5)]|=1<<(i&31);
  }
 }
 return Object.freeze({...plan,transitionSlots:slots,transitionStable:stable,transitionDead:dead,
  transitionPlanBudgetBytes:budgetBytes,transitionPlanBytes:bytes,transitionWorkingBytes:bytes+inverse.byteLength,
  bytes:plan.bytes+bytes,workingBytes:plan.workingBytes+bytes+inverse.byteLength});
}
export function prepareSupportCompiledTransitionScratch32(g){
 return {map:new Uint32Array(1),mirror:new Uint32Array(g.keyWords)};
}
export function loadSupportCompiledChild32(g,target,dst,childBasis,ci,seen,indexOut,childIndex,index){
 indexOut[0]=index;return g.supportBasisPlans.sizes[index];
}
