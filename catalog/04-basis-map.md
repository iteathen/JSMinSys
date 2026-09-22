# Provisional minimal-basis map — v0

This file is deliberately provisional. It does **not** define the final JSMinSys instruction set.

The purpose is to map the Connect4 workload onto the smallest useful computational vocabulary and expose where additional operations actually reduce physical cost.

## 1. Universal-computation floor

Turing completeness is a conceptual lower-bound tool, not the performance target.

A register-machine style universal core can be described in terms of:

- mutable state
- read/write
- increment/decrement-like state transformation
- zero/nonzero test with conditional branch
- unbounded repetition/memory in the theoretical model

Real Connect4 is finite, so JSMinSys does not need literal mathematical unboundedness. The important lesson is that multiplication, division, modulo, hashing, collections, objects, and solver abstractions are not required for computational sufficiency.

## 2. Provisional JSMinSys symbol classes

### Memory

- `LD32` — load one 32-bit lane
- `ST32` — store one 32-bit lane
- `CONST32` — materialize/use a fixed 32-bit constant
- `ADDR` — fixed/indexed address calculation

These may not become exposed library calls; they are accounting symbols for the physical work.

### Control

- `TESTZ` / `TESTNZ`
- `BRANCH`
- `JUMP`

Calls/returns/loops are expected to lower into combinations of control and state and should not automatically become hot primitives.

### Candidate value transforms

Current high-value candidates:

- `ADD32`
- `AND32`
- `OR32`
- `XOR32`
- `SHL32`
- `SHR32` / `USHR32`

Operations are admitted because of workload cost, not because they are needed for logical completeness.

### Candidate comparison transforms

- `EQ32`
- `LT32` / ordered compare only where required

A comparison that feeds a branch may be cheaper as a fused compare/test/branch shape than as a separately materialized Boolean value.

### Candidate specialized transforms

- `CLZ32`
- `IMUL32`

These must justify themselves through assembly/cost qualification.

### Explicitly outside the initial basis

- BigInt
- arbitrary precision
- floating-point math as a solver representation requirement
- division
- modulo
- exponentiation
- generic allocation
- generic collections
- general sorting
- atomics
- strings
- object graphs

Any may be reconsidered only under evidence.

## 3. Block → symbol map

| Recurring block | Provisional lowering | Missing capability pressure |
|---|---|---|
| bit test | LD32 + AND32 + TESTNZ | none |
| set bit | LD32 + OR32 + ST32 | OR32 may be synthesized but likely cheaper native |
| clear bit | LD32 + AND32 + precomputed inverse mask + ST32 | runtime NOT may be avoidable |
| toggle bit | LD32 + XOR32 + ST32 | none |
| multiword AND/OR/XOR | repeated lane-local op | favors fixed 32-bit composition |
| zero across words | OR32 chain + TESTZ | could compare lanes separately |
| equality across words | XOR32/OR32 + TESTZ, or EQ32 chain | choose cheaper emitted shape |
| first set bit | AND/negate + CLZ32 or shift/test loop | CLZ32 candidate |
| popcount | shifts + masks + ADD32 + optional IMUL32 | candidate block, not primitive yet |
| subset/implication | AND32 + inverse mask + TESTZ | representation may precompute inverse |
| cell membership | AND32 + TESTNZ | none |
| legal/landing cell | loads + masks/shifts + tests | representation should reduce decoding |
| row/column decode | historically DIV/MOD/FLOOR | redesign target, not primitive demand |
| winning-line test | AND32 + EQ/TEST | precomputed line mask |
| directional win test | SHIFT + AND chains | depends on board geometry |
| apply state | LD/ST + masks + ADD/branch as needed | representation-sensitive |
| undo state | reverse stores/history loads | representation-sensitive |
| hash mix32 | XOR + shifts + IMUL32 | challenge against direct index |
| power-of-two index | AND32 with mask | cold sizing excluded |
| TT probe | index + LD + compare + conditional LD | memory/cache dominates |
| TT replace | ST32 lanes | tolerate overwrite first |
| canonical reflection | shifts/masks/loads + compare | only if search reduction pays |
| residual transition | indexed LD32 | excellent representation-driven block |
| fixed candidate selection | LD + compare/test + branch | avoid general sort |
| alpha-beta update | compare + branch + value transform | WDL encoding may simplify |
| atomic claim | atomic load/CAS/etc. | strategy-specific, outside base |
| queue protocol | atomics + memory + control | architectural deletion target |

## 4. Operator admission test

A candidate operation is not admitted because it is common or convenient.

For operation `P`:

1. **Can the need disappear?**
   - representation change
   - precomputation
   - control-state implication
   - reuse of an already-present bit/index/range
   - tolerate the fault / do nothing

2. **Can the current basis express it cheaply enough?**
   - if yes, add nothing.

3. **Does native `P` collapse materially more physical work than it costs?**
   - instruction count
   - latency
   - reciprocal throughput
   - dependency depth
   - loads/stores
   - cache lines
   - branch behavior

4. **Does admitting `P` create new semantic machinery?**
   - if yes, count that cost too.

5. **Can `P` replace or delete another admitted primitive/block?**
   - admission should favor vocabulary contraction.

## 5. Current pressure ordering

Based on the Connect4 corpus, the next derivation work should test this progression:

```text
MEMORY + CONTROL
        |
        v
      ADD32
        |
        v
      AND32
        |
        v
  SHIFT capability
        |
        v
   OR32 / XOR32
        |
        v
 comparison forms
        |
        v
 CLZ32 / IMUL32 only if blocks justify them
```

This ordering is a research sequence, not a conclusion.

At every step, re-run the block catalog and ask whether the enlarged basis makes another operation unnecessary.

## 6. Representation loop

The derivation is intentionally cyclic:

```text
representation
    ↓
minimal basis
    ↓
attempt workload lowering
    ↓
find expensive or impossible block
    ↓
do nothing / lazy handling / exploit structure
    ↓
if still necessary: redesign representation
    └───────────────────────────────↺
```

Only after the representation loop fails should the primitive vocabulary grow.

## 7. Cost objective

The optimization target is not minimum operator count.

For basis `S` and workload `W`, minimize approximately:

```text
total cost(S, W)
  = executed µops
  + dependency cost
  + memory traffic
  + cache/coherence cost
  + branch cost
  + JIT/runtime overhead that survives optimization
```

subject to exact application semantics.

A larger vocabulary can be more minimal physically if it replaces many operations with a single cheap native instruction.

## 8. Immediate research questions

- Does `OR32` deserve first-class admission rather than synthesis from AND/XOR?
- Do we need signed right shift at all, or only unsigned transport?
- Can ordered comparisons be reduced to zero/equality tests through representation?
- Can subtraction disappear from WDL-oriented hot paths?
- Can multiplication be isolated to hashing/cold paths and then removed by direct addressing?
- Can all division/modulo/floor in hot code disappear through coordinate/layout redesign?
- Does `Math.clz32` earn a primitive slot, or should first-set-bit be a qualified block?
- Can multiword values be arranged so cross-word shifts and carry propagation are rare or absent?
- Which shared-worker blocks should be deleted by tolerating duplicate work rather than optimized?
