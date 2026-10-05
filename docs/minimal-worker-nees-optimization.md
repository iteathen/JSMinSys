# Minimal Lazy-SMP worker — NEES-EXTREME optimization record

**Status:** active optimization authority  
**Scope:** `addons/rba-connect4-lazy-smp-worker-minimal.mjs` and the directly coupled RBA/TT execution it invokes  
**NEES authority:** NEES Draft 0.5, NEES-EXTREME  
**Runtime profile:** `node26-v8-14.6`  
**Performance target:** exact empty-board standard 7x6 solve in **<= 10,000 ms** on the local Intel Core i5-12600K target  
**Hardware target authority:** `profiles/minimal-worker-i5-12600k-target.json`  
**Primitive-cycle policy:** every repeated E0/E1 primitive remains optimization debt until its role is required, its realization is cycle-qualified on the target, or a lower-cost replacement is costed out.  
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

At this document's original baseline, CPC, NDC, live-line evaluation, heuristic move scoring, restriction masks and interval semantics were outside this worker. Current owner-authorized localhost experiments and retained decisions are in `evidence/minimal-worker-localhost-20261004/OPTIMIZATION_CAMPAIGN.md`. That live campaign also owns the recovered actual memory/runtime configuration; the old target profile must not substitute for it. C07 retains mixed center/live policies; C10 separately tests a guarded win-only CPC certificate with no legacy NDC import.

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

The owner's primary <=10,000 ms goal uses the prepared-empty interval: all
workers, tables and position-independent geometry preparation are ready,
then the empty root is constructed and solved until the exact result is
observed. Position-dependent work after readiness is included. Initialization
and cleanup are separate secondary goals; their duration must not veto an
improvement in the primary solve interval. Record both boundaries explicitly.
Whole-operation process cycles include initialization and cleanup unless the
measurement actually isolates them; do not label them solve-only cycles or
subtract a nominal clock-rate estimate.

## Benchmark representativeness policy

The optimization target is **not** late-game or isolated fixture latency. It is the complete exact empty-board 7x6 solve. Benchmark authority therefore follows this hierarchy:

1. **Promotion authority — target hardware full solve.** The complete empty-board solve on the declared Intel Core i5-12600K target is the governing performance measurement. The <=10,000 ms goal is evaluated only here.
2. **Development authority — complete empty-board solve.** When a development host can complete the exact empty-board solve within practical limits, same-host before/after full-solve measurements outrank all fixture suites.
3. **Bulk-profile proxy — trace-derived early/mid search roots.** If full solves are too expensive for every development iteration, proxies MUST be sampled from the actual empty-board search and weighted by measured contribution to full-solve nodes/cycles/time. Early and midgame subtrees that dominate the solve are the intended proxy population.
4. **Regression-only fixtures — late/endgame/settled controls.** Small maintained 4x4 and late 7x6 positions remain valuable for correctness, W/D/L equivalence, cancellation, TT semantics, reflection, and pathological regressions. They MUST NOT by themselves authorize or reject an optimization intended for the empty-board 10-second target unless the changed mechanism is specifically dominant in those positions.

A benchmark set that is mostly worker startup, terminal closures, CPC-resolved legacy positions, or single-digit-node searches is **non-representative for performance promotion** of the minimal empty-board solver.

When development evidence conflicts, prefer the measurement whose execution profile most closely matches the actual empty-board solve. A local primitive win on late fixtures is subordinate to an opposite result on the full solve or on trace-weighted bulk-search proxies.

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

## Representative empty-board development baseline

A complete current-minimal empty-board 7x6 solve was attempted on the GitHub Node 26 development runner with:

- 4 minimal workers;
- 4,194,304-entry shared exact TT;
- 1,048,576-entry local TT per worker;
- full shared probing/publication policy;
- no structural opening shortcut;
- 600,000 ms solve deadline.

Result:

```text
status: TIMEOUT
wallMs: 600011.585147
rootWdl: unresolved
move: -1
sharedCacheHits: 3
sharedCacheStores: 49
sharedCacheStoreContention: 1
workersExited: 4
cleanup: true
```

This result is **not** target-hardware qualification: the runner CPU, OS and cache capacities differ from the declared i5 profile. It is nevertheless authoritative for development-benchmark representativeness: the real empty-board workload exceeds the late/endgame fixture durations by more than four orders of magnitude and does not complete within ten minutes under this runner-safe configuration.

