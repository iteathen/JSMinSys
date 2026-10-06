import test from 'node:test';
import assert from 'node:assert/strict';
import {cycleExpressionForOperations,validateCycleCallbacks} from '../tools/cycle-ledger-validation.mjs';

test('callback ledger generation retains concrete callee identity and selector',()=>{
 const operations=[{op:'runtime.callback',target:'bankedStore',count:'PUB*BANKED'},
  {op:'runtime.call.subledger',target:'localStore',count:1},{op:'atomic.store.u32',count:'WINNER'}];
 assert.equal(cycleExpressionForOperations(operations),
  '(PUB*BANKED)*CALLBACK(bankedStore)+(1)*CALL(localStore)+(WINNER)*C(atomic.store.u32)');
});

test('callback target cannot silently degrade to a generic callback cost',()=>{
 const unit={unit:'fixture#f',operations:[{op:'runtime.callback',target:'store',count:1}],cycleCount:{expression:'(1)*C(runtime.callback)'}};
 assert.throws(()=>validateCycleCallbacks(unit),/CALLBACK\(store\)/);
 unit.cycleCount.expression='(1)*CALLBACK(store)';
 assert.doesNotThrow(()=>validateCycleCallbacks(unit));
});
