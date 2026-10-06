// Offline trace inspection; never imported by a solver.
import {readFileSync,writeFileSync} from 'node:fs';
const name=process.argv[2];if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid diagnostic name');
const dir=new URL('../minimal-worker-localhost-20261004/'+name+'/',import.meta.url);
const trace=readFileSync(new URL('stdout.txt',dir),'utf8'),start=trace.search(/\{\s*"purpose":/);
if(start<0)throw Error('Missing diagnostic result');
// Worker trace output can follow the final JSON. Extract its balanced object.
let depth=0,inString=false,escape=false,end=-1;
for(let i=start;i<trace.length;i++){
 const c=trace[i];if(inString){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')inString=false;continue;}
 if(c==='"')inString=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break;}
}
if(end<0)throw Error('Incomplete diagnostic JSON');
const result=JSON.parse(trace.slice(start,end)),targets=new Set(),functions={};
for(const line of trace.split('\n')){
 const m=line.match(/^Inlining .*?<SharedFunctionInfo ([^>]+)>.*? into .*?\{(0x[0-9a-f]+) <SharedFunctionInfo negamax>/i);
 if(!m)continue;targets.add(m[2]);(functions[m[1]]??=new Set()).add(m[2]);
}
const out={name,runtime:result.runtime,v8:result.v8,basisViews:result.result.basisViews,
 cleanup:result.result.cleanup,workersExited:result.result.workersExited,
 negamaxTargets:[...targets],functions:Object.fromEntries(Object.entries(functions).map(([k,v])=>[k,[...v]])),
 caveat:'Diagnostic partial search only; direct inlining coverage is not a performance conclusion.'};
if(!out.basisViews||!out.cleanup||out.workersExited!==4||targets.size!==4)throw Error('Incomplete actual diagnostic path');
writeFileSync(new URL('inlining-inspection.json',dir),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({name,targets:targets.size,functions:Object.fromEntries(Object.entries(out.functions).map(([k,v])=>[k,v.length]))}));