Consequences:

1. millisecond late/endgame fixture averages MUST NOT be used as the primary evidence that an optimization advances the <=10 s empty-board target;
2. all previously retained primitive/search optimizations are **provisional for the empty-board performance objective** until target-i5 full-solve A/B or an admitted bulk-search proxy confirms them;
3. fixture regressions remain correctness/pathology evidence, but fixture wins do not establish full-solve wins;
4. development proxies must move toward early/mid search roots representing substantial unresolved subtrees, preferably selected from an instrumented empty-board search;
5. the sparse shared-exact activity observed in this timed-out run (3 hits / 49 stores) is a candidate structural signal, not yet a conclusion: it suggests the current full-window-only shared publication policy may provide little cross-worker reuse during the unresolved bulk search and therefore deserves representative profiling.

## Early bulk-search development control

The historical early search root after five center moves (`[3,3,3,3,3]`, human `44444`) was also tested with the current minimal worker on the GitHub Node 26 runner using the same 4-worker, 4,194,304 shared / 1,048,576 local TT development configuration.

Result:

```text
status: TIMEOUT
wallMs: 300012.162263
rootWdl: unresolved
sharedCacheHits: 2
sharedCacheStores: 46
sharedCacheStoreContention: 0
cleanup: true
workersExited: 4
```

This early-game control is materially closer to the target search regime than rank-24/endgame fixtures and still does not complete within five minutes on the development runner.

### Structural implication for optimization priority

The empty-board and rank-5 partial runs both show extremely sparse shared **exact** evidence during the unresolved bulk search:

- empty board / 600 s: 3 shared hits, 49 shared stores;
- rank-5 / 300 s: 2 shared hits, 46 shared stores.

The counters do not measure private local-TT activity and therefore do not by themselves prove a particular replacement. They do establish that the existing **shared exact-only channel is scarcely participating during the representative unresolved search interval**.

This promotes shared search-bound reuse to a first-class structural candidate. The local worker already proves globally valid canonical-q zero-threshold bounds (`>=0` / `<=0`) at high frequency; those facts are currently private. A concurrency-safe shared-bound design may reduce Lazy-SMP duplicate work far more than another isolated primitive rewrite.

Any shared-bound experiment must preserve exact semantic-key validation, mover polarity, concurrent publication safety, and the distinction between a bound and exact W/D/L. It must be qualified on empty-board / early-bulk workload, not late fixtures.

## Baseline development evidence

Same-runner GitHub Actions comparison on Node 26, four workers, 65,536-entry local/shared caches, 11 maintained 4x4/7x6 fixtures, five repeats each:

| Worker | Mean wall time | Winner nodes/run | Local TT hits/run | Shared hits/run | Shared stores/run |
| --- | ---: | ---: | ---: | ---: | ---: |
| legacy | 44.599 ms | 80.0 | 10.2 | 10.5 | 42.3 |
| minimal before child reflection canonicalization | 38.247 ms | 868.8 | 11.4 | 4.8 | 10.5 |
| minimal canonical-q baseline | 38.462 ms | 530.3 | 14.7 | 4.8 | 8.8 |

All 165 solves were exact with zero W/D/L disagreements. Restoring reflection canonicalization reduced the minimal worker's winner-node count by about 39% and increased local TT hits by about 29%, while short-fixture wall time was effectively flat. This qualifies reflection canonicalization as an **ENABLING/TRADEOFF** component of the cache-collapse composite, not removable overhead merely because it has local cost.

The maintained fixture set is short enough that worker startup materially affects wall time. It is retained only as regression/correctness evidence. Performance promotion for the 10-second target requires the complete empty-board solve or a trace-derived, bulk-weighted proxy from that solve.

## Cost-profile / ledger status

The source is covered by `catalog/addon-cycle-ledger-v0.json`, with unknown/unbounded recurrence preserved symbolically.

The NEES reference quantified CPU profile is `node26-v8-14.6/x86_64-amd-zen3`. GitHub-hosted runner microarchitecture is not pinned as Zen 3, so its cycle constants MUST NOT be presented as exact runner latency. The symbolic ledger is retained for operation accounting; governing-unit elapsed measurements remain authoritative for promotion.

