import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('every actual worker recursive call keeps windows/scores integral and cancellation unchanged',()=>{
 const names=readdirSync(new URL('../addons/',import.meta.url)).filter(p=>/^rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(p));
 assert.equal(names.length,32);
 for(const p of names){
  const source=readFileSync(new URL('../addons/'+p,import.meta.url),'utf8'),start=source.indexOf('value=negamax('),
   end=/value=(?:-value|\(-value\)\|0);/.exec(source.slice(start));
  assert.ok(start>0&&end,p);
  const body=source.slice(start,start+end.index+end[0].length);
  for(let alpha=-2;alpha<2;alpha++)for(let beta=alpha+1;beta<=2;beta++)for(const childValue of [-2,-1,0,1]){
   let observed;
   const context={depth:1,dst:14,ci:0,childHandle:0,childN:69,mover:0,orientation:0,childReflected:0,
    childLiveOffset:6,childOrderRow:7,CANCELLED:-2,negamax:(...args)=>{observed=args.slice(-2);return childValue;}};
   runInNewContext('function step(alpha,beta){let value;'+body+'return value;}',context);
   const result=context.step(alpha,beta);
   assert.ok(!Object.is(observed[0],-0)&&!Object.is(observed[1],-0),p+' recursive window must not carry negative zero');
   assert.equal(observed[0],(-beta)|0);assert.equal(observed[1],(-alpha)|0);
   assert.equal(result,childValue===-2?-2:(-childValue)|0,p+' sentinel/value transport');
   assert.ok(!Object.is(result,-0),p+' returned score must not carry negative zero');
  }
 }
});
