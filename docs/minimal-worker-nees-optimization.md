# Minimal Lazy-SMP worker — NEES-EXTREME optimization record

**Status:** active optimization authority  
**Scope:** `addons/rba-connect4-lazy-smp-worker-minimal.mjs` and the directly coupled RBA/TT execution it invokes  
**NEES authority:** NEES Draft 0.5, NEES-EXTREME  
**Runtime profile:** `node26-v8-14.6`  
**Current worker source identity at baseline:** `ecca6a46a535c7209c83ea22f6422577aa12cea0`

This document is the durable first-adoption E0-E2 baseline audit and optimization-debt/disposition record required by NEES-EXTREME. Later coherent changes inherit this record and re-audit the affected causal neighborhood plus any invalidated assumptions.

## Semantic owner

The minimal worker must compute the exact finite-game W/D/L value and publish an optimal legal root move while preserving:

- Connect4 gravity, turn order, legality and first-win terminal semantics;
- RBA residual-coordinate semantics;
- the RBA neutral/gray-token quotient;
- reflection-canonical semantic cache identity;
- exact local/shared cache equality (hash is a locator only);
- worker cancellation/lifecycle behavior;
- the existing host result wire values and Lazy-SMP 2+ worker execution contract.

CPC, NDC, live-line evaluation, heuristic move scoring, restriction masks and interval semantics are intentionally outside this worker.

## Execution classes

### E0 — recurrence

`negamax()` is the E0 recurrence. Per visited node it currently includes:

- stop polling through `Atomics.load`;
- node accounting;
- depth-to-arena offset derivation;
- alpha/beta window classification;
- canonical-q hash and local/shared TT probe;
- legal-action scan in prepared center-distance order;
- RBA child cofactor construction;
- child reflection canonicalization;
- recursive Negamax and sign transport;
- alpha/beta update/cutoff;
- exact-TT publication when the node is globally exact.

### E1 — transition / probe work

The principal E1 mechanisms are:

- `connect4RbaCofactorKnownHeight`;
- `connect4RbaCanonicalize`;
- `mixSpan32Locator32`;
- local TT key equality and publication;
- sampled shared exact-cache probe/publication;
- compact 7x6 semantic key projection.

### E2 — coordination / publication

- winner publication through `CONTROL_WINNER`;
- done/wake publication;
- shared exact-cache atomic commit protocol.

The stop flag is E2 in semantic role but is read at E0 frequency and therefore remains in the E0 machine-cost inventory.

### E3/COLD

Worker construction, typed-array allocation, center-order construction, geometry/profile preparation, shared-cache attachment and final result materialization are outside the node recurrence. They remain relevant to short solves but are not to be mislabeled as E0.

## Governing optimization unit

For changes that affect recurrence, TT identity, canonicalization, move traversal or shared-cache behavior, the governing optimization unit is:

> one complete `runLazySmpConnect4Rba32(..., {workerMode:'minimal'})` exact solve with fixed geometry, worker count, cache capacities and sharing policy.

A single-worker helper or local microbenchmark is explanatory evidence only because worker races and the shared TT can change which worker wins and how much duplicated work is performed.

## Regression surface

Promotion must consider at least:

- 4x4 and standard 7x6 geometry;
- win, draw and loss positions;
- shallow/late and materially deeper search positions;
- 2-worker and 4-worker Lazy SMP;
- reflected and non-reflected roots;
- local/shared cache size and sharing-density changes;
- exact root move validity when several moves are W/D/L-equivalent;
- cancellation/timeout behavior;
- shared-cache contention and exact-only publication;
- Node 26 / V8 14.6-family behavior and code-size/JIT effects when a realization-specific method is load-bearing.

## Baseline development evidence

Same-runner GitHub Actions comparison on Node 26, four workers, 65,536-entry local/shared caches, 11 maintained 4x4/7x6 fixtures, five repeats each:

| Worker | Mean wall time | Winner nodes/run | Local TT hits/run | Shared hits/run | Shared stores/run |
| --- | ---: | ---: | ---: | ---: | ---: |
| legacy | 44.599 ms | 80.0 | 10.2 | 10.5 | 42.3 |
| minimal before child reflection canonicalization | 38.247 ms | 868.8 | 11.4 | 4.8 | 10.5 |
| minimal canonical-q baseline | 38.462 ms | 530.3 | 14.7 | 4.8 | 8.8 |

All 165 solves were exact with zero W/D/L disagreements. Restoring reflection canonicalization reduced the minimal worker's winner-node count by about 39% and increased local TT hits by about 29%, while short-fixture wall time was effectively flat. This qualifies reflection canonicalization as an **ENABLING/TRADEOFF** component of the cache-collapse composite, not removable overhead merely because it has local cost.

The maintained fixture set is short enough that worker startup materially affects wall time. It is therefore development evidence, not a claim about hard-position asymptotics. Harder-position governing-unit qualification remains required before promotion of a search-structure change.

## Cost-profile / ledger status

The source is covered by `catalog/addon-cycle-ledger-v0.json`, with unknown/unbounded recurrence preserved symbolically.

