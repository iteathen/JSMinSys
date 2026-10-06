// COLD application owner: allocate and initialize once, then release one search.
import {performance} from 'node:perf_hooks';
import {createManagedThreadSession32,sharedViewBytes32} from './branch-manager-host.mjs';
import {connect4RbaFromMoves} from './rba-connect4-ingress.mjs';
import {shareConnect4RbaGeometry32} from './rba-connect4-geometry.mjs';
import {createConnect4RbaSharedExactCache32,isCompactProfile8} from './rba-connect4-shared-exact-cache.mjs';
import {validateConnect4CacheCapacity32} from './rba-connect4-cache-capacity.mjs';
import {prepareSharedCacheLayout,createConnect4RbaSharedLayoutCache32} from './rba-connect4-shared-exact-cache-layout.mjs';
import {prepareSupportBasisPlans32} from './rba-connect4-support-basis-plan.mjs';
import {prepareSupportCompiledTransitions32} from './rba-connect4-support-compiled-transition.mjs';
import {prepareBankedSharedCapacity32,sharedNativeBankCapacity32} from './rba-connect4-shared-banked-cache.mjs';
import {createIndexPartialCache32,createMixedIndexPartialCache32} from './rba-connect4-index-partial-cache.mjs';

const STOP=0,DONE=1,ERROR=2,WAKE=3,WINNER=4,STRIDE=4,
  WORKER_DIED=101,DEADLINE=102,CANCELLED=103;

