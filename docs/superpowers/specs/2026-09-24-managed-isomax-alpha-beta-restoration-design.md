# Managed IsoMax Negamax Alpha-Beta Restoration Design

**Date:** 2026-09-24  
**Repository:** `iteathen/JSMinSys`  
**Managed-runtime branch:** `experiment/connect4-managed-runtime-v1`  
**Connect4 integration branch:** `work/isomax-jsminsys-boundary-cleanup`  
**Status:** Design approved in conversation; written-spec review pending before implementation.

## Problem

The managed-runtime ownership refactor accidentally replaced IsoMax's governing CPC-first **Negamax-style alpha-beta** search loop with shared-q expansion.

The earlier worker path called `solveConnect4RbaAlphaBeta()`, whose hot recursion was:

1. exact-cache probe;
2. CPC evaluation;
3. semantic alpha/beta tightening;
4. immediate bound cutoff;
5. select one action;
6. cofactor/canonicalize one child;
7. recurse immediately;
8. update alpha;
9. stop constructing siblings once `alpha >= beta` or an exact winning value closes the node.

Commit `acbb7815143ed1cee85d3ce997171a6f8cc4ea81` changed the worker from that recursive solver to `evaluateConnect4CpcRbaTt32()` + `publishConnect4CpcRbaEvaluation32()` + `runRbaBranchWorkerLoop32()`. Commit `8611a8eba9221f1b1ce3f0c784f10808a2577bae` then removed the former alpha-beta adapter as superseded.

The replacement evaluator materializes and CPC-evaluates every unresolved child before the worker descends its retained continuation. That defeats alpha-beta's core economy: siblings that would have been pruned are already constructed, canonicalized, measured, stored, and often published.

Measured consequences on the maintained `45461667` control are consistent with this architectural error:

- historical recursive CPC-first alpha-beta: about 584k counted alpha-beta nodes/s and about 4.45k whole-process cycles per counted recursive node on its historical runner;
- current managed shared-q traversal: about 81k cycles/transition and about 195k cycles/q evaluation on the current 4-worker reference;
- the fixed 65,536-row shared TT can fill before the current traversal solves the control.

These measurements are not directly portable across hardware or node definitions, but the structural difference is unambiguous.

## Goal

Restore the tight CPC-first **Negamax-style alpha-beta** loop as the **governing search engine inside each managed worker** while preserving the decentralized Surplus/shared-TT/manager architecture.

The corrected architecture must be capable of becoming tighter than the historical worker by retaining the later RBA representation, initialization-prepared geometry, position-code subtraction, cycle accounting, manager separation, and cross-worker transposition knowledge.

## Non-goals

- Do not revert managed-runtime ownership back into IsoMax.
- Do not reintroduce the deleted Connect4-local worker/manager adapters.
- Do not involve BSFP or modify `components/bsfp/**`.
- Do not make the branch manager part of the worker alpha-beta hot loop.
- Do not convert local alpha/beta windows into globally authoritative q truth.
- Do not pre-expand all legal siblings merely to manufacture parallel work.
- Do not add abstraction layers to hide distribution or cycle cost.
- Do not merge PR #26 or PR #163 automatically.

## Architectural authority

### Worker

A worker owns a local CPC-first **Negamax-style alpha-beta** search loop. Each recursive child flips mover perspective and is searched with the negated window `(-beta, -alpha)`; the returned child score is negated before the parent updates its local best/alpha state.

For a claimed q, the worker must:

1. establish the local alpha/beta window;
2. probe exact local/shared evidence that is valid for that q;
3. run CPC and tighten the local search interval;
4. return immediately on exact CPC evidence;
5. cut immediately when CPC bounds close the current window;
6. choose the initialization-prepared best/first action;
7. construct only that child;
8. recurse locally as `value = -search(child, -beta, -alpha)` (or the equivalent tighter Negamax window when CPC/root exact information permits it);
9. update local best/alpha immediately from the negated child value;
10. stop before constructing later siblings when a cutoff occurs.

The default local path therefore pays no shared work-publication cost for siblings that alpha-beta proves unnecessary.

### Surplus exposure

Surplus is a **distribution mechanism layered on alpha-beta**, not the replacement search algorithm.

The first restoration checkpoint must run the local alpha-beta search correctly even if it exposes no new parallel surplus.

After that checkpoint is qualified, surplus may be exposed at a split point only when all of the following are true:

- the first/local child has been evaluated far enough that the node remains open;
- another sibling still survives the current local alpha/beta window and CPC restrictions;
- useful worker capacity exists or the established distribution policy otherwise requires exposure;
- exposing the sibling does not require pre-materializing all remaining siblings;
- the exposed work carries only globally sound q identity/evidence plus the work description needed to resume it.

