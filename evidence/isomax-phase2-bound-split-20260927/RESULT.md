# Phase-2 4-worker zero-bound direction split — 2026-09-27

Status: first reduced-core optimization screen complete.

## Hardware/topology

Standard GitHub Windows runner reported `availableParallelism() = 4`.

Every arm used exactly:
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- rootFrontier=true;
- shared exact 4,194,304;
- local exact 1,048,576/worker;
- full sharing.

No single-worker runs.

Workflow:
`IsoMax Phase2 4-worker bound split`

Run: `36374092717` — success.

Artifact: `10950602126`

Digest:
`sha256:38d3bb9413f9571dbd6119f808d0f42c391e286cfae81fc4a92c1dccbfb6468b`.

## Arms

A — selected production, no weak zero bounds:
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`

B — current LOWER0 + UPPER0:
`00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee`

C — verified LOWER0-only:
`789d5f8024357b98e2dfb8cf1d78083a0cad310f`

D — verified UPPER0-only:
`38ef5684180e129a805d42a6383377d17b0289a2`

## Exact derived-long — 353335714

Four balanced A/B/C/D blocks / 16 fresh processes.
All samples exact with identical root result/move.

Paired process-cycle deltas versus A:

- B both bounds: **-67.136%**
  - interval **[-67.762%, -66.510%]**
- C LOWER0-only: **-63.781%**
  - interval **[-64.468%, -63.094%]**
- D UPPER0-only: **-64.739%**
  - interval **[-65.380%, -64.098%]**

Mean total nodes:
- A: 22.745M
- B: **4.704M**
- C: 5.558M
- D: 5.314M

Combined B is therefore the strongest exact derived-long solver. The two bound
directions are both individually useful and compose positively on this tree.

## Official hard fixed window — 35333571

One balanced A/B/D/C block, fixed 120-second ceiling.
All four arms timed out, so no exact solve ratio is admissible.

Fixed-window observations:

| arm | cycles | nodes | shared hits | shared stores |
|---|---:|---:|---:|---:|
| A no bounds | 1.1316 T | 141.637M | 20.370M | 12.535M |
| B both | 1.1353 T | 133.120M | 19.691M | 15.598M |
| C LOWER0-only | 1.0594 T | 127.613M | 18.820M | 13.842M |
| D UPPER0-only | **1.0270 T** | **123.000M** | 17.920M | **13.412M** |

Descriptive deltas versus A:

B both:
- cycles +0.32%
- nodes -6.01%
- shared stores **+24.44%**

C LOWER0-only:
- cycles **-6.38%**
- nodes -9.90%
- shared stores +10.43%

D UPPER0-only:
- cycles **-9.25%**
- nodes **-13.16%**
- shared stores **+7.00%**

Only one hard block was run; treat ordering as a strong lead, not final
qualification.

## Structural interpretation

Neither bound direction is useless:
- both individually cut the exact derived-long solve by >63% cycles;
- combined is another ~7–9% faster than either alone on that completed tree.

But on the harder censored tree, combined bounds are materially worse than
either single direction and create far more shared/store traffic.

This points to **bound-class interference / repeated-store economics**, not a
simple choice of LOWER0 versus UPPER0.

The next experiment should preserve both logical bounds while reducing their
interaction cost.

Primary lead:
- avoid republishing a full local q key when the same q already carries the same
  weak bound;
- if the same q independently acquires both LOWER0 and UPPER0, their conjunction
  proves exact draw (value 0), so coalesce to an exact local draw instead of
  overwriting weak bounds back and forth.

That rule is exact in mover-relative W/D/L {-1,0,+1}:
    value >= 0 AND value <= 0 => value = 0

Any coalescing implementation must verify full q-key identity before promotion to
exact draw; hash equality alone is insufficient.

Do not add a second broad bound table yet.
