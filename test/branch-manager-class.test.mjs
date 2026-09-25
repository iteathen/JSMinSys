import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Worker,
  BranchManager,
  RbaBranchManager,
  prepareRbaBranchManager32,
} from '../addons/index.mjs';

test('BranchManager is the minimal canonical JSMinSys manager base', () => {
  const manager=new BranchManager(1);

  assert.equal(manager.owner,1);
  assert.deepEqual(Object.keys(manager),['owner']);
  assert.equal(manager instanceof BranchManager,true);
  assert.equal(manager instanceof Worker,false);
  assert.throws(()=>manager.run(),/BranchManager\.run must be implemented/);
});

test('RBA branch managers are a concrete BranchManager implementation', () => {
  const manager=prepareRbaBranchManager32({capacity:32,budget:8});

  assert.equal(manager instanceof RbaBranchManager,true);
  assert.equal(manager instanceof BranchManager,true);
  assert.equal(manager instanceof Worker,false);
  assert.notEqual(RbaBranchManager.prototype.run,BranchManager.prototype.run);
  assert.equal(manager.owner,1);
  assert.equal(manager.budget,8);
  assert.equal(manager.scanCursor,0);
  assert.equal(manager.events,0);
  assert.equal(manager.dedupes,0);
  assert.equal(manager.maintenancePasses,0);
  assert.equal(manager.readyScratch.length,8);
  assert.equal(manager.routeNext.length,8);
});
