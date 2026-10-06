import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ledger=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url)));
test('immutable cofactor IDs are charged at their actual native width',()=>{
  const units=ledger.units.filter(u=>/coordinate-closure-view-/.test(u.source));
  assert.equal(units.length,8);
  for(const u of units){
    const native=u.operations.find(o=>o.op==='memory.load.native_index');
    assert.equal(native.count,u.name.includes('NonWinning')?'A':'B+D+A',u.name);
    assert.match(u.cycleCount.parameters.BASIS_BYTES,/shapeCount/);
    assert.doesNotMatch(u.operations.find(o=>o.op==='memory.load.u32').count,/\b[BD]\b|\bA\b/);
  }
});
test('shared tactical consumers distinguish basis IDs from uint32 state reads',()=>{
  const names=['evaluateConnect4PreparedCpcMatchingResponse32','evaluateConnect4PreparedCpcWin32','evaluateConnect4PreparedCpcResponse32','evaluateConnect4CpcTargetGeneralWin32','evaluateConnect4CpcTargetDenseWin32','connect4RbaImmediateWinningColumn','findConnect4CpcxPairHub32','collectConnect4CpcxSingletons32'];
  for(const name of names){
    const u=ledger.units.find(u=>u.name===name);assert.ok(u,name);
    assert.ok(u.operations.some(o=>o.op==='memory.load.native_index'&&o.count==='BASIS'),name);
    assert.match(u.cycleCount.parameters.BASIS_BYTES,/BYTES_PER_ELEMENT/);
    assert.ok(!/basis IDs/.test(u.cycleCount.parameters.L32??''),name);
  }
});
