// COLD QUALIFICATION ONLY. Reads Windows accounting; performs no game work.
// Not imported by components or called from a restricted execution path.
// QueryProcessCycleTime includes user+kernel cycles summed over all threads.
// https://learn.microsoft.com/en-us/windows/win32/api/realtimeapiset/nf-realtimeapiset-queryprocesscycletime
export async function processCycleCounter(){
  if(process.platform!=='win32')throw Error('Windows cycle counter unavailable; do not substitute nominal GHz');
  const {DynamicLibrary}=await import('node:ffi');
  const library=new DynamicLibrary('kernel32.dll');
  const current=library.getFunction('GetCurrentProcess',{arguments:[],return:'pointer'});
  const query=library.getFunction('QueryProcessCycleTime',{arguments:['pointer','buffer'],return:'int32'});
  const lastError=library.getFunction('GetLastError',{arguments:[],return:'uint32'});
  const handle=current(),buffer=Buffer.alloc(8);
  return {read(){if(!query(handle,buffer))throw Error(`QueryProcessCycleTime failed: ${lastError()}`);return buffer.readBigUInt64LE();},close(){library.close();}};
}
