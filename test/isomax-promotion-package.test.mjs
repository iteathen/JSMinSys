import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../isomax/',import.meta.url);
test('package auto worker and memory defaults preserve the historical measured configuration',()=>{
 const pkg=JSON.parse(readFileSync(new URL('package.json',root))),p=JSON.parse(readFileSync(new URL('profile.json',root)));
 assert.equal(pkg.version,'0.2.0-rc.5');
 assert.equal(p.options.workers,'auto');assert.equal(p.measured.workers,6);assert.equal(p.options.workerMode,'minimal');
 assert.equal(p.options.memoryProfile,'auto');
 assert.equal(Object.hasOwn(p.options,'sharedCacheCapacity'),false);assert.equal(Object.hasOwn(p.options,'localCacheCapacity'),false);
 assert.equal(p.explicitCacheDefaults.sharedCacheCapacity,134217728);assert.equal(p.explicitCacheDefaults.localCacheCapacity,8388608);
 assert.equal(p.options.rootFrontier,false);assert.equal(p.options.supportBasisViews,true);
 assert.equal(p.options.sharedProofBounds,true);assert.equal(p.options.localCacheLayout,'native');
 assert.deepEqual(p.launchFlags,['--max-inlined-bytecode-size=2400','--max-inlined-bytecode-size-cumulative=9600']);
 for(const name of ['run.mjs','cli.mjs'])assert.ok(existsSync(new URL(name,root)),name);
 for(const name of ['run-i5.ps1','targets.json'])assert.equal(existsSync(new URL(name,root)),false,name);
 const api=readFileSync(new URL('index.mjs',root),'utf8');assert.match(api,/rba-connect4-prepared-session-host/);
 const cli=readFileSync(new URL('cli.mjs',root),'utf8');assert.match(cli,/\.solve\(\[\]\)/);assert.doesNotMatch(cli,/44444|RankLocal/);
});
