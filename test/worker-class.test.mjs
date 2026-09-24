import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Worker,
  RbaBranchWorker,
  prepareRbaBranchWorker32,
} from '../addons/index.mjs';

test('Worker is the minimal canonical JSMinSys worker base', () => {
  const worker=new Worker(7);

  assert.equal(worker.owner,7);
  assert.deepEqual(Object.keys(worker),['owner']);
  assert.equal(worker instanceof Worker,true);
  assert.throws(()=>worker.run(),/Worker\.run must be implemented/);

  class SpecializedWorker extends Worker {
    run(){
      return this.owner;
    }
  }
  const specialized=new SpecializedWorker(9);
  assert.equal(specialized.owner,9);
  assert.equal(specialized instanceof Worker,true);
  assert.equal(specialized.run(),9);
});

test('RBA branch workers are a concrete Worker implementation', () => {
  const worker=prepareRbaBranchWorker32({owner:2});

  assert.equal(worker instanceof RbaBranchWorker,true);
  assert.equal(worker instanceof Worker,true);
  assert.notEqual(RbaBranchWorker.prototype.run,Worker.prototype.run);
  assert.equal(worker.owner,2);
  assert.equal(worker.q,-1);
  assert.equal(worker.code,0);
  assert.equal(worker.claims,0);
  assert.equal(worker.branches,0);
  assert.equal(worker.evaluations,0);
  assert.equal(worker.idlePolls,0);
});
