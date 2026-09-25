# Managed IsoMax Negamax Restoration Implementation Plan

> **SUPERSEDED EXECUTION PLAN CLAUSES — owner directive, 2026-09-24**
>
> Do not execute any step below that creates or qualifies a single-worker,
> root-only, zero-Surplus managed IsoMax path. Those steps caused a repeated
> architecture regression and are retained only as historical evidence.
>
> Current execution authority requires:
>
> - **2+ search workers plus Branch Manager**;
> - workers retain at most one continuation and publish unresolved viable
>   siblings as Surplus to the shared ready queue;
> - all performance/qualification runs use 2+ workers;
> - per-worker claims/evaluations must remain visible so idle-worker regressions
>   cannot pass unnoticed;
> - Branch Manager remains asynchronous and does not manufacture work.
>
> The production correction is JSMinSys
> `main@51bd9bc09b2c50b84619bc7efa953ad9c1e0302a`. The Phase-1 root-only
> instructions below are **not executable authority** unless the owner explicitly
> revokes the multi-worker restriction.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Historical goal (superseded where it disables Surplus):** Restore CPC-first Negamax alpha-beta before reintroducing distributed splitting.

**Architecture:** Keep the current managed host, shared TT, claim/release loop, manager, and exact publication path. Replace the managed worker's all-child CPC evaluator with the existing qualified `solveConnect4RbaAlphaBeta()` kernel for each claimed q; Phase 1 exposes no new surplus, so only one worker claims the root while other workers remain idle. The worker publishes the exact result back through the existing shared-TT publication path after the Negamax solve completes.

**Tech Stack:** Node.js 26.7, ES modules, worker_threads, SharedArrayBuffer/Atomics, JSMinSys RBA/CPC/Negamax add-ons, node:test, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-24-managed-isomax-alpha-beta-restoration-design.md`

## Global Constraints

- CPC-first **Negamax-style alpha-beta** is the worker search authority.
- Recursive children use the negated window `(-beta, -alpha)` and negate the child return before parent alpha/best updates.
- Surplus/shared-TT/manager machinery coordinates workers; it does not replace local search semantics.
- Phase 1 must not pre-materialize all siblings or expose new surplus.
- Local fail-high/fail-low bounds remain local and are not global q truth.
- Every modified JSMinSys execution unit updates `catalog/addon-cycle-ledger-v0.json` in the same change.
- Decomposed-source blob guards must match every modified decomposed source.
- Unknown/thread/allocation/blocking/runtime costs remain symbolic or unbounded, never zero.
- Do not touch BSFP.
- Local CPC-first Negamax search has a **1,000 CPU cycles per local Negamax node target budget**; the current ~3.9k cycles/node Phase-1 measurement is the optimization baseline, not the target.
- The 1,000-cycle budget excludes manager, worker startup, idle-worker, shared-TT distribution, and Surplus coordination overhead; those costs remain separately visible and accounted.
- Do not merge PR #26 or PR #163 automatically.

## Review Focus

- **Nonterminal reflected root:** managed witness must match direct Negamax caller-frame witness under reflection.
- **Terminal root:** exact terminal W/D/L must publish with witness `-1` and no child search.
- **Multiple workers with no surplus:** exactly one root claim/search must occur; idle workers must not duplicate the Negamax solve.
- **Deadline during monolithic Negamax solve:** host must still terminate workers and fail closed without inventing W/D/L.
- **basisSetWords mode:** Phase-1 managed semantics must remain correct for both list-basis and set-basis TT storage because the local Negamax root comes from the already-prepared root image, not by decoding TT basis storage.

---

### Task 1: Pin managed Negamax authority with a failing integration test

**Files:**
- Modify: `test/rba-connect4-managed.test.mjs`

**Interfaces:**
- Consumes: `runManagedConnect4CpcRba32(moves, options)`, `solveConnect4RbaAlphaBeta(root,{state,reflected})`.
- Produces: a regression contract that managed one-worker execution reports direct Negamax work metrics and does not materialize shared sibling q rows.

- [ ] **Step 1: Extend the existing managed semantics test**

Add assertions after the direct serial Negamax result is computed and the one-worker managed result returns:

```js
assert.equal(managed.metrics.alphaBetaNodes,serial.metrics.nodes);
assert.equal(managed.metrics.cutoffs,serial.metrics.cutoffs);
assert.equal(managed.metrics.cacheHits,serial.metrics.cacheHits);
assert.equal(managed.metrics.cofactors,serial.metrics.cofactors);
assert.equal(managed.metrics.transitions,serial.metrics.cofactors);
assert.equal(managed.metrics.branches,0);
assert.equal(managed.metrics.ttLive,1);
```

Retain both `basisSetWords` variants already in the test.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/rba-connect4-managed.test.mjs`

