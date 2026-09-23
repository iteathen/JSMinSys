# JSMinSys Core Specification — Draft 0.2

**Status:** experimental draft  
**Type:** strict execution profile over NEES-EXTREME  
**Parent standard:** NEES Draft 0.5 or later compatible authority  
**Initial proving workload:** Connect4 solver corpus

## 1. Identity

JSMinSys is a strict execution profile built on NEES.

A declared JSMinSys restricted scope MUST conform to **NEES-EXTREME in full**.

JSMinSys does not redefine NEES optimization doctrine, cost accounting, evidence hierarchy, runtime qualification, governing optimization units, causal analysis, performance qualification, deviation semantics, or stale-advice rules.

JSMinSys adds a narrower execution universe:

- admitted data representations;
- admitted source operations and builtins;
- admitted reusable blocks;
- stricter representation rules;
- stricter fault-handling defaults;
- transitive enforcement that prevents hot-path escape into unapproved mechanisms.

The relationship is:

```text
NEES-EXTREME
    complete optimization / evidence / cost standard
            |
            v
JSMinSys
    stricter execution profile
    + representation restrictions
    + operation allow-list
    + block allow-list
    + mechanical enforcement
```

## 2. Inheritance and precedence

### JMS-NEES-001 — Full NEES adoption

All applicable NEES-EXTREME MUST and MUST NOT requirements apply to every JMS-RESTRICTED or JMS-SEALED scope.

A JSMinSys implementation MUST NOT claim conformance while ignoring an applicable NEES requirement merely because this specification does not repeat it.

### JMS-NEES-002 — Local rules may only narrow

JSMinSys MAY impose a stricter local rule than NEES.

It MUST NOT weaken NEES.

Examples:

- NEES may permit an Object when it is the best realization; JMS-SEALED may forbid Objects in its restricted scope.
- NEES may permit BigInt when justified; JSMinSys may prohibit it in the current hot profile.
- NEES may permit an unmodeled general mechanism outside a quantified ledger; JMS-SEALED may require every admitted emission to have a mapped NEES cost entry.

### JMS-NEES-003 — NEES owns machine-cost authority

NEES owns:

- operation/cycle cost profiles;
- generated-code qualification;
- cache and memory cost treatment;
- branch cost treatment;
- Atomics/coherence/blocking treatment;
- runtime and CPU profiles;
- total-machine-cost accounting;
- critical-path and governing-unit interpretation.

JSMinSys MUST consume NEES cost data rather than maintain a conflicting independent cost authority.

Any JSMinSys-local cost extension MUST conform to the NEES cost-model contract and remain subordinate to NEES evidence rules.

### JMS-NEES-004 — Parent-standard revision review

A new NEES authority does not automatically invalidate JSMinSys.

However, if NEES changes a rule or profile on which a JSMinSys restriction depends, the affected JSMinSys rule, operation, block, or cost mapping MUST be reviewed.

## 3. Purpose

JSMinSys exists to make avoidable high-cost implementation patterns difficult or impossible to express inside a declared hot scope.

Its objective is:

> Preserve required semantics while expressing the hot computation through the smallest practically useful, explicitly costed execution vocabulary.

JSMinSys is not:

- a general JavaScript style guide;
- a replacement for NEES;
- a general numerical library;
- a claim that fewer source constructs always mean fewer cycles;
- a requirement that an entire application use the restricted substrate.

## 4. JSMinSys-specific optimization hierarchy

NEES remains the governing optimization standard. JSMinSys adds the following stricter design order when constructing or repairing its restricted substrate.

### JMS-CORE-001 — Representation first

Design or redesign the representation before building mechanisms around it.

The representation SHOULD make required relations cheap to expose and SHOULD maximize implication density: one physical fact should satisfy multiple semantic obligations when possible.

### JMS-CORE-002 — Do nothing first

When an undesirable internal condition occurs, first determine whether it needs any response.

If the condition can only cause bounded additional work or a missed optimization without corrupting authoritative semantics, doing nothing is the preferred first option.

