// Cold boundaries only. Search-thread cycles exclude strategist and other V8 threads.
export async function prepareCycleMeter(enabled){
  if(!enabled)return {read:()=>null,close:()=>{}};
  if(process.platform!=='win32')throw Error('campaign cycle meter requires Windows');
  const {DynamicLibrary}=await import('node:ffi');
  const dll=new DynamicLibrary('kernel32.dll');
  const current=dll.getFunction('GetCurrentThread',{arguments:[],return:'pointer'});
  const query=dll.getFunction('QueryThreadCycleTime',{arguments:['pointer','buffer'],return:'int32'});
  const handle=current(),buffer=Buffer.alloc(8);
  return {read(){if(!query(handle,buffer))throw Error('QueryThreadCycleTime');return buffer.readBigUInt64LE();},close(){dll.close();}};
}
