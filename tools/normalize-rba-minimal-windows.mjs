// Cold coherent worker realization. Outcome-only domain {-1,0,+1}; CANCELLED
// remains -2 and is tested before score negation. No search/window semantic change.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const names=readdirSync('addons').filter(p=>/^rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(p));
assert.equal(names.length,32);
const updates=names.map(name=>{
 const path='addons/'+name,old=readFileSync(path,'utf8').replaceAll('\r\n','\n'),
  text=old.replaceAll('-beta,-alpha)','(-beta)|0,(-alpha)|0)').replaceAll('value=-value;','value=(-value)|0;');
 assert.equal(text.split('(-beta)|0,(-alpha)|0)').length,2,path+' recursive argument pair');
 assert.equal(text.split('value=(-value)|0;').length,2,path+' returned score');
 return {path,old,text};
});
for(const {path,old,text} of updates)if(process.argv.includes('--check'))assert.equal(old,text,path);else writeFileSync(path,text);
