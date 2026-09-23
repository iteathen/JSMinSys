# JSMinSys Core Specification — Draft 0.1

**Status:** experimental first draft  
**Scope:** restricted minimal-cost execution substrate for high-performance JavaScript systems  
**Cost authority:** NEES Draft 0.5 quantified execution-cost accounting  
**Initial proving workload:** Connect4 solver corpus

## 1. Purpose

JSMinSys defines a restricted computational substrate for building performance-critical JavaScript systems from a deliberately small, explicitly admitted set of data representations, operations, and reusable blocks.

Its primary objective is:

> Express the required semantics using the least total realizable machine cost, while making avoidable high-cost implementation patterns difficult or impossible to express.

JSMinSys is not a general JavaScript style guide, convenience library, application framework, or claim that fewer source constructs are always faster.

It is an execution discipline and enforcement target.

The system is designed for environments where unrestricted implementation freedom creates recurring performance failures such as:

- unnecessary abstractions;
- duplicated state;
- avoidable synchronization;
- collision-recovery machinery whose prevention cost exceeds the fault cost;
- repeated derivation of facts already implied by representation;
- unnecessary memory movement;
- cache-hostile layouts;
- premature widening of numeric representation;
- expensive general-purpose structures replacing cheap fixed-domain operations.

JSMinSys therefore begins from a minimal computational basis and admits additional capabilities only when their total physical cost is justified.

## 2. Relationship to NEES

JSMinSys depends on NEES for general execution-cost reasoning.

NEES owns:

- quantified cycle-cost accounting;
- runtime and CPU cost profiles;
- generated-code qualification rules;
- cache, branch, atomic, and blocking-cost treatment;
- governing optimization units;
- total-machine-cost reasoning;
- causal qualification;
- evidence and falsification discipline.

JSMinSys owns:

- the admissible operation vocabulary;
- the admissible data and storage vocabulary;
- composition rules;
- restricted execution boundaries;
- higher-level block admission;
- representation constraints;
- enforcement that prevents escape into unapproved hot-path mechanisms.

JSMinSys MUST NOT maintain a conflicting independent cycle-cost authority.

A JSMinSys operation SHOULD reference a NEES cost-profile operation or a JSMinSys-local extension conforming to the NEES cost-model contract.

## 3. Normative language

The words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, and MAY are normative.

A rule marked **EXPERIMENTAL** is provisional and may be revised as assembly inspection, runtime qualification, or workload evidence improves.

## 4. Governing optimization order

When a problem or performance fault appears, JSMinSys requires the following order of consideration.

### JMS-CORE-001 — Representation first

Before implementation, choose or redesign representation so that required relations are cheap to expose.

The representation SHOULD maximize useful implication density:

- one stored fact SHOULD satisfy multiple semantic obligations when possible;
- important relations SHOULD be extractable through the cheapest available operations;
- hot information SHOULD remain compact and local;
- independent storage of derivable facts SHOULD be avoided.

The representation is not fixed permanently. Repeated difficulty in later steps is evidence that the representation may be wrong.

### JMS-CORE-002 — Do nothing first

When an undesirable event occurs, first determine whether any response is necessary.

If the event can only cause bounded extra work, a missed optimization, a stale hint, a false miss, harmless overwrite, duplicate speculative work, or another performance-only fault, the preferred response MAY be no response.

An internal imperfection does not create an automatic repair obligation.

### JMS-CORE-003 — Use the laziest workable response

If action is necessary, use the least eager response that preserves required semantics.

Prefer:

- deferred repair;
- recomputation on actual demand;
- overwrite;
- drop;
- ignore-until-needed;
- bounded fallback;
- local retry only when necessary;

over maintaining a continuously perfect invariant.

### JMS-CORE-004 — Exploit existing structure

Before adding state or a mechanism, search the entire existing physical state for an already-available implication.

Potential information carriers include:

- bit position;
- word position;
- index;
- parity;
- sign;
- range;
- ordering;
- lifetime;
- execution path;
- control-flow position;
- previously loaded state;
- address relationship;
- transition identity.

Conceptual subsystem boundaries MUST NOT prevent reuse of an already-available physical fact.

### JMS-CORE-005 — Redesign before machinery