## i5-12600K primitive-cycle discipline

The local Intel Core i5-12600K is the promotion hardware. The NEES Zen 3 reference cost profile is useful for vocabulary/accounting only and MUST NOT be used as authoritative cycle cost for this target.

The production qualification loop is:

1. run the complete empty-board solve with `tools/bench-minimal-i5.mjs`;
2. record wall time and `QueryProcessCycleTime` process cycles;
3. pin workers to the recorded P-core targets through `tools/worker-affinity-preload.mjs`;
4. use current generated/runtime evidence on the exact Node/V8 build when source-to-machine lowering matters;
5. reduce the highest-frequency/highest-cycle primitive or remove the structure that causes it;
6. re-measure the complete solve before promotion.

The explicit objective is **<=10 seconds**, not a proxy node count or local helper score.

### Primitive hot-path audit

Every primitive below is considered live optimization debt unless marked required/tradeoff:

| Primitive / mechanism | Frequency | Current status | Required next evidence |
| --- | --- | --- | --- |
| shared stop `Atomics.load` | every visited node | UNVERIFIED-DEBT | target generated code + cycle impact; test reduced polling only if cancellation/cleanup bound preserved |
| node/cutoff/cache-hit counter increments | node/cutoff/hit frequency | UNVERIFIED-DEBT | production path should not pay diagnostic cost unless contract requires it |
| key/basis arena offset arithmetic | every node | UNVERIFIED-DEBT | compare carried offsets vs derived offsets on i5 generated code |
| q hash mixing | every non-root node | UNVERIFIED-DEBT | qualify full-q vs compact-identity hash on standard 7x6 |
| local TT tag load | every non-root node | REQUIRED by current TT design | minimize representation/load count |
| local semantic-key compare | occupied local slot | REQUIRED/optimizable | verify 7x6 compact compare lowering and branch behavior |
| shared TT probe Atomics | admitted shared probes | COUPLED TRADEOFF | tune sharing only at full-solve boundary |
| local TT key publication | local stores | REQUIRED/optimizable | reduce copies/projection recomputation if possible |
| shared TT publication Atomics | shared exact stores | COUPLED | MW-001C currently targets redundant narrow-proof publication |
| legal height load/full-column branch | each action candidate | REQUIRED | generated-code audit; no speculative branchless rewrite without evidence |
| RBA cofactor transition | each searched action | REQUIRED semantic transition | optimize in coupled worker/RBA boundary |
| reflection support compare | each nonterminal child | ENABLING | retained unless replacement preserves canonical-cache collapse |
| reflection basis/coordinate permutation | reflected/symmetric candidates | ENABLING/optimizable | branch distribution + fused canonicalization candidates |
| q hash after canonicalization | each non-root node | COUPLED | investigate canonicalize/hash fusion |
| recursive call + alpha/beta sign transport | nonterminal action | REQUIRED/optimizable | current V8 call/inlining evidence |
| center-order load | each action | REQUIRED by chosen move policy | keep prepared; remove any redundant indexing arithmetic |
| worker-index narrow-share partition AND/compare | narrow exact store only | EXPERIMENTAL MW-001C | retain only if full-solve total cycles improve |
| result/metric publication | once per worker completion | E2/E3 | low priority but still accountable |

A primitive is not considered optimized merely because its source form is short. Actual target cycles and the enclosing solve remain authoritative.

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

## MW-001 development evidence — local bound retention

The first implementation retains local-only zero-threshold alpha/beta bounds using tags `4/5`. Opposite local bounds for the same canonical q currently promote the q to exact draw; non-exact bound tags are prohibited from the shared exact cache.

Correctness development checks are green, including a direct negative control that scans the shared cache and rejects any value above `3`.

Same-VM baseline-versus-candidate measurements with identical Node 26 setup, cache capacities and move inputs:

| Workers / control | Exact-only baseline | MW-001 candidate | Wall delta | Winner-node delta |
| --- | ---: | ---: | ---: | ---: |
| 2w 4x4 empty | 105.733 ms | 42.575 ms | -59.7% | -94.1% |
| 2w 7x6 A rank 24 | 40.445 ms | 38.157 ms | -5.7% | -59.6% |
| 2w 7x6 B late | 28.626 ms | 31.798 ms | **+11.1%** | +0.9% |
| 4w 4x4 empty | 184.866 ms | 59.067 ms | -68.0% | -94.3% |
| 4w 7x6 A rank 24 | 55.480 ms | 46.646 ms | -15.9% | -80.7% |
| 4w 7x6 B late | 40.855 ms | 42.403 ms | **+3.8%** | -28.5% |

