// COLD ONLY: memory profiles, geometry-dependent layout and resource admission.
import {freemem,totalmem} from 'node:os';
import {prepareSharedCacheLayout,isCompactLayoutProfile8} from './rba-connect4-shared-exact-cache-layout.mjs';
import {sharedNativeBankCapacity32,prepareBankedSharedCapacity32} from './rba-connect4-shared-banked-cache.mjs';
const GiB=2**30,privateBudget=2**28;
function createIsoMaxMemoryProfiles32(){return Object.freeze([1,2,4,8,16,32,64,128].map(sharedGiB=>Object.freeze({
 id:String(sharedGiB),sharedGiB,sharedBudgetBytes:sharedGiB*GiB,privateBudgetBytesPerWorker:privateBudget,
 status:sharedGiB<=8?'tested':'experimental',
 evidenceScope:sharedGiB<=4?'localhost i5-12600K Windows empty7x6,2..6 workers':sharedGiB===8?'localhost i5-12600K Windows empty7x6,six workers':'No full-capacity solve or performance qualification',
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

export function selectIsoMaxMemoryProfile32({geometry,workers,availableBytes,requested='auto',allowExperimental=true,reserveBytes=2*GiB}={}){
 if(!geometry||!Number.isInteger(workers)||workers<2||workers>64||!Number.isSafeInteger(availableBytes)||availableBytes<0||
  !Number.isSafeInteger(reserveBytes)||reserveBytes<0||typeof allowExperimental!=='boolean')throw RangeError('Invalid memory profile inputs');
 requested=String(requested);
 if(requested!=='auto'&&!ISOMAX_MEMORY_PROFILES.some(p=>p.id===requested))throw RangeError('Unknown memory profile');
 const layout=prepareSharedCacheLayout(geometry,geometry.keyWords),compact=isCompactLayoutProfile8(geometry,geometry.keyWords),
  privateEntryBytes=compact?32:geometry.keyWords*4+1,
  localCacheCapacity=2**Math.floor(Math.log2(privateBudget/privateEntryBytes)),
  privateBytesPerWorker=localCacheCapacity*privateEntryBytes,
  candidates=requested==='auto'?ISOMAX_MEMORY_PROFILES.filter(p=>p.status==='tested'||allowExperimental).toReversed():ISOMAX_MEMORY_PROFILES.filter(p=>p.id===requested);
 if(!Number.isSafeInteger(localCacheCapacity)||localCacheCapacity<1)throw RangeError('Board key exceeds private memory profile budget');
 for(const profile of candidates){
  const sharedCacheCapacity=2**Math.floor(Math.log2(profile.sharedBudgetBytes/layout.entryBytes)),sharedBytes=sharedCacheCapacity*layout.entryBytes,
   requiredBytes=sharedBytes+workers*privateBytesPerWorker+reserveBytes;
  if(requiredBytes>availableBytes)continue;
  const bankCapacity=Math.min(sharedCacheCapacity,sharedNativeBankCapacity32(layout)),plan=prepareBankedSharedCapacity32(sharedCacheCapacity,bankCapacity);
  return Object.freeze({profile,selection:requested==='auto'?'automatic':'explicit',sharedCacheCapacity,localCacheCapacity,
   sharedCacheLayout:'native',localCacheLayout:compact?'native':'split',sharedBankCapacity:plan.bankCount>1?bankCapacity:null,
   sharedBytes,privateBytesPerWorker,privateBytes:workers*privateBytesPerWorker,reserveBytes,requiredBytes,availableBytes,
   bankCount:plan.bankCount,bankEntries:bankCapacity,entryBytes:layout.entryBytes,
   addressing:plan.bankCount>1?'banked native fields':'unbanked native fields',
   localEvidenceMatchesGeometryAndWorkers:compact&&profile.status==='tested'&&workers<=6&&(profile.sharedGiB!==8||workers===6),performanceScope:profile.evidenceScope});
 }
 throw RangeError('Insufficient memory headroom for requested IsoMax memory profile');
}
