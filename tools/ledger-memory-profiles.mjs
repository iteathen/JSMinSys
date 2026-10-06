// Cold source accounting for memory-profile adoption and generic bank plans.
import {readFileSync,writeFileSync} from 'node:fs';
import {refreshReviewedSourceGuards} from './cycle-source-guards.mjs';
import {cycleExpressionForOperations} from './cycle-ledger-validation.mjs';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8')),
 bankSource='addons/rba-connect4-shared-banked-cache.mjs',profileSource='addons/isomax-memory-profile.mjs';
ledger.localOperationExtensions['runtime.cold.memory.profile']={cost:{kind:'symbolic',name:'MEMORY_PROFILE_INIT(platform,geometry,workers,profiles,FFI)'},note:'Cold OS/libuv/Windows memory snapshot, catalog construction, power-of-two geometry-dependent cache sizing and admission. Includes FFI construction/close, validation, allocation and result freezing; no periodic or per-node sampling.'};
ledger.units=ledger.units.filter(u=>u.source!==bankSource&&u.source!==profileSource);
const hot={probeSharedPreparedBankedCompact32:'probeSharedPreparedCompact32',storeSharedPreparedBankedCompact32:'storeSharedPreparedCompact32',
 probeBankedCompactSharedCache32:'probeSharedPreparedBankedCompact32',storeBankedCompactSharedCache32:'storeSharedPreparedBankedCompact32',
 probeBankedCompactSharedCacheCounted32:'probeConnect4RbaSharedLayoutCache32',storeBankedCompactSharedCacheCounted32:'storeConnect4RbaSharedLayoutCache32',
 probeBankedDirect32:'SELECTED_NATIVE_PROBE',storeBankedDirect32:'SELECTED_NATIVE_STORE'};
for(const source of [bankSource,profileSource])for(const match of readFileSync(source,'utf8').matchAll(/(?:export )?(?:async )?function (\w+)\(/g)){
 const name=match[1],target=hot[name],selector=/PreparedBanked|SharedCacheCounted|BankedDirect32/.test(name),
  operations=target?[{op:target.startsWith('SELECTED_')?'runtime.callback':'runtime.call.subledger',target,count:1}]:[{op:source===profileSource?'runtime.cold.memory.profile':'runtime.cold.tt.bank.initialize',count:1}],
  parameters={};
 if(selector)operations.unshift({op:'runtime.field.load',count:3},{op:'alu.shr.u32',count:1},{op:'alu.and.u32',count:1},{op:'runtime.array.reference.load',count:1});
 if(/^(probe|store)BankedCompactSharedCache32$/.test(name))operations.push({op:'runtime.call.subledger',target:'compactLayoutSupportProfile8',count:1},{op:'runtime.call.subledger',target:'compactLayoutTailProfile8',count:1});
 if(target?.startsWith('SELECTED_'))parameters[target]='One cold-bound unchanged native layout function; lookup/proof/tag/atomic protocol charged in its existing subledger.';
 if(name==='createBankedSharedLayoutCache32'){
  operations.push({op:'runtime.call.subledger',target:'createConnect4RbaSharedLayoutCache32',count:'BANKS'},{op:'runtime.call.subledger',target:'attachBankedSharedLayoutCache32',count:1});
  parameters.BANKS='1..64 disjoint allocations, all initialized before READY.';
 }
 if(name==='attachBankedSharedLayoutCache32'){
  operations.push({op:'runtime.call.subledger',target:'attachConnect4RbaSharedLayoutCache32',count:'BANKS'});parameters.BANKS='1..64 validated factory banks; no live mutation during attachment.';
 }
 ledger.units.push({unit:source+'#'+name,source,name,scope:target?'banked-native-shared-tt-access':'cold-memory-profile-setup',status:'decomposed',operations,
  cycleCount:{kind:'symbolic',expression:cycleExpressionForOperations(operations),parameters,
   note:target?'Cold-bound lookup cost explicitly charged. Same existing native identity, proof transport and seqlock/CAS/wrap/drop calls. No allocation, clock, counters, retries, layout selection or profile checks in uncounted hot wrappers; actual JIT/call/cache cost remains machine-qualified only where measured.':'Initialization only. OS memory snapshots are transient, not allocation guarantees.128GiB address plans tested without large allocation;16..128GiB full-capacity performance remains experimental.'}});
}
for(const unit of ledger.units){
 if(!['addons/rba-connect4-prepared-session-host.mjs','addons/rba-connect4-shared-exact-cache-layout.mjs'].includes(unit.source))continue;
 if(unit.name==='prepareLazySmpConnect4Rba32'||unit.name==='createConnect4RbaSharedLayoutCache32'||unit.name==='attachConnect4RbaSharedLayoutCache32'||unit.name==='prepareSharedCacheAccess')
  unit.cycleCount.note=(unit.cycleCount.note??'')+' Memory-profile adoption: cold generic bank sizing/attachment/selection also includes all geometry-specific field widths. Global capacity uses unsigned32 hash space; each leaf stays within its original native index range.';
}
refreshReviewedSourceGuards(ledger,new Set([bankSource,profileSource]));
ledger.summary.units=ledger.units.length;ledger.summary.decomposed=ledger.units.filter(u=>u.status==='decomposed').length;
ledger.summary.localExtensionOperations=Object.keys(ledger.localOperationExtensions).length;
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