Across these controls, the candidate remained exact with no W/D/L mismatch. Aggregate winner-node work fell about 93% for both 2-worker and 4-worker groups.

### Newly exposed coupled cost: shared draw promotion

MW-001 greatly increases useful local reuse, but the current opposite-bound merge path calls `storeExact(..., 2)`, which publishes the newly proved draw into the shared exact TT. On the 4-worker controls this increased mean shared stores approximately:

- 4x4 empty: 29 -> 3,220;
- 7x6 A rank 24: 18.7 -> 571.7;
- 7x6 B late: 9.7 -> 214.

This shared publication is semantically valid, but it is not automatically a favorable composite realization. It adds Atomics/coherence work and is a plausible explanation for the late-position regression where subtree elimination is small.

Treat this as **MW-001A**, causal role **COUPLED**, disposition **UNVERIFIED-DEBT**.

**Admission for refinement:** when opposite local bounds prove draw, retain exact draw in the worker-local TT but do not automatically publish that inferred draw to the shared TT. Ordinary globally exact search results remain shareable.

**Mechanism:** preserve the large within-worker subtree elimination while reducing cross-worker atomic publication/coherence traffic.

**Falsifier:** reject local-only draw promotion if the loss of cross-worker draw reuse increases complete solve time or duplicated nodes enough to outweigh the reduced shared publication traffic.

MW-001 is therefore strongly favorable development evidence but is **not yet closed/promoted**; MW-001A is part of the same coherent TT optimization unit.

## MW-001A broad qualification evidence

The local-only bound-derived draw variant was compared against the exact-only baseline across:

- 13 maintained/harder controls (4x4 empty, five maintained 4x4 fixtures, rank-24 7x6, and six maintained late 7x6 fixtures);
- 2-worker and 4-worker Lazy SMP;
- three same-VM repeats per control;
- identical Node 26 runtime, local/shared cache capacities and full-sharing policy.

Results:

| Worker count | Baseline mean | MW-001A mean | Wall delta | Winner-node delta |
| --- | ---: | ---: | ---: | ---: |
| 2 workers | 20.483 ms | 16.579 ms | **-19.1%** | **-90.7%** |
| 4 workers | 27.984 ms | 22.408 ms | **-19.9%** | **-90.3%** |

All 156 solves were exact with zero W/D/L disagreement.

Observed per-control regressions remain visible:

- 2w 7x6-C: +6.6% with only three searched nodes in both variants;
- 4w 7x6-C: +9.7% with only three searched nodes in both variants;
- 4w 7x6-B: +3.7% while winner-node work fell 26.3%;
- 4w 7x6-F: +2.5% on an approximately single-digit-node solve.

These are not erased as noise. They remain part of the regression surface until the coherent TT optimization is closed.

### MW-001B — narrow-window exact publication pressure

Even after bound-derived draw promotion became local-only, MW-001A still publishes many more shared exact entries than the baseline because narrow-window searches can prove domain-extreme values (`+1` or `-1`) exactly and currently send those exacts to the shared TT.

Across the broad matrix, shared-store counts are frequently one to two orders of magnitude above the exact-only baseline. That publication is semantically legal but creates additional Atomics/coherence traffic and is the leading remaining coupled cost inside MW-001.

**Causal role:** COUPLED to the local-bound search reduction and shared-TT composite.

**Disposition:** UNVERIFIED-DEBT; next experiment.

**Admission:** retain narrow-window extreme exact values in the worker-local TT, but reserve automatic shared publication for results whose caller requested the full W/D/L window. This preserves local subtree elimination while reducing cross-worker publication caused specifically by narrow-window proof reuse.

**Falsifier:** reject the refinement if loss of cross-worker extreme-value reuse increases complete solve time or duplicate search enough to outweigh lower shared publication/coherence cost on the 2w/4w qualification surface.

## MW-001B development evidence — narrow exacts local

