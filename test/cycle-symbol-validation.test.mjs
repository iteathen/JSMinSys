import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCycleSymbols} from '../tools/cycle-ledger-validation.mjs';

test('cycle validator rejects undeclared selectors rather than matching literal backslashes',()=>{
  const unit={unit:'fixture#f',operations:[{op:'memory.load.u32',count:'HIT'}],cycleCount:{expression:'(HIT)*C(memory.load.u32)',parameters:{}}};
  assert.throws(()=>validateCycleSymbols(unit),/unbound symbolic cycle term HIT/);
  unit.cycleCount.parameters.HIT='1 on hit,0 otherwise';
  assert.doesNotThrow(()=>validateCycleSymbols(unit));
});

test('callee and opcode names are excluded but every operation selector stays bound',()=>{
  const unit={unit:'fixture#f',operations:[{op:'runtime.callback',target:'UPSTREAM',count:'K*(1-BANKED)'}],
    cycleCount:{expression:'(K*(1-BANKED))*CALLBACK(UPSTREAM)+(1)*CALL(EXPORTED_HELPER)+(1)*C(OPCODE)',parameters:{K:'iterations',BANKED:'selected'}}};
  assert.doesNotThrow(()=>validateCycleSymbols(unit));
  unit.operations[0].count='UNDECLARED';
  assert.throws(()=>validateCycleSymbols(unit),/unbound symbolic cycle term UNDECLARED/);
});
