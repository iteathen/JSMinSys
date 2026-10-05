import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Only this functional test instruments scratch writes. Production arrays and
// worker code have no observers or counters. Motif fixture is not an oracle.
test('known forbidden triggers are rejected before pair bookkeeping',()=>{
 const writes=[];
 function TrackedU8(length){
  const array=new Uint8Array(length);if(length!==3)return array;
  return new Proxy(array,{
   get(t,k){const value=Reflect.get(t,k,t);return typeof value==='function'?value.bind(t):value;},
   set(t,k,v){if(k==='0'&&v)writes.push(v);return Reflect.set(t,k,v,t);},
  });
 }
 TrackedU8.BYTES_PER_ELEMENT=1;
 const source=readFileSync(new URL('../addons/connect4-cpcx-pair-hub.mjs',import.meta.url),'utf8'),
  factory=runInNewContext(source.replace('export function ','function ')+'\nprepareConnect4CpcxPairHub32;',
   {Uint8Array:TrackedU8,Uint16Array,Uint32Array,Math}),
  cells=new Uint32Array(56);
 cells[48]=0;cells[49]=1;cells[52]=0;cells[53]=2;
 const g={columns:3,rows:4,cellCount:12,pairShapeStart:12,tripleShapeStart:14,p0Offset:4,p1Offset:5,
  shapeCells:cells,cellColumn:new Uint32Array([0,1,2]),cellRow:new Uint32Array(3)},p=factory(g),
  words=new Uint32Array([0,0,0,0,3,0]),basis=new Uint32Array([12,13]),frame=p.forbiddenWords;
 p.forbidden[frame]=1;
 assert.equal(p.find(words,0,basis,0,2,0,-1,frame),-1);
 assert.deepEqual(writes,[],'shared exclusion mask should supersede failed-trigger state');
 p.forbidden[frame]=0;writes.length=0;
 assert.equal(p.find(words,0,basis,0,2,0,-1,frame),0);
 assert.deepEqual(writes,[1],'second distinct demand returns proof without storing a count');
});
