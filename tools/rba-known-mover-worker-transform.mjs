// COLD: recurrence owns the exact mover; preserve shared absolute-bound gauge.
import assert from 'node:assert/strict';
export function transformKnownMoverWorker(source,native){
 let s=source;const args='src,hash,slot'+(native?',support,tail':'');
 function once(a,b){assert.equal(s.split(a).length,2,a);s=s.replace(a,b);}
 const extract='(words[src+g.metaOffset]>>>2)&1';assert.equal(s.split(extract).length,3);
 s=s.replaceAll(extract,'mover');
 once('function probeCache('+args+'){','function probeCache('+args+',mover){');
 once('probeCache('+args+')||','probeCache('+args+',mover)||');
 return s;
}