Examples may include:

- cache overwrite;
- false miss;
- stale hint;
- duplicate speculative work;
- dropped advisory state;
- harmless collision.

### JMS-CORE-003 — Use the laziest workable response

If doing nothing is insufficient, use the least eager intervention that preserves required semantics.

Prefer on-demand repair, overwrite, drop, recomputation, bounded fallback, or late recovery over continuously maintaining a perfect invariant.

### JMS-CORE-004 — Exploit existing structure

Before adding state or machinery, search existing physical and execution state for an already-available implication.

Eligible information carriers include:

- bits;
- word positions;
- indices;
- parity;
- sign;
- ranges;
- ordering;
- lifetime;
- execution path;
- control-flow position;
- already-loaded state;
- transition identity.

Conceptual ownership boundaries MUST NOT block reuse of a physical fact already available to the restricted computation.

### JMS-CORE-005 — Redesign before adding machinery

If the current representation makes JMS-CORE-002 through JMS-CORE-004 difficult, redesign the representation before adding recurring mechanisms.

### JMS-CORE-006 — Machinery last

New recurring metadata, managers, queues, synchronization protocols, repair systems, or generalized abstractions are last-resort additions.

Their admission MUST satisfy NEES total-machine-cost and governing-optimization-unit requirements.

## 5. Minimal-computation principle

JSMinSys derives its execution vocabulary from a computationally sufficient floor rather than from the ordinary JavaScript language surface.

Turing completeness is a lower-bound reasoning tool, not the optimization objective.

The actual objective is the **minimum total physical cost of the target workload**.

Therefore an operation MAY be admitted even if logically derivable from smaller primitives when the native operation materially lowers cost.

Conversely, an ordinary JavaScript operator MAY remain disfavored or unused even when admissible.

## 6. Admission states

Every JSMinSys operation, data form, or block has one of these states:

- **ADMISSIBLE** — legal inside the declared restricted scope;
- **PREFERRED** — currently favored for a specific purpose/profile;
- **DERIVED** — legal as composition but not a distinct primitive capability;
- **COLD-ONLY** — permitted outside the restricted hot scope;
- **EXPERIMENTAL** — allowed only with explicit qualification;
- **DISALLOWED** — unavailable inside the restricted scope.

Admission does not imply preference or equal cost.

## 7. Data representation

### JMS-DATA-001 — uint32 default

Unsigned 32-bit words are the default hot numerical lane.

The current preferred persistent storage form is `Uint32Array`.

### JMS-DATA-002 — Wider values compose 32-bit words

When more than 32 logical bits are required, widen by adding 32-bit words.

Examples:

- 64 logical bits → 2 × uint32;
- 96 logical bits → 3 × uint32;
- 128 logical bits → 4 × uint32.

### JMS-DATA-003 — Multiword values are structural, not necessarily integers

A multiword value does not need to emulate one conventional wide integer.

Layouts SHOULD minimize:

- cross-word carries;
- cross-word shifts;
- cross-word comparisons;
- unnecessary lane access.

### JMS-DATA-004 — BigInt exclusion

BigInt, `BigInt64Array`, and `BigUint64Array` are DISALLOWED in the current hot substrate unless explicit NEES-qualified evidence establishes a lower-cost realization.

### JMS-DATA-005 — Typed storage

The TypedArray family is ADMISSIBLE storage.

Current admitted forms include:

- `Uint32Array`;
- `Int32Array`;
- `Uint16Array`;
- `Int16Array`;
- `Uint8Array`;
- `Int8Array`;
- `Uint8ClampedArray`;
- `Float32Array`;
- `Float64Array`.

Specific use remains subject to NEES representation and total-cost qualification.

`ArrayBuffer` is admissible backing storage.

`SharedArrayBuffer` is admissible only when shared-memory execution itself is justified.

### JMS-DATA-006 — Runtime-configured geometry

Board/application geometry MAY be selected at runtime during initialization.