Expected: FAIL because current managed metrics do not contain `alphaBetaNodes` and current traversal materializes shared q rows.

- [ ] **Step 3: Commit only the regression test**

Commit message: `test(managed): require Negamax worker authority`

---

### Task 2: Replace all-child managed evaluation with the qualified Negamax kernel

**Files:**
- Modify: `addons/rba-connect4-managed-host.mjs`
- Modify: `addons/rba-connect4-managed-worker.mjs`
- Modify: `catalog/addon-cycle-ledger-v0.json`
- Test: `test/rba-connect4-managed.test.mjs`

**Interfaces:**
- Consumes:
  - `prepareConnect4RbaAlphaBeta({geometry,mode,cacheCapacity,...})`
  - `solveConnect4RbaAlphaBeta(root,{state,reflected}) -> {value,relative,move,metrics}`
  - `publishConnect4CpcRbaEvaluation32(t,q,owner,state,code,rootQ,witness,witnessIndex)`
  - `runRbaBranchWorkerLoop32(t,worker,evaluate,publish,options)`
- Produces:
  - managed worker callback `evaluate(t,q,s) -> exact absolute W/D/L code 1..3`;
  - managed metrics fields `alphaBetaNodes`, `cutoffs`, `cacheHits`, `cofactors`;
  - Phase-1 shared branch count remains zero.

- [ ] **Step 1: Pass the prepared root image to each managed worker**

In `runManagedConnect4CpcRba32`, include `root` in evaluator workerData. Keep the shared TT root admission unchanged so one worker still claims authority for the root q.

Increase managed metric width from 12 to 16 and update slab byte arithmetic accordingly.

- [ ] **Step 2: Prepare one local Negamax state per worker**

Replace `prepareConnect4CpcRbaEvaluator` in `rba-connect4-managed-worker.mjs` with:

```js
const ab=prepareConnect4RbaAlphaBeta({
  geometry:g,
  mode:RBA_AB_CPC_ONLY,
  cacheCapacity:65536,
  cpcFrontierResponse:!!workerData.cpcFrontierResponse,
  cpcProjectedAdvisory:!!workerData.cpcProjectedAdvisory,
});
const state={g,ab,witness:-1};
```

The state allocation is worker initialization work, not recursive-node work.

- [ ] **Step 3: Make evaluate run the existing Negamax kernel**

Use the claimed-root assertion and the qualified solver:

```js
const evaluate=(t,q,s)=>{
  if(q!==rootQ)throw new Error('Phase-1 managed Negamax received non-root surplus q');
  const result=solveConnect4RbaAlphaBeta(
    workerData.root,
    {state:s.ab,reflected:rootReflected},
  );
  s.witness=result.move;
  const m=result.metrics;
  metrics[4]=1+m.nodes-m.cacheHits;
  metrics[5]=m.cpcExact;
  metrics[6]=m.cpcBounds;
  metrics[7]=m.cpcRestrictions;
  metrics[8]=m.cpcForced;
  metrics[9]=m.cpcPrecursors;
  metrics[10]=m.cofactors;
  metrics[11]=0;
  metrics[12]=m.nodes;
  metrics[13]=m.cutoffs;
  metrics[14]=m.cacheHits;
  metrics[15]=m.cofactors;
  return result.value;
};
```

The `1 + nodes - cacheHits` CPC-call derivation is valid for a nonterminal root because the root performs one CPC evaluation, and every recursive search node performs CPC unless an exact-cache hit returns first. For a terminal-root case, publish terminal directly or set the derived CPC count to zero based on the root terminal metadata.

- [ ] **Step 4: Reuse the existing exact publication helper**