MW-001B kept globally exact narrow-window results worker-local and reserved automatic shared publication for full W/D/L-window results.

Same-VM three-way development check (exact-only baseline vs MW-001A vs MW-001B), 2w/4w:

| Workers | Baseline mean | MW-001A mean | MW-001B mean | B vs A | B vs baseline |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 | 38.521 ms | 25.320 ms | 24.505 ms | **-3.2%** | **-36.4%** |
| 4 | 54.220 ms | 34.228 ms | 32.857 ms | **-4.0%** | **-39.4%** |

Mean shared stores fell:

- 2w: 728.1 -> 9.4 (**-98.7%**) from MW-001A to MW-001B;
- 4w: 959.2 -> 12.6 (**-98.7%**).

All 72 solves remained exact with no W/D/L disagreement.

This establishes that unconditional shared publication of narrow-window exacts was a known avoidable cost on the tested composite: it produced large atomic/coherence traffic without lowering the governing-unit mean.

However, MW-001B is **not yet promotable as the final sharing policy**. The targeted 4-worker 7x6-B control regressed about **19.4%** against the exact-only baseline even though the aggregate improved. This is evidence that some cross-worker narrow-proof reuse is load-bearing for at least one search shape.

### MW-001C — selective narrow-proof sharing

**Candidate cost:** the all-or-nothing choice between publishing every narrow-window exact and publishing none.

**Causal role:** COUPLED to Lazy-SMP diversification and shared-TT reuse.

**Disposition:** UNVERIFIED-DEBT; next experiment.

**Candidate mechanism:** retain every narrow-window exact locally, but admit a bounded deterministic subset to the shared exact TT (for example, a designated publisher worker or a separately qualified hash-sampling policy). Full-window exact publication remains unchanged.

**Admission:** MW-001A proves that narrow-proof sharing can reduce duplicated search, while MW-001B proves that sharing all such proofs creates excessive atomic/coherence work. A bounded selective policy is admitted only if it preserves the large local-bound subtree reduction while recovering the 4-worker regression without reintroducing the shared-store explosion.

**Falsifier:** reject any selector whose complete-solve performance fails to beat the better of MW-001A/MW-001B on the regression surface, or whose benefit depends only on a proxy counter rather than governing-unit elapsed cost.

## MW-001C disposition — partitioned narrow sharing rejected

A deterministic narrow-proof publisher partition was tested by reusing the existing q hash: for power-of-two worker counts, `hash & (workers-1)` selected the one worker eligible to publish a narrow-window exact.

On the four-worker target development surface, MW-001C was effectively flat versus MW-001B overall (**+0.6%**) while increasing mean shared stores from about 10.8 to 274.9 in the targeted set. It also regressed 4x4-empty by about 3.5% versus MW-001B. The added hot-path AND/compare/branch and renewed shared-TT/coherence traffic therefore did not establish a governing-unit win.

**Disposition:** COSTED-OUT / REJECTED for the current four-worker target.

The source has been returned to MW-001B: local zero-threshold bounds, local narrow-window exacts, and shared publication only for full-window exact results.

This does not prove that every future selective-sharing scheme is inferior; it proves that this specific hash-partition mechanism failed its admission test and must not remain in the production hot path.

## MW-005 — remove production E0 diagnostics

**Candidate cost:** `nodes`, `cutoffs`, and `cacheHits` were incremented inside the minimal worker recurrence only to populate diagnostic `winnerMetrics`.

**Causal role:** STANDALONE with respect to exact search semantics. The counters do not affect move legality, alpha/beta, TT identity, terminal results, publication or cancellation.

**Mechanism:** the production minimal worker no longer increments those counters, no longer constructs a metric-buffer view, and no longer performs the three completion metric stores. The host does not allocate the metric SharedArrayBuffer for `workerMode:'minimal'`; `winnerMetrics` is `null` for that mode. Legacy and Behavior/Root-Frontier modes are unchanged.

**Admission:** eliminate repeated non-semantic arithmetic/dependency chains from E0 and unnecessary shared allocation from the minimal governing unit.

**Falsifier:** revert if complete-solve wall time/process cycles on the i5 do not improve or if any caller is shown to require those diagnostics as semantics. Development node counts may be obtained from historical/instrumented revisions; they are not allowed to tax the production recurrence.

