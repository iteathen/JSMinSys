import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Position-independent launcher; V8 flags are consumed before worker init.
const base=new URL('./',import.meta.url),r=spawnSync(process.execPath,[
 '--max-inlined-bytecode-size=2400','--max-inlined-bytecode-size-cumulative=9600',
 '--import',new URL('runtime/tools/benchmark-v8-startup-preload.mjs',base).href,
 fileURLToPath(new URL('cli.mjs',base)),...process.argv.slice(2)],{stdio:'inherit'});
if(r.error){console.error(r.error.message);process.exitCode=1;}else process.exitCode=r.status??1;