If doing nothing, lazy handling, and structural reuse are insufficient, reconsider the representation.

A redesign SHOULD make future required behavior:

- easier to ignore safely;
- easier to handle lazily;
- easier to derive from existing state;
- cheaper to access;
- less synchronized;
- more cache-local;
- more word-local.

### JMS-CORE-006 — Add machinery only under extreme pressure

New recurring state, synchronization, metadata, managers, queues, recovery protocols, or generalized abstractions are the last resort.

A new mechanism MUST have a demonstrated required semantic role or lower total machine cost than the simpler alternatives.

## 5. Minimal-computation principle

JSMinSys derives its vocabulary from a computationally sufficient floor rather than from the ordinary JavaScript language surface.

Turing completeness is used as a lower-bound reasoning tool:

> A capability is not admitted merely because conventional programs usually have it.

The actual JSMinSys basis is optimized for physical cost, not for the minimum number of operator names.

An operation MAY be admitted even when logically derivable from other operations when the native operation materially reduces total machine work.

Example:

- OR can be synthesized from AND/XOR;
- native OR may still be admitted because one cheap operation is preferable to several.

## 6. Admission classes

Every JSMinSys operation or block has one of these statuses:

- **ADMISSIBLE** — legal inside the declared JSMinSys scope;
- **PREFERRED** — currently favored for a specific purpose/profile;
- **DERIVED** — legal as composition but not a distinct primitive capability;
- **COLD-ONLY** — permitted outside the restricted hot substrate;
- **EXPERIMENTAL** — legal only under an explicit qualification record;
- **DISALLOWED** — cannot appear inside the declared restricted scope.

Admissibility does not imply equal cost.

## 7. Cost-model requirement

### JMS-COST-001 — Every admitted emission has a cost model

Every ADMISSIBLE hot-path emission MUST map to a NEES-compatible cycle-cost model.

Permitted model forms are:

- fixed;
- range;
- symbolic/parameterized;
- unbounded.

Unknown cost MUST remain explicit. It MUST NOT silently become zero.

### JMS-COST-002 — Cost is profile-bound

The cost model MUST identify the applicable NEES runtime/CPU profile.

A cost measured or derived for one CPU microarchitecture MUST NOT be transplanted to another as if universal.

### JMS-COST-003 — Source syntax is not machine authority

A JavaScript operator MAY map to a candidate machine operation, but the mapping is not authoritative until qualified when load-bearing.

Generated-code inspection or equivalent runtime evidence SHOULD be used for hot primitives whose exact lowering affects admission or preference.

### JMS-COST-004 — Total physical cost outranks operator count

The optimization target includes, as applicable:

- latency;
- reciprocal throughput;
- executed µops;
- dependency depth;
- loads and stores;
- cache locality;
- cache-line count;
- branch prediction;
- allocation;
- conversions;
- runtime guards;
- synchronization;
- coherence;
- blocking;
- code-size/JIT effects.

A larger primitive vocabulary MAY be preferable when it reduces total machine cost.

## 8. Default numeric domain

### JMS-DATA-001 — uint32 is the default hot word

The default hot numerical lane is unsigned 32-bit state.

The preferred persistent storage representation is `Uint32Array` unless another admitted representation is better for the actual domain.

### JMS-DATA-002 — Widen by composition

When more than 32 logical bits are required, widen by composing additional 32-bit words.

Examples:

- 64 logical bits → 2 × uint32;
- 96 logical bits → 3 × uint32;
- 128 logical bits → 4 × uint32.

JSMinSys SHOULD NOT switch to BigInt merely because one word is insufficient.

### JMS-DATA-003 — Wide values need not emulate integers

A multiword logical value does not have to behave as one conventional wide integer.

Word boundaries SHOULD be chosen to keep common operations word-local.

Cross-word:

- carry;
- borrow;
- shift;
- compare;

SHOULD be introduced only when the real representation requires them.

### JMS-DATA-004 — BigInt hot-path exclusion

BigInt and BigInt-backed typed arrays are DISALLOWED in the hot substrate unless explicit contrary evidence demonstrates lower total machine cost under the selected profile.

Current excluded hot storage forms:

- `BigInt64Array`;
- `BigUint64Array`.

