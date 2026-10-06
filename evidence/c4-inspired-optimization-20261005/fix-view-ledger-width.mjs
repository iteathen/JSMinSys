// Offline review correction: no runtime source or instrumentation changes.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path));
const expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+');
const names=new Set(['evaluateConnect4PreparedCpcMatchingResponse32','evaluateConnect4PreparedCpcWin32','evaluateConnect4PreparedCpcResponse32','evaluateConnect4CpcTargetGeneralWin32','evaluateConnect4CpcTargetDenseWin32','connect4RbaImmediateWinningColumn','findConnect4CpcxPairHub32','collectConnect4CpcxSingletons32']);
for(const u of l.units){
  if(/coordinate-closure-view-/.test(u.source)){
    const count=u.name.includes('NonWinning')?'A':'B+D+A';
    const raw=u.operations.find(o=>o.op==='memory.load.u32');
    raw.count=raw.count.replaceAll('+B+D','').replace('+A+','+');
    u.operations.find(o=>o.op==='memory.load.native_index').count=count;
    delete u.cycleCount.parameters.WORD_BYTES;
    u.cycleCount.parameters.BASIS_BYTES='Plan ID width: shapeCount <=256 selects1, <=65536 selects2, otherwise4 bytes; standard7x6 is Uint16. Cold array selection; no decoder or hot width switch.';
  }else if(names.has(u.name)){
    if(u.operations.some(o=>o.op==='memory.load.native_index'&&o.count==='BASIS'))continue;
    const raw=u.operations.find(o=>o.op==='memory.load.u32');
    if(u.name==='findConnect4CpcxPairHub32')raw.count='SOURCE';
    else if(u.name==='collectConnect4CpcxSingletons32')raw.count='BITS+3*ACTIVE+HAZARDS';
    u.operations.push({op:'memory.load.native_index',count:'BASIS'});
    const p=u.cycleCount.parameters;
    p.BASIS='Actual basis-array reads, including reached early predicates, singleton prefix/search and active residual IDs; counted separately from uint32 state/geometry reads.';
    p.BASIS_BYTES='Actual supplied basis.BYTES_PER_ELEMENT: ordinary ingress/private arena4, immutable plan1/2/4 chosen by shapeCount at init. Native-index operation is context-specific, not a hot selector.';
    for(const k of ['L32','L'])if(p[k])p[k]=p[k].replace(/basis IDs,?\s*/i,'')+' Excludes basis-array reads charged by BASIS.';
  }else continue;
  const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);
  u.cycleCount.note+=' Review correction: distinguish immutable/native basis reads from uint32 coordinate/state accesses; no measured cycle estimate or solver change.';
}
for(const u of l.units.filter(u=>u.source==='addons/rba-connect4-support-basis-view.mjs')){
  u.cycleCount.parameters.NATIVE_WIDTHS='Each native-index read uses its actual array: sizes width from maxBasis<=255/65535; basis IDs from shapeCount<=256/65536. Both constructor choices occur at init. Ingress basis and strides remain uint32.';
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
