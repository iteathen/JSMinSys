// Cold system topology discovery; never imported by a search worker.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {queryWindowsTopology} from './worker-affinity.mjs';

export function windowsWorkerPlan(topology){
 if(!Array.isArray(topology?.cores)||!topology.cores.length)throw Error('CPU topology contains no physical cores');
 const classes=topology.cores.map(c=>c.efficiency);
 if(classes.some(c=>!Number.isInteger(c)||c<0||c>255))throw Error('Invalid CPU efficiency class');
 const maximum=Math.max(...classes),hybrid=classes.some(c=>c!==maximum),
  performanceCores=classes.filter(c=>c===maximum).length;
 return {workers:performanceCores,physicalCores:classes.length,performanceCores,
  selection:hybrid?'performance-cores':'physical-cores',source:'Windows GetLogicalProcessorInformationEx'};
}
export function parseCpuList(text){
 const result=new Set();
 for(const part of text.trim().split(',')){
  const match=/^(\d+)(?:-(\d+))?$/.exec(part);
  if(!match)throw Error('Invalid OS CPU list');
  const first=Number(match[1]),last=Number(match[2]??match[1]);
  if(!Number.isSafeInteger(first)||!Number.isSafeInteger(last)||first>last||last>1048575)throw Error('Invalid OS CPU range');
  for(let i=first;i<=last;i++)result.add(i);
 }
 return [...result].sort((a,b)=>a-b);
}
export function optionalTopologyFile(read,path){
 try{return read(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}
}
export function linuxWorkerPlan(read=path=>readFileSync(path,'utf8')){
 const status=read('/proc/self/status'),match=/^Cpus_allowed_list:\s*(.*)$/m.exec(status);
 if(!match)throw Error('OS CPU affinity list unavailable');
 let allowed=parseCpuList(match[1]);
 const online=optionalTopologyFile(read,'/sys/devices/system/cpu/online');
 if(online!==null){const active=new Set(parseCpuList(online));allowed=allowed.filter(cpu=>active.has(cpu));}
 if(!allowed.length)throw Error('No available CPUs');
 const coreText=optionalTopologyFile(read,'/sys/bus/event_source/devices/cpu_core/cpus'),
  atomText=optionalTopologyFile(read,'/sys/bus/event_source/devices/cpu_atom/cpus'),
  rows=allowed.map(cpu=>({cpu,core:parseCpuList(read(`/sys/devices/system/cpu/cpu${cpu}/topology/thread_siblings_list`)).join(','),
   capacity:optionalTopologyFile(read,`/sys/devices/system/cpu/cpu${cpu}/cpu_capacity`)})),
  physicalCores=new Set(rows.map(r=>r.core)).size;
 let selected=rows,selection='physical-cores-class-unreported',performanceCores=null;
 if(coreText!==null){
  // The P-core mask is authoritative. E cores can span additional PMUs, and
  // a registered E-core mask can legitimately be empty when those CPUs are offline.
  const p=new Set(coreText.trim()?parseCpuList(coreText):[]),
   e=new Set(atomText?.trim()?parseCpuList(atomText):[]);
  if([...p].some(cpu=>e.has(cpu)))throw Error('Ambiguous hybrid CPU classification');
  selected=rows.filter(r=>p.has(r.cpu));selection='performance-cores';
 }else if(atomText!==null){
  throw Error('Performance-core classification unavailable');
 }else if(rows.some(r=>r.capacity!==null)){
  if(rows.some(r=>r.capacity===null||!/^\d+\s*$/.test(r.capacity)||!Number.isSafeInteger(Number(r.capacity))||Number(r.capacity)<=0))throw Error('Incomplete CPU capacity classification');
  const maximum=Math.max(...rows.map(r=>Number(r.capacity)));
  selected=rows.filter(r=>Number(r.capacity)===maximum);
  selection=selected.length===rows.length?'physical-cores':'performance-cores';
 }
 const workers=new Set(selected.map(r=>r.core)).size;
 if(selection!=='physical-cores-class-unreported')performanceCores=workers;
 return {workers,physicalCores,performanceCores,selection,source:'Linux sysfs physical topology and process affinity'};
}
export function darwinWorkerPlan(read=key=>execFileSync('/usr/sbin/sysctl',['-n',key],{encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']})){
 let levels;try{levels=read('hw.nperflevels').trim();}catch{levels='';}
 if(levels!==''&&!/^\d+$/.test(levels))throw Error('Invalid performance level count');
 const count=Number(levels);
 if(count>64)throw Error('Invalid performance level count');
 if(count>1){
  const cores=Array.from({length:count},(_,i)=>Number(read(`hw.perflevel${i}.physicalcpu`).trim()));
  if(cores.some(c=>!Number.isSafeInteger(c)||c<1))throw Error('Invalid physical core count');
  return {workers:cores[0],physicalCores:cores.reduce((a,b)=>a+b,0),performanceCores:cores[0],selection:'performance-cores',source:'macOS hw.perflevel0.physicalcpu'};
 }
 const workers=Number(read('hw.physicalcpu').trim());
 if(!Number.isSafeInteger(workers)||workers<1)throw Error('Invalid physical core count');
 return {workers,physicalCores:workers,performanceCores:workers,selection:'physical-cores',source:'macOS hw.physicalcpu'};
}
export async function discoverWorkerPlan(){
 let plan;
 if(process.platform==='win32')plan=windowsWorkerPlan(await queryWindowsTopology());
 else if(process.platform==='linux')plan=linuxWorkerPlan();
 else if(process.platform==='darwin')plan=darwinWorkerPlan();
 else throw Error(`CPU topology discovery is unsupported on ${process.platform}; supply an explicit worker count`);
 return {...plan,platform:process.platform};
}
