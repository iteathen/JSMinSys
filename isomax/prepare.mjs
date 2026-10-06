// Maintainer tool: reproduce the closure from the immutable retained commit.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,unlinkSync,readdirSync} from 'node:fs';
import {dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('./',import.meta.url)),source='a02bc4946d741e4aaacc30802aeb850fa8c59a95',check=process.argv.includes('--check'),
 digest=s=>createHash('sha256').update(s).digest('hex'),normal=s=>s.replaceAll('\r\n','\n'),
 read=p=>normal(execFileSync('git',['show',source+':'+p],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})),
 previous=JSON.parse(readFileSync(root+'provenance.json','utf8')),files={},seen=new Set(),workers=[];
function output(path,text,original){
 const target=root+path;
 if(check){if(normal(readFileSync(target,'utf8'))!==text)throw Error('Package drift: '+path);}
 else if(!existsSync(target)||normal(readFileSync(target,'utf8'))!==text){mkdirSync(dirname(target),{recursive:true});writeFileSync(target,text);}
 files[path]={source:original,sha256:digest(text)};
}
function include(path){
 if(seen.has(path))return;
 if(path.startsWith('../')||posix.isAbsolute(path))throw Error('Escaped repository dependency');seen.add(path);
 const text=read(path);output('runtime/'+path,text,path);
 for(const m of text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'').matchAll(/(?<![\w'-])(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)){
  if(m[1].startsWith('node:'))continue;if(!m[1].startsWith('.'))throw Error('External dependency: '+m[1]);
  include(posix.normalize(posix.join(posix.dirname(path),m[1])));
 }
}
for(const family of ['','-views','-views-compiled'])for(const center of [false,true])for(const proofs of [false,true])for(const native of [false,true]){
 const p='addons/rba-connect4-lazy-smp-worker-minimal'+family+(center?'-center':'')+(proofs?'-proofs':'')+(native?'-local32':'')+'.mjs';workers.push('runtime/'+p);include(p);
}
for(const p of ['addons/rba-connect4-prepared-session-host.mjs','addons/rba-connect4-geometry.mjs','addons/connect4-rank-local-presearch.mjs','addons/worker-topology.mjs','tools/worker-affinity-preload.mjs','tools/benchmark-v8-startup-preload.mjs'])include(p);
output('LICENSE',read('LICENSE'),'LICENSE');
output('targets.json',read('isomax/targets.json'),'isomax/targets.json');
for(const p of ['C61-MEMORY-GRID.json','C66-CROSSOVER.json','fusion-final-confirm.json'])output('evidence/'+p,read('evidence/c4-inspired-optimization-20261005/'+p),'evidence/c4-inspired-optimization-20261005/'+p);
for(const p of ['CURRENT-CHECKPOINT.md','FINAL-REVIEW.md','final-correctness-ci.json'])output('evidence/'+p,read('evidence/isomax-overhead-fusion-20261005/'+p),'evidence/isomax-overhead-fusion-20261005/'+p);
for(const name of ['fusion-b3-01','fusion-b3-parent-02','fusion-c66-01','fusion-c66-02','fusion-final-confirm-01']){
 const prefix='evidence/minimal-worker-localhost-20261004/'+name+'/';
 for(const p of ['stdout.json','stderr.txt','invocation.json','measurement.json','cleanup-verification.json',...Array.from({length:4},(_,i)=>'affinity-'+i+'.json')])output('evidence/runs/'+name+'/'+p,read(prefix+p),prefix+p);
}
for(const p of ['index.mjs','cli.mjs','run.mjs','run-i5.ps1','example.mjs','profile.json','package.json','verify.mjs','README.md','evidence/README.md',...readdirSync(root+'test').filter(n=>n.endsWith('.mjs')).map(n=>'test/'+n)])files[p]={source:'package-authored',sha256:digest(normal(readFileSync(root+p,'utf8')))};
for(const [p,r] of Object.entries(previous.files))if(!files[p]&&/^(runtime|evidence)\//.test(p)&&r.source!=='package-authored'){
 if(p.split('/').includes('..'))throw Error('Unsafe stale path');
 if(check&&existsSync(root+p))throw Error('Stale package file: '+p);
 if(!check&&existsSync(root+p)){
  if(digest(normal(readFileSync(root+p,'utf8')))!==r.sha256)throw Error('Modified stale package file: '+p);
  unlinkSync(root+p);
 }
}
const lock={version:'0.2.0-rc.3',status:'repository distribution; registry publication disabled',sourceRepository:'https://github.com/iteathen/JSMinSys',sourceCommit:source,
 measuredRuntimeCommits:['427f691b00248ac15b795e187508bf5144f69706','2e64e4b45cc8145f8c34b43829ae484ad2267bc1','1eddb12fa4dc80275e825025065e08898c3ffb14'],normalization:'UTF-8 with CRLF normalized to LF; SHA-256',workerModules:workers,files:Object.fromEntries(Object.entries(files).sort())};
const text=JSON.stringify(lock,null,2)+'\n';
if(check){if(normal(readFileSync(root+'provenance.json','utf8'))!==text)throw Error('Provenance drift');}else writeFileSync(root+'provenance.json',text);
console.log('Prepared/checked '+seen.size+' immutable runtime modules and '+Object.keys(files).length+' locked files.');
