# Phase-2 optimization — selective shared exact after local weak-bound hit

Date: 2026-09-27

## Current winner

4-worker reduced-core winner:
`e449df20dc59cc6c1e5b2da78134751a2376f355`

Mechanism:
- both LOWER0 and UPPER0 retained;
- repeated same-q/same-bound store suppresses key republication;
- opposite bounds on the same fully verified q coalesce to exact draw;
- newly exact draw is published to shared exact.

Measured versus the previous both-bound implementation:
- derived-long cycles: ~-2.99%;
- derived-long nodes: ~-4.43%;
- official-hard single-block exact completion: 112.17s vs 116.22s.

## Remaining structural issue

A local weak-bound row still masks an exact result that may already exist in the
shared exact cache, because the private slot probe returns the weak code before
falling through to shared lookup.

Do not probe shared exact on an immediate weak-bound cutoff: that path already
avoids the subtree at minimal cost.

Test only non-cutoff weak-bound hits.

## Arms

A — current coalesced+shared-draw winner.

B — **no-op-only shared fallback**:
- LOWER0:
  - beta<=0 => immediate cutoff, no shared probe;
  - alpha<0 => tighten alpha, no shared probe;
  - otherwise the bound is a no-op; probe shared exact before continuing.
- UPPER0:
  - alpha>=0 => immediate cutoff, no shared probe;
  - beta>0 => tighten beta, no shared probe;
  - otherwise the bound is a no-op; probe shared exact before continuing.

C — **all non-cutoff shared fallback**:
- immediate weak-bound cutoff remains first;
- otherwise probe shared exact;
- if no shared exact hit, apply the weak-bound tightening/no-op logic.

Shared lookup uses the existing deterministic sharing-density mask and exact
shared cache. No new table or solved knowledge.

## Hypothesis

No-op-only fallback has favorable economics because a no-op local weak bound is
providing zero pruning value while actively masking possible shared exact
evidence.

All-noncutoff fallback may recover more exact evidence but can overpay atomic
shared probes on bound hits that already provide useful alpha/beta tightening.

## Topology / measurement

Standard GitHub Windows runner:
- availableParallelism=4;
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- shared exact 4M;
- local exact 1M/worker;
- full sharing;
- no single-worker run.

Primary:
- exact derived-long `353335714`;
- paired cycles/wall/nodes/shared hits.

Secondary:
- official hard `35333571`;
- unchanged 120s ceiling;
- exact ratio only if all compared samples finish.

## Correctness

Shared fallback can only return exact shared W/D/L after the existing full shared
key equality/sequence validation.

Public/shared exact semantics remain unchanged.

Update canonical cycle ledgers with:
- extra shared-eligibility tests;
- optional CALL(probeConnect4RbaSharedExactCache32);
- exact-hit conversion/return path.

Commit every arm/result due recurring UI desync.