## 9. Admissible storage

The typed-array storage family is ADMISSIBLE.

Current preferred form:

- `Uint32Array`.

Other admitted typed-array forms remain use-qualified:

- `Int8Array`;
- `Uint8Array`;
- `Uint8ClampedArray`;
- `Int16Array`;
- `Uint16Array`;
- `Int32Array`;
- `Float32Array`;
- `Float64Array`.

Admissible backing memory:

- `ArrayBuffer`;
- `SharedArrayBuffer` when shared-memory execution itself is justified.

Typed storage is not automatically faster than ordinary JavaScript storage. It is admitted because fixed-width representation, compact layout, locality, and explicit memory structure can be load-bearing.

## 10. Initial admissible operation vocabulary

The current Draft 0.1 allow-list is provisional and machine-readable in `catalog/catalog-v0.json`.

### 10.1 Arithmetic

ADMISSIBLE:

- `+`
- `-`
- `*`
- `/`
- `%`
- `**`
- `++`
- `--`

Admission does not imply preference. Expensive operations such as division MAY remain optimization targets even while legal.

### 10.2 Bitwise

ADMISSIBLE:

- `&`
- `|`
- `^`
- `~`
- `<<`
- `>>`
- `>>>`

These are core candidates because they provide cheap projection, combination, difference, and bit-position transport over 32-bit words.

### 10.3 Comparison

ADMISSIBLE:

- `===`
- `!==`
- `<`
- `<=`
- `>`
- `>=`

A comparison consumed immediately by control SHOULD be costed using its emitted compare/test/branch shape rather than assuming a separately materialized Boolean.

### 10.4 Logical and selection

ADMISSIBLE:

- `!`
- `&&`
- `||`
- `?:`

Their cost is path-dependent and MUST preserve short-circuit behavior in accounting.

### 10.5 Assignment and update

ADMISSIBLE:

- `=`
- `+=`
- `-=`
- `*=`
- `&=`
- `|=`
- `^=`
- `<<=`

Compound assignment is normally DERIVED from load + transform + store unless the emitted form is cheaper.

### 10.6 Specialized numeric builtins

ADMISSIBLE:

- `Math.imul`
- `Math.clz32`
- `Math.floor`
- `Math.trunc`
- `Math.ceil`
- `Math.round`
- `Math.min`
- `Math.max`

A builtin is admitted because it may expose a useful runtime/native realization, not because all `Math.*` functions are acceptable.

### 10.7 Nullish, optional, and type/meta operators

ADMISSIBLE but generally not preferred in E0 unless justified:

- `??`
- `?.`
- `instanceof`
- `typeof`
- `void`

These are primarily compatibility/control/validation mechanisms.

### 10.8 Memory/control capability symbols

The cost model recognizes:

- `CONST32`
- `LD32`
- `ST32`
- `ADDR`
- `TESTZ`
- `TESTNZ`
- `BRANCH`
- `JUMP`

These are accounting capabilities and need not correspond one-to-one with public library calls.

### 10.9 Atomics

The following are ADMISSIBLE because real target systems may require them:

- `Atomics.load`
- `Atomics.store`
- `Atomics.compareExchange`
- `Atomics.exchange`
- `Atomics.add`
- `Atomics.sub`
- `Atomics.wait`
- `Atomics.notify`

They are not preferred merely because they are admitted.

Synchronization MUST be treated as a high-cost architectural mechanism whose cache/coherence/blocking effects are included in the cost model.

## 11. One-cycle admission rule

### JMS-OP-001 — Cheap native primitive default

A source-level operation whose qualified hot-path lowering is a single one-cycle native operation on a supported reference profile is presumptively ADMISSIBLE when:

- no hidden allocation materially changes the cost;
- no conversion materially changes the cost;
- no synchronization materially changes the cost;
- no exception machinery materially changes the path;
- no persistent deoptimization or generic fallback invalidates the assumed lowering.

The operation still requires a cost-model entry.

This rule is a convenience for admission, not a statement that every use of that operator costs exactly one wall-clock cycle.

## 12. Block layer

JSMinSys distinguishes primitive operations from reusable blocks.

A block is a recurring composition whose total physical realization has independent optimization value.

Initial block catalog includes:

- bit test;
- set bit;
- clear bit;
- toggle bit;
- fixed-width wordwise AND/OR/XOR;
- multiword zero/equality;
- first-set-bit;
- popcount;
- subset/implication;
- legal/landing-cell derivation;
- winning-line test;
- apply/undo transition;
- hash/mix;
- power-of-two table indexing;
- transposition-table probe/replace;
- canonical reflection;
- frontier/dominance tests;
- residual indexed transition;
- fixed candidate selection;
- atomic claim/release;
- shared queue operations.

A block MUST NOT become a primitive merely because it recurs.

Before admitting a block as a privileged operation, determine whether:

- representation can delete it;
- its components are already cheap enough;
- fusion reduces loads/stores/branches;
- it preserves values in registers;
- it materially improves code generation;
- it reduces cache traffic.

## 13. Higher-level abstractions

Higher-level application concepts are not automatically part of JSMinSys.

Examples from the proving corpus include:

- board state;
- legal moves;
- winning geometry;
- search;
- transposition tables;
- residual classes;
- frontier dominance;
- move ordering;
- worker ownership;
- queues;
- certificates.

JSMinSys attempts to lower these into the smallest existing block/primitive vocabulary.

If an abstraction requires many new primitives, first question the abstraction or representation before expanding JSMinSys.

## 14. Fault semantics

### JMS-FAULT-001 — Exactness is concentrated

The authoritative semantic result MUST remain correct.

Optimization structures MAY be lossy when their failure can only increase work rather than corrupt the authoritative result.

Examples of potentially tolerable faults:

- cache overwrite;
- false miss;
- stale performance hint;
- duplicate speculative work;
- lost advisory claim;
- dropped late optimization result.

### JMS-FAULT-002 — Cheapest failure mode

For any non-authoritative mechanism, ask:

> What is the cheapest possible failure mode?

If tolerating the fault costs less than preventing it, prevention SHOULD NOT be added.

### JMS-FAULT-003 — Lazy repair

Repair SHOULD occur only when damaged state becomes necessary.

Global cleanup, eager reconciliation, and continuous invariant maintenance are disfavored when local lazy recovery suffices.

## 15. Cache and memory discipline

### JMS-MEM-001 — Cache cost is part of operation cost

The cost of an operation includes memory behavior.

A representation or block MUST consider:

- bytes touched;
- cache lines touched;
- locality;
- dependent loads;
- stores;
- write ownership;
- cross-core coherence;
- working-set size.

### JMS-MEM-002 — Hot/cold separation

Cold metadata SHOULD NOT expand hot entries unless the additional bytes reduce greater total machine cost.

### JMS-MEM-003 — Recompute versus load

Cheap recomputation SHOULD be preferred over a memory access when the memory access has higher expected total cost.

A few ALU operations may be preferable to an unpredictable cache miss.

## 16. Restricted execution boundary

JSMinSys is intended to become enforceable.

A declared restricted hot scope MUST eventually be statically verifiable against:

- admitted syntax;
- admitted builtins;
- admitted data/storage forms;
- admitted calls;
- admitted blocks;
- transitive hot-path call graph.

Import restrictions alone are insufficient.

The enforcement system SHOULD reject:

- unapproved dynamic allocation;
- unapproved objects/collections;
- unapproved calls;
- unapproved synchronization;
- unapproved widening;
- hidden helpers that escape the cost model;
- calls whose transitive implementation leaves the admitted substrate.

## 17. No hidden machinery

An admitted primitive or block MUST disclose behavior that materially affects hot-path cost.

A primitive MUST NOT secretly introduce:

- allocation;
- hashing;
- object traversal;
- locks;
- atomics;
- retry loops;
- asynchronous scheduling;
- generic iteration;
- string conversion;
- widening;
- fallback to a materially different runtime path;

without that behavior being part of its cost/qualification record.

## 18. Function cost accounting

JSMinSys functions SHOULD be reducible to a NEES cycle ledger.

At minimum, reports SHOULD preserve:

- operation counts;
- selected NEES cost profile;
- fixed/ranged/symbolic/unbounded costs;
- hot-L1 scenario;
- hot-L2 scenario;
- branch assumptions;
- unresolved symbolic terms;
- blocking terms.