export async function prepareLazySmpConnect4Rba32({geometry,workers=2,
  sharedCacheCapacity=65536,localCacheCapacity=65536,sharedSampleMask=0,
  timeoutMs=120000,signal,workerMode='minimal',rootFrontier=false,
  behaviorMemory=null,cpcFrontierResponse=false,cpcProjectedAdvisory=false,
  initializationTimeoutMs=30000,sharedCacheLayout='auto',sharedProofBounds=false,supportBasisPlanBudgetBytes=0,supportClosurePlan=false,supportReflectionPlan=false,localCacheLayout='split',supportBasisViews=false,workerTargets=null,sharedBankCapacity=null,cacheIdentity='native32'}={}){
  const initializationStarted=performance.now();
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(!Number.isSafeInteger(supportBasisPlanBudgetBytes)||supportBasisPlanBudgetBytes<0)throw new RangeError('invalid support-plan budget');
  if(typeof supportClosurePlan!=='boolean')throw new TypeError('invalid support closure mode');
  if(typeof supportReflectionPlan!=='boolean'||(supportReflectionPlan&&!supportClosurePlan))throw new TypeError('reflection requires support closures');
  if(typeof supportBasisViews!=='boolean')throw new TypeError('support basis views must be boolean');
  if(typeof sharedProofBounds!=='boolean')throw new TypeError('sharedProofBounds must be boolean');
  if(workerMode!=='minimal'||rootFrontier||behaviorMemory!==null||cpcFrontierResponse||cpcProjectedAdvisory)
    throw new TypeError('prepared application requires minimal workers without legacy options');
  if(!Number.isInteger(workers)||workers<2||workers>64)throw new RangeError('Lazy SMP requires at least two search workers');
  if(workerTargets!==null&&(!Array.isArray(workerTargets)||workerTargets.length!==workers))throw new RangeError('Invalid worker affinity target count');
  const compact=isCompactProfile8(geometry,geometry.keyWords),keyWords=compact?8:geometry.keyWords;
  if(!['native32','partial24','partial16','partialMixed'].includes(cacheIdentity))throw RangeError('invalid TT identity experiment');
  const partial=compact&&cacheIdentity!=='native32',mixed=partial&&cacheIdentity==='partialMixed',effectiveCacheIdentity=partial?cacheIdentity:'native32',partialEntryWords=cacheIdentity==='partial16'?4:6;
  if(localCacheLayout!=='split'&&localCacheLayout!=='native')throw new RangeError('invalid private TT layout');
  const localNative=localCacheLayout==='native'&&compact;
  if(localNative)validateConnect4CacheCapacity32(localCacheCapacity,16);
  // Only standard compact geometry is performance-qualified. Preserve generic
  // storage and valid larger capacities outside the native halfword-view bound.
  if(sharedCacheLayout==='auto')sharedCacheLayout=compact&&sharedCacheCapacity<=0x08000000?'native':'split40';
  if(sharedCacheLayout!=='split40'&&sharedCacheLayout!=='native')throw new RangeError('invalid shared TT layout');
  if(partial&&(!localNative||sharedCacheLayout!=='native'||sharedBankCapacity!==null||sharedCacheCapacity<(mixed?16:8)||localCacheCapacity<(mixed?16:8)||sharedCacheCapacity>2**28))
    throw RangeError('partial TT requires native caches within one optimized bank');
  const layout=partial?{kind:cacheIdentity,entryBytes:partialEntryWords*4,entryWords:partialEntryWords}:sharedCacheLayout==='native'?prepareSharedCacheLayout(geometry,geometry.keyWords):null,
    sharedStride=layout===null?keyWords:layout.kind==='compact32'?16:
      layout.kind==='direct'?layout.heightStride:layout.entryWords;
  const banked=layout!==null&&(sharedBankCapacity!==null||sharedCacheCapacity>sharedNativeBankCapacity32(layout));
  if(sharedBankCapacity!==null&&!banked)throw RangeError('shared banks require native layout');
  if(banked){
    const limit=sharedNativeBankCapacity32(layout),capacity=sharedBankCapacity??limit;
    if(capacity>limit)throw RangeError('native TT bank index exceeds optimized range');
    prepareBankedSharedCapacity32(sharedCacheCapacity,capacity);
  }
  else validateConnect4CacheCapacity32(sharedCacheCapacity,sharedStride);
  validateConnect4CacheCapacity32(localCacheCapacity,keyWords);
  if(!Number.isInteger(sharedSampleMask)||sharedSampleMask<0||sharedSampleMask>255||
     (sharedSampleMask&(sharedSampleMask+1)))throw new RangeError('invalid Lazy SMP shared sample mask');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0||!Number.isFinite(initializationTimeoutMs)||initializationTimeoutMs<=0)
    throw new RangeError('invalid Lazy SMP timeout');
  if(supportBasisPlanBudgetBytes&&!signal?.aborted)geometry={...geometry,supportBasisPlans:prepareSupportBasisPlans32(geometry,supportBasisPlanBudgetBytes,supportClosurePlan,supportReflectionPlan)};

  const basisViews=supportBasisViews&&Boolean(geometry.supportBasisPlans?.closures&&geometry.supportBasisPlans?.mirrorMap);
  const transitionBudget=536870912,
    transitionPlan=basisViews&&!signal?.aborted?prepareSupportCompiledTransitions32(geometry,geometry.supportBasisPlans,transitionBudget):null,
    compiledTransitions=transitionPlan!==null;
  if(partial&&!compiledTransitions)throw RangeError('partial TT candidate requires admitted compiled support plans');
  if(compiledTransitions)geometry={...geometry,supportBasisPlans:transitionPlan};
  const control=new Int32Array(new SharedArrayBuffer(20)),
    resultWords=new Int32Array(new SharedArrayBuffer(workers*STRIDE*4)),
    readyGate=new Int32Array(new SharedArrayBuffer(20)),
    affinityState=workerTargets===null?null:new Int32Array(new SharedArrayBuffer(workers*3*4)),
    session=createManagedThreadSession32({control,stopIndex:STOP,doneIndex:DONE,errorIndex:ERROR,
      wakeIndex:WAKE,workerDiedCode:WORKER_DIED,deadlineCode:DEADLINE,cancelledCode:CANCELLED});
  control[WINNER]=-1;
  let root=null,shared=null,workerGeometry=null,started=false,closed=false,closePromise=null,
    initializationFinished=null,solveStarted=null,solveFinished=null,cleanupStarted=null,cleanupFinished=null;

  async function closePreparedConnect4Search32(){
    if(closePromise)return closePromise;
    signal?.removeEventListener('abort',abortPreparedConnect4Search32);
    if(started&&!Atomics.load(control,DONE)&&!Atomics.load(control,ERROR))session.fail(CANCELLED);
    closed=true;cleanupStarted=performance.now();
    Atomics.store(readyGate,1,-1);Atomics.notify(readyGate,1);
    closePromise=session.close();
    await closePromise;cleanupFinished=performance.now();
    signal?.removeEventListener('abort',abortPreparedConnect4Search32);
  }
  function abortPreparedConnect4Search32(){
    if(Atomics.load(control,DONE))return;
    session.fail(CANCELLED);void closePreparedConnect4Search32();
  }
  function preparedConnect4SearchState32(){return {...session.state(),readyWorkers:Atomics.load(readyGate,0),
    searchStarted:started,closed,basisViews,compiledTransitions,cacheIdentity:effectiveCacheIdentity,
    affinityReady:affinityState!==null&&Array.from({length:workers},(_,i)=>Atomics.load(affinityState,i*3)>0).every(Boolean),
    affinityVerified:affinityState!==null&&Array.from({length:workers},(_,i)=>Atomics.load(affinityState,i*3)===1).every(Boolean)};}
  function materializePreparedConnect4SearchResult32(reflected=0){
    const host=session.state(),winner=Atomics.load(control,WINNER),errorCode=host.errorCode,
      exact=!errorCode&&Atomics.load(control,DONE)===1&&winner>=0;
    return {status:exact?'EXACT':errorCode===DEADLINE?'TIMEOUT':errorCode===CANCELLED?'INTERRUPTED':'FAILED',
      rootWdl:exact?Atomics.load(resultWords,winner*STRIDE)-2:null,
      move:exact?Atomics.load(resultWords,winner*STRIDE+2):-1,winner,winnerMetrics:null,
      nodeCounts:null,workerTiming:null,frontierMetrics:null,
      sharedCacheHits:null,sharedCacheStores:null,sharedCacheStoreContention:null,
      sharedSampleMask,workerMode:'minimal',cacheIdentity:effectiveCacheIdentity,
      sharedCacheLayout,sharedTtEntryBytes:mixed?null:layout===null?(keyWords+2)*4:layout.entryBytes,
      sharedTtEntryWidths:mixed?[16,24]:null,sharedTtPayloadBytes:shared?.payloadBytes??shared?.entries?.byteLength??null,
      sharedTtLogicalEntries:mixed?shared?.logicalEntries:sharedCacheCapacity,sharedTtPools:mixed?2:1,
      sharedTtBanks:shared?.banks?.length??1,sharedTtBankEntries:shared?.banks?.[0]?.mask===undefined?null:shared.banks[0].mask+1,
      sharedProofBounds,basisViews,compiledTransitions,supportTransitionPlanBudgetBytes:transitionBudget,
      supportTransitionPlanBytes:geometry.supportBasisPlans?.transitionPlanBytes??0,
      supportTransitionWorkingBytes:geometry.supportBasisPlans?.transitionWorkingBytes??0,
      localCacheLayout:localNative?'native':'split',privateTtEntryBytes:mixed?null:partial?partialEntryWords*4:localNative?32:keyWords*4+1,
      privateTtEntryWidths:mixed?[16,24]:null,privateTtPayloadBytes:mixed?localCacheCapacity*28:null,
      privateTtLogicalEntries:mixed?localCacheCapacity*1.5:localCacheCapacity,
      supportBasisPlanBytes:geometry.supportBasisPlans?.bytes??0,supportBasisPlanProfiles:geometry.supportBasisPlans?.profiles??0,
      supportClosurePlan:Boolean(geometry.supportBasisPlans?.closures),supportReflectionPlan:Boolean(geometry.supportBasisPlans?.mirrorMap),supportPlanWorkingBytes:geometry.supportBasisPlans?.workingBytes??0,
      completedWorkers:Array.from({length:workers},(_,i)=>Atomics.load(resultWords,i*STRIDE+3)),
      reflected,elapsedMs:performance.now()-initializationStarted,
      readyWorkers:Atomics.load(readyGate,0),
      preparedTiming:{readyWorkers:Atomics.load(readyGate,0),rootConstructedAfterReady:started,
        initializationMs:(initializationFinished??performance.now())-initializationStarted,
        solveMs:solveStarted===null?0:(solveFinished??performance.now())-solveStarted,
        cleanupMs:cleanupStarted===null?0:(cleanupFinished??performance.now())-cleanupStarted,
        boundary:'all workers ready and empty TT pages initialized -> root construction -> exact result observed; cleanup separate'},
      errorCode,errors:host.errors,cleanup:host.cleanup,workersExited:host.workersExited,
      requestedWorkers:workers,workersUsed:session.threads.length,
      workerAffinity:affinityState===null?null:Array.from({length:workers},(_,i)=>({worker:i,target:workerTargets[i],
        verified:Atomics.load(affinityState,i*3)===1,hintsApplied:Atomics.load(affinityState,i*3)>1,
        affinityTagApplied:Atomics.load(affinityState,i*3)===3,
        affinityTagStatus:workerTargets[i].platform==='darwin'?Atomics.load(affinityState,i*3+1):null,
        group:workerTargets[i].platform==='darwin'?null:Atomics.load(affinityState,i*3+1),
        cpu:workerTargets[i].platform==='darwin'?null:Atomics.load(affinityState,i*3+2)})),
      sharedBytes:(shared===null?0:layout===null?sharedViewBytes32(shared):(shared.payloadBytes??(shared.banks?shared.banks.reduce((bytes,bank)=>bytes+bank.entries.byteLength,0):shared.entries.byteLength))+shared.stats.byteLength+(mixed?12:0))+(workerGeometry===null?0:sharedViewBytes32(workerGeometry))+(geometry.supportBasisPlans?.bytes??0)+
        control.byteLength+resultWords.byteLength+readyGate.byteLength+(affinityState?.byteLength??0)+
        (root===null?0:root.words.byteLength+root.basis.byteLength+root.moveHistory.byteLength)};
  }
  async function solvePreparedConnect4Search32(moves){
    if(started)throw new Error('prepared search session is one-shot; already started');
    if(closed){await closePreparedConnect4Search32();return materializePreparedConnect4SearchResult32();}
    started=true;solveStarted=performance.now();
    try{
      const actualRoot=connect4RbaFromMoves(moves,{geometry,positionCode:false});
      root.words.set(actualRoot.words);root.basis.set(actualRoot.basis);
      root.moveHistory.set(actualRoot.moveHistory);
      Atomics.store(readyGate,2,actualRoot.basis.length);
      Atomics.store(readyGate,3,actualRoot.reflected);
      Atomics.store(readyGate,4,actualRoot.moveHistory.length);
      Atomics.store(readyGate,1,1);Atomics.notify(readyGate,1);
      await session.wait({timeoutMs,signal});
      solveFinished=performance.now();
      return await finishPreparedConnect4Search32(actualRoot.reflected);
    }catch(error){await closePreparedConnect4Search32();throw error;}
  }
  async function finishPreparedConnect4Search32(reflected){await closePreparedConnect4Search32();return materializePreparedConnect4SearchResult32(reflected);}

  try{
    if(signal?.aborted){abortPreparedConnect4Search32();await closePreparedConnect4Search32();initializationFinished=performance.now();return {solve:solvePreparedConnect4Search32,close:closePreparedConnect4Search32,state:preparedConnect4SearchState32};}
    signal?.addEventListener('abort',abortPreparedConnect4Search32,{once:true});
    root={words:new Uint32Array(new SharedArrayBuffer(geometry.keyWords*4)),
      basis:new Uint32Array(new SharedArrayBuffer(geometry.maxBasis*4)),
      moveHistory:new Uint32Array(new SharedArrayBuffer(geometry.cellCount*4)),reflected:0};
    workerGeometry=shareConnect4RbaGeometry32(geometry);
    shared=mixed?createMixedIndexPartialCache32({geometry,capacity:sharedCacheCapacity,shared:true}):partial?createIndexPartialCache32({geometry,capacity:sharedCacheCapacity,shared:true,kind:cacheIdentity}):
      (layout===null?createConnect4RbaSharedExactCache32:createConnect4RbaSharedLayoutCache32)({capacity:sharedCacheCapacity,keyWords:geometry.keyWords,geometry,bankCapacity:sharedBankCapacity});
    if(sharedProofBounds)shared.proofDomain='absolute-wdl-zero-v1';
    if(layout===null){shared.sequence.fill(0);shared.value.fill(0);shared.keys.fill(0);}
    else if(shared.banks)for(const bank of shared.banks)bank.entries.fill(0);
    else shared.entries.fill(0);
    for(let i=0;i<workers;i+=1){
     const file=new URL('./rba-connect4-lazy-smp-worker-minimal'+(basisViews?(compiledTransitions?'-views-compiled':'-views'):'')+
      (i&1?'':'-center')+(sharedProofBounds?'-proofs':'')+(localNative?'-local32':'')+(partial?'-'+cacheIdentity:'')+'.mjs',import.meta.url);
     session.spawn(workerTargets===null?file:new URL('./worker-startup-affinity.mjs',import.meta.url),{
      control,resultWords,workerIndex:i,workerCount:workers,geometry:workerGeometry,
      root,rootReflected:0,sharedExactCache:shared,localCacheCapacity,sharedSampleMask,readyGate,
      workerAffinityTarget:workerTargets?.[i]??null,workerAffinityState:affinityState,workerModuleUrl:file.href});
    }
    while(Atomics.load(readyGate,0)!==workers&&!closed&&!Atomics.load(control,ERROR)){
      if(performance.now()-initializationStarted>initializationTimeoutMs){session.fail(DEADLINE);break;}
      await new Promise(resolve=>setTimeout(resolve,5));
    }
    if(Atomics.load(control,ERROR)||closed)await closePreparedConnect4Search32();
    if(affinityState!==null&&!closed&&!preparedConnect4SearchState32().affinityReady){session.fail(WORKER_DIED);await closePreparedConnect4Search32();}
    initializationFinished=performance.now();
    return {solve:solvePreparedConnect4Search32,close:closePreparedConnect4Search32,state:preparedConnect4SearchState32};
  }catch(error){await closePreparedConnect4Search32();throw error;}
}
