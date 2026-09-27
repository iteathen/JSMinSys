// Cold launcher for the owner-selected hardware profile. No solver changes.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import profile from './locked-profile.json' with {type:'json'};
const input=JSON.parse(process.argv[2]??'{"moves":""}');
assert.ok(Object.keys(input).every(k=>k==='moves'||k==='timeoutMs'),'selected profile accepts only moves and timeoutMs');
assert.equal(typeof input.moves,'string');assert.match(input.moves,/^[1-7]*$/);
if(input.timeoutMs!==undefined)assert.ok(Number.isSafeInteger(input.timeoutMs)&&input.timeoutMs>0);
// This loader owns the tested fixed seven-worker assignment. Fail closed if
// profile edits would make its actual behavior differ from the selected plan.
assert.equal(profile.options.workers,7);assert.equal(profile.execution.arm,'probe');
assert.equal(profile.execution.wideWorker,0);assert.deepEqual(profile.execution.deepWorkers,[1,2,3,4,5,6]);
assert.equal(profile.execution.frontierStride,2);assert.equal(profile.execution.releaseAtUnresolvedRootActions,1);
const env={...process.env,ISOMAX_WIDE_PATH:profile.execution.arm};
delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
const root=new URL('../../',import.meta.url),config={...profile.options,...input};
const result=spawnSync(process.execPath,['--experimental-ffi','--import',new URL(profile.execution.loader,root).href,
  fileURLToPath(new URL('./sample.mjs',import.meta.url)),JSON.stringify(config)],
  {cwd:fileURLToPath(root),env,encoding:'utf8',maxBuffer:4*1024*1024});
if(result.stderr)process.stderr.write(result.stderr);
if(result.error)throw result.error;
if(result.status!==0){if(result.stdout)process.stdout.write(result.stdout);process.exit(result.status??1);}
console.log(JSON.stringify({selectedProfile:profile.id,execution:profile.execution,...JSON.parse(result.stdout)}));
