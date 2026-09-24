import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('catalog/catalog-v0.json', 'utf8'));
const functions = JSON.parse(readFileSync('catalog/functions-v0.json', 'utf8'));
const coverage = JSON.parse(readFileSync('catalog/block-coverage-v0.json', 'utf8'));
const cycleModel = JSON.parse(readFileSync('catalog/cycle-model-v0.json', 'utf8'));
const addonCycleLedger = JSON.parse(readFileSync('catalog/addon-cycle-ledger-v0.json', 'utf8'));

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
  coverage.summary.complete,
);
assert.equal(
  coverage.blocks.filter((block) => block.status.includes('deferred')).length,
  coverage.summary.deferredMissingPrimitive,
);

const sourceFiles = [...new Set(functions.functions.map((fn) => fn.source))];
const forbiddenSourcePatterns = [
  [/\bnew\s+/, 'unapproved dynamic construction'],
  [/\bBigInt\b|\bBigInt64Array\b|\bBigUint64Array\b/, 'BigInt'],
  [/\bNumber\.isInteger\s*\(/, 'Number.isInteger'],
  [/\bMap\s*\(|\bSet\s*\(|\bWeakMap\s*\(|\bWeakSet\s*\(/, 'general collection construction'],
  [/\bPromise\s*\(/, 'Promise construction'],
];
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  const sourceWithAdmittedConstructionRemoved = source.replace(/\bnew\s+Uint32Array\s*\(/g, 'Uint32Array.construct(');
  for (const [pattern, label] of forbiddenSourcePatterns) {
    assert.ok(!pattern.test(sourceWithAdmittedConstructionRemoved), `${path}: forbidden sealed-source form: ${label}`);
  }
}

assert.equal(
  functions.summary.functionsWithCycleCount,
  functions.functions.length,
  'cycle-count summary does not cover every implemented function',
);
assert.equal(functions.summary.functionsMissingCycleCount, 0, 'implemented functions missing cycle counts');

for (const primitive of admitted) {
  assert.ok(cycleModel.operations[primitive], `admitted primitive missing cycle model: ${primitive}`);
}
assert.equal(
  Object.keys(cycleModel.operations).length,
  admitted.size,
  'cycle model and admitted-operation counts differ',
);
assert.equal(cycleModel.coverage.complete, true, 'cycle model coverage must be complete');

const addonAllowedCostKinds = new Set(['fixed','range','scenario','expression','symbolic','unbounded']);
const addonUnits = new Map();
for (const unit of addonCycleLedger.units) {
  assert.equal(typeof unit.unit, 'string', 'add-on cycle unit id missing');
  assert.ok(!addonUnits.has(unit.unit), `duplicate add-on cycle unit ${unit.unit}`);
  addonUnits.set(unit.unit, unit);
  assert.equal(unit.cycleCount && typeof unit.cycleCount === 'object', true, `${unit.unit}: missing cycleCount`);
  assert.ok(addonAllowedCostKinds.has(unit.cycleCount.kind), `${unit.unit}: invalid add-on cycleCount kind`);
  assert.ok(Array.isArray(unit.operations) && unit.operations.length > 0, `${unit.unit}: missing operation ledger`);
}

const addonCostOps = new Set([
  ...Object.keys(addonCycleLedger.neesOperationBindings ?? {}),
  ...Object.keys(addonCycleLedger.localOperationExtensions ?? {}),
]);

assert.equal(
  addonCycleLedger.summary.neesBoundOperations,
  Object.keys(addonCycleLedger.neesOperationBindings ?? {}).length,
  'add-on NEES binding summary mismatch',
);
assert.equal(
  addonCycleLedger.summary.localExtensionOperations,
  Object.keys(addonCycleLedger.localOperationExtensions ?? {}).length,
  'add-on local-extension summary mismatch',
);
for (const unit of addonCycleLedger.units) {
  for (const operation of unit.operations) {
    assert.equal(typeof operation.op, 'string', `${unit.unit}: operation id missing`);
    assert.ok(addonCostOps.has(operation.op), `${unit.unit}: unbound add-on cost operation ${operation.op}`);
  }
}

for (const unit of addonCycleLedger.units.filter((entry) => entry.status === 'decomposed')) {
  assert.ok(
    !unit.operations.some((operation) => operation.op === 'runtime.legacy.addon.body'),
    `${unit.unit}: decomposed unit may not use legacy symbolic fallback`,
  );
  const cycleText = [
    unit.cycleCount.expression,
    unit.cycleCount.activeCycleExpression,
    ...(unit.cycleCount.unboundedTerms ?? []),
  ].filter(Boolean).join(' ');
  for (const match of cycleText.matchAll(/\bCALL\(([^()\s,+*]+)\)/g)) {
    assert.ok(
      unit.operations.some((operation) =>
        operation.op === 'runtime.call.subledger' && operation.target === match[1]),
      `${unit.unit}: cycle expression CALL(${match[1]}) lacks a subledger operation`,
    );
  }
  for (const match of cycleText.matchAll(/\bCALLBACK\(([^()\s,+*]+)\)/g)) {
    assert.ok(
      unit.operations.some((operation) =>
        operation.op === 'runtime.callback' && operation.target === match[1]),
      `${unit.unit}: cycle expression CALLBACK(${match[1]}) lacks a callback operation`,
    );
  }
  for (const match of cycleText.matchAll(/\bC\(([^()\s,+*]+)\)/g)) {
    assert.ok(
      unit.operations.some((operation) => operation.op === match[1]),
      `${unit.unit}: cycle expression C(${match[1]}) lacks a bound operation`,
    );
  }
}

function gitBlobSha(source) {
  return createHash('sha1')
    .update(`blob ${Buffer.byteLength(source)}\0`)
    .update(source)
    .digest('hex');
}

const decomposedSources = new Set(
  addonCycleLedger.units
    .filter((unit) => unit.status === 'decomposed')
    .map((unit) => unit.source),
);
for (const source of decomposedSources) {
  const expected = addonCycleLedger.decomposedSourceBlobs?.[source];
  assert.match(expected ?? '', /^[0-9a-f]{40}$/, `${source}: missing decomposed source blob guard`);
  assert.equal(
    gitBlobSha(readFileSync(source, 'utf8')),
    expected,
    `${source}: decomposed source changed without refreshing its cycle ledger`,
  );
}
for (const source of Object.keys(addonCycleLedger.decomposedSourceBlobs ?? {})) {
  assert.ok(decomposedSources.has(source), `${source}: stale decomposed source blob guard`);
}

const declaredAddonUnits = new Set();
for (const name of readdirSync('addons').filter((name) => name.endsWith('.mjs'))) {
  const path = `addons/${name}`;
  const source = readFileSync(path, 'utf8');
  for (const match of source.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    declaredAddonUnits.add(`${path}#${match[1]}`);
  }
  for (const match of source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) {
    declaredAddonUnits.add(`${path}#${match[1]}`);
  }
}
declaredAddonUnits.add('addons/rba-connect4-managed-worker.mjs#<module-main>');
declaredAddonUnits.add('addons/rba-connect4-managed-manager.mjs#<module-main>');

for (const unit of declaredAddonUnits) {
  assert.ok(addonUnits.has(unit), `add-on function/module missing cycle ledger: ${unit}`);
}
assert.equal(
  addonCycleLedger.summary.units,
  addonCycleLedger.units.length,
  'add-on cycle-ledger summary unit count mismatch',
);
assert.equal(
  addonCycleLedger.summary.missing,
  0,
  'add-on cycle-ledger summary reports missing units',
);

const managedDetailedSources = new Set([
  'addons/rba-connect4-managed-host.mjs',
  'addons/rba-connect4-managed-worker.mjs',
  'addons/rba-connect4-managed-manager.mjs',
]);
for (const unit of addonCycleLedger.units) {
  if (managedDetailedSources.has(unit.source)) {
    assert.equal(unit.status, 'decomposed', `${unit.unit}: managed runtime may not use legacy symbolic fallback`);
  }
}

console.log(
  `JSMinSys catalog verified: ${functions.functions.length} sealed functions + ${addonCycleLedger.units.length} add-on units cycle-ledgered, ` +
  `${coverage.summary.complete}/${coverage.summary.catalogBlocks} blocks complete, ` +
  `${functions.deferred.length} deferred function(s).`,
);