The NEES reference quantified CPU profile is `node26-v8-14.6/x86_64-amd-zen3`. GitHub-hosted runner microarchitecture is not pinned as Zen 3, so its cycle constants MUST NOT be presented as exact runner latency. The symbolic ledger is retained for operation accounting; governing-unit elapsed measurements remain authoritative for promotion.

## Initial candidate-cost inventory

| ID | Candidate cost | Causal role | Current disposition | Priority / next evidence |
| --- | --- | --- | --- | --- |
| MW-001 | Local TT stores only globally exact results; narrow-window alpha/beta information is discarded | STANDALONE with respect to CPC/NDC removal; coupled to search/TT | **UNVERIFIED-DEBT** | First experiment. Admit local lower/upper WDL bounds only; shared TT remains exact-only. Measure node reduction and full-solve cost. |
| MW-002 | Child reflection canonicalization on every nonterminal edge | ENABLING | **TRADEOFF / RETAIN** | Already demonstrated ~39% node reduction versus noncanonical q. Revisit only with a replacement preserving canonical collapse. |
| MW-003 | Canonicalization followed by a separate full q hash scan | COUPLED | **UNVERIFIED-DEBT** | Profile canonicalization branch distribution; investigate safe canonicalize+hash fusion without replacing early exits with larger unconditional scans. |
| MW-004 | `Atomics.load(CONTROL_STOP)` at every node | COUPLED to lifecycle/cancellation | **UNVERIFIED-DEBT** | Any reduced polling cadence must preserve bounded cancellation semantics and improve complete solve cost. |
| MW-005 | `nodes`, `cutoffs`, `cacheHits` metric updates inside E0 | STANDALONE unless diagnostics are product-required | **UNVERIFIED-DEBT** | Determine whether metrics can be initialization-selected or moved out without changing the public result contract. |
| MW-006 | Depth multiplications for key/basis arena offsets at every recursive node | STANDALONE | **UNVERIFIED-DEBT** | Consider carrying offsets directly after higher-leverage search/TT work. |
| MW-007 | Local semantic-key compare/copy traffic | COUPLED to exact identity | **UNVERIFIED-DEBT** | Preserve compact 7x6 identity; investigate only with full-key correctness and working-set evidence. |
| MW-008 | Shared exact-cache Atomics and coherence traffic | COUPLED composite | **TRADEOFF / UNVERIFIED-DEBT** | Sampling already exists. Requalify density on harder positions / worker-count surface before changing. |
| MW-009 | Center-order load + legality/height branch per action | REQUIRED/UNKNOWN | **REQUIRED pending stronger structural replacement** | Do not micro-rewrite without generated/runtime evidence. |
| MW-010 | RBA cofactor construction | REQUIRED semantic transition | **REQUIRED, internally optimizable** | Optimize in its own RBA causal unit only if worker-level total cost improves. |
| MW-011 | Recursive JS call/sign/window transport | REQUIRED/UNKNOWN | **UNVERIFIED-DEBT** | Consider only after higher-leverage subtree elimination and with current V8 evidence. |

No candidate above is declared known avoidable merely from local appearance.

## First coherent experiment — MW-001 local bound retention

### Mechanism

The game value domain is exactly `{-1,0,+1}`. Narrow-window alpha/beta nodes can establish useful local bounds even when they do not establish global q truth.

The experiment may retain:

- exact absolute W/D/L values locally and in the shared exact TT;
- a local-only lower bound of `>= 0`;
- a local-only upper bound of `<= 0`.

Opposite local bounds for the same semantic q imply exact draw and may be promoted to exact local/shared value `2`.

No bound may enter the shared exact cache unless it has become exact.

### Admission condition

Admit the experiment because narrow-window returns are currently discarded and repeated canonical q states are observed in the recurrence. If local bound reuse reduces repeated subtree work enough to lower complete minimal-worker solve cost, it is an admissible structural optimization.

### Falsifier

Reject or revise the experiment if any of the following occur:

- W/D/L or optimal-move correctness changes;
- a bound is consumed with the wrong mover/polarity semantics;
- a non-exact bound reaches the shared exact cache;
- node reduction does not occur on repeated-state controls;
- complete Lazy-SMP governing-unit time regresses across the qualified surface;
- extra TT key traffic/branching/JIT/code-size effects outweigh the removed search work.

### Stale-advice firewall

This experiment does not rely on claims that TypedArrays, branches, monomorphism, or fewer instructions are inherently faster. Its mechanism is structural: preserve already-proved search information to avoid re-solving equivalent canonical q states. Promotion depends on governing-unit measurement.

## Qualification boundary for the first optimization unit

The first coherent unit will not be promoted from node counts alone. Before closure it must include:

1. semantic/correctness suite and exact controls;
2. local-bound negative controls preventing shared non-exact publication;
3. NEES ledger update for additional TT tag/probe/store work;
4. same-runner old-minimal vs candidate governing-unit benchmark;
5. at least one materially harder search control where worker startup is not the dominant measured cost;
6. 2-worker and 4-worker checks;
7. updated debt/disposition table for MW-001 and any newly exposed costs.

