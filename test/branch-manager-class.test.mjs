import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Worker,
  BranchManager,
} from '../addons/index.mjs';

test('BranchManager is the minimal canonical JSMinSys manager base', () => {
  const manager=new BranchManager(1);

  assert.equal(manager.owner,1);
  assert.deepEqual(Object.keys(manager),['owner']);
  assert.equal(manager instanceof BranchManager,true);
  assert.equal(manager instanceof Worker,false);
  assert.throws(()=>manager.run(),/BranchManager\.run must be implemented/);
});
