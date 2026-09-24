import test from 'node:test';
import assert from 'node:assert/strict';

import {Worker} from '../addons/index.mjs';

test('Worker is the minimal canonical JSMinSys worker base', () => {
  const worker=new Worker(7);

  assert.equal(worker.owner,7);
  assert.deepEqual(Object.keys(worker),['owner']);
  assert.equal(worker instanceof Worker,true);

  class SpecializedWorker extends Worker {}
  const specialized=new SpecializedWorker(9);
  assert.equal(specialized.owner,9);
  assert.equal(specialized instanceof Worker,true);
});
