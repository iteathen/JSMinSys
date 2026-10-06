import test from 'node:test';
import assert from 'node:assert/strict';
import * as pinning from '../addons/worker-pinning.mjs';
import {windowsWorkerPlan,linuxWorkerPlan} from '../addons/worker-topology.mjs';
test('Windows plan identifies one logical target per physical P core',()=>{
 const p=windowsWorkerPlan({cores:[{core:0,efficiency:1,groups:[{group:0,mask:'3'}]},{core:1,efficiency:1,groups:[{group:1,mask:'12'}]},{core:2,efficiency:0,groups:[{group:0,mask:'48'}]}]});
 assert.deepEqual(p.targets.map(t=>[t.group,t.processor]),[[0,0],[1,2]]);
});
test('Linux targets use allowed online siblings and never choose an E core',()=>{
 const data={'/proc/self/status':'Cpus_allowed_list:\t1,3,4\n','/sys/bus/event_source/devices/cpu_core/cpus':'0-3','/sys/bus/event_source/devices/cpu_atom/cpus':'4',
  '/sys/devices/system/cpu/cpu1/topology/thread_siblings_list':'0-1','/sys/devices/system/cpu/cpu3/topology/thread_siblings_list':'2-3','/sys/devices/system/cpu/cpu4/topology/thread_siblings_list':'4'};
 const p=linuxWorkerPlan(path=>{if(Object.hasOwn(data,path))return data[path];const e=Error();e.code='ENOENT';throw e;});
 assert.deepEqual(p.targets.map(t=>t.cpu),[1,3]);
});
test('affinity primitive exists and rejects unsupported platforms',async()=>{
 assert.equal(typeof pinning.configureCurrentWorkerAffinity,'function');
 await assert.rejects(()=>pinning.configureCurrentWorkerAffinity({platform:'unsupported',cpu:0}),/unsupported/i);
});