**Disposition:** ACTIVE EXPERIMENT pending same-VM development A/B and local i5 cycle qualification.

## MW-005 development evidence — metric-free production path

Same-VM Node 26 development A/B against the immediately previous metric-bearing MW-001B worker, six repeats per control:

| Workers | Baseline mean | Metric-free mean | Delta |
| --- | ---: | ---: | ---: |
| 2 | 21.923 ms | 21.755 ms | -0.8% |
| 4 | 29.320 ms | 28.840 ms | -1.6% |

The harder 4-worker 7x6 controls improved:

- rank-24 A: 27.915 -> 26.546 ms (**-4.9%**);
- B: 27.470 -> 25.928 ms (**-5.6%**).

The short 4x4-empty control regressed 2.7%, while 4x4-mid was flat. All 96 solves remained exact. The candidate returns `winnerMetrics:null` as intended.

**Development disposition:** RETAIN pending target-hardware qualification. The mechanism removes three repeated E0 dependency chains and a minimal-mode shared metric buffer; the target i5 process-cycle/full-solve measurement remains authoritative.

## MW-006 — carry arena offsets through the recurrence

**Candidate cost:** each visited node derived `src = depth * keyWords` and `basisOffset = depth * maxBasis`.

**Causal role:** STANDALONE arithmetic inside the recurrence, subject to V8 register/argument effects.

**Mechanism:** `negamax` now receives the already-known key/basis offsets from its parent and passes `dst`/`childBasis` directly to the child. This removes two depth-derived multiplications from every visited node.

**Admission:** parent execution already computes the exact child offsets, so re-deriving them from depth is duplicate work.

**Falsifier:** extra recurrence arguments may increase register pressure, stack traffic, call-frame cost, or inhibit optimization. Reject unless complete solve time/process cycles improve on the target; GitHub same-runner timing is development evidence only.

**Disposition:** ACTIVE EXPERIMENT.

## MW-006 development evidence — carried arena offsets

Same-VM Node 26 A/B against the metric-free depth-derived-offset baseline, eight repeats per control:

| Workers | Baseline mean | Carried-offset mean | Delta |
| --- | ---: | ---: | ---: |
| 2 | 23.068 ms | 22.101 ms | **-4.2%** |
| 4 | 34.193 ms | 33.022 ms | **-3.4%** |

The harder 7x6 controls improved approximately 7.7–8.4%. The 4-worker 4x4-empty control regressed 3.5%. All 96 solves remained exact.

**Development disposition:** RETAIN pending target i5 generated-code/process-cycle qualification. The source and ledger now remove the two depth-derived arena multiplications from E0.

## MW-006A — derive child depth once

**Candidate cost:** `depth + 1` was expressed separately at cofactor size publication, child basis-size lookup, and recursive call sites.

**Mechanism:** derive `childDepth` once on node entry and reuse it throughout the action loop.

**Causal role:** STANDALONE arithmetic expression; current V8 may already common the expression, so source reduction is not sufficient evidence.

**Falsifier:** cost out/revert if complete-solve timing or target generated code shows no reduction, or if added live range/register pressure offsets the saved arithmetic.

**Disposition:** ACTIVE EXPERIMENT.

## MW-006A disposition — child-depth hoist rejected

Ten-repeat same-VM development A/B showed:

- 2 workers: -1.5% aggregate;
- 4 workers: **+0.8% aggregate regression**;
- 4w rank-24 7x6: +0.7%;
- 4w 7x6-B: +2.0%.

All solves remained exact.

The four-worker production target did not establish an enclosing win. The explicit `childDepth` live range has therefore been removed and the source returned to the MW-006 form.

**Disposition:** COSTED-OUT / REJECTED. Do not reintroduce solely on the claim that fewer source additions must be faster.

## MW-012 — compact 7x6 locator hash

**Candidate cost:** every non-root standard-7x6 node used the generic `mixSpan32Locator32` over all 14 raw q words even though the exact cache already uses a qualified lossless eight-word compact semantic identity.

**Mechanism:** hash the same eight compact semantic fields with the same mixer, unrolled. This removes six mixer lanes and loop control from the standard-7x6 locator. General geometries retain the full-span hash.

**Semantic boundary:** the hash is a locator only. Cache equality remains authoritative and exact; collisions may change work but cannot change W/D/L.

