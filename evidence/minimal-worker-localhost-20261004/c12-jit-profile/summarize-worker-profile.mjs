import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const dir=process.argv[2],totals=new Map(),files=[];let count=0;
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.cpuprofile'))){
 const raw=fs.readFileSync(path.join(dir,file)),p=JSON.parse(raw);
 if(!p.nodes.some(n=>n.callFrame.functionName==='negamax'))continue;
 files.push({file,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 const nodes=new Map(p.nodes.map(n=>[n.id,n]));
 for(const id of p.samples??[]){const n=nodes.get(id),frame=n.callFrame.functionName+' @ '+path.basename(n.callFrame.url);totals.set(frame,(totals.get(frame)??0)+1);count++;}
}
if(files.length!==4)throw Error('expected four worker profiles, got '+files.length);
const result={kind:'diagnostic-only-20-second-early-search-sampled-profile',sourceCommit:JSON.parse(fs.readFileSync(path.join(dir,'invocation.json'))).upstream_commit,workers:4,flatSelfSamples:count,limitations:'Early-search only; sampled/inlined attribution approximate, includes startup. Not full-workload cost fractions or performance authority.',files,top:[...totals].sort((a,b)=>b[1]-a[1]).slice(0,40).map(([frame,samples])=>({frame,samples,percent:100*samples/count}))};
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.top.slice(0,16),null,2));
