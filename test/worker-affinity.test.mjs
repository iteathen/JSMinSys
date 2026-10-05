import test from 'node:test';
import assert from 'node:assert/strict';
import * as affinity from '../addons/worker-affinity.mjs';

// Hand-encoded Windows x64 relationship records catch offset/width/group errors.
function core(group,mask,efficiency){
 const b=Buffer.alloc(48);b.writeUInt32LE(0,0);b.writeUInt32LE(48,4);
 b[9]=efficiency;b.writeUInt16LE(1,30);b.writeBigUInt64LE(mask,32);b.writeUInt16LE(group,40);return b;
}
function cache(group,mask,bytes){
 const b=Buffer.alloc(56);b.writeUInt32LE(2,0);b.writeUInt32LE(56,4);
 b[8]=2;b.writeUInt32LE(bytes,12);b.writeUInt16LE(1,38);b.writeBigUInt64LE(mask,40);b.writeUInt16LE(group,48);return b;
}
const fixture=()=>Buffer.concat([core(0,3n,1),core(1,1n<<40n,1),core(0,12n,0),cache(0,3n,1310720),cache(1,1n<<40n,1310720),cache(0,12n,2097152)]);
test('performance targets distinguish SMT siblings, efficiency classes and processor groups',()=>{
 assert.equal(typeof affinity.parseWindowsTopology,'function');
 const t=affinity.parseWindowsTopology(fixture());
 const selected=affinity.selectPerformanceTargets(t,2);
 assert.deepEqual(selected.map(x=>[x.group,x.processor,x.l2Bytes]),[[0,0,1310720],[1,40,1310720]]);
 assert.throws(()=>affinity.validateWorkerTargets(t,[selected[0],{...selected[0],processor:1}],2));
 assert.throws(()=>affinity.validateWorkerTargets(t,[selected[0],{group:0,processor:2}],2));
 assert.throws(()=>affinity.validateWorkerTargets(t,[selected[0],{group:7,processor:0}],2));
 assert.throws(()=>affinity.selectPerformanceTargets(t,3));
});
test('malformed topology never silently supplies a placement',()=>{
 assert.equal(typeof affinity.parseWindowsTopology,'function');
 for(const b of [Buffer.alloc(8),fixture().subarray(0,47)])assert.throws(()=>affinity.parseWindowsTopology(b));
});
test('maintenance target requires the efficiency class without weakening search-worker validation',()=>{
 const t=affinity.parseWindowsTopology(fixture());
 assert.equal(affinity.validateEfficiencyTarget(t,{group:0,processor:2}).efficiency,0);
 assert.throws(()=>affinity.validateEfficiencyTarget(t,{group:0,processor:0}));
 assert.throws(()=>affinity.validateWorkerTargets(t,[{group:0,processor:2}],1));
});
