# IsoMax Phase-2 selective shared fallback result — 2026-09-27

Status: exact-control rejection; current coalesced+shared-draw winner retained.

## Topology

Standard GitHub Windows runner with availableParallelism=4.

All arms:
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- shared exact 4,194,304;
- local exact 1,048,576/worker;
- full sharing;
- rootFrontier=true;
- no single-worker runs.

Workflow:
`IsoMax Phase2 4-worker shared fallback`

Run:
`36377402344` — success.

Artifact:
`10951536910`

Digest:
`sha256:c041744933f3c09a15fbf629c5efa5fbac9f0bec7ddfb29c5dff88af3aa6537a`.

## Arms

A — current coalesced + shared exact-draw winner:
`e449df20dc59cc6c1e5b2da78134751a2376f355`

B — shared exact fallback only when a local weak bound is a true no-op:
`4d9b8458be9eff73f2537301b6d758fef24e7703`

C — shared exact fallback on every non-cutoff local weak-bound hit:
`4161b37e949adf05d3e10978547a40adf15a2743`

Both candidate SHAs passed Verify before timing.

## Exact derived-long — 353335714

Six balanced blocks / 18 fresh processes.
All samples exact with identical root WDL/move.

A means:
- cycles: 56.415 B
- wall: 6107.31 ms
- nodes: 4.529 M
- shared hits: 514,955
- shared stores: 1,597,027

B no-op-only versus A:
- solve cycles: **+0.065%**
- 95% interval: **[-1.442%, +1.572%]**
- wall: -0.120%
- nodes: -0.084%
- shared hits: **+0.964%**
- shared stores: **-0.221%**

No exact whole-solve improvement is established.

C all-noncutoff versus A:
- solve cycles: **+0.366%**
- 95% interval: **[-1.667%, +2.398%]**
- wall: -1.567%, interval crosses zero
- nodes: -0.256%
- shared hits: +0.965%, interval crosses zero
- shared stores: -0.256%

No exact whole-solve improvement is established.

## Official hard fixed-window — 35333571

One ABC block, unchanged 120-second application ceiling.
All three arms timed out, so exact solve-speed ratios are inadmissible.

Fixed-window means:

| arm | cycles | nodes | shared hits | shared stores | contention |
|---|---:|---:|---:|---:|---:|
| A coalesced+shared | 1.1244 T | 126.60 M | 20.03 M | 16.14 M | 579,960 |
| B no-op fallback | 1.1060 T | 123.71 M | 19.46 M | 15.95 M | 520,468 |
| C all-noncutoff | 0.9580 T | 106.39 M | 16.42 M | 14.80 M | 399,836 |

Descriptive C versus A:
- cycles: -14.80%
- CPU: -14.68%
- nodes: -15.96%
- shared hits: -18.00%
- shared stores: -8.32%
- contention: -31.06%

This is a strong censored lead only. Because C does not improve the completed
exact derived-long control, do not retain it as the new winner from this run.

## Disposition

Retain A:
`e449df20dc59cc6c1e5b2da78134751a2376f355`.

Reject selective shared fallback as an exact-control optimization:
- B recovers some shared hits but does not reduce total exact solve cost;
- C adds broader shared probing and likewise does not reduce exact solve cycles.

The hard-window behavior is worth preserving as a clue, but it does not override
the completed exact screen.

Next:
1. instrument current winner for same-bound store suppression versus opposite-bound
   draw promotion counts;
2. profile the current winner on exact derived-long;
3. target the dominant remaining operation class before adding more TT machinery.
