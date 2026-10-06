import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshReviewedSourceGuards,sourceBlobHash} from '../tools/cycle-source-guards.mjs';

test('a scoped generator refuses unrelated drift and leaves every guard untouched',()=>{
 const ledger={units:[{source:'reviewed.mjs',status:'decomposed'},{source:'unrelated.mjs',status:'decomposed'}],
  decomposedSourceBlobs:{'reviewed.mjs':sourceBlobHash('old'),'unrelated.mjs':sourceBlobHash('old')}};
 const before=structuredClone(ledger.decomposedSourceBlobs);
 assert.throws(()=>refreshReviewedSourceGuards(ledger,new Set(['reviewed.mjs']),()=> 'changed'),/unreviewed source drift: unrelated/);
 assert.deepEqual(ledger.decomposedSourceBlobs,before);
 refreshReviewedSourceGuards(ledger,new Set(['reviewed.mjs']),p=>p==='reviewed.mjs'?'changed':'old');
 assert.equal(ledger.decomposedSourceBlobs['reviewed.mjs'],sourceBlobHash('changed'));
 assert.equal(ledger.decomposedSourceBlobs['unrelated.mjs'],before['unrelated.mjs']);
});

test('source guard normalization is portable and new unreviewed units cannot be silently sealed',()=>{
 assert.equal(sourceBlobHash('a\r\nb\r\n'),sourceBlobHash('a\nb\n'));
 const ledger={units:[{source:'new.mjs',status:'decomposed'}],decomposedSourceBlobs:{}};
 assert.throws(()=>refreshReviewedSourceGuards(ledger,new Set(),()=>''),/unreviewed source drift/);
});
