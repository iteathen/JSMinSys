// Reproduce the self-contained runtime from the exact qualified Git revision.
// Cold packaging tool only; not imported by the application.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,unlinkSync,readdirSync} from 'node:fs';
import {dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('./',import.meta.url));
const source='ab628f21fa8c989aa7fc1bc416b23ed126f82b93';
const read=path=>{
  const addition=corrections.additions[path];
  if(addition){
    if(digest(addition.text)!==addition.sha256)throw Error('cold addition drift: '+path);
    return addition.text;
  }
  return execFileSync('git',['show',`${source}:${path}`],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).replaceAll('\r\n','\n');
};
const digest=text=>createHash('sha256').update(text).digest('hex');
const correctionsText=readFileSync(root+'cold-corrections.json','utf8').replaceAll('\r\n','\n');
const corrections=JSON.parse(correctionsText);
if(corrections.baseSourceCommit!==source)throw Error('corrections target a different frozen source');
const applied=new Set();
function corrected(path,text){
  const correction=corrections.files[path];
  if(!correction)return text;
  if(digest(text)!==correction.sourceSha256)throw Error('correction source drift: '+path);
  for(const {before,after} of correction.replacements){
    if(!before||text.split(before).length!==2)throw Error('correction anchor is not unique: '+path);
    text=text.replace(before,after);
  }
  if(digest(text)!==correction.sha256)throw Error('correction output drift: '+path);
  applied.add(path);return text;
}
const previous=existsSync(root+'provenance.json')?JSON.parse(readFileSync(root+'provenance.json','utf8')):{files:{}};
const files={},seen=new Set();
function output(path,text,original){
  const target=root+path;
  if(process.argv.includes('--check')){
    if(readFileSync(target,'utf8').replaceAll('\r\n','\n')!==text)throw Error('package drift: '+path);
  }else if(!existsSync(target)||readFileSync(target,'utf8').replaceAll('\r\n','\n')!==text){
    mkdirSync(dirname(target),{recursive:true});writeFileSync(target,text);
  }
  if(original)files[path]={source:original,sha256:digest(text),
    ...(corrections.files[original]?{sourceSha256:corrections.files[original].sourceSha256,correction:corrections.files[original].id}:{}),
    ...(corrections.additions[original]?{source:'cold-correction addition',correction:corrections.additions[original].id}:{})};
}
function include(path){
  if(seen.has(path))return;seen.add(path);
  if(path.startsWith('../')||posix.isAbsolute(path))throw Error('dependency escapes repository');
  const text=corrected(path,read(path));output('runtime/'+path,text,path);
  const code=text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
  for(const m of code.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)){
    if(m[1].startsWith('node:'))continue;
    if(!m[1].startsWith('.'))throw Error('undeclared external dependency: '+m[1]);
    include(posix.normalize(posix.join(posix.dirname(path),m[1])));
  }
}
for(const name of ['host','worker','worker-dense',...[false,true].flatMap(wide=>[true,false].flatMap(packed=>[false,true].map(dense=>'worker-general'+(wide?'-wide':'')+(packed?'':'-unpacked')+(dense?'-dense':''))))])
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
evidenceTree('evidence/isomax-boolean-confirm-20261002/','evidence/benchmark-rc2/');
evidenceTree('evidence/isomax-library-7x6-20261002/','evidence/screens/library-unhoisted/');
evidenceTree('evidence/isomax-library-hoisted-7x6-20261002/','evidence/screens/library-hoisted/');
evidenceTree('evidence/isomax-library-native-7x6-20261002/','evidence/benchmark/');
evidenceTree('evidence/isomax-library-native-7x5-20261002/','evidence/benchmark-7x5/');
evidenceTree('evidence/isomax-library-geometry-20261002/','evidence/library-qualification/');
output('evidence/LIBRARY_NEES_REVIEW.md',read('experiments/isomax-library-geometry/NEES_REVIEW.md'),'experiments/isomax-library-geometry/NEES_REVIEW.md');
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
for(const path of Object.keys(corrections.files))if(!applied.has(path))throw Error('unused cold correction: '+path);
for(const path of Object.keys(corrections.additions))if(!seen.has(path))throw Error('unused cold addition: '+path);
// Public authoring is separate from the frozen runtime/evidence source.
for(const path of ['index.mjs','profile.json','example.mjs','package.json','verify.mjs','README.md','evidence/README.md','cold-corrections.json',
  ...readdirSync(root+'test').filter(name=>name.endsWith('.test.mjs')).map(name=>'test/'+name)])
  files[path]={source:'package-authored',sha256:digest(readFileSync(root+path,'utf8').replaceAll('\r\n','\n'))};
// Remove only unchanged, previously generated files omitted by the new closure.
// User-authored files (including evidence/README.md) are never part of this set.
for(const [path,record] of Object.entries(previous.files))if(!files[path]){
  if(path.startsWith('/')||path.split('/').includes('..')||!['runtime/','evidence/'].some(prefix=>path.startsWith(prefix)))throw Error('unsafe stale generated path: '+path);
  if(process.argv.includes('--check'))throw Error('stale package file: '+path);
  if(digest(readFileSync(root+path,'utf8').replaceAll('\r\n','\n'))!==record.sha256)throw Error('modified stale generated file: '+path);
  unlinkSync(root+path);
}
output('provenance.json',JSON.stringify({status:'prepared candidate; unpublished',sourceRepository:'https://github.com/iteathen/JSMinSys',
  sourceCommit:source,measuredRuntimeCommit:'8713baa11148a7723043d8c434ffb77343a96253',
  coldCorrections:{manifest:'cold-corrections.json',sha256:digest(correctionsText),performanceQualification:'historical measurements apply to the frozen source; corrections have correctness qualification only'},
  normalization:'UTF-8 with CRLF normalized to LF; SHA-256',files:Object.fromEntries(Object.entries(files).sort())},null,2)+'\n');
console.log(`Prepared/checked ${seen.size} runtime modules (${applied.size} cold corrections) and ${Object.keys(files).length} locked files.`);
