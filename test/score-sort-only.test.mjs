import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
test('score-only candidate leaves actions in ingress order without center preordering',()=>{
  assert.deepEqual([...prepareConnect4RbaGeometry({columns:7,rows:6}).actionOrder],[0,1,2,3,4,5,6]);
});
test('score-only worker has no worker-specific reordering override',()=>{
  assert.doesNotMatch(readFileSync(new URL('../addons/rba-connect4-lazy-smp-worker.mjs',import.meta.url),'utf8'),/orderOffset\s*:/);
});