**Admission:** the compact representation is already qualified as lossless for standard 7x6, so equal semantic q values necessarily produce equal compact locator inputs.

**Falsifier:** reject if compact field packing plus changed collision distribution outweighs the six removed mixer lanes at the complete-solve boundary. Target i5 cycles remain authoritative.

**Disposition:** ACTIVE EXPERIMENT.

## MW-012 disposition — compact locator rejected

Ten-repeat same-VM standard-7x6 A/B:

- 2 workers: -5.8% aggregate;
- **4 workers: +1.1% aggregate regression**;
- 4w rank-28 A: +5.2%;
- 4w B: +6.5%;
- 4w rank-24 A: -6.0%.

All 160 solves remained exact.

The production target is four workers on the local i5. The compact field packing/change in locator behavior did not establish a four-worker governing-unit win, despite six fewer mixer lanes.

**Disposition:** COSTED-OUT / REJECTED. Full-q `mixSpan32Locator32` is restored. Do not infer that fewer hash lanes are faster without accounting for identity packing and collision/locality effects.

## MW-004 — eliminate recursive stop polling

**Candidate cost:** one shared `Atomics.load(CONTROL_STOP)` executed on every visited node, plus `CANCELLED` sentinel propagation through recursive returns.

**Causal role:** previously treated as COUPLED to cancellation/lifecycle. Inspection of `ManagedThreadSession` shows the host already owns teardown: winner, timeout, and abort all reach `closeManagedThreadSession32`, which sets stop/wake and calls `worker.terminate()` for every worker before joining exits.

**Mechanism:** remove the per-node stop atomic and all `CANCELLED` propagation from the minimal worker. Timeout/abort semantics remain host-owned and are qualified directly.

**Admission:** worker-local cooperative polling is duplicate lifecycle machinery when the host forcibly terminates worker threads at the governing boundary.

**Falsifier:** reject if timeout/abort status, cleanup, or worker-exit guarantees regress; or if target complete-solve cost does not improve. A future persistent-worker execution model would cross the admission boundary and require requalification.

**Disposition:** ACTIVE EXPERIMENT.

## MW-004 full-elimination disposition — rejected

Ten-repeat same-VM development A/B for removing recursive stop polling entirely:

- 2 workers: -3.0% aggregate;
- **4 workers: +3.3% aggregate regression**;
- 4w 4x4 empty: +8.6%;
- 4w rank-24 7x6: +1.4%;
- 4w rank-28 A: -2.0%;
- 4w B: +3.5%.

All 160 solves remained exact and direct timeout/abort controls proved the host can terminate minimal workers without cooperative polling.

The semantic elimination is therefore valid but the four-worker performance admission failed on the development surface. The per-node stop atomic and cancellation sentinel are restored.

**Disposition:** full elimination COSTED-OUT / REJECTED for now. MW-004 remains UNVERIFIED-DEBT for cheaper sampled/depth-gated polling because the host-owned lifecycle proof still permits such experiments.

## MW-004A — depth-gated stop polling

**Mechanism:** replace the per-node stop atomic with `if (!(depth & 3) && Atomics.load(...))`. Every node pays one depth mask/branch; only depths divisible by four perform the shared atomic load.

**Admission:** full removal failed the four-worker development gate, but host-owned termination proves cooperative polling can be reduced without changing correctness. A depth gate preserves regular cancellation opportunities while reducing shared-memory traffic.

**Falsifier:** reject if the extra local mask/branch plus altered execution timing does not reduce four-worker complete-solve cost, or if timeout/abort/cleanup controls regress.

**Disposition:** ACTIVE EXPERIMENT.

## MW-004A development evidence — poll every fourth ply

Ten-repeat same-VM A/B against per-node cooperative polling:

| Workers | Per-node poll | Depth/4 poll | Delta |
| --- | ---: | ---: | ---: |
| 2 | 33.931 ms | 34.026 ms | +0.3% |
| 4 | 47.862 ms | 46.206 ms | **-3.5%** |

Four-worker 7x6 controls improved:

- rank-24 A: **-8.4%**;
- rank-28 A: **-5.4%**;
- B: **-4.5%**.

All 160 solves remained exact. Direct timeout/abort lifecycle controls remain part of CI.

**Development disposition:** RETAIN as the current cancellation baseline, pending local i5 process-cycle qualification.

