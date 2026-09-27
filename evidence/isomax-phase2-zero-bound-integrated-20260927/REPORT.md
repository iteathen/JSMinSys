# IsoMax Phase-2 integrated zero-bound confirmation — 2026-09-27

Status: direct-source local qualification passed; multiworker qualification pending.

## Sources

Control:
`10380f79af68dc1f57455d535814ac0a7eacea33`
— frozen Stage-9 Phase-2 denominator.

Candidate solver source:
`dbac3d430414a90b8e31da9e0c640a06dfef596d`
— direct-source search-derived LOWER0/UPPER0 integration with canonical alpha,
behavior, root-frontier mirrors and cycle ledgers synchronized.

PR #79 standard Verify/schema/node-compatibility: green.

## Workflow

`IsoMax Phase2 integrated zero-bound confirmation`

Run: `36358419229` — success.

Artifact: `10944841910`

Digest:
`sha256:aacb67fc7db8630929be5d6b81ff60d1697286db26558c84b5e4a125ce979522`.

Windows QueryProcessCycleTime. Fixed source worktrees; plan cache prepared outside
the measured solve boundary exactly as in the Phase-1 denominator campaign.

## Long exact control — 353335714

Eight ABBA blocks / 32 fresh processes.

Exact W/D/L/root move preserved.

Control:
- cycles: 20.349 B mean;
- wall: 8124.92 ms;
- nodes: 11,755,731;
- cofactors: 11,813,310.

Integrated candidate:
- cycles: **8.671 B** mean;
- wall: **3328.00 ms**;
- nodes: **2,900,135**;
- cofactors: **2,900,429**.

Paired deltas:
- **solve cycles: -57.3835%**
- 95% interval: **[-57.8147%, -56.9524%]**
- **wall: -59.0374%**
- interval: **[-59.4434%, -58.6314%]**
- CPU time: **-57.1921%**
- nodes: **-75.3300%**
- cofactors: **-75.4478%**

Cycles/node increase ~72.75%. This remains a structural search win, not a
per-node-cost win.

The direct-source candidate therefore independently confirms the Phase-2
additional 50% target with large margin on the hard local exact control.

## Short control — 45461667

Four ABBA blocks / 16 fresh processes.

- cycles: +0.884%, interval **[-3.23%, +5.00%]**;
- wall: +0.146%, interval **[-5.16%, +5.45%]**;
- nodes: 62,031 -> 60,663 (-2.21%).

No short-control cycle or wall regression is established.

## Remaining qualification boundary

This result does not yet imply selected multiworker production economics.

The Phase-1 support-derived cofactor plan is benchmark-harness-attached on the
qualified local lane. Before seven-worker comparison, explicitly verify/wire the
same plan representation into:
- deep Lazy-SMP workers;
- the iterative root-frontier worker where applicable.

Then qualify local bound/shared exact interaction. A private bound currently can
occupy the local direct-map slot and therefore may prevent that probe from
falling through to a shared exact lookup. The seven-worker test must measure
whether the much smaller local tree outweighs any lost shared evidence.

Do not call production qualification complete until that wiring/economic check
is explicit.
