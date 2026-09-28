// COLD OPTIONAL INITIALIZATION ONLY. Never import this module into a search kernel.
// Windows x64 GROUP_AFFINITY uses a 64-bit mask; BigInt is confined to cold ABI work.
// OS affinity restricts scheduling, not cache ownership or L2 residency.
export function parseWindowsTopology(buffer){
 const cores=[],caches=[];
 for(let offset=0;offset<buffer.length;){
  if(offset+8>buffer.length)throw Error('truncated topology header');
  const relation=buffer.readUInt32LE(offset),size=buffer.readUInt32LE(offset+4);
  if(size<8||offset+size>buffer.length)throw Error('invalid topology record size');
  if(relation===0||relation===2){
   const cache=relation===2,base=cache?40:32,countAt=cache?38:30;
   if(size<base+16)throw Error('truncated topology relationship');
   const count=buffer.readUInt16LE(offset+countAt)||(cache?1:0),groups=[];
   if(count<1||base+count*16>size)throw Error('invalid topology group count');
   for(let i=0;i<count;i++){
    const p=offset+base+i*16,mask=buffer.readBigUInt64LE(p);
    if(mask===0n)throw Error('empty topology affinity');
    groups.push({group:buffer.readUInt16LE(p+8),mask:mask.toString()});
   }
   if(cache)caches.push({level:buffer[offset+8],bytes:buffer.readUInt32LE(offset+12),groups});
   else cores.push({core:cores.length,efficiency:buffer[offset+9],groups});
  }
  offset+=size;
 }
 if(!cores.length)throw Error('no processor cores discovered');
 return {cores,caches};
}
export function targetForProcessor(topology,group,processor){
 if(!Number.isInteger(group)||group<0||group>65535||!Number.isInteger(processor)||processor<0||processor>63)throw RangeError('invalid processor target');
 const bit=1n<<BigInt(processor);
 const core=topology.cores.find(c=>c.groups.some(g=>g.group===group&&(BigInt(g.mask)&bit)!==0n));
 const l2=topology.caches.find(c=>c.level===2&&c.groups.some(g=>g.group===group&&(BigInt(g.mask)&bit)!==0n));
 if(!core||!l2)throw Error('target lacks discovered core/L2 mapping');
 return {group,processor,core:core.core,efficiency:core.efficiency,l2Bytes:l2.bytes};
}
export function validateWorkerTargets(topology,targets,count){
 if(!Number.isInteger(count)||count<1||!Array.isArray(targets)||targets.length!==count)throw RangeError('invalid worker target count');
 const max=Math.max(...topology.cores.map(c=>c.efficiency)),min=Math.min(...topology.cores.map(c=>c.efficiency));
 if(max===min)throw Error('heterogeneous performance-core class not identified');
 const selected=[];
 for(const t of targets){
  const actual=targetForProcessor(topology,t.group,t.processor);
  if(actual.efficiency!==max)throw Error('target is not in performance-core class');
  if(selected.some(s=>s.core===actual.core))throw Error('workers must use distinct physical cores');
  selected.push(actual);
 }
 return selected;
}
export function selectPerformanceTargets(topology,count){
 const max=Math.max(...topology.cores.map(c=>c.efficiency)),targets=[];
 for(const c of topology.cores){
  if(c.efficiency!==max)continue;
  const g=c.groups[0],mask=BigInt(g.mask);
  for(let processor=0;processor<64;processor++)if(mask&(1n<<BigInt(processor))){targets.push({group:g.group,processor});break;}
  if(targets.length===count)break;
 }
 return validateWorkerTargets(topology,targets,count);
}
export async function queryWindowsTopology(){
 if(process.platform!=='win32'||process.arch!=='x64')throw Error('Windows x64 affinity profile required');
 const {DynamicLibrary}=await import('node:ffi'),lib=new DynamicLibrary('kernel32.dll');
 try{
  const get=lib.getFunction('GetLogicalProcessorInformationEx',{arguments:['int32','buffer','buffer'],return:'int32'}),
   error=lib.getFunction('GetLastError',{arguments:[],return:'uint32'}),length=Buffer.alloc(4);
  const first=get(0xffff,Buffer.alloc(1),length);
  if(first||error()!==122||length.readUInt32LE(0)===0)throw Error('topology size query failed');
  const buffer=Buffer.alloc(length.readUInt32LE(0));
  if(!get(0xffff,buffer,length))throw Error('topology query failed: '+error());
  return parseWindowsTopology(buffer.subarray(0,length.readUInt32LE(0)));
 }finally{lib.close();}
}
export async function bindCurrentThread(target){
 if(process.platform!=='win32'||process.arch!=='x64')throw Error('Windows x64 affinity profile required');
 const {group,processor}=target;
 if(!Number.isInteger(group)||group<0||group>65535||!Number.isInteger(processor)||processor<0||processor>63)throw RangeError('invalid thread affinity');
 const {DynamicLibrary}=await import('node:ffi'),lib=new DynamicLibrary('kernel32.dll');
 try{
  const current=lib.getFunction('GetCurrentThread',{arguments:[],return:'pointer'}),
   set=lib.getFunction('SetThreadGroupAffinity',{arguments:['pointer','buffer','buffer'],return:'int32'}),
   get=lib.getFunction('GetThreadGroupAffinity',{arguments:['pointer','buffer'],return:'int32'}),
   error=lib.getFunction('GetLastError',{arguments:[],return:'uint32'}),
   requested=Buffer.alloc(16),previous=Buffer.alloc(16),actual=Buffer.alloc(16),thread=current();
  requested.writeBigUInt64LE(1n<<BigInt(processor));requested.writeUInt16LE(group,8);
  if(!set(thread,requested,previous))throw Error('SetThreadGroupAffinity failed: '+error());
  if(!get(thread,actual))throw Error('GetThreadGroupAffinity failed: '+error());
  if(actual.readBigUInt64LE(0)!==requested.readBigUInt64LE(0)||actual.readUInt16LE(8)!==group)throw Error('OS affinity did not match request');
  return {group,processor,mask:actual.readBigUInt64LE(0).toString(),previousGroup:previous.readUInt16LE(8),previousMask:previous.readBigUInt64LE(0).toString()};
 }finally{lib.close();}
}
