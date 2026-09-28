# IsoMax Phase-2 shared density sweep

Date: 2026-09-27
Status: configuration-only performance experiment.

Fixed solver source:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

## Motivation

Recent diagnostics closed several extra-machinery leads:
- wide-worker read specialization did not qualify;
- packed fingerprints did not qualify;
- mismatching shared q comparisons already reject after ~1.25 key words;
- identical exact republication is only ~3.6–3.7% of store attempts.

The preferred solver already contains a deterministic sharing-density mechanism:
`sharedSampleMask`.

Use it before adding new cache machinery.

## Arms

All arms use the identical solver revision and identical:
- 4 workers = 1 wide + 3 deep;
- rootFrontier=true;
- shared capacity 4,194,304;
- local capacity 1,048,576/worker;
- Node 26.7.0.

Only `sharedSampleMask` changes:

- A: 0 — full sharing;
- B: 1 — approximately 1/2 admitted;
- C: 3 — approximately 1/4 admitted;
- D: 7 — approximately 1/8 admitted.

The existing high-hash predicate gates optional shared reads/publications.
Private exact search remains complete.

No single-worker run.

## Benchmark

Primary exact:
`353335714`, six balanced four-arm blocks.

Record whole-process cycles, wall, CPU, nodes, per-worker nodes, shared hits,
stores, contention, cycles/node, winner, exact WDL/move, RSS.

Primary acceptance authority:
whole-process cycles on completed exact controls.

Secondary:
`35333571`, one balanced fixed-window block, unchanged 120000 ms ceiling.

Timeouts remain censored evidence only.

If a reduced-density arm establishes an exact whole-process win, carry the
simplest winning density forward and confirm it in a direct two-arm run before
changing the selected profile.

PR #84 remains draft/open; this experiment gives no merge authorization.
