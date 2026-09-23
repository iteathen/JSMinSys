import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('catalog/catalog-v0.json', 'utf8'));
const functions = JSON.parse(readFileSync('catalog/functions-v0.json', 'utf8'));
const coverage = JSON.parse(readFileSync('catalog/block-coverage-v0.json', 'utf8'));

const admitted = new Set(Object.values(catalog.admissibleOperations).flat());
const names = new Set();

for (const fn of functions.functions) {
  assert.equal(typeof fn.name, 'string', 'function name missing');
  assert.ok(!names.has(fn.name), `duplicate function ${fn.name}`);
  names.add(fn.name);
  assert.ok(existsSync(fn.source), `${fn.name}: missing source ${fn.source}`);
  for (const primitive of fn.primitives) {
    assert.ok(admitted.has(primitive), `${fn.name}: primitive is not admitted: ${primitive}`);
  }
  assert.ok(fn.cycleCount && typeof fn.cycleCount === 'object', `${fn.name}: missing cycleCount`);
  assert.equal(
    fn.cycleCount.profile,
    'node26-v8-14.6/x86_64-amd-zen3',
    `${fn.name}: unexpected cycle profile`,
  );
  assert.ok(
    ['fixed', 'range', 'scenario', 'expression', 'unbounded'].includes(fn.cycleCount.kind),
    `${fn.name}: invalid cycleCount kind ${fn.cycleCount.kind}`,
  );
  if (fn.cycleCount.kind === 'fixed') {
    assert.ok(Number.isFinite(fn.cycleCount.cycles) && fn.cycleCount.cycles >= 0, `${fn.name}: invalid fixed cycle count`);
  }
  if (fn.cycleCount.kind === 'range') {
    assert.ok(Number.isFinite(fn.cycleCount.minCycles) && Number.isFinite(fn.cycleCount.maxCycles), `${fn.name}: invalid cycle range`);
    assert.ok(fn.cycleCount.minCycles >= 0 && fn.cycleCount.maxCycles >= fn.cycleCount.minCycles, `${fn.name}: invalid cycle bounds`);
  }
}

for (const block of coverage.blocks) {
  for (const name of block.functions ?? []) {
    assert.ok(names.has(name), `block ${block.id}: unknown function ${name}`);
  }
  if (block.status.includes('deferred')) {
    assert.ok((block.deferred ?? []).length > 0, `block ${block.id}: deferred status without deferred function`);
    assert.ok((block.missingPrimitives ?? []).length > 0, `block ${block.id}: deferred status without missing primitive`);
  }
}

assert.equal(coverage.blocks.length, coverage.summary.catalogBlocks);
assert.equal(
  coverage.blocks.filter((block) => !block.status.includes('deferred')).length,
  coverage.summary.completeWithoutNewPrimitive,
);
assert.equal(
  coverage.blocks.filter((block) => block.status.includes('deferred')).length,
  coverage.summary.deferredMissingPrimitive,
);

const sourceFiles = [...new Set(functions.functions.map((fn) => fn.source))];
const forbiddenSourcePatterns = [
  [/\bnew\s+/, 'dynamic construction'],
  [/\bBigInt\b|\bBigInt64Array\b|\bBigUint64Array\b/, 'BigInt'],
  [/\bNumber\.isInteger\s*\(/, 'Number.isInteger'],
  [/\bMap\s*\(|\bSet\s*\(|\bWeakMap\s*\(|\bWeakSet\s*\(/, 'general collection construction'],
  [/\bPromise\s*\(/, 'Promise construction'],
];
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  for (const [pattern, label] of forbiddenSourcePatterns) {
    assert.ok(!pattern.test(source), `${path}: forbidden sealed-source form: ${label}`);
  }
}

assert.equal(
  functions.summary.functionsWithCycleCount,
  functions.functions.length,
  'cycle-count summary does not cover every implemented function',
);
assert.equal(functions.summary.functionsMissingCycleCount, 0, 'implemented functions missing cycle counts');

console.log(
  `JSMinSys catalog verified: ${functions.functions.length} implemented functions, all cycle-counted, ` +
  `${coverage.summary.completeWithoutNewPrimitive}/${coverage.summary.catalogBlocks} blocks complete without new primitives, ` +
  `${functions.deferred.length} deferred function(s).`,
);
