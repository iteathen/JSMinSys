# IsoMax Phase-2 realized local zero-bound result — 2026-09-27

Status: decisive local-screen winner; direct-source integration and multiworker qualification still required.

## Frozen denominator

Stage-9 Phase-2 denominator:
`10380f79af68dc1f57455d535814ac0a7eacea33`.

## Realized policies

A — Stage-9 denominator, exact-only local cache.

B — **search-derived local LOWER0/UPPER0 only**.

C — CPC-derived local LOWER0/UPPER0 only.

D — combined search + CPC bounds.

All bound codes remain private/local. Shared cache publication remains exact-only.
An existing exact local row is protected from bound eviction. Public exact-only
cache probes filter codes 4/5.

The candidate was realized as a cold module-load specialization over the exact
frozen Stage-9 source. No runtime experiment-mode branch was inserted into
recursion.

Experiment cycle accounting:
`experiments/isomax-phase2/BOUND_REALIZED_CYCLE_LEDGER.md`.

## Correctness gate

Workflow:
`IsoMax Phase2 realized zero-bound TT`

Run:
`36357608169` — success.

Before timing all three realized policies passed the directed narrow-window
oracle, including the independent physical 4x4 comparison.

Artifact:
`10944751138`

Digest:
`sha256:617ffad09fc7eadacdd74973f8b325b3e9589c42ec078dd5f168849cf42026c5`.

## Long exact control — 353335714

Eight balanced A/B/C/D blocks; 32 fresh Windows processes.
Windows QueryProcessCycleTime supplied actual process cycles.

Exact result/root move agreed for every arm.

| arm | mean cycles | wall ms | nodes | cofactors |
|---|---:|---:|---:|---:|
| A Stage-9 | 21.332 B | 8528.70 | 11,755,731 | 11,813,310 |
| **B search bounds** | **9.330 B** | **3591.00** | **2,900,135** | **2,900,429** |
| C CPC bounds | 21.460 B | 8575.98 | 11,755,731 | 11,813,310 |
| D combined | 9.300 B | 3579.89 | 2,903,280 | 2,903,611 |

### B — search-derived bounds

Paired deltas versus frozen denominator:

- **solve cycles: -56.2642%**
- descriptive 95% interval: **[-56.7540%, -55.7744%]**
- **wall: -57.8996%**
- wall interval: **[-58.4588%, -57.3404%]**
- CPU time: **-56.2973%**
- **nodes: -75.3300%**
- cofactors: **-75.4478%**

Cycles/node rise ~77.3%; the win is structural search reduction, not a cheaper
node. This is exactly why Phase 2 uses whole-solve effectiveness rather than
cycles/node as the governing metric.

### C — CPC-derived bounds

- cycles: +0.622%, interval crossing zero;
- nodes/cofactors unchanged.

Reject as a standalone performance candidate.

### D — combined

- cycles: -56.3993%;
- nodes: -75.3033%.

Its long result is only ~0.14 percentage points better than search-only while
storing much more bound information. The short control also trends worse.
The extra CPC-bound machinery therefore has no demonstrated economic value over
the simpler search-only policy.

## Short exact control — 45461667

Four balanced blocks / 16 fresh processes.

Search-only B:
- cycles: +0.814%, interval **[-9.81%, +11.44%]**;
- wall: +0.816%, interval crossing zero;
- nodes: -2.21%.

No short-control cycle regression or improvement is established.

Combined D:
- cycles: +1.46%, interval crossing zero;
- cycles/node: +3.72%, interval above zero.

This further favors search-only B as the retained policy.

## Phase-2 target

The owner target is:

    whole exact-solve cost <= 0.50 * Phase-2 Stage-9 denominator

Search-only B measured:

    0.43736 * denominator cycles

Thus the Phase-2 50% target is **crossed locally with substantial margin** on the
hard control.

This is not yet a production promotion claim. Required next gates:

1. implement the search-only policy directly in canonical addon source;
2. fold all operations into the canonical JSMinSys addon cycle ledger;
3. full Verify/schema/node compatibility;
4. repeat matched long confirmation from the direct-source candidate;
5. qualify the selected six-deep/one-wide multiworker whole-solve lane;
6. check memory/shared-exact interaction and short-control behavior;
7. only then choose promotion/merge disposition.

## Retained mechanism

Keep only search-derived bounds initially:

- LOWER0 from search fail-high/cutoff establishing mover-relative value >= 0;
- UPPER0 from completed non-exact fail-low establishing value <= 0;
- local/private only;
- exact entries protected from weak-bound eviction;
- exact stores overwrite bounds;
- public/shared cache remains exact-only.

Do not retain CPC-derived bound stores unless new evidence changes their
economics.

## Durability

This result is a Phase-2 milestone and must remain committed even if later
multiworker qualification rejects or modifies the realization.
