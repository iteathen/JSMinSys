import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRootFrontier,checkHotBody} from '../tools/audit-root-frontier.mjs';
test('selected hot closure stays allocation/string/experiment-free',()=>{
  assert.ok(auditRootFrontier().length>20);
});
test('hot structural detector rejects representative negative controls',()=>{
  for(const body of ['const x=new Uint32Array(1);','return {value:1};',"const x='WIN';",'console.log(value);','return connect4RbaFromMoves(moves);'])
    assert.throws(()=>checkHotBody(body,'negative control'));
  assert.doesNotThrow(()=>checkHotBody('words[i]=words[i]+1;return value;','numeric control'));
});