Once selected, geometry is invariant for the lifetime of the configured execution instance, but JSMinSys hot mechanical functions MUST NOT assume one hard-coded board size unless the function is explicitly named and documented as a size-specific specialization.

Initialization SHOULD derive reusable scalar or table invariants such as:

- columns;
- cell count;
- last row;
- per-column support deltas;
- landing-cell initialization;
- coordinate lookup tables;
- reflection contribution tables;
- other representation-specific constants.

Hot functions MAY require those prepared values as preconditions rather than reconstructing them repeatedly.

A specialization for one configured geometry MAY exist as an alternative function, but it MUST NOT silently replace the general runtime-configured contract.

### JMS-DATA-007 — General path required for geometry-general capability

When JSMinSys or an add-on claims a capability for runtime-configured board/application geometry, at least one implementation path MUST derive all geometry-dependent widths, lane counts, candidate counts, and storage strides from initialization data.

A fixed-size specialization MAY coexist with that path, but it MUST be explicitly named or documented as specialized and MUST NOT be the only implementation offered for a geometry-general capability.

Proving-workload constants such as a particular board width, row count, cell count, winning-line count, residual-basis capacity, key width, or action count MUST NOT become hidden global limits.

The general path may reject configurations that exceed JavaScript/TypedArray/index representation limits, but such limits MUST be validated explicitly during initialization rather than encoded as an unrelated proving-workload dimension.

## 8. Operation vocabulary

The machine-readable operation authority is `catalog/catalog-v0.json`.

Draft 0.2 currently admits the following source-level families.

### Arithmetic

- `+`
- `-`
- `*`
- `/`
- `%`
- `**`
- `++`
- `--`

### Bitwise

- `&`
- `|`
- `^`
- `~`
- `<<`
- `>>`
- `>>>`

### Comparison

- `===`
- `!==`
- `<`
- `<=`
- `>`
- `>=`

### Logical / selection

- `!`
- `&&`
- `||`
- `?:`

### Assignment / update

- `=`
- `+=`
- `-=`
- `*=`
- `&=`
- `|=`
- `^=`
- `<<=`

### Specialized numeric builtins

- `Math.imul`
- `Math.clz32`
- `Math.floor`
- `Math.trunc`
- `Math.ceil`
- `Math.round`
- `Math.min`
- `Math.max`

### Nullish / optional / type-meta forms

- `??`
- `?.`
- `instanceof`
- `typeof`
- `void`

These are generally not preferred in E0 unless justified.

### Storage construction

- `Uint32Array.construct` — source realization: `new Uint32Array(length)`

This operation is admitted despite potentially high and variable cost because NEES provides an explicit parameterized cost model:

```text
TYPED_ARRAY_ALLOC_U32(length, typedArrayAllocationPath, pageState, gcState)
```

Generic `new` is not admitted by this rule.

### Atomics

- `Atomics.load`
- `Atomics.store`
- `Atomics.compareExchange`
- `Atomics.exchange`
- `Atomics.add`
- `Atomics.sub`
- `Atomics.wait`
- `Atomics.notify`

Admission does not imply that Atomics are cheap or desirable. NEES synchronization, coherence, and blocking rules apply in full.

## 9. Cost mapping

### JMS-COST-001 — Every admitted hot emission maps to NEES

Every ADMISSIBLE hot-path emission MUST map to a NEES cost-profile operation or a conforming local extension.

No admitted hot emission may be silently treated as zero-cost because its exact realization is unknown.

### JMS-COST-002 — One-cycle presumptive admission

A source-level operation whose qualified hot-path lowering is a single one-cycle native operation on the selected NEES CPU profile is presumptively admissible when no hidden allocation, conversion, synchronization, fallback, or deoptimization materially raises total cost.

This is an admission shortcut only.

NEES remains authoritative for:

- source-to-machine proof;
- latency vs throughput;
- cache effects;
- branches;
- dependency depth;
- governing-unit interpretation.

