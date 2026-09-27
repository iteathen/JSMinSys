# IsoMax worker-hot-loop baseline

This experiment establishes the measurement floor before the next IsoMax
cycle-reduction campaign. It changes no solver code.

## Why this baseline exists

The target is at least a 50% reduction in worker hot-loop cycle cost. GitHub
hosted VMs vary between jobs, so absolute timings from separate runs are not an
acceptance metric. Comparisons use fresh child processes on one Windows runner
in ABBA blocks.

Windows is deliberate: JSMinSys already owns a qualified
`QueryProcessCycleTime` reader. No nominal-GHz conversion is used.

## Two baseline paths

`local`
: one deep evaluator with the selected 1M private exact cache and no shared
  cache. This isolates the core CPC/RBA/cofactor/live-line/search kernel.

`shared`
: the same evaluator plus the selected 4M full-sharing exact cache. With one
  evaluator this does not model peer cooperation, but it retains the hot
  shared-cache probe/publication costs without Lazy-SMP scheduling noise.

Both use current CPC-only alpha-beta, current move order, no strategist,
no behavior polling and no source instrumentation.

## Fixtures

- `45461667`: official Fhourstones control, exact P0 win, root column 4
  (zero-based move 3). Used for repeated A/A noise calibration.
- `353335714`: longer derived losing child of official `35333571`. Used as a
  longer hot-kernel control so startup/JIT noise is a smaller fraction.

Root construction, geometry preparation and cache allocation occur outside the
measured solve-call interval. The first solve is measured and therefore includes
the JIT behavior a fresh evaluator pays.

## Baseline workflow

The workflow runs four independent A/A campaigns on one Windows GitHub VM:

- short/local: 6 ABBA blocks;
- short/shared: 6 ABBA blocks;
- long/local: 2 ABBA blocks;
- long/shared: 2 ABBA blocks.

A and B point to the same source revision. Their paired ratio distribution is
the runner/noise baseline. Every arm must also produce one deterministic result,
node/cofactor/CPC/cache signature.

A separate CPU profile of the longer local fixture runs after timing and is
uploaded only for hotspot attribution. Profiled execution never enters timing
statistics.

## Future candidate rule

Use the same controller with two clean checkouts on the *same job*.

For a representation/operation-only change with identical search work:

- exact result/root witness must match;
- deterministic work signature must remain equivalent as declared;
- primary target: `cyclesPerNode <= 0.50 * baseline`;
- whole `solveCycles` must also improve materially.

For a structural change that intentionally changes search work, cycles/node is
not by itself comparable. Report at least:

- total solve cycles;
- wall time;
- nodes and cofactors;
- CPC/cache counters;
- any changed memory/shared-cache traffic.

A 50% local microbenchmark saving is not sufficient if whole-solve work grows
enough to lose the benefit.
