// Offline immutable-view cost identities. Apply once, no timed instrumentation.
import {readFileSync,writeFileSync} from 'node:fs';const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+'),op=(op,count,target)=>({op,count,...target?{target}:{}});
if(l.units.some(u=>u.source.includes('support-basis-view')))throw Error('C44already applied');
function add(source,name,scope,operations,parameters,note){l.units.push({unit:source+'#'+name,source,name,scope,operations,cycleCount:{kind:'symbolic',expression:expr(operations),parameters,note},status:'decomposed'});}
const helper='addons/rba-connect4-support-basis-view.mjs';
add(helper,'prepareSupportBasisViewScratch32','cold-basis-view-scratch',[op('runtime.field.load',2),op('runtime.typed_array.allocate',3),op('runtime.object.allocate',1),op('runtime.field.store',3)],{},'Inverse(shapeCount),map1,mirror(keyWords) before readiness. Legacyseen/mirrorBasis/size/unneeded mapcapacity eliminated bycomplete-view contract. Standardbytes g.shapeCount*4+4+g.keyWords*4.');
add(helper,'initializeSupportBasisView32','cold-position-basis-validation',[
 op('runtime.field.load','F'),op('memory.load.u32','2*C+N+1'),op('memory.load.native_index','VALID*(1+N)'),op('runtime.number.multiply','C+1'),op('alu.add.u32','ADD'),op('alu.and.u32',1),op('control.test.u32','TEST'),op('control.branch','TEST'),op('runtime.object.allocate','FAIL')],
 {C:'Configuredcolumns sumheights exactsupportcode.',N:'Actuallycompared rootIDs after nonterminalguard/sizecheck.',VALID:'1fornonterminalroot,0forterminal unusedbasis.',F:'Reachedplan/geometry/viewfields.',ADD:'Loop/indexsum/addressincrements.',TEST:'Reachedrootterminal/size/ID/loopgates.',FAIL:'RangeErrorexceptiononlyoninvalidingress; no expectedsolvepathallocation.'},'Position-dependent root handle/IDvalidation AFTERallready, insideprimarytime. Basisorder/size mustmatch; no pernode validationorwitnesspatch.');
