// COLD ONLY: memory profiles, geometry-dependent layout and resource admission.
import {freemem,totalmem} from 'node:os';
import {prepareSharedCacheLayout,isCompactLayoutProfile8} from './rba-connect4-shared-exact-cache-layout.mjs';
import {sharedNativeBankCapacity32,prepareBankedSharedCapacity32} from './rba-connect4-shared-banked-cache.mjs';
const GiB=2**30,privateBudget=2**28;
function createIsoMaxMemoryProfiles32(){return Object.freeze([1,2,4,8,12,16,32,64,128].map(sharedGiB=>Object.freeze({
 id:String(sharedGiB),sharedGiB,sharedBudgetBytes:sharedGiB*GiB,privateBudgetBytesPerWorker:privateBudget,
 status:sharedGiB<=12?'tested':'experimental',
 evidenceScope:sharedGiB===12?'localhost i5-12600K Windows empty7x6,six workers,partial24 actual12GiB':sharedGiB<=4?'localhost i5-12600K Windows empty7x6,2..6 workers,native32':sharedGiB===8?'localhost i5-12600K Windows empty7x6,six workers,native32':'No full-capacity solve or performance qualification',
 addressing:sharedGiB<=4?'native fields; banks selected from geometry':'native fields in independently addressed banks',
})));}
export const ISOMAX_MEMORY_PROFILES=createIsoMaxMemoryProfiles32();

export async function discoverAvailableSolverMemory32(){
 const physicalAvailableBytes=freemem(),processAvailableBytes=process.availableMemory(),totalPhysicalBytes=totalmem();
 let commitAvailableBytes=null,source='os.freemem + process.availableMemory (libuv process/resource limits)';
 if(process.platform==='win32'){
  const {DynamicLibrary}=await import('node:ffi'),library=new DynamicLibrary('kernel32.dll');
  try{
   const query=library.getFunction('GlobalMemoryStatusEx',{arguments:['buffer'],return:'int32'}),buffer=Buffer.alloc(64);
   buffer.writeUInt32LE(64);if(!query(buffer))throw Error('Windows memory discovery failed');
   commitAvailableBytes=Number(buffer.readBigUInt64LE(32));
   source+=' + GlobalMemoryStatusEx available commit';
  }finally{library.close();}
 }
 const availableBytes=Math.min(physicalAvailableBytes,processAvailableBytes,commitAvailableBytes??Infinity);
 if(!Number.isSafeInteger(availableBytes)||availableBytes<0)throw Error('Invalid memory discovery');
 return Object.freeze({platform:process.platform,totalPhysicalBytes,physicalAvailableBytes,processAvailableBytes,
  commitAvailableBytes,availableBytes,source});
}

export function inspectIsoMaxPreparation32({geometry:g,workers,supportBasisPlanBudgetBytes=GiB,
 supportClosurePlan=true,supportReflectionPlan=true,supportBasisViews=true}={}){
 if(!g||!Number.isInteger(workers)||workers<2||workers>64||!Number.isSafeInteger(supportBasisPlanBudgetBytes)||supportBasisPlanBudgetBytes<0)
  throw RangeError('Invalid support/runtime memory reserve inputs');
 let profiles=1,planBytes=0,compiledPlanEligible=false,effectivePlan=supportBasisPlanBudgetBytes?null:g.supportBasisPlans;
 for(let column=0;column<g.columns;column++){
  profiles*=g.rows+1;if(!Number.isSafeInteger(profiles)||profiles>0xffffffff){profiles=0;break;}
 }
 if(profiles&&supportBasisPlanBudgetBytes){
  const idBytes=g.shapeCount<=256?1:g.shapeCount<=65536?2:4,sizeBytes=g.maxBasis<=255?1:g.maxBasis<=65535?2:4,
   indexBytes=g.maxBasis<=256?1:g.maxBasis<=65536?2:4,basisElements=profiles*g.maxBasis,maskElements=profiles*g.shapeWordCount,
   closureElements=supportClosurePlan?basisElements*g.coordWords:0,
   bytes=basisElements*idBytes+maskElements*4+profiles*sizeBytes+g.columns*4+closureElements*4+
    (supportReflectionPlan?basisElements*indexBytes+profiles*4:0);
  const admitted=Number.isSafeInteger(bytes)&&bytes<=supportBasisPlanBudgetBytes&&basisElements<=0xffffffff&&maskElements<=0xffffffff&&closureElements<=0xffffffff;
  if(admitted){
   planBytes=bytes+g.shapeCount*4;
   effectivePlan={profiles,closures:supportClosurePlan,mirrorMap:supportReflectionPlan};
  }
 }
 const basisViews=supportBasisViews&&Boolean(effectivePlan?.closures&&effectivePlan?.mirrorMap);
 if(basisViews){
  const Slot=g.maxBasis<=255?Uint8Array:g.maxBasis<=65535?Uint16Array:Uint32Array,
   dead=Slot===Uint8Array?255:Slot===Uint16Array?65535:0xffffffff,
   slots=effectivePlan.profiles*g.columns*g.maxBasis,masks=effectivePlan.profiles*g.columns*g.coordWords,
   compiledBytes=slots*Slot.BYTES_PER_ELEMENT+masks*4,
   reusable=effectivePlan.transitionPlanBytes===compiledBytes&&effectivePlan.transitionDead===dead&&
    effectivePlan.transitionSlots instanceof Slot&&effectivePlan.transitionSlots.length===slots&&effectivePlan.transitionSlots.buffer instanceof SharedArrayBuffer&&
    effectivePlan.transitionStable instanceof Uint32Array&&effectivePlan.transitionStable.length===masks&&effectivePlan.transitionStable.buffer instanceof SharedArrayBuffer;
  compiledPlanEligible=reusable||(Number.isSafeInteger(compiledBytes)&&compiledBytes<=2**29&&slots<=0xffffffff&&masks<=0xffffffff);
  if(compiledPlanEligible&&!reusable)planBytes+=compiledBytes+g.shapeCount*4;
 }
 // shareConnect4RbaGeometry32 allocates one shared copy per private view.
 let geometryCopyBytes=0;
 for(const value of Object.values(g))if(ArrayBuffer.isView(value)&&!(value.buffer instanceof SharedArrayBuffer)){
  geometryCopyBytes+=value.byteLength;
 }
 const frameBytes=(g.cellCount+1)*g.keyWords*4,
  basisBytes=basisViews?0:(g.cellCount+1)*g.maxBasis*4,
  // Runtime allowances are estimates, not claims of measured per-isolate cost.
  bytes=planBytes+geometryCopyBytes+2**27+workers*(2**25+frameBytes+basisBytes);
 if(!Number.isSafeInteger(bytes)||bytes<0)throw RangeError('Geometry exceeds memory reserve range');
 return {reserveBytes:Math.max(2**28,2**Math.ceil(Math.log2(bytes))),compiledPlanEligible};
}

