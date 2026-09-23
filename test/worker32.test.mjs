import test from 'node:test';
import assert from 'node:assert/strict';
import {
  takeOwnedStampedWork32,
  validateOwnedWork32,
  releaseOwnedWork32,
  publishResolvedValue32,
  publishDependencies7x32,
  retainFirstRunnableDependency7x32,
  observeWake32,
  signalWake32,
  parkOnWake32,
  workerStopOrDone32,
} from '../src/worker32.mjs';

test('worker take establishes ownership and lazily skips resolved/retired rows', () => {
  const control=new Int32Array([0,2,3]);
  const next=Int32Array.from([1,2,-1]),prev=Int32Array.from([-1,0,1]);
  const member=Uint32Array.from([1,1,1]),ticket=Uint32Array.from([2,3,4]),generation=Uint32Array.from([2,3,4]);
  const refs=Uint32Array.from([0,1,1]),resolved=Uint32Array.from([0,1,0]),execution=Uint32Array.from([1,1,1]);
  const item=takeOwnedStampedWork32(control,0,1,2,next,prev,member,ticket,generation,refs,resolved,execution,1,0,7);
  assert.equal(item,2);
  assert.deepEqual([...control],[-1,-1,0]);
  assert.deepEqual([...execution],[0,0,7]);
  assert.equal(validateOwnedWork32(refs,resolved,execution,2,7),1);
  resolved[2]=1; assert.equal(validateOwnedWork32(refs,resolved,execution,2,7),0);
  assert.equal(releaseOwnedWork32(execution,2,7,0),1); assert.equal(execution[2],0);
});

test('worker take rejects stale generation/ownership before touching the list', () => {
  const control=new Int32Array([0,0,1]),next=Int32Array.from([-1]),prev=Int32Array.from([-1]),member=Uint32Array.from([1]);
  const ticket=Uint32Array.from([2]),generation=Uint32Array.from([3]),refs=Uint32Array.from([1]),resolved=Uint32Array.from([0]),execution=Uint32Array.from([1]);
  assert.equal(takeOwnedStampedWork32(control,0,1,2,next,prev,member,ticket,generation,refs,resolved,execution,1,0,7),-2);
  assert.deepEqual([...control],[0,0,1]); assert.equal(member[0],1);
});

test('resolved publication orders value before marker and validates owned work separately', () => {
  const values=new Uint32Array(2),resolved=new Uint32Array(2),execution=Uint32Array.from([0,9]),refs=Uint32Array.from([0,1]);
  assert.equal(publishResolvedValue32(values,resolved,1,3),1);
  assert.equal(values[1],3); assert.equal(resolved[1],1);
  assert.equal(validateOwnedWork32(refs,resolved,execution,1,9),0);
  assert.equal(validateOwnedWork32(refs,resolved,execution,1,8),-1);
});

test('dependency publication carries fixed rows and retained handoff claims first runnable child', () => {
  const childOut=new Int32Array(7).fill(-1),genOut=new Uint32Array(7),p0Out=new Uint32Array(7),p1Out=new Uint32Array(7),p2Out=new Uint32Array(7);
  const childIn=Int32Array.from([4,-1,2]),genIn=Uint32Array.from([10,0,8]),p0In=Uint32Array.from([1,2,3]),p1In=Uint32Array.from([4,5,6]),p2In=Uint32Array.from([7,8,9]);
  assert.equal(publishDependencies7x32(childOut,genOut,p0Out,p1Out,p2Out,1,childIn,genIn,p0In,p1In,p2In,0,3),3);
  assert.deepEqual([...childOut.slice(1,4)],[4,-1,2]);
  assert.deepEqual([...p2Out.slice(1,4)],[7,8,9]);
  const execution=new Uint32Array(6),resolved=new Uint32Array(6),state=new Uint32Array(6);
  resolved[4]=1;
  const child=retainFirstRunnableDependency7x32(execution,resolved,state,childOut,1,3,11,0);
  assert.equal(child,2); assert.equal(execution[2],11);
});

test('wake observe/signal/park and stop/done primitives compose without hidden policy', () => {
  const control=new Int32Array(new SharedArrayBuffer(4*4));
  const observed=observeWake32(control,0);
  assert.equal(observed,0);
  assert.equal(signalWake32(control,0,1),0);
  assert.equal(observeWake32(control,0),1);
  assert.equal(parkOnWake32(control,0,1,0),0);
  assert.equal(workerStopOrDone32(control,1,2),0);
  Atomics.store(control,2,1); assert.equal(workerStopOrDone32(control,1,2),1);
});
