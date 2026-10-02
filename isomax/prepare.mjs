// Reproduce the self-contained runtime from the exact qualified Git revision.
// Cold packaging tool only; not imported by the application.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('./',import.meta.url));
const source='fb0f60adcb9341b42af770f05899bbf61fd3c129';
const read=path=>execFileSync('git',['show',`${source}:${path}`],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replaceAll('\r\n','\n');
const digest=text=>createHash('sha256').update(text).digest('hex');
const files={},seen=new Set();
function output(path,text,original){
  const target=root+path;
  if(process.argv.includes('--check')){
    if(readFileSync(target,'utf8').replaceAll('\r\n','\n')!==text)throw Error('package drift: '+path);
  }else{mkdirSync(dirname(target),{recursive:true});writeFileSync(target,text);}
  if(original)files[path]={source:original,sha256:digest(text)};
}
function include(path){
  if(seen.has(path))return;seen.add(path);
  if(path.startsWith('../')||posix.isAbsolute(path))throw Error('dependency escapes repository');
  const text=read(path);output('runtime/'+path,text,path);
  const code=text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
  for(const m of code.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)){
    if(m[1].startsWith('node:'))continue;
    if(!m[1].startsWith('.'))throw Error('undeclared external dependency: '+m[1]);
    include(posix.normalize(posix.join(posix.dirname(path),m[1])));
  }
}
for(const name of ['host','worker','worker-general','worker-general-wide','worker-general-unpacked','worker-general-wide-unpacked'])
  include(`experiments/isomax-lean/${name}.mjs`);
for(const path of ['addons/rba-connect4-geometry.mjs','addons/connect4-rank-local-presearch.mjs','tools/worker-affinity-preload.mjs'])include(path);
output('LICENSE',read('LICENSE'),'LICENSE');
output('targets.json',read('evidence/isomax-memory-affinity-20260928/targets.json'),'evidence/isomax-memory-affinity-20260928/targets.json');
const evidenceRoot='evidence/isomax-tt-init-confirm-20261002/';
const paths=execFileSync('git',['ls-tree','-r','--name-only',source,evidenceRoot],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8'}).trim().split('\n');
if(!paths.length||!paths[0].startsWith(evidenceRoot))throw Error('benchmark evidence missing');
for(const path of paths)output('evidence/benchmark/'+path.slice(evidenceRoot.length),read(path),path);
for(const name of ['full-suite-final.txt','nightly-tests-final.txt']){
  const path='evidence/isomax-init-integration-20261002/'+name;output('evidence/qualification/'+name,read(path),path);
}
output('evidence/INITIALIZATION_PROTOCOL.md',read('experiments/isomax-tt-layout/INITIALIZATION_PROTOCOL.md'),'experiments/isomax-tt-layout/INITIALIZATION_PROTOCOL.md');
output('provenance.json',JSON.stringify({status:'prepared candidate; unpublished',sourceRepository:'https://github.com/iteathen/JSMinSys',
  sourceCommit:source,measuredRuntimeCommit:'302ebcd91bca13e76cc8d1b0de25631b5e768af4',
  normalization:'UTF-8 with CRLF normalized to LF; SHA-256',files:Object.fromEntries(Object.entries(files).sort())},null,2)+'\n');
console.log(`Prepared/checked ${seen.size} unchanged runtime modules and ${Object.keys(files).length} locked files.`);