export function estimateIsoMaxPreparationReserve32(options){return inspectIsoMaxPreparation32(options).reserveBytes;}
export function resolveIsoMaxCacheIdentity32(options){
 const requested=options.cacheIdentity??'auto';
 if(!['auto','native32','partial24'].includes(requested))throw RangeError('Invalid public cache identity');
 const partial=isCompactLayoutProfile8(options.geometry,options.geometry.keyWords)&&inspectIsoMaxPreparation32(options).compiledPlanEligible;
 if(requested==='partial24'&&!partial)throw RangeError('partial24 requires complete standard support plans');
 return requested!=='native32'&&partial?'partial24':'native32';
}

export function selectIsoMaxMemoryProfile32({geometry,workers,availableBytes,requested='auto',allowExperimental=true,reserveBytes=2*GiB,cacheIdentity='native32'}={}){
 if(!geometry||!Number.isInteger(workers)||workers<2||workers>64||!Number.isSafeInteger(availableBytes)||availableBytes<0||
  !Number.isSafeInteger(reserveBytes)||reserveBytes<0||typeof allowExperimental!=='boolean')throw RangeError('Invalid memory profile inputs');
 requested=String(requested);
 if(requested!=='auto'&&!ISOMAX_MEMORY_PROFILES.some(p=>p.id===requested))throw RangeError('Unknown memory profile');
 if(!['native32','partial24'].includes(cacheIdentity))throw RangeError('Invalid memory cache identity');
 const compact=isCompactLayoutProfile8(geometry,geometry.keyWords),partial=compact&&cacheIdentity==='partial24',
  effectiveIdentity=partial?'partial24':'native32',layout=partial?{kind:'partial24',entryBytes:24,entryWords:6}:prepareSharedCacheLayout(geometry,geometry.keyWords),
  privateEntryBytes=partial?24:compact?32:geometry.keyWords*4+1,
  localCacheCapacity=2**Math.floor(Math.log2(privateBudget/privateEntryBytes)),
  privateBytesPerWorker=localCacheCapacity*privateEntryBytes,
  candidates=requested==='auto'?ISOMAX_MEMORY_PROFILES.filter(p=>p.status==='tested'||allowExperimental).toReversed():ISOMAX_MEMORY_PROFILES.filter(p=>p.id===requested);
 if(!Number.isSafeInteger(localCacheCapacity)||localCacheCapacity<1)throw RangeError('Board key exceeds private memory profile budget');
 for(let i=0;i<candidates.length;i++){
  // Automatic duplicate row counts choose the smallest equivalent budget.
  while(requested==='auto'&&i+1<candidates.length&&
   Math.floor(Math.log2(candidates[i].sharedBudgetBytes/layout.entryBytes))===Math.floor(Math.log2(candidates[i+1].sharedBudgetBytes/layout.entryBytes)))i++;
  const profile=candidates[i];
  const sharedCacheCapacity=2**Math.floor(Math.log2(profile.sharedBudgetBytes/layout.entryBytes)),sharedBytes=sharedCacheCapacity*layout.entryBytes,
   requiredBytes=sharedBytes+workers*privateBytesPerWorker+reserveBytes;
  if(requiredBytes>availableBytes)continue;
  const bankCapacity=Math.min(sharedCacheCapacity,sharedNativeBankCapacity32(layout)),plan=prepareBankedSharedCapacity32(sharedCacheCapacity,bankCapacity);
  const qualified=partial?sharedCacheCapacity===2**29&&workers===6:compact&&profile.status==='tested'&&workers<=6&&(profile.sharedGiB!==8||workers===6)&&profile.sharedGiB!==12;
  return Object.freeze({profile,cacheIdentity:effectiveIdentity,selection:requested==='auto'?'automatic':'explicit',sharedCacheCapacity,localCacheCapacity,
   sharedCacheLayout:'native',localCacheLayout:compact?'native':'split',sharedBankCapacity:plan.bankCount>1?bankCapacity:null,
   sharedBytes,privateBytesPerWorker,privateBytes:workers*privateBytesPerWorker,reserveBytes,requiredBytes,availableBytes,
   bankCount:plan.bankCount,bankEntries:bankCapacity,entryBytes:layout.entryBytes,
   addressing:plan.bankCount>1?'banked native fields':'unbanked native fields',
   localEvidenceMatchesGeometryAndWorkers:qualified,performanceScope:qualified?profile.evidenceScope:'Exact geometry/cache layout has correctness coverage; performance unqualified for this allocation/worker combination'});
 }
 throw RangeError('Insufficient memory headroom for requested IsoMax memory profile');
}
