// Reproduce the self-contained runtime from the exact qualified Git revision.
// Cold packaging tool only; not imported by the application.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('./',import.meta.url));
const source='ea044cbb23cc0e2a549f01274498c15db6fad0ad';
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
for(const name of ['host','worker','worker-dense','worker-general','worker-general-wide','worker-general-unpacked','worker-general-wide-unpacked'])
  include(`experiments/isomax-lean/${name}.mjs`);
for(const path of ['addons/rba-connect4-geometry.mjs','addons/connect4-rank-local-presearch.mjs','tools/worker-affinity-preload.mjs'])include(path);
output('LICENSE',read('LICENSE'),'LICENSE');
output('targets.json',read('evidence/isomax-memory-affinity-20260928/targets.json'),'evidence/isomax-memory-affinity-20260928/targets.json');
function evidenceTree(evidenceRoot,destination){
  const paths=execFileSync('git',['ls-tree','-r','--name-only',source,evidenceRoot],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8'}).trim().split('\n');
  if(!paths.length||!paths[0].startsWith(evidenceRoot))throw Error('evidence missing: '+evidenceRoot);
  for(const path of paths)output(destination+path.slice(evidenceRoot.length),read(path),path);
}
evidenceTree('evidence/isomax-tt-init-confirm-20261002/','evidence/tt-layout/');
evidenceTree('evidence/isomax-boolean-confirm-20261002/','evidence/benchmark/');
evidenceTree('evidence/isomax-closure-confirm-20261002/','evidence/screens/closure-confirm/');
evidenceTree('evidence/isomax-structural-cost-20261002/','evidence/campaign/');
for(const experiment of ['csr','constants','masks','prepared'])
  evidenceTree(`evidence/isomax-${experiment}-screen-20261002/`,`evidence/screens/${experiment}/`);
for(const name of ['CLAIM_AUDIT.md','NEES_REVIEW.md','PLAN.md'])
  output('evidence/'+name,read('experiments/isomax-structural-cost/'+name),'experiments/isomax-structural-cost/'+name);
for(const name of ['full-suite-final.txt','nightly-tests-final.txt']){
  const path='evidence/isomax-init-integration-20261002/'+name;output('evidence/qualification/'+name,read(path),path);
}
output('evidence/INITIALIZATION_PROTOCOL.md',read('experiments/isomax-tt-layout/INITIALIZATION_PROTOCOL.md'),'experiments/isomax-tt-layout/INITIALIZATION_PROTOCOL.md');
output('provenance.json',JSON.stringify({status:'prepared candidate; unpublished',sourceRepository:'https://github.com/iteathen/JSMinSys',
  sourceCommit:source,measuredRuntimeCommit:'98b51d3c118bf34878af0430b82174578f5a7011',
  normalization:'UTF-8 with CRLF normalized to LF; SHA-256',files:Object.fromEntries(Object.entries(files).sort())},null,2)+'\n');
console.log(`Prepared/checked ${seen.size} unchanged runtime modules and ${Object.keys(files).length} locked files.`);
