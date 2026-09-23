import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const addonFiles=readdirSync('addons').filter(name=>name.endsWith('.mjs'));
const forbidden=[
  [/7x6/i,'7x6 proving geometry'],
  [/rba7x6/i,'fixed RBA 7x6 API'],
  [/rba-tt8x32/i,'fixed eight-word RBA TT API'],
  [/\b69\b/,'7x6 winning-line/basis constant'],
  [/\b625\b/,'7x6 residual-shape constant'],
  [/RBA_TT_MAX_EDGES|RBA_TT_MAX_BASIS|RBA_TT_KEY_WORDS/,'fixed RBA TT dimension constant'],
];
for(const file of addonFiles){
  const source=readFileSync('addons/'+file,'utf8');
  for(const [pattern,label] of forbidden)assert.ok(!pattern.test(source),`addons/${file}: hidden ${label}`);
}

const core=readFileSync('src/index.mjs','utf8');
for(const name of [
  'span32.mjs','relational32.mjs','widekey32.mjs','interval32.mjs','basis32.mjs','state32.mjs','worker32.mjs'
])assert.ok(core.includes(name),`missing general core export ${name}`);

const addons=readFileSync('addons/index.mjs','utf8');
for(const name of [
  'rba-tt32.mjs','rba-connect4-geometry.mjs','rba-connect4-coordinate.mjs',
  'rba-connect4-front.mjs','rba-connect4-solver.mjs'
])assert.ok(addons.includes(name),`missing configured RBA export ${name}`);

const spec=readFileSync('SPEC.md','utf8');
assert.ok(spec.includes('JMS-DATA-007'), 'general geometry path rule missing');

const functions=JSON.parse(readFileSync('catalog/functions-v0.json','utf8'));
const names=new Set(functions.functions.map(fn=>fn.name));
for(const name of [
  'equalSpan32At','subsetSpan32At','insertMinimalSpan32InPlace','productJoinMinimalSpan32Into',
  'mixSpan32Locator32','probeSpan32IdSlot32','publishSpanIdSlot32',
  'reduceMaxIntervals32Into','reduceMinIntervals32Into','permuteBitsSpan32Into',
  'publishDependencies32','retainFirstRunnableDependency32','applyMoveSpan32','undoMoveSpan32'
])assert.ok(names.has(name),`general runtime-sized catalog function missing: ${name}`);

const geometry=readFileSync('addons/rba-connect4-solver.mjs','utf8');
assert.ok(!/columns\s*:\s*7|rows\s*:\s*6/.test(geometry),'RBA solver must require initialization geometry');

console.log('Runtime geometry audit passed: general path present; RBA add-ons contain no 7x6 carrier constants.');
