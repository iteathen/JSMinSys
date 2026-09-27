# IsoMax hot-loop next experiment

Status: planned only. Do not mutate the selected solver until the exact-head
baseline is frozen.

## Goal

Reduce the deep-worker hot-loop cycle cost by at least 50% without weakening
exact W/D/L, root witness, q identity, first-win semantics, or exact-cache
publication.

The current baseline/profile and historical research identify the cofactor family
as the first causal target. This plan deliberately does not repeat rejected
Lazy-SMP coordination, generic trusted-API, terminal-first, sparse/lazy mover,
or strict-superset adjacency experiments.

## Stage 0 — governing baseline

Use `experiments/isomax-hotloop-baseline`.

Primary kernel control:
- fixture: `353335714`;
- one evaluator;
- current CPC-only alpha-beta;
- 1M private exact cache;
- no shared cache;
- first cold solve measured with Windows QueryProcessCycleTime.

Secondary hot-sharing control:
- same evaluator/fixture;
- 1M private + 4M shared exact cache;
- full sharing;
- no peer workers.

Short control:
- official Fhourstones `45461667`.

Every candidate comparison must run baseline and candidate in the same GitHub job
with fresh processes and balanced order. Separate-job absolute timings are
descriptive only.

## Stage 1 — cofactor dense/C1 factorial

Current source contains C1 completed-upset absorption, but the earlier retained
PR33 dense-indexed specialization is no longer the active body. Test its
mechanisms separately while preserving C1.

Arms:

A. Current C1 baseline.

B. Dense-remove path:
   - direct `g.removeByCell` lookup for the standard prepared profile;
   - child basis and removed-image scratch produced without profile callback
     dispatch;
   - keep current C1 per-player absorption and generic fallback.

C. Dense-subset path:
   - retain current basis/removal path;
   - direct `g.subsetTable` row access for upset expansion;
   - keep current C1 per-player absorption and generic fallback.

D. Dense-remove + dense-subset:
   - composition of B and C;
   - this is the historical C2 intent, not a copy of the obsolete PR33 body;
   - C1 absorption remains load-bearing.

Do not introduce a runtime experiment switch into the hot loop. Each arm is a
clean committed source variant with its cycle-ledger update in the same commit.

### Stage-1 measurements

Primary: long local fixture.
- solve cycles;
- cycles/node;
- wall time;
- nodes, cofactors, CPC/cache metrics.

Secondary:
- short local fixture;
- selected six-deep/one-wide whole solve on completed controls after a kernel
  candidate survives the local screen.

Correctness before timing:
- full JSMinSys tests;
- catalog/cycle-ledger verification;
- geometry/hot-closure generators/audits;
- targeted cofactor differential controls across dense/sparse 4x4, 7x6 and
  configurable geometry;
- current C1 principal-upset regression;
- first-win and reflection controls.

Promotion screen:
- no semantic mismatch;
- no hidden search-work increase for a representation-only arm;
- reject an arm that merely shifts work to another owner;
- preserve every losing result and raw sample.

## Stage 2 — support-transition-plan reuse census

This is diagnostic only; its instrumentation is never timing evidence.

Hypothesis:
For standard 7x6, the geometric portion of a cofactor is determined by the
current support/heights plus the legal landing column. It does not depend on the
P0/P1 residual-coordinate contents. Therefore many different q states with the
same support may be redundantly rebuilding the same:

- removed parent-shape -> image mapping;
- child basis;
- child id -> child-index mapping;
- pair/triple/quad boundaries;
- potentially the child-basis upset spans needed by each surviving image.

Measure before implementing storage.

Use a measurement-only source hook/census to record:
- total nonterminal cofactor calls;
- unique support codes;
- unique legal `(support,column)` plan keys;
- calls per plan-key histogram;
- percent of calls occurring after the first occurrence of that plan key;
- rank distribution of reuse;
- child-basis-size distribution;
- number of unique image/upset plans.

For 7x6, support heights have 7 values in 0..6, so a base-7 support code fits
comfortably in uint32. A legal landing cell is derivable from support+column.
The census must still compare exact support fields; the compact code is a
diagnostic index, not q identity.

No timing result from the instrumented census is admissible.

## Decision after Stage 2

If support-plan reuse is low, stop. Do not add another cache.

If reuse is high, design a bounded prepared plan store whose payload contains
only support-derived geometry. It must never cache W/D/L, player residual
coordinates, CPC conclusions, or solved-position information.

The plan store must be evaluated against direct recomputation because historical
IsoMax evidence repeatedly shows that high reuse does not by itself justify an
extra lookup/storage layer.

## 50% target arithmetic

If the cofactor family accounts for roughly 65% of current worker CPU, reducing
only that family must remove about 77% of its cost to halve the whole loop:

    0.35 + 0.65*r <= 0.50
    r <= 0.23

Therefore the dense factorial is a first screen, not expected by itself to meet
the campaign goal. The support-plan census asks whether a structural reuse
mechanism exists with enough leverage to approach the required reduction.
