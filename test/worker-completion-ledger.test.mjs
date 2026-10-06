import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('every minimal completion ledger matches actual winner, loser and cancelled atomic paths',()=>{
 const l=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url)));
 const units=l.units.filter(u=>/^addons\/rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(u.source)&&u.name==='<module-main>');
 assert.equal(units.length,32);
 for(const u of units){
  const source=readFileSync(new URL('../'+u.source,import.meta.url),'utf8'),code=source.slice(source.lastIndexOf('if(relative!==CANCELLED)'));
  for(const [relative,winner] of [[1,1],[1,0],[-2,0]]){
   const counts={'atomic.store.u32':0,'atomic.rmw.u32':0,'atomic.notify':0};
   runInNewContext(code,{relative,CANCELLED:-2,index:0,RESULT_STRIDE:4,terminal:0,mover:0,bestMove:3,
    relativeToAbsolute:v=>v+2,workerData:{rootReflected:0},g:{mirrorColumn:[6,5,4,3,2,1,0]},resultWords:[],control:[],
    CONTROL_WINNER:4,CONTROL_DONE:1,CONTROL_WAKE:3,
    Atomics:{store:()=>{counts['atomic.store.u32']++;},compareExchange:()=>{counts['atomic.rmw.u32']++;return winner?-1:0;},
     add:()=>{counts['atomic.rmw.u32']++;},notify:()=>{counts['atomic.notify']++;}}});
   for(const [op,actual] of Object.entries(counts)){
    const modeled=u.operations.filter(o=>o.op===op&&o.count!=='PT').reduce((n,o)=>n+Function('COMPLETED','WINNER','return ('+o.count+')')(relative===-2?0:1,winner),0);
    assert.equal(modeled,actual,u.unit+' '+op+' relative='+relative+' winner='+winner);
   }
  }
 }
});
