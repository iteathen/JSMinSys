import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import * as api from '../addons/index.mjs';

test('Connect4 exports Lazy SMP without the retired shared-work scheduler',()=>{
  assert.equal(typeof api.runLazySmpConnect4Rba32,'function');
  assert.equal(typeof api.connect4RbaFromMoves,'function');
  for(const name of ['createRbaTt32','prepareRbaBranchManager32','evaluateConnect4RbaTt32','rbaTtPublishSurplus32'])
    assert.equal(name in api,false,name);
  for(const file of ['rba-tt32.mjs','rba-branch-manager.mjs','rba-connect4-solver.mjs'])
    assert.equal(existsSync(new URL('../addons/'+file,import.meta.url)),false,file);
});

test('native worker execution cannot reenter cold ingress',()=>{
  const visited=new Set();
  function visit(url){
    if(visited.has(url.href))return;
    visited.add(url.href);
    assert.ok(!/rba-connect4-ingress\.mjs$/.test(url.pathname),url.href);
    const source=readFileSync(url,'utf8');
    for(const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g))visit(new URL(match[1],url));
  }
  visit(new URL('../addons/rba-connect4-lazy-smp-worker.mjs',import.meta.url));
});
