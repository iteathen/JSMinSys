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

console.log(
  `JSMinSys catalog verified: ${functions.functions.length} implemented functions, ` +
  `${coverage.summary.completeWithoutNewPrimitive}/${coverage.summary.catalogBlocks} blocks complete without new primitives, ` +
  `${functions.deferred.length} deferred function(s).`,
);