The additive ledger is a comparison instrument, not exact wall-clock proof.

Critical-path, throughput, and port-pressure analysis MAY later refine it.

## 19. Qualification

A JSMinSys implementation claim SHOULD preserve:

```text
JSMinSys spec version:
NEES version:
runtime profile:
cost profile:
restricted scope:
semantic owner:
admissible data forms:
admissible operations used:
admissible blocks used:
function cycle ledger:
generated-code evidence:
cache assumptions:
branch assumptions:
synchronization assumptions:
remaining symbolic/unbounded terms:
deviations:
```

## 20. Enforcement levels

Draft 0.1 defines three conceptual levels.

### JMS-CATALOG

The implementation uses the JSMinSys catalogs for analysis but is not syntactically restricted.

### JMS-RESTRICTED

The declared hot scope uses only admitted operations, data forms, and blocks.

### JMS-SEALED

The full transitive hot-path call graph is mechanically verified and cannot escape the admitted substrate without an explicit deviation.

JMS-SEALED is the intended long-term target for model-generated extreme-performance kernels.

## 21. Deviations

A hot-scope deviation MUST record:

```text
scope:
disallowed operation/mechanism:
required semantics:
why existing admissible structure is insufficient:
representation alternatives considered:
lazy/do-nothing alternatives considered:
new cost:
NEES cost profile:
expected benefit:
falsifier:
requalification trigger:
```

A deviation is not automatic permission to expand the global vocabulary.

## 22. Vocabulary growth

A request for a new primitive MUST pass this order:

1. Can the requirement disappear?
2. Can doing nothing preserve required semantics?
3. Can lazy behavior make it sufficient?
4. Can existing state/structure imply the result?
5. Can representation redesign remove the need?
6. Can the current primitive basis express it cheaply enough?
7. Does a new native primitive materially reduce total cost?
8. Can adding it delete or subsume another primitive/block?

Only then should global admission be considered.

## 23. Vocabulary contraction

Removing primitives is a first-class success criterion.

If representation redesign makes an admitted operation or block unnecessary, JSMinSys SHOULD remove or demote it when doing so does not increase total machine cost.

A smarter system may have a smaller executable vocabulary.

## 24. Initial proving workload

Connect4 is the initial proving workload because it contains:

- compact fixed-domain state;
- exact semantics;
- bitset-heavy computation;
- recursive search;
- memory-intensive memoization;
- multiword representations;
- concurrency experiments;
- frequent opportunities for structural fusion.

Connect4 concepts MUST NOT become general JSMinSys primitives solely because they appear in the proving corpus.

## 25. Non-goals

JSMinSys does not attempt to:

- replace JavaScript generally;
- create a general numeric library;
- reproduce arbitrary precision;
- ban every high-level feature everywhere;
- prove mathematical global optimality;
- guarantee one JavaScript source operator equals one machine instruction;
- make source code maximally readable;
- preserve conventional abstraction boundaries at the expense of machine cost;
- require every application subsystem to use the restricted hot substrate.

## 26. Draft 0.1 open questions

The first draft intentionally leaves these unresolved:

- exact final minimal primitive basis;
- whether signed right shift deserves independent admission;
- which comparison forms should be direct primitives versus fused control forms;
- which `Math.*` builtins remain useful after representation redesign;
- which blocks deserve privileged/fused implementations;
- how the static verifier will represent and validate transitive calls;
- how much code generation is preferable to handwritten restricted JavaScript;
- whether any hot scopes should lower through WebAssembly or native code;
- how NEES cost profiles will be consumed programmatically by JSMinSys;
- how cache working-set budgets become enforceable;
- how platform-specific vocabularies should coexist without fragmenting the specification.

## 27. Current authority

For Draft 0.1:

- this file defines the provisional normative intent;
- `catalog/catalog-v0.json` is the current machine-readable research catalog;
- `catalog/05-admissible-operations.md` records the current allow-list;
- `catalog/06-data-types.md` records current data/storage admission;
- NEES Draft 0.5 is the authority for quantified cost-accounting semantics.

Where prose and machine-readable research artifacts disagree, the discrepancy MUST be treated as draft debt and resolved explicitly before claiming JMS-SEALED conformance.