The intended shape is first-child / principal-variation style splitting:

```text
claim q
  -> local alpha-beta search first/best child
  -> cutoff? return; expose nothing
  -> still open?
       retain one continuation locally
       expose only surviving useful surplus siblings
```

A worker may continue descending its retained branch without returning to the manager.

### Branch manager

The branch manager remains off the worker evaluation hot loop.

It owns:

- dedupe / exact transposition merge for exposed shared work;
- TT and queue cleanup;
- redirect/lifetime maintenance;
- redundant-worker reset;
- prioritization/organization that can occur asynchronously without forcing worker hot-loop round trips.

It does not:

- manufacture search children;
- run the worker's alpha-beta recursion;
- globally serialize action ordering;
- require every local search node to become a shared TT transaction.

### Shared TT

The shared TT remains the authority for:

- shared q identity;
- shared exact semantic evidence;
- exposed-work ownership;
- dependency topology that actually crosses worker boundaries;
- row lifetime / redirects / merge state.

Local search-control information remains local:

- Negamax `alpha`;
- Negamax `beta`;
- mover-relative score orientation;
- fail-high/fail-low bounds whose validity depends on the caller window;
- local recursion/continuation frame state.

Only evidence already qualified as globally sound may be published as q truth.

## Search kernel reuse

The existing `addons/rba-connect4-alphabeta.mjs` kernel is the behavioral reference for restored **Negamax-style alpha-beta** pruning semantics. The restoration should reuse or structurally factor that qualified logic rather than re-derive a second alpha-beta implementation from scratch.

The important authority is the behavior, not necessarily the current public function boundary. If distribution requires an incremental/resumable form, extract the minimum internal kernel necessary while preserving:

- CPC-first interval tightening;
- mover-relative Negamax score conversion (`absToRelative` / `relativeToAbs` semantics);
- child recursion through the negated window `(-beta, -alpha)` and negated return value;
- exact-cache qualification;
- forced/preemption filtering;
- initialization-prepared action order;
- one-child-at-a-time construction;
- immediate recursive/iterative descent;
- cutoff before sibling construction;
- deterministic caller-frame witness selection.

## Managed-worker boundary

`addons/rba-connect4-managed-worker.mjs` must stop using `evaluateConnect4CpcRbaTt32()` as the governing search algorithm.

The managed worker may still use shared TT claim/release and Surplus publication helpers, but those operations wrap local alpha-beta work rather than replace it.

The current all-child evaluator remains useful as:

- a test/reference path;
- manager-side or experimental frontier materialization where explicitly needed;
- differential qualification.

It must not remain the production worker's default governing loop after restoration.

## Cycle accounting

Cycle visibility remains mandatory.

Every new or modified execution unit, helper, callback, module-main path, or changed operation sequence must update `catalog/addon-cycle-ledger-v0.json` in the same work.

For every restoration step:

1. record the old governing-unit cycle expression;
2. record the new expression;
3. explicitly identify deleted shared-TT, allocation, child-construction, CPC, canonicalization, atomic, or callback operations;
4. bind all operations to current NEES costs or explicit conforming local symbolic/unbounded extensions;
5. update decomposed-source blob guards;
6. run mechanical cycle-ledger coverage before accepting the change.

No thread, allocation, blocking, callback, or unknown runtime cost may be silently treated as zero.

The obsolete pre-restoration shared-q reference was approximately:

- 81k cycles/transition;
- 195k cycles/q evaluation.

Phase 1 restored the local CPC-first Negamax kernel and established a current measured one-worker reference of approximately **3.9k CPU cycles per local Negamax node** on the maintained same-runner benchmark.

### Local cycle budget target

The optimization target is now **1,000 CPU cycles per local Negamax node**.

This is the governing local-kernel budget for subsequent optimization passes. It applies to the worker's local CPC-first Negamax search work, measured as whole-process CPU cycles normalized by `alphaBetaNodes` on the controlled same-runner benchmark. It is intentionally separate from manager, worker-startup, shared-TT distribution, idle-worker, and Surplus coordination overhead.

The current ~3.9k cycles/node Phase-1 measurement is a baseline, **not** an acceptable steady-state budget. Later local-kernel optimization work should explicitly report progress toward <=1,000 cycles/node and reject designs that hide local search cost inside a different node definition or move it into uncounted coordination work.

The 1,000-cycle target is a performance objective, not a correctness relaxation: exact W/D/L, deterministic witness behavior, Negamax window semantics, cycle-ledger completeness, and fail-closed behavior remain mandatory.

## Restoration sequence

### Phase 1 — restore local alpha-beta authority

