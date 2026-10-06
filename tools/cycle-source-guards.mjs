// Cold source integrity. A generator may refresh only sources whose inventory it owns/reviews.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export function sourceBlobHash(text){
 const source=text.replaceAll('\r\n','\n');
 return createHash('sha1').update(`blob ${Buffer.byteLength(source)}\0`).update(source).digest('hex');
}

export function refreshReviewedSourceGuards(ledger,reviewed,readSource=p=>readFileSync(p,'utf8')){
 const updates={};
 for(const source of new Set(ledger.units.filter(u=>u.status==='decomposed').map(u=>u.source))){
  const hash=sourceBlobHash(readSource(source));
  if(reviewed.has(source))updates[source]=hash;
  else assert.equal(hash,ledger.decomposedSourceBlobs[source],`unreviewed source drift: ${source}; repair that owner's operation inventory explicitly`);
 }
 // Verify all unreviewed sources before changing even one reviewed guard.
 Object.assign(ledger.decomposedSourceBlobs,updates);
}
