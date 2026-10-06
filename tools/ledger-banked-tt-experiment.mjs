// Cold experimental source ledger; no claimed machine cycle savings.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8')),
 source='addons/rba-connect4-shared-banked-cache.mjs';
ledger.localOperationExtensions['runtime.array.reference.load']={cost:{kind:'symbolic',name:'JS_ARRAY_REFERENCE_LOAD_AND_GUARDS'},note:'Bank object reference lookup; V8 element-kind/bounds and inlining costs are unqualified.'};
ledger.localOperationExtensions['runtime.cold.tt.bank.initialize']={cost:{kind:'symbolic',name:'COLD_BANK_SETUP(capacity,banks,validation,allocation,cloning)'},note:'Cold power-of-two and exact-layout validation, bank array/object/view allocation, alias checking and attachment. Child TT allocation charged to the existing cache-create ledger.'};
const hot={
 probeSharedPreparedBankedCompact32:'probeSharedPreparedCompact32',
 storeSharedPreparedBankedCompact32:'storeSharedPreparedCompact32',
 probeBankedCompactSharedCache32:'probeSharedPreparedBankedCompact32',
 storeBankedCompactSharedCache32:'storeSharedPreparedBankedCompact32',
 probeBankedCompactSharedCacheCounted32:'probeBankedCompactSharedCache32',
 storeBankedCompactSharedCacheCounted32:'storeConnect4RbaSharedLayoutCache32',
};
for(const match of readFileSync(source,'utf8').matchAll(/export function (\w+)\(/g)){
 const name=match[1],target=hot[name],unit=source+'#'+name;
 if(ledger.units.some(row=>row.unit===unit))continue;
 const selector=/^probeSharedPreparedBanked|^storeSharedPreparedBanked|^storeBankedCompactSharedCacheCounted/.test(name),
  operations=target?[{op:'runtime.call.subledger',target,count:1}]:[{op:'runtime.cold.tt.bank.initialize',count:1}],
  parameters={};
 if(selector)operations.unshift({op:'runtime.field.load',count:3},{op:'alu.shr.u32',count:1},{op:'alu.and.u32',count:1},{op:'runtime.array.reference.load',count:1});
 if(name==='probeBankedCompactSharedCache32'||name==='storeBankedCompactSharedCache32')operations.push({op:'runtime.call.subledger',target:'compactLayoutSupportProfile8',count:1},{op:'runtime.call.subledger',target:'compactLayoutTailProfile8',count:1});
 if(name==='probeBankedCompactSharedCacheCounted32'){operations.push({op:'control.test.u32',count:1},{op:'control.branch',count:1},{op:'atomic.rmw.u32',count:'HIT'});parameters.HIT='1 only for a diagnostic hit; production access never uses counted functions.';}
 if(name==='createBankedCompactSharedCache32'){operations.push({op:'runtime.call.subledger',target:'createConnect4RbaSharedLayoutCache32',count:'BANKS'},{op:'runtime.call.subledger',target:'attachBankedCompactSharedCache32',count:1});parameters.BANKS='Number of banks; support tables and no current-position work are duplicated.';}
 if(name==='attachBankedCompactSharedCache32'){operations.push({op:'runtime.call.subledger',target:'attachConnect4RbaSharedLayoutCache32',count:'BANKS'});parameters.BANKS='Number of validated, nonaliased bank views.';}
 ledger.units.push({unit,source,name,scope:target?'experimental-banked-shared-tt-access':'cold-banked-shared-tt-setup',status:'decomposed',operations,
  cycleCount:{kind:'symbolic',expression:operations.map(o=>o.op==='runtime.call.subledger'?`(${o.count})*CALL(${o.target})`:`(${o.count})*C(${o.op})`).join('+'),parameters,
   note:'Experimental 8/16GiB capacity path only. Bank selection and call/argument/inlining costs are optimization debt until whole empty-board measurements. Existing seqlock/CAS, injective identity, proof tags, wrap and droppable writes remain in the called unchanged protocol. No decoder, allocation, clocks, statistics, layout test or polling inside the prepared uncounted wrappers.'}});
}
for(const unit of ledger.units){
 if(unit.source===source||!ledger.decomposedSourceBlobs[unit.source])continue;
 const bytes=readFileSync(unit.source,'utf8').replaceAll('\r\n','\n'),hash=createHash('sha1').update(`blob ${Buffer.byteLength(bytes)}\0`).update(bytes).digest('hex');
 if(hash!==ledger.decomposedSourceBlobs[unit.source]){
  unit.cycleCount.note=(unit.cycleCount.note??'')+' Banked-TT experiment: source change is cold topology/dispatch/resource accounting only; current unbanked hot function bodies are unchanged. Banked hot access is charged to its new subledgers.';
  if(unit.name==='prepareLazySmpConnect4Rba32'||unit.name==='materializePreparedConnect4SearchResult32'){
   unit.operations.push({op:'runtime.cold.tt.bank.initialize',count:'BANK_SETUP'});
   unit.cycleCount.parameters={...unit.cycleCount.parameters,BANK_SETUP:'Cold bank allocation/fill, selection or resource aggregation; zero for absent banks.'};
   unit.cycleCount.expression=(unit.cycleCount.expression??'')+'+BANK_SETUP*C(runtime.cold.tt.bank.initialize)';
  }
 }
}
for(const src of new Set([...Object.keys(ledger.decomposedSourceBlobs),source])){
 const bytes=readFileSync(src,'utf8').replaceAll('\r\n','\n');
 ledger.decomposedSourceBlobs[src]=createHash('sha1').update(`blob ${Buffer.byteLength(bytes)}\0`).update(bytes).digest('hex');
}
ledger.summary.units=ledger.units.length;ledger.summary.decomposed=ledger.units.filter(u=>u.status==='decomposed').length;
ledger.summary.localExtensionOperations=Object.keys(ledger.localOperationExtensions).length;
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
