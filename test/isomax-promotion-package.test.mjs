import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../isomax/',import.meta.url);
test('promoted package selects the measured minimal four-worker configuration',()=>{
 const pkg=JSON.parse(readFileSync(new URL('package.json',root))),p=JSON.parse(readFileSync(new URL('profile.json',root)));
 assert.equal(pkg.version,'0.2.0-rc.1');
 assert.equal(p.options.workers,4);assert.equal(p.options.workerMode,'minimal');
 assert.equal(p.options.sharedCacheCapacity,134217728);assert.equal(p.options.localCacheCapacity,8388608);
 assert.equal(p.options.rootFrontier,false);assert.equal(p.options.supportBasisViews,true);
 assert.equal(p.options.sharedProofBounds,true);assert.equal(p.options.localCacheLayout,'native');
 assert.deepEqual(p.launchFlags,['--max-inlined-bytecode-size=2400','--max-inlined-bytecode-size-cumulative=9600']);
 for(const name of ['run.mjs','run-i5.ps1','cli.mjs'])assert.ok(existsSync(new URL(name,root)),name);
 const api=readFileSync(new URL('index.mjs',root),'utf8');assert.match(api,/rba-connect4-prepared-session-host/);
 const cli=readFileSync(new URL('cli.mjs',root),'utf8');assert.match(cli,/\.solve\(\[\]\)/);assert.doesNotMatch(cli,/44444|RankLocal/);
});