const load=structuredClone(l.units.find(u=>u.name==='loadSupportClosureBasis32'));load.source=helper;load.unit=helper+'#loadSupportClosureBasisView32';load.name='loadSupportClosureBasisView32';for(const o of load.operations){if(o.op==='memory.store.u32')o.count='N+1';if(o.op==='alu.add.u32')o.count='4*C+2*N';}load.cycleCount.parameters.N='Exactcurrent inverse slots built fromsharednativeIDs, nonecopiedtobasis.';load.cycleCount.note='Same supporthandle/inverse build, nochildBasiswrites, ignoredlegacyseen/childBasis/ciargs. Sharedrowread remainsactualcachelocality/IDwidth debt. Onehandle outputalwayspresent.';load.cycleCount.expression=expr(load.operations);l.units.push(load);
for(const dense of [false,true]){
 const oldSource='addons/rba-connect4-coordinate-closure-'+(dense?'dense':'prepared')+'.mjs',newSource=oldSource.replace('closure-','closure-view-');
 for(const old of l.units.filter(u=>u.source===oldSource)){
  const u=structuredClone(old);u.source=newSource;u.name=u.name.replace('connect4RbaClosure','connect4RbaClosureView');u.unit=newSource+'#'+u.name;
  for(const o of u.operations)if(o.target==='loadSupportClosureBasis32')o.target='loadSupportClosureBasisView32';
  for(const k of ['expression','activeCycleExpression'])if(u.cycleCount[k])u.cycleCount[k]=u.cycleCount[k].replaceAll('CALL(loadSupportClosureBasis32)','CALL(loadSupportClosureBasisView32)');
  u.cycleCount.note+=' C44generatedfromexactclosureauthority; ONLYloaderchanges. Sameactiveunion/upsetabsorption/firstterminal/nonwinningguard/ownerfields; parentIDsreadimmutableviewwithscalarrowbase. Nohotflag/allocation/decoder.';l.units.push(u);
 }
}
const oldReflection='addons/rba-connect4-coordinate-support-reflection.mjs',newReflection=oldReflection.replace('.mjs','-view.mjs');
for(const old of l.units.filter(u=>u.source===oldReflection)){
 const u=structuredClone(old);u.source=newReflection;u.name=u.name.replace('SupportPlanReflectedSupport','SupportPlanReflectedSupportView').replace('SupportCanonicalize','SupportCanonicalizeView');u.unit=newReflection+'#'+u.name;
 if(u.name==='connect4RbaSupportCanonicalizeView'){
  u.operations=u.operations.filter(o=>o.op!=='memory.load.native_index');for(const o of u.operations){if(o.target==='compareSupportPlanReflectedSupport')o.target='compareSupportPlanReflectedSupportView';if(o.op==='memory.store.u32')o.count='SEL*(C+2)';if(o.op==='runtime.number.multiply')o.count='K';}
  u.cycleCount.parameters.N='Ownerpermutationarity, no reflectedbasis rowcopy.';u.cycleCount.note='Canonicalwordcomparison/permutation/support/meta publication unchanged, no basiswrites. Onecanonicalhandle publicationonreflection; caller mustnotreflecthandleagain. Actualloops/contextreadssymbolic, notfree.';
 }
 u.cycleCount.expression=expr(u.operations);l.units.push(u);
}
for(const old of [...l.units].filter(u=>u.source.includes('worker-minimal')&&!u.source.includes('-views'))){
 const u=structuredClone(old),newSource=u.source.replace('worker-minimal','worker-minimal-views');u.source=newSource;u.unit=newSource+'#'+u.name;
 u.cycleCount.parameters??={};
 if(u.name==='<module-main>'){
  for(const o of u.operations){if(o.target==='prepareConnect4RbaCoordinateScratch')o.target='prepareSupportBasisViewScratch32';if(o.op==='runtime.typed_array.allocate'&&typeof o.count==='number')o.count--;}
  u.operations.push(op('runtime.call.subledger',1,'initializeSupportBasisView32'),op('runtime.field.load',1));
  Object.assign(u.cycleCount.parameters,{S:'Actualrootkey/centerorder/history/size stores, NOprivatebasis rootcopy.',MUL:'Coldalloc/result/ordercomputations excludingprivatebasisarena dimensions.',F:'Actualcoldfieldloads forcomplete-view geometry/pointer/callbackbindings.'});
 }
 if(u.name==='negamax'){
  u.operations=u.operations.filter(o=>!(o.op==='runtime.call.subledger'&&(/Cofactor|Canonicalize/.test(o.target??''))));
  for(const dense of [false,true])for(const three of [false,true])u.operations.push(op('runtime.call.subledger',`A*${dense?'KD':'(1-KD)'}*${three?'THREE':'(1-THREE)'}`,'connect4RbaClosureView'+(dense?'Dense':'Prepared')+(three?'3':'Span')+'CofactorNonWinningKnownHeight'));
  u.operations.push(op('runtime.call.subledger','R','connect4RbaSupportCanonicalizeView'),op('runtime.number.multiply','R'));
  Object.assign(u.cycleCount.parameters,{ADD:'Actualword/order/loopaddresses; no privatechildbasisframe addition.',R:'Nonterminalchildren whosecanonicalhandle determines scalarchildBi=handle*maxBasis.',KD:'Cold dense-removaltable admitted.',THREE:'ColdactualcoordWords3 versusspan choice, no boardliteral.',MIRROR:'1complete-view admission; nohotcheck.'});
 }
 const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);u.cycleCount.note+=' C44immutable companion cold-selectedonlywithcompleteplans. Childcanonicalhandle selectsrowbase andisforwardedtofrontierwithreflection0; liveorientationusesactualreflectionbit. Defaultworker untouched. Sharedreadlocality/large-rowaddress/typedID/inliningdebt requiresactualprofile/fullsolve. No recurring selector, reporting orobjects.';l.units.push(u);
}
for(const source of ['addons/rba-connect4-prepared-session-host.mjs','addons/rba-connect4-lazy-smp-host.mjs']){
 const u=l.units.find(u=>u.source===source&&u.name==='prepareLazySmpConnect4Rba32')??l.units.find(u=>u.source===source&&u.name==='runLazySmpConnect4Rba32');
 u.operations.push(op('control.test.u32','BV_TEST'),op('control.branch','BV_TEST'),op('runtime.field.load','BV_READ'),op('runtime.field.store','BV_REPORT'));
 Object.assign(u.cycleCount.parameters??={},{BV_TEST:'ColdviewBoolean/minimal validation andcompleteplanadmission only; no search flag.',BV_READ:'Actuallyreachedgeometryplanclosure/mirror admission andoption forwarding reads.',BV_REPORT:'ActualcoldselectedbasisViews result/state fields, no hottelemetry.'});const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);u.cycleCount.note+=' C44coldview admission/defaultfallback andworkerfilename suffix, reportactualselection. No worker count/topology/TT/searchloopchanges.';
}
l.localOperationExtensions['runtime.math.max']??={cost:{kind:'symbolic',name:'COLD_NUMBER_MAX_COST(profile)'},note:'Cold supporthandle scratchminimum, standardallocationunchanged.'};
l.localOperationExtensions['runtime.string.concat']??={cost:{kind:'symbolic',name:'COLD_STRING_CONCAT_COST(length,allocation)'},note:'Coldworkerfilenamecreation.'};
for(const name of ['preparedConnect4SearchState32','materializePreparedConnect4SearchResult32']){
 const u=l.units.find(u=>u.source==='addons/rba-connect4-prepared-session-host.mjs'&&u.name===name);u.operations.push(op('runtime.field.store',1),op('runtime.field.load',1));const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);
}
{const u=l.units.find(u=>u.source==='addons/rba-connect4-prepared-session-host.mjs'&&u.name==='prepareLazySmpConnect4Rba32');u.operations.push(op('runtime.string.concat','workers'));u.cycleCount.parameters.workers='One additionalcoldworker suffix perpoolmember.';const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);}
l.summary.localExtensionOperations=Object.keys(l.localOperationExtensions).length;
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
