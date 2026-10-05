import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const baseline='5954a8c8fe069fec1067fbeefb6840065aa19ef4';
const rows=[];
function check(path,marker=null){
  const old=execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}).replaceAll('\r\n','\n');
  const current=readFileSync(path,'utf8').replaceAll('\r\n','\n');
  const body=s=>marker===null?s:s.slice(s.indexOf(marker));
  if(marker)assert.ok(old.includes(marker)&&current.includes(marker),path);
  assert.equal(body(current),body(old),path);
  rows.push({path,scope:marker??'whole module',sha256:createHash('sha256').update(body(current)).digest('hex')});
}
for(const name of ['minimal','minimal-center'])check('addons/rba-connect4-lazy-smp-worker-'+name+'.mjs','function relativeTerminal(');
check('addons/rba-connect4-shared-exact-cache-uncounted.mjs');
for(const p of ['addons/cpc-connect4.mjs','addons/rba-connect4-coordinate.mjs','addons/rba-connect4-coordinate-prepared.mjs','addons/rba-connect4-coordinate-dense.mjs'])check(p);
for(const name of readdirSync('isomax/runtime/experiments/isomax-lean').filter(n=>n.startsWith('solver')&&n.endsWith('.mjs')))check('isomax/runtime/experiments/isomax-lean/'+name);
check('isomax/runtime/experiments/isomax-lean/shared-cache.mjs','export function probeConnect4RbaSharedExactCache32(');
writeFileSync(new URL('../raw/hot-identity.json',import.meta.url),JSON.stringify({baseline,rows},null,2)+'\n');
console.log(JSON.stringify({unchangedHotRegions:rows.length,baseline}));
