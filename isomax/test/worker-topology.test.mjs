import test from 'node:test';
import assert from 'node:assert/strict';
import * as topology from '../runtime/addons/worker-topology.mjs';

test('Windows hybrid discovery counts physical P cores, excluding SMT and E cores',()=>{
 assert.equal(typeof topology.windowsWorkerPlan,'function');
 const plan=topology.windowsWorkerPlan({cores:[
  {core:0,efficiency:1,groups:[{group:0,mask:'3'}]},
  {core:1,efficiency:1,groups:[{group:1,mask:'1099511627776'}]},
  {core:2,efficiency:0,groups:[{group:0,mask:'12'}]},
 ]});
 assert.equal(plan.workers,2);assert.equal(plan.physicalCores,3);
 assert.equal(plan.performanceCores,2);assert.equal(plan.selection,'performance-cores');
});
test('homogeneous Windows CPU uses every physical core',()=>{
 const plan=topology.windowsWorkerPlan({cores:Array.from({length:16},(_,core)=>({core,efficiency:0,groups:[{group:0,mask:'3'}]}))});
 assert.equal(plan.workers,16);assert.equal(plan.selection,'physical-cores');
});
test('CPU lists parse ranges and reject corrupt topology',()=>{
 assert.deepEqual(topology.parseCpuList('0-2,7,9-10\n'),[0,1,2,7,9,10]);
 for(const text of ['', '3-1', '-1', '2x', '1,,3'])assert.throws(()=>topology.parseCpuList(text));
});
const fakeReader=files=>path=>{if(!Object.hasOwn(files,path)){const e=Error('missing '+path);e.code='ENOENT';throw e;}return files[path];};
test('Linux selects allowed P cores once each, not SMT siblings',()=>{
 const files={
  '/proc/self/status':'Cpus_allowed_list:\t0-5\n',
  '/sys/bus/event_source/devices/cpu_core/cpus':'0-3',
  '/sys/bus/event_source/devices/cpu_atom/cpus':'4-5',
 };
 for(let i=0;i<6;i++)files[`/sys/devices/system/cpu/cpu${i}/topology/thread_siblings_list`]=i<4?`${i&~1}-${(i&~1)+1}`:String(i);
 const plan=topology.linuxWorkerPlan(fakeReader(files));
 assert.equal(plan.workers,2);assert.equal(plan.physicalCores,4);assert.equal(plan.selection,'performance-cores');
});
test('Linux physical fallback never counts hyperthreads as extra workers',()=>{
 const files={'/proc/self/status':'Cpus_allowed_list:\t0-3\n'};
 for(let i=0;i<4;i++)files[`/sys/devices/system/cpu/cpu${i}/topology/thread_siblings_list`]=`${i&~1}-${(i&~1)+1}`;
 const plan=topology.linuxWorkerPlan(fakeReader(files));assert.equal(plan.workers,2);
 assert.equal(plan.selection,'physical-cores-class-unreported');
});
for(const atom of ['2-3',''])test(`Linux P-core selection tolerates low-power PMUs and empty E masks (${atom})`,()=>{
 const files={'/proc/self/status':'Cpus_allowed_list:\t0-5\n',
  '/sys/bus/event_source/devices/cpu_core/cpus':'0-1',
  '/sys/bus/event_source/devices/cpu_atom/cpus':atom,
  '/sys/bus/event_source/devices/cpu_lowpower/cpus':'4-5'};
 for(let i=0;i<6;i++)files[`/sys/devices/system/cpu/cpu${i}/topology/thread_siblings_list`]=String(i);
 assert.equal(topology.linuxWorkerPlan(fakeReader(files)).workers,2);
});
test('Linux capacity classes distinguish heterogeneous ARM cores',()=>{
 const files={'/proc/self/status':'Cpus_allowed_list:\t0-3\n'};
 for(let i=0;i<4;i++){
  files[`/sys/devices/system/cpu/cpu${i}/topology/thread_siblings_list`]=String(i);
  files[`/sys/devices/system/cpu/cpu${i}/cpu_capacity`]=i<2?'1024':'512';
 }
 const plan=topology.linuxWorkerPlan(fakeReader(files));assert.equal(plan.workers,2);
 assert.equal(plan.physicalCores,4);assert.equal(plan.selection,'performance-cores');
});
test('Darwin performance level zero uses physical counts',()=>{
 const values={'hw.nperflevels':'2','hw.perflevel0.physicalcpu':'8','hw.perflevel1.physicalcpu':'4'};
 const plan=topology.darwinWorkerPlan(key=>values[key]??'');
 assert.equal(plan.workers,8);assert.equal(plan.physicalCores,12);
});
test('Darwin homogeneous CPUs use physicalcpu',()=>{
 const plan=topology.darwinWorkerPlan(key=>key==='hw.physicalcpu'?'6':'');
 assert.equal(plan.workers,6);assert.equal(plan.selection,'physical-cores');
});
test('unknown or corrupt topology is not guessed from logical CPU count',()=>{
 assert.throws(()=>topology.windowsWorkerPlan({cores:[]}));
 assert.throws(()=>topology.linuxWorkerPlan(fakeReader({'/proc/self/status':'missing cpu list'})));
 assert.throws(()=>topology.darwinWorkerPlan(()=>''));
});
