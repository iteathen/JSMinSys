// Maintainer tool: reproduce the closure from the immutable retained commit.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,unlinkSync,readdirSync} from 'node:fs';
import {dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('./',import.meta.url)),source='b7604c7dcca54fca362d630ed96c96410469e3e2',check=process.argv.includes('--check'),
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
for(const center of [false,true])for(const proofs of [false,true])for(const kind of ['partial24','partialMixed']){
 const p='addons/rba-connect4-lazy-smp-worker-minimal-views-compiled'+(center?'-center':'')+(proofs?'-proofs':'')+'-local32-'+kind+'.mjs';workers.push('runtime/'+p);include(p);
}
for(const p of ['addons/rba-connect4-prepared-session-host.mjs','addons/rba-connect4-geometry.mjs','addons/connect4-rank-local-presearch.mjs','addons/worker-topology.mjs','addons/isomax-memory-profile.mjs','addons/worker-startup-affinity.mjs','tools/worker-affinity-preload.mjs','tools/benchmark-v8-startup-preload.mjs'])include(p);
output('LICENSE',read('LICENSE'),'LICENSE');
for(const p of ['REPORT.md','REVIEW.md','timing-summary.json','correctness-summary.json','debt-dispositions.json','environment-change.json'])output('evidence/'+p,read('evidence/isomax-nees-remediation-20261006/'+p),'evidence/isomax-nees-remediation-20261006/'+p);
output('evidence/producer-cycle-ledger.json',read('catalog/addon-cycle-ledger-v0.json'),'catalog/addon-cycle-ledger-v0.json');
for(const p of ['index.mjs','cli.mjs','run.mjs','example.mjs','profile.json','package.json','verify.mjs','README.md','evidence/README.md','evidence/SYSTEM-DISCOVERY.md','evidence/system-discovery-20261006.json',...readdirSync(root+'test').filter(n=>n.endsWith('.mjs')).map(n=>'test/'+n)])files[p]={source:'package-authored',sha256:digest(normal(readFileSync(root+p,'utf8')))};
for(const [p,r] of Object.entries(previous.files))if(!files[p]&&/^(runtime|evidence)\//.test(p)&&r.source!=='package-authored'){
 if(p.split('/').includes('..'))throw Error('Unsafe stale path');
 if(check&&existsSync(root+p))throw Error('Stale package file: '+p);
 if(!check&&existsSync(root+p)){
  if(digest(normal(readFileSync(root+p,'utf8')))!==r.sha256)throw Error('Modified stale package file: '+p);
  unlinkSync(root+p);
 }
}
const lock={version:'0.2.0-rc.5',status:'repository distribution; registry publication disabled',sourceRepository:'https://github.com/iteathen/JSMinSys',sourceCommit:source,
 measuredRuntimeCommits:['1c7b64f352c2e44b4853f9faaf916b48d7837bce','d12d6d798b18c66c7ca2d1ee913cb2166089cc0f'],normalization:'UTF-8 with CRLF normalized to LF; SHA-256',workerModules:workers,files:Object.fromEntries(Object.entries(files).sort())};
const text=JSON.stringify(lock,null,2)+'\n';
if(check){if(normal(readFileSync(root+'provenance.json','utf8'))!==text)throw Error('Provenance drift');}else writeFileSync(root+'provenance.json',text);
console.log('Prepared/checked '+seen.size+' immutable runtime modules and '+Object.keys(files).length+' locked files.');
