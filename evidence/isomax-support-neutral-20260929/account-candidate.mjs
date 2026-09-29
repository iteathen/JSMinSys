// Cold, reproducible ledger update for this experimental source checkpoint only.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8'));
if(l.units.some(u=>u.name==='projectSupportNeutralSparse32'))throw Error('already accounted');
function extend(u,ops,expression,parameters,note){
  u.operations.push(...ops);u.cycleCount.expression+='+'+expression;
  if(u.cycleCount.activeCycleExpression)u.cycleCount.activeCycleExpression+='+'+expression;
  Object.assign(u.cycleCount.parameters,parameters);u.cycleCount.note+=' '+note;
}
for(const u of l.units){
  if(['prepareConnect4RbaAlphaBeta','prepareConnect4RbaAlphaBetaBehavior','prepareConnect4RbaFrontier'].includes(u.name))extend(u,[
    {op:'runtime.call.subledger',count:1,target:'prepareSupportNeutralSparse32'},
    {op:'runtime.typed_array.allocate',count:1},{op:'runtime.field.store',count:2},
    {op:'runtime.field.load',count:1},{op:'alu.imul.u32',count:1}
  ],'CALL(prepareSupportNeutralSparse32)+C(runtime.typed_array.allocate)+2*C(runtime.field.store)+C(runtime.field.load)+C(alu.imul.u32)',{},
  'Experimental sparse support key: cold shape-column preparation plus zero-initialized depth-local key spans; allocation/page/GC costs are symbolic, not zero.');
  if(['searchCpcOnly','searchCpcOnlyBehavior','searchCpcOnlyFrontier'].includes(u.name))extend(u,[
    {op:'runtime.call.subledger',count:'SN*P',target:'projectSupportNeutralSparse32'},
    {op:'runtime.field.load',count:'P+2*SN*P+SP'},
    {op:'control.test.u32',count:'P+SN*P'},{op:'control.branch',count:'P+SN*P'}
  ],'SN*P*CALL(projectSupportNeutralSparse32)+(P+2*SN*P+SP)*C(runtime.field.load)+(P+SN*P)*C(control.test.u32)+(P+SN*P)*C(control.branch)',
  {SN:'1 for selected 7x6 geometry, otherwise 0',SP:'successful sparse projections across P iterations; 0..P'},
  'Experimental deferred projection before cache access. All private/bound/shared accesses use the selected depth-local key; cofactor/CPC/live-line/root physical semantics use original q. Existing hash/probe/store subledgers still apply.');
}
function unit(name,scope,ops,parameters,note){
  l.units.push({unit:'addons/rba-connect4-support-neutral.mjs#'+name,source:'addons/rba-connect4-support-neutral.mjs',name,scope,operations:ops,
    cycleCount:{kind:'expression',expression:ops.map(o=>`(${o.count})*${o.target?'CALL('+o.target+')':'C('+o.op+')'}`).join('+'),parameters,note},status:'decomposed'});
}
unit('prepareSupportNeutralSparse32','cold-geometry-preparation',[
  {op:'runtime.field.load',count:'3+Q*(1+2*S+3*T)'},{op:'control.test.u32',count:'3+Q*(2+2*S+T)'},{op:'control.branch',count:'3+Q*(2+2*S+T)'},
  {op:'runtime.typed_array.allocate',count:'Q'},{op:'memory.load.u32',count:'Q*(S+2*T)'},{op:'memory.store.u32',count:'Q*S'},
  {op:'alu.add.u32',count:'Q*(S+2*T)'},{op:'alu.imul.u32',count:'Q*T'},{op:'alu.shl.u32',count:'Q*T'},{op:'alu.or.u32',count:'Q*T'}
],{Q:'1 if selected geometry; otherwise 0',S:'shapeCount',T:'sum of shape sizes'},'Conservative source-operation envelope for cold preparation; loop-bound field loads and all allocation are charged.');
unit('projectSupportNeutralSparse32','worker-cache-key-projection',[
  {op:'memory.load.u32',count:'R+2*G+P*(A+1)'},{op:'memory.store.u32',count:'4*P'},
  {op:'alu.add.u32',count:'3*R+2*G+P*(11+A)'},{op:'alu.sub.u32',count:'B+D'},
  {op:'alu.imul.u32',count:'G+P*A'},{op:'alu.and.u32',count:'B+D+P*7'},
  {op:'alu.or.u32',count:'P*(A+2)+D'},{op:'alu.xor.u32',count:'D'},
  {op:'alu.shl.u32',count:'P*(8+A)'},{op:'alu.shr.u32',count:'P'},
  {op:'control.test.u32',count:'8+2*R+3*B+4*D+P*18'},{op:'control.branch',count:'8+2*R+3*B+4*D+P*18'},
  {op:'runtime.call.subledger',count:'G',target:'firstSetBitIndex32'}
],{R:'coordinate words examined before rejection/success, 1..6',B:'nonzero coordinate words examined, 0..3',G:'accepted global generator IDs, 0..2',D:'1 when both coordinates are sparse and mask eligibility is evaluated, otherwise 0',P:'1 on successful projection, otherwise 0',A:'active column count on success, 0..5'},
'Conservative source-operation envelope, not calibrated Intel cycles. Includes rejection paths, indexed addressing, generator/column-mask loads, bit decoding, eligibility, seven-column selection, four depth-local key stores and primitive calls. Key spans remain zero outside four assigned lanes. No persistent mask, retirement iteration, second hash, equality object, or recursive allocation. Existing full hash and exact compact equality cost remains charged by search/cache subledgers.');
for(const source of new Set(l.units.filter(u=>u.status==='decomposed').map(u=>u.source))){
  const s=readFileSync(source,'utf8').replaceAll('\r\n','\n');
  l.decomposedSourceBlobs[source]=createHash('sha1').update(`blob ${Buffer.byteLength(s)}\0`).update(s).digest('hex');
}
l.summary.units=l.units.length;l.summary.decomposed=l.units.filter(u=>u.status==='decomposed').length;
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