Keep `publishConnect4CpcRbaEvaluation32` as the publication boundary by passing a state object with `g` and the Negamax-produced `witness`. Because Phase 1 returns only exact codes 1..3, its branch-publication path is unreachable and no surplus is exposed.

- [ ] **Step 5: Publish worker bookkeeping after loop exit without changing search semantics**

Keep claims/evaluations/idle-poll counters in metric slots 0..3. `branches` must remain zero for Phase 1.

- [ ] **Step 6: Update the cycle ledger atomically with the source changes**

For `addons/rba-connect4-managed-worker.mjs#evaluate`, replace the all-child evaluator subledger with:

```text
CALL(solveConnect4RbaAlphaBeta)
+ explicit result/metric field loads
+ CPC-call derivation arithmetic
+ 12 Float64 metric stores
```

For `#<module-main>`, replace `prepareConnect4CpcRbaEvaluator` with `prepareConnect4RbaAlphaBeta`, retain `runRbaBranchWorkerLoop32`, and account the wider final metric stores.

For `addons/rba-connect4-managed-host.mjs#prepareManagedRuntimeSlab32`, change metric bytes from `96*W` to `128*W` and preserve allocation/view costs.

For `runManagedConnect4CpcRba32`, account the additional root object transport as part of the existing symbolic worker-spawn/host-bookkeeping cost; do not assign zero incremental cost.

Refresh decomposed-source blob guards for both managed source files.

- [ ] **Step 7: Run focused and full JSMinSys verification**

Run:
```bash
node --test test/rba-connect4-managed.test.mjs
npm test
npm run verify
```

Expected: all pass, including the Task-1 assertions.

- [ ] **Step 8: Commit**

Commit message: `fix(managed): restore Negamax worker search authority`

---

### Task 3: Pin Connect4 to the restored kernel and measure the recovered cycle economics

**Files:**
- Modify in `iteathen/Connect4`: `vendor/jsminsys`
- Modify in `iteathen/Connect4`: `.github/workflows/isomax-managed-runtime-ab.yml`
- Modify in `iteathen/Connect4`: `tools/bench-isomax-branch-manager.mjs` only if needed to print normalized Negamax metrics already returned by the solver.

**Interfaces:**
- Consumes: JSMinSys exact restoration commit from Task 2.
- Produces: same-runner B/C/C/B evidence for current shared-q baseline versus restored managed Negamax candidate.

- [ ] **Step 1: Re-fetch both PR heads and abort on unexpected concurrent divergence**

Expected starting authorities are the live heads at execution time, not the SHAs embedded in this plan.

- [ ] **Step 2: Pin the Connect4 gitlink and A/B candidate atomically**

Set:
- baseline = the last qualified pre-restoration managed-runtime head;
- candidate = the Task-2 Negamax restoration head.

Do not change unrelated Connect4 files.

- [ ] **Step 3: Ensure benchmark output includes normalized Negamax units**

For candidate samples record:
- `alphaBetaNodes`;
- `cutoffs`;
- `cacheHits`;
- `cofactors`;
- `cpuCycles / alphaBetaNodes`;
- nodes/s = `alphaBetaNodes / wallSeconds`.

Retain existing wall, CPU cycles, transition, RSS, shared-byte, TT topology, and worker-count fields.

- [ ] **Step 4: Run/consume integration Verify and same-runner B/C/C/B**

Acceptance for Phase 1:
- `45461667` completes EXACT rather than filling the 65,536-row TT;
- one-worker managed result matches oracle and direct Negamax witness;
- `ttLive` remains 1 in no-surplus mode;
- cycles/Negamax-node are measured explicitly against the restored local-kernel baseline;
- the durable local optimization target is <=1,000 CPU cycles per local Negamax node;
- no correctness, cleanup, or cycle-ledger regression.

- [ ] **Step 5: Record the new Phase-1 cycle baseline**

Add the exact runner/runtime/CPU, nodes/s, cycles/Negamax-node, wall time, and total cycles to PR #163 and summarize on JSMinSys PR #26.

Record **1,000 cycles/local Negamax node** as the forward local-kernel target and keep distributed/manager overhead as separate budget lines. Future optimization passes must report both the measured local cycles/node and distance from the 1,000-cycle target.

Do not begin Phase 2 Surplus splitting until this restored local kernel is qualified.