Produce a managed worker that, after claiming a root/shared q, searches it with the qualified CPC-first **Negamax-style alpha-beta** kernel.

For the first checkpoint, distributed Surplus exposure may be disabled or limited to the existing claimed root boundary. Correct local pruning is more important than immediate parallel scaling.

Acceptance:

- the worker does not pre-materialize every legal sibling;
- alpha/beta cutoffs occur before later sibling construction;
- exact value and deterministic witness match the established oracle controls;
- current managed host/manager ownership remains intact;
- cycle ledger is complete;
- 1-worker throughput materially approaches the historical recursive path relative to the current shared-q traversal.

### Phase 2 — expose alpha-beta surplus

Introduce the minimal resumable/split interface needed to expose surviving sibling work after the local first-child/PV search fails to cut.

Acceptance:

- no sibling is exposed before it is known to survive the current local pruning state;
- worker retains one continuation;
- manager does not manufacture work;
- shared TT carries only globally sound evidence;
- local search-control windows stay local;
- 1-worker overhead remains near the Phase-1 kernel;
- 2/4-worker scaling is measured separately.

### Phase 3 — cross-worker exact evidence

Exploit shared exact q results and manager merges to shorten local searches without weakening local alpha-beta pruning.

Acceptance:

- shared exact evidence can terminate a local frame where sound;
- duplicate exposed branches converge;
- redundant workers can reset cleanly;
- no global lock/manager round trip is added to every recursive node.

## Tests

The restoration must add tests that fail on the current shared-q production path and pass only when alpha-beta governs the worker.

Required behavioral tests include:

1. **Negamax cutoff-before-sibling-materialization:** create a position/window where the first child is searched with `(-beta, -alpha)`, its result is negated into the parent frame, causes a cutoff, and assert no later sibling cofactor/publication occurs.
2. **CPC-bound cutoff:** CPC closes a mover-relative local Negamax alpha/beta window without constructing children.
3. **Exact-cache hit:** exact cached q returns without child construction.
4. **No-surplus single worker:** managed one-worker solve returns the same WDL/witness with no requirement to expose siblings.
5. **Surplus only after open first child:** when the first child does not cut, later surviving work may be exposed; when it cuts, exposed count remains zero.
6. **Local-window non-authority:** Negamax fail-high/fail-low local returns are not published as globally exact q values, and their sign/window orientation is not mistaken for absolute W/D/L truth.
7. **Reflection witness:** caller-frame deterministic move ordering remains correct under root reflection.
8. **Cancellation/deadline:** managed host still fails closed and cleans workers.
9. **Cycle-ledger coverage:** every touched managed/alpha-beta execution unit remains decomposed and source-blob guarded.

## Benchmark protocol

Use the existing same-runner B/C/C/B discipline.

The first restoration benchmark must compare:

- baseline: current qualified managed shared-q traversal;
- candidate: managed worker with restored local alpha-beta authority.

Record at least:

- wall time;
- whole-process CPU cycles;
- local alpha-beta nodes;
- cycles/local-alpha-beta-node;
- q claims;
- exposed surplus count;
- cutoffs;
- cache hits;
- CPC calls/exact/bounds/restrictions;
- cofactors/transitions;
- TT live/ready/event topology;
- RSS/shared bytes;
- CPU time versus wall time.

Do not use raw transition counts alone as a speed ratio.

The decisive Phase-1 evidence is whether the restored managed worker recovers tight local alpha-beta cycle economics and completes the maintained `45461667` control without filling the shared TT.

## Failure conditions

Reject or revert a restoration candidate if any of these occurs:

- it still materializes all siblings before local descent;
- 1-worker search depends on manager reconciliation for ordinary alpha-beta recursion;
- manager/TT locking appears on every recursive node;
- local alpha/beta bounds are published as globally exact without proof;
- distributed machinery materially slows the no-surplus one-worker kernel;
- cycle-ledger coverage is weakened;
- correctness or deterministic witness changes;
- BSFP paths are touched.

## Success condition

The managed runtime again behaves as a tight CPC-first **Negamax-style alpha-beta** solver whose workers can distribute surviving useful surplus without surrendering local pruning.

The target architecture is therefore:

```text
managed host
    |
    +-- worker 1: tight local CPC-Negamax-alpha-beta
    |       -- expose only surviving surplus
    |
    +-- worker 2: tight local CPC-Negamax-alpha-beta
    |       -- expose only surviving surplus
    |
    +-- ...
    |
    +-- branch manager
            dedupe / merge / cleanup / resets
            off worker hot loops
    |
    +-- shared TT
            shared q identity + global exact evidence + exposed work
```

The worker search loop is authoritative. The manager and TT make multiple tight searches cooperate; they do not replace the searches.