## MW-004B disposition — poll every eighth ply rejected

Ten-repeat same-VM depth-4 versus depth-8 A/B:

- 2 workers: -0.6% aggregate;
- **4 workers: +3.4% aggregate regression**;
- 4w 4x4 empty: +3.4%;
- 4w rank-24 7x6: +5.8%;
- 4w rank-28 A: +3.5%;
- 4w B: +0.6%.

All 160 solves remained exact.

**Disposition:** COSTED-OUT / REJECTED. Depth-4 polling remains the current development optimum. Less frequent atomics did not imply lower total solve cost.

## MW-013 — prepare hot geometry scalars

**Candidate cost:** repeated hot reads of immutable geometry object fields (`columns`, `rows`, `keyWords`, `maxBasis`) in loop bounds, legality checks, arena offset increments and hashing.

**Mechanism:** copy those immutable fields into module-scope numeric scalar bindings during worker initialization and consume the scalars in E0.

**Causal role:** STANDALONE realization candidate. Modern V8 may already constant-fold/hoist the stable object fields.

**Admission:** the geometry object is immutable for the worker lifetime and the values are already validated before search.

**Falsifier:** reject if complete four-worker solve timing is flat/worse, indicating V8 already removes the property-read cost or scalar live ranges/code shape are inferior.

**Disposition:** ACTIVE EXPERIMENT.

## MW-013 disposition — prepared geometry scalars rejected

Ten-repeat same-VM A/B:

- 2 workers: -3.4% aggregate;
- **4 workers: +2.9% aggregate regression**;
- 4w 4x4 empty: +6.1%;
- 4w rank-24 7x6: +2.7%;
- 4w rank-28 A: +3.1%;
- 4w B: -1.3%.

All 160 solves remained exact.

**Disposition:** COSTED-OUT / REJECTED. Direct stable geometry field access is restored. The result is consistent with current V8 already optimizing these reads sufficiently; source-level scalarization is not a valid optimization claim here.

## MW-014 — player-relative local exact tags

**Candidate cost:** worker-local exact TT entries used the shared cache's absolute 1/2/3 W/D/L encoding. Every local exact hit therefore called absolute-to-relative conversion, and every narrow-window exact local store performed relative-to-absolute conversion even though the value never crossed the worker boundary.

**Mechanism:** local exact tags now encode `relative + 2` (loss=1, draw=2, win=3) for the side-to-move already contained in q identity. Local hits return `tag - 2` directly. Narrow exact stores write the relative tag directly. Shared hits convert absolute->relative exactly once when promoted locally; full-window shared publication converts relative->absolute at the shared boundary.

**Semantic boundary:** mover is part of the canonical q key, so a relative exact value is stable semantic truth for that local q. Shared cache/result wire semantics remain unchanged.

**Admission:** remove representation conversion from the dominant private-cache reuse path while preserving the existing external/shared representation.

**Falsifier:** reject if extra boundary logic/code shape outweighs the removed local conversions at the four-worker complete-solve boundary, or if any W/D/L/reflection/shared-cache correctness control changes.

**Disposition:** ACTIVE EXPERIMENT.

## MW-014 disposition — player-relative local exact tags rejected

Ten-repeat same-VM A/B:

- 2 workers: -0.2% aggregate;
- **4 workers: +1.6% aggregate regression**;
- 4w 4x4 empty: -1.8%;
- 4w rank-24 7x6: +2.8%;
- 4w rank-28 A: +2.4%;
- 4w B: +4.6%.

All 160 solves remained exact.

**Disposition:** COSTED-OUT / REJECTED. Worker-local exact tags are restored to the shared absolute 1/2/3 encoding. Removing conversion calls did not lower four-worker total cost.

## Qualification boundary for the first optimization unit

The first coherent unit will not be promoted from node counts alone. Before closure it must include:

1. semantic/correctness suite and exact controls;
2. local-bound negative controls preventing shared non-exact publication;
3. NEES ledger update for additional TT tag/probe/store work;
4. same-runner old-minimal vs candidate governing-unit benchmark;
5. at least one materially harder search control where worker startup is not the dominant measured cost;
6. 2-worker and 4-worker checks;
7. updated debt/disposition table for MW-001 and any newly exposed costs.

