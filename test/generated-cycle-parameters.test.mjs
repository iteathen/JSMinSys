import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('generated search ledger distinguishes insertion shifts and stop checks',()=>{
  const ledger=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url),'utf8'));
  for(const name of ['searchCpcOnlyBehavior','searchCpcOnlyFrontier']){
    const u=ledger.units.find(u=>u.name===name);
    assert.match(u.cycleCount.parameters.K,/insertion/);
    assert.match(u.cycleCount.parameters.STOP_TEST,/cancellation/);
    for(const op of ['control.test.u32','control.branch']){
      assert.ok(u.operations.some(x=>x.op===op&&x.count==='STOP_TEST'));
      assert.ok(u.cycleCount.expression.includes(`(STOP_TEST)*C(${op})`));
      assert.ok(!u.operations.some(x=>x.op===op&&x.count==='K'));
    }
    assert.ok(u.operations.some(x=>x.op.startsWith('memory.')&&x.count.includes('K')));
  }
});
