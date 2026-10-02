// Offline sampled-profile analysis; never loaded by solver workers.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const dir=process.argv[2],totals=new Map(),categories=new Map(),threads=[];
function category(frame){
  const f=frame.functionName;
  if(/searchCpcOnly|solveConnect4/.test(f))return 'recursive/control or inlined work';
  if(/Cofactor|cofactor|Subset|subset|RemoveDense|removeDense/.test(f))return 'cofactor/basis/subsets';
  if(/Canonical|ReflectedSupport|permutePair/.test(f))return 'canonicalization';
  if(/SharedCache|SharedExact|compactSupport|compactTail/.test(f))return 'shared TT/key helpers';
  if(/Cpc|Singleton|ForkPreemption|pairedResponse|cellMarked|coordHas|playableCell/.test(f))return 'CPC';
  if(/Live|popcount|argMax/.test(f))return 'live-line/order';
  if(/CacheSlot/.test(f))return 'private TT';
  return null;
}
for(const file of readdirSync(dir).filter(f=>f.endsWith('.cpuprofile'))){
  const profile=JSON.parse(readFileSync(dir+'/'+file));
  if(!profile.nodes.some(n=>n.callFrame.url.includes('/solver.mjs')))continue; // main thread excluded
  const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map();
  for(const n of profile.nodes)for(const child of n.children??[])parents.set(child,n.id);
  let duration=0;
  for(let i=0;i<(profile.samples??[]).length;i++){
    const id=profile.samples[i],node=nodes.get(id),us=profile.timeDeltas?.[i]??1000;duration+=us;
    const name=node.callFrame.functionName||'(anonymous)',url=node.callFrame.url;
    const key=name+' @ '+url+':'+(node.callFrame.lineNumber+1);
    totals.set(key,(totals.get(key)??0)+us);
    let p=id,label=null;
    if(name==='(garbage collector)')label='GC';
    if(name==='(idle)')label='idle';
    while(!label&&p!==undefined){label=category(nodes.get(p).callFrame);p=parents.get(p);}
    label??='unattributed/setup/native';categories.set(label,(categories.get(label)??0)+us);
  }
  threads.push({file,samples:profile.samples.length,sampledMicroseconds:duration});
}
const total=threads.reduce((n,t)=>n+t.sampledMicroseconds,0);
const list=m=>[...m].sort((a,b)=>b[1]-a[1]).map(([name,us])=>({name,sampledMicroseconds:us,percent:100*us/total}));
const result={threads,totalSampledMicroseconds:total,categories:list(categories),topLeafFrames:list(totals).slice(0,40),
  limits:'Sampling diagnostic, not scored timing or hardware stall attribution. Nearest named ancestor attribution; V8 inlining/native frames can obscure source ownership. Percentages are sampled time, not exact instruction counts.'};
writeFileSync(dir+'/ANALYSIS.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({threads,categories:result.categories,top:result.topLeafFrames.slice(0,16)},null,2));
