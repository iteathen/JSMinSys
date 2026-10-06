// Explicit-ref restore for matched views. Never resets history or other work.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const ref=process.argv[2];if(!ref)throw Error('Explicit immutable ref required');
const paths=execFileSync('git',['ls-tree','-r','--name-only',ref,'addons'],{encoding:'utf8'}).trim().split('\n').filter(p=>/^addons\/rba-connect4-lazy-smp-worker-minimal-views(?:-center)?(?:-proofs)?(?:-local32)?\.mjs$/.test(p));
if(paths.length!==8)throw Error('Eight view workers required');
execFileSync('git',['restore','--source='+ref,'--',...paths,'tools/build-rba-basis-view-workers.mjs']);
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),f=JSON.parse(execFileSync('git',['show',ref+':'+path],{encoding:'utf8',maxBuffer:16*1024*1024}));
l.units=l.units.filter(u=>!paths.includes(u.source)).concat(f.units.filter(u=>paths.includes(u.source)));
for(const p of paths)l.decomposedSourceBlobs[p]=f.decomposedSourceBlobs[p];
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
console.log(JSON.stringify({ref,paths,note:'Other cold prototype libraries/ledgers remain frozen and unimported by parent.'}));
