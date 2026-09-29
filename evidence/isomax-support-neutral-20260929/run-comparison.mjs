// Cold orchestration only; each sample uses the existing selected-profile launcher.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const dir='evidence/isomax-support-neutral-20260929',old='evidence/isomax-memory-affinity-20260928';
const runtime=JSON.parse(readFileSync(old+'/runtime.json','utf8'));
const sources={A:{library:'C:/r/isomax-p2-memory-source',sourceSha:'6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e'},B:{library:'C:/r/isomax-support-neutral-c-source',sourceSha:'de8394ab44bea9892f1cbb8a84160efb753a4cc3'}};
// Predetermined before any timings: two completed-control ABBA blocks plus one
// matched full 10-minute pair, the owner's allowed alternative to 40min stress.
const schedule=[...['353335714','35333571'].flatMap((fixture,block)=>[...'ABBA'].map((arm,i)=>({fixture,arm,id:`sn-c-exact-${block}-${i}-${arm.toLowerCase()}`}))),
  ...[...'AB'].map(arm=>({fixture:'',arm,id:`sn-c-empty-${arm.toLowerCase()}`}))];
writeFileSync(dir+'/comparison-plan.json',JSON.stringify({sources,schedule,timeoutMs:600000,profile:'isomax-four-pcore-10g-576m-i5-12600k-20260928',note:'Packet-local A is the sole unchanged resource configuration. Scientific arm A/B is identified by source SHA and schedule, not packet-local resource label.'},null,2)+'\n');
for(const sample of schedule){
  const p={id:sample.id,order:'A',arms:{A:{shared:268435456,private:16777216,pin:true,preload:true}},fixture:sample.fixture,timeoutMs:600000,...sources[sample.arm],stopOnCensoredFirstPair:false};
  const path=dir+'/'+p.id+'-packet.json';writeFileSync(path,JSON.stringify(p,null,2)+'\n');
  execFileSync(runtime.nodeExe,[old+'/run-packet.mjs',path],{stdio:'inherit',windowsHide:true});
  const row=JSON.parse(readFileSync(old+'/'+p.id+'-samples.jsonl','utf8').trim());
  if(sample.fixture&&row.status!=='EXACT')throw Error('Completed-control gate censored; preserve raw and reassess, no automatic stress run');
}