### JMS-COST-004 — Cost magnitude does not control admission

A high cycle cost is not, by itself, grounds for exclusion from JSMinSys.

An operation MAY be admitted when its cost can be represented faithfully under NEES as a fixed value, range, parameterized expression, or unbounded cost. The application author decides whether the operation is worth its cost.

JSMinSys SHOULD make expensive operations visibly expensive rather than hiding or prohibiting them solely because they are slow.

All admitted functions remain candidates for later cycle-cost reduction, but optimization MUST preserve semantics and follow NEES governing-unit qualification.

### JMS-COST-003 — Local duplicate cost catalogs are non-authoritative

Research artifacts in this repository may retain historical/local cost snapshots for provenance.

They MUST NOT override the selected NEES cost profile.

## 10. Block layer

A JSMinSys block is a recurring composition with independent optimization value.

The current research catalog includes blocks such as:

- bit test/set/clear/toggle;
- fixed-width wordwise logical operations;
- multiword zero/equality;
- first-set-bit;
- popcount;
- subset/implication;
- legal/landing-cell derivation;
- winning-line test;
- apply/undo transition;
- hash/mix;
- transposition-table probe/replace;
- canonical reflection;
- frontier/dominance tests;
- residual indexed transition;
- fixed candidate selection;
- atomic claim/release;
- shared queue operations.

A recurring block MUST NOT become privileged merely because it occurs frequently.

Its admission MUST satisfy NEES and should first test whether representation redesign, fusion, or existing primitives make a privileged block unnecessary.

## 11. Higher-level abstractions

Application concepts do not automatically become JSMinSys primitives.

The proving corpus contains concepts such as:

- board state;
- legal move generation;
- winning geometry;
- search;
- transposition tables;
- residual classes;
- frontiers;
- move ordering;
- worker ownership;
- queues;
- certificates.

JSMinSys lowers these concepts into admitted data, operations, and blocks.

If a proposed abstraction demands substantial vocabulary growth, first challenge the abstraction and representation.

## 12. Fault semantics

### JMS-FAULT-001 — Concentrate exactness

Authoritative application semantics MUST remain exact.

Optimization structures MAY be lossy when failure can only increase work or lose an optimization.

### JMS-FAULT-002 — Cheapest failure mode

For non-authoritative state, the preferred failure behavior is the cheapest behavior that preserves required semantics.

### JMS-FAULT-003 — Lazy repair

Repair SHOULD happen only when damaged or missing state becomes necessary.

Eager cleanup and continuous reconciliation are disfavored when lazy recovery is cheaper.

These rules do not weaken NEES semantic correctness requirements.

## 13. Restricted execution boundary

JSMinSys is intended to be mechanically enforceable.

A JMS-RESTRICTED or JMS-SEALED scope is checked against:

- admitted syntax;
- admitted data/storage forms;
- admitted builtins;
- admitted calls;
- admitted blocks;
- the transitive hot-path call graph.

Import restrictions alone are insufficient.

The enforcement system SHOULD reject:

- unapproved allocation;
- unapproved objects/collections;
- unapproved calls;
- unapproved synchronization;
- unapproved numeric widening;
- hidden helpers that escape the admitted substrate;
- transitive calls whose implementation leaves the sealed execution universe.

## 14. No hidden machinery

An admitted primitive or block MUST disclose any behavior that materially affects NEES cost accounting.

It MUST NOT secretly introduce hot:

- allocation;
- hashing;
- object traversal;
- synchronization;
- retry loops;
- asynchronous scheduling;
- generic iteration;
- string conversion;
- numeric widening;
- materially different fallback paths;

without that behavior being represented in its qualification/cost record.

## 15. Enforcement levels

### JMS-CATALOG

Uses JSMinSys catalogs for analysis but does not mechanically restrict execution.

NEES conformance is optional unless separately declared.

### JMS-RESTRICTED

The declared scope:

- conforms to NEES-EXTREME;
- uses only admitted JSMinSys data, operations, calls, and blocks;
- records deviations explicitly.

