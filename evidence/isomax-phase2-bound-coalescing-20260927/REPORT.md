# IsoMax Phase-2 zero-bound coalescing result — 4 workers

Date: 2026-09-27
Status: coalesced+shared exact-draw arm is current optimization winner.

## Topology

Standard GitHub Windows runner, availableParallelism=4.

All arms:
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- shared exact 4,194,304;
- local exact 1,048,576/worker;
- full sharing;
- rootFrontier=true.

No single-worker runs.

Workflow:
`IsoMax Phase2 4-worker bound coalescing`

Run:
`36375481507` — success.

Artifact:
`10950119722`

Digest:
`sha256:80f2fa22c719b2159bda62018841b6ef25a54257a396a7cdccac4a49091457a2`.

## Arms

A — current LOWER0+UPPER0:
`00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee`

B — UPPER0-only:
`38ef5684180e129a805d42a6383377d17b0289a2`

C — same-q coalescing local only:
`501540f69b0e3cfe3b3895291cfd34b05985554d`

D — same-q coalescing + publish newly exact draw to shared exact:
`e449df20dc59cc6c1e5b2da78134751a2376f355`

## Derived-long exact control — 353335714

Four balanced blocks / 16 fresh processes. All arms exact with identical root
WDL/move.

D versus current A:
- solve cycles: **-2.988%**
- 95% interval: **[-4.455%, -1.520%]**
- wall: **-3.408%**
- CPU: **-2.975%**
- all-worker nodes: **-4.430%**
- shared hits: -0.220% (neutral)
- shared stores: +0.713%

Means:
- A cycles: 36.044 B
- D cycles: **34.964 B**
- A nodes: 4.816 M
- D nodes: **4.603 M**

Local-only C trends favorable but its cycle interval crosses zero. Sharing the
newly exact draw is the qualified improvement on this completed tree.

## Official hard — 35333571

One A/B/D/C block under the unchanged 120-second application ceiling.

A current both-bounds:
- **EXACT**
- wall: **116.224 s**
- cycles: 1.17829 T
- nodes: 253.847 M

D coalesce+shared:
- **EXACT**
- wall: **112.168 s**
- cycles: 1.14021 T
- nodes: 235.902 M

Single-block descriptive D versus A:
- cycles: **-3.232%**
- wall: **-3.490%**
- nodes: **-7.069%**
- shared hits: -2.719%
- shared stores: +0.345%

B UPPER0-only and C local-only both timed out at 120 seconds on this block.

The official-hard result is only one paired block and therefore is a strong lead,
not final statistical qualification. But it is the first reduced-core run in this
campaign where the improved zero-bound realization finishes the official hard
fixture with clear margin under the fixed ceiling.

## Structural conclusion

The split experiment showed both LOWER0 and UPPER0 are useful, so dropping a
bound direction sacrifices too much exact-tree reduction.

The successful optimization is instead to preserve both while reducing
interference:
- same-q repeated weak bound does not republish the full q key;
- opposite LOWER0/UPPER0 on the same fully verified q proves exact draw;
- newly exact draw is published through the existing shared exact channel.

Exact rule:

    value >= 0 AND value <= 0 => value = 0

Full q-key equality is required before coalescing. Hash equality alone is never
sufficient.

## Next step

Retain D as the current optimization candidate.

Next pass should measure where remaining hard-tree cost sits before adding more
machinery. Priority candidates:
1. count same-bound repeat suppression vs opposite-bound draw promotions;
2. measure whether exact-draw publication is responsible mainly for tree
   reduction or reduced repeated weak-bound traffic;
3. profile D on the exact derived-long control;
4. then target the dominant remaining operation class.

Do not add a second broad bound table yet.
