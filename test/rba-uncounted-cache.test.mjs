import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {createConnect4RbaSharedExactCache32,probeConnect4RbaSharedExactCache32} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {probeConnect4RbaSharedExactCacheUncounted32 as probe,storeConnect4RbaSharedExactCacheUncounted32 as store} from '../addons/rba-connect4-shared-exact-cache-uncounted.mjs';
test('uncounted cache preserves exact keys and seqlock with untouched reporting words',()=>{
 for(const [columns,rows] of [[7,6],[7,5],[4,4]]){
  const geometry=prepareConnect4RbaGeometry({columns,rows}),a=connect4RbaFromMoves([],{geometry}),b=connect4RbaFromMoves([0],{geometry}),cache=createConnect4RbaSharedExactCache32({capacity:1,keyWords:geometry.keyWords,geometry});
  cache.stats.set([11,22,33]);
  assert.equal(probe(cache,a.words,0,0),0);
  store(cache,a.words,0,3,0);assert.equal(probe(cache,a.words,0,0),3);
  assert.equal(probe(cache,b.words,0,0),0);
  store(cache,b.words,0,2,0);assert.equal(probe(cache,b.words,0,0),2);assert.equal(probe(cache,a.words,0,0),0);
  Atomics.add(cache.sequence,0,1);const before=Array.from(cache.keys);store(cache,a.words,0,3,0);
  assert.equal(probe(cache,b.words,0,0),0);assert.deepEqual(Array.from(cache.keys),before);
  Atomics.add(cache.sequence,0,1);
  assert.deepEqual(Array.from(cache.stats),[11,22,33]);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,b.words,0,0),2);
  assert.equal(cache.stats[0],12);
 }
});
test('uncounted cache is generated from the counted protocol with reporting alone removed',()=>{
 execFileSync(process.execPath,[new URL('../tools/build-rba-uncounted-cache.mjs',import.meta.url).pathname.replace(/^\/(.:)/,'$1'),'--check']);
 const source=readFileSync(new URL('../addons/rba-connect4-shared-exact-cache-uncounted.mjs',import.meta.url),'utf8');
 assert.ok(!source.includes('cache.stats'));
 assert.ok(source.includes('Atomics.compareExchange'));
});