### JMS-SEALED

JMS-RESTRICTED plus mechanical verification of the complete transitive hot-path call graph.

No unapproved execution path may escape the admitted substrate without an explicit deviation.

JMS-SEALED is the intended target for generated extreme-performance kernels.

## 16. Conformance record

A JMS-RESTRICTED or JMS-SEALED claim MUST first satisfy the full NEES conformance record.

It then adds:

```text
JSMinSys version:
JSMinSys enforcement level:
restricted scope:
admissible data forms used:
admissible operations used:
admissible blocks used:
transitive call-graph status:
JSMinSys deviations:
```

Cycle ledgers, runtime profiles, cost profiles, generated-code evidence, causal roles, governing optimization units, and performance qualification remain NEES fields and SHOULD NOT be duplicated under separate JSMinSys semantics.

## 17. Deviations

A JSMinSys deviation supplements, and does not replace, any applicable NEES deviation.

A restriction deviation SHOULD record:

```text
scope:
disallowed operation/data/block/mechanism:
required semantics:
why existing JSMinSys vocabulary is insufficient:
do-nothing/lazy alternatives considered:
representation alternatives considered:
NEES cost/profile evidence:
expected benefit:
falsifier:
requalification trigger:
```

A local deviation does not automatically expand the global JSMinSys vocabulary.

## 18. Vocabulary growth

Before admitting a new global primitive, data form, or privileged block:

1. Can the requirement disappear?
2. Can doing nothing preserve required semantics?
3. Can lazy behavior suffice?
4. Can existing structure imply the result?
5. Can representation redesign remove the need?
6. Can the current vocabulary express it cheaply enough?
7. Does a new primitive materially reduce NEES total-machine cost?
8. Can it replace or delete an existing primitive/block?

Only then should global admission be considered.

## 19. Vocabulary contraction

Removing primitives, blocks, state, or mechanisms is a first-class success condition.

If a representation redesign makes an admitted construct unnecessary, JSMinSys SHOULD remove or demote it when NEES qualification shows no total-cost regression.

## 20. Initial proving workload

Connect4 is the first proving workload because it exercises:

- compact exact state;
- bitset-heavy computation;
- recursive search;
- memoization;
- multiword representation;
- shared-memory experiments;
- structural opportunities for fusion and elimination.

Connect4 concepts MUST NOT become global JSMinSys primitives solely because they appear in the proving corpus.

## 21. Non-goals

JSMinSys does not attempt to:

- replace JavaScript generally;
- replace NEES;
- create a general numeric library;
- reproduce arbitrary precision;
- prove mathematical global optimality;
- guarantee one JavaScript operator equals one native instruction;
- require every application subsystem to be sealed;
- preserve conventional abstraction boundaries when a lower-cost structure is available.

## 22. Draft 0.2 open questions

- exact final primitive basis;
- whether signed right shift remains independently useful;
- which comparison forms should remain source-level versus fused control forms;
- which current `Math.*` builtins survive representation redesign;
- which blocks deserve privileged/fused realizations;
- exact static-verifier representation;
- how transitive calls are sealed;
- whether code generation improves enforcement or lowering;
- how JSMinsis should consume NEES cost profiles programmatically;
- how cache working-set budgets become enforceable;
- how platform-specific vocabularies should coexist.

## 23. Authority

For Draft 0.2:

1. NEES-EXTREME is the parent optimization/conformance authority.
2. This file defines JSMinSys-specific restrictions and enforcement semantics.
3. `catalog/catalog-v0.json` is the machine-readable research/admission catalog.
4. `catalog/05-admissible-operations.md` records the current operation allow-list.
5. `catalog/06-data-types.md` records current data/storage admission.
6. NEES cost profiles are authoritative for quantified cycle accounting.

Where a local historical cost record conflicts with NEES, NEES wins.

Where this specification is stricter than NEES without weakening NEES, the JSMinSys restriction applies inside the declared JSMinSys scope.
