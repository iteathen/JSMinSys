// Cold verified per-thread CPU binding, completed before worker initialization.
import {endianness} from 'node:os';
import {bindCurrentThread} from './worker-affinity.mjs';
export async function queryWindowsAllowedGroups(){
 if(process.platform!=='win32')throw Error('Windows process affinity required');
 const {DynamicLibrary}=await import('node:ffi'),lib=new DynamicLibrary('kernel32.dll');
 try{
  const current=lib.getFunction('GetCurrentProcess',{arguments:[],return:'pointer'}),
   groups=lib.getFunction('GetProcessGroupAffinity',{arguments:['pointer','buffer','buffer'],return:'int32'}),
   masks=lib.getFunction('GetProcessAffinityMask',{arguments:['pointer','buffer','buffer'],return:'int32'}),
   count=Buffer.alloc(2),processMask=Buffer.alloc(8),systemMask=Buffer.alloc(8),handle=current();
  count.writeUInt16LE(64);let ids=Buffer.alloc(128);
  if(!groups(handle,count,ids)){
   if(count.readUInt16LE(0)<=64)throw Error('Cannot discover process CPU groups');
   ids=Buffer.alloc(count.readUInt16LE(0)*2);
   if(!groups(handle,count,ids))throw Error('Cannot discover process CPU groups');
  }
  if(count.readUInt16LE(0)===1){
   if(!masks(handle,processMask,systemMask))throw Error('Cannot discover process CPU allowance');
   return [{group:ids.readUInt16LE(0),mask:processMask.readBigUInt64LE(0).toString()}];
  }
  // Windows exposes this mask only for single-group processes. Bind/readback
  // remains the final authority for each target in a multi-group process.
  return Array.from({length:count.readUInt16LE(0)},(_,i)=>({group:ids.readUInt16LE(i*2),mask:'18446744073709551615'}));
 }finally{lib.close();}
}
export async function bindVerifiedWorkerCpu(target){
 if(target?.platform==='darwin')throw Error('macOS does not support verified hard CPU pinning');
 if(target?.platform!==process.platform)throw Error('Unsupported worker pinning platform');
 if(process.platform==='win32'){
  const actual=await bindCurrentThread(target);
  return {platform:'win32',group:actual.group,cpu:actual.processor,verified:true};
 }
 if(process.platform!=='linux')throw Error('Unsupported worker pinning platform');
 if(!Number.isInteger(target.cpu)||target.cpu<0||target.cpu>1048575)throw Error('Invalid CPU pinning target');
 const {DynamicLibrary}=await import('node:ffi'),lib=new DynamicLibrary(null),
  wordBytes=['ia32','arm'].includes(process.arch)?4:8,sizeType=wordBytes===4?'uint32':'uint64',
  word=Math.floor(target.cpu/(wordBytes*8)),byte=Math.floor((target.cpu%(wordBytes*8))/8),
  offset=word*wordBytes+(endianness()==='LE'?byte:wordBytes-1-byte),bit=1<<(target.cpu&7);
 try{
  const get=lib.getFunction('sched_getaffinity',{arguments:['int32',sizeType,'buffer'],return:'int32'}),
   set=lib.getFunction('sched_setaffinity',{arguments:['int32',sizeType,'buffer'],return:'int32'});
  let size=Math.max(128,Math.ceil((offset+1)/wordBytes)*wordBytes),allowed;
  for(;;){
   allowed=Buffer.alloc(size);
   if(get(0,wordBytes===8?BigInt(size):size,allowed)===0)break;
   size*=2;if(size>1048576)throw Error('Cannot read Linux thread affinity');
  }
  if(!(allowed[offset]&bit))throw Error('CPU target is outside inherited thread allowance');
  const requested=Buffer.alloc(size),actual=Buffer.alloc(size),length=wordBytes===8?BigInt(size):size;
  requested[offset]=bit;
  if(set(0,length,requested)!==0||get(0,length,actual)!==0||!requested.equals(actual))throw Error('Linux CPU pinning was not accepted exactly');
  return {platform:'linux',group:0,cpu:target.cpu,verified:true};
 }finally{lib.close();}
}
