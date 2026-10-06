// COLD: expand the sealed popcount body so no nested hot call relies on feedback.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';
const authority=readFileSync(new URL('../src/word32.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n'),
 start=authority.indexOf('export function popcount32(word) {'),end=authority.indexOf('\n}',start);
assert.ok(start>=0&&end>start);
let body=authority.slice(authority.indexOf('\n',start)+1,end);
assert.equal(body.split('let x = word;').length,2);
body=body.replace('let x = word;','let x = membership[at] & lower;').replace('return Math.imul(x, 0x01010101) >>> 24;','return prefix[at] + (Math.imul(x, 0x01010101) >>> 24);');
const target=new URL('../addons/rba-connect4-support-rank-query.mjs',import.meta.url),s=readFileSync(target,'utf8').replaceAll('\r\n','\n'),at=s.indexOf('export function findSupportRankSlot32(');
assert.ok(at>=0);
const out=s.slice(0,at)+'export function findSupportRankSlot32(membership,prefix,rowBase,image){\n const at=rowBase+(image>>>5),lower=~(0xffffffff<<(image&31));\n // GENERATED expansion of sealed popcount32; no nested hot call.\n'+body+'\n}\n';
if(process.argv.includes('--check'))assert.equal(s,out);else writeFileSync(target,out);
