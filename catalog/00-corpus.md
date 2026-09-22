# Connect4 workload corpus — v0

JSMinSys begins from a concrete workload rather than an imagined API.

## Source revisions

- incumbent minimax / exact oracle: `3c7524321d49c11c3cb6c519425e3bd0ed4bb42b`
- IsoMax: `a26ef2254c850243f68505eeff1d849ad0f4f0c0`
- BSFP: `abdf7b0993f07bd6087669848c2dda91dff65608`

## Surveyed incumbent / oracle files

- `components/incumbent/position.mjs`
- `components/incumbent/evaluator.mjs`
- `components/incumbent/search.mjs`
- `components/incumbent/tt.mjs`
- `components/oracle/exact7x6.mjs`

## Surveyed IsoMax files

- `components/isometric/state.mjs`
- `components/isometric/solver.mjs`
- `components/isometric/residual-pool.mjs`
- `components/isometric/frontier.mjs`
- `components/isometric/isomax-index.mjs`
- `components/isometric/move-order.mjs`
- `components/isometric/execution/shared-tt.mjs`
- `components/isometric/execution/branch-manager.mjs`
- `components/isometric/execution/worker.mjs`
- `components/isometric/execution/conserved-delta.mjs`

## Surveyed BSFP files

- `components/bsfp/reference-solver.mjs`
- `components/bsfp/support-lattice.mjs`
- `components/bsfp/residual-winspace.mjs`
- `components/bsfp/residual-frontier.mjs`
- `components/bsfp/ownership-antichain-packed42-rolling-solver.mjs`
- `components/bsfp/geometry.mjs`
- `components/bsfp/wsl-requirement-lattice.mjs`

## Deliberate exclusions

The initial census excludes tests, benchmarks, reports, most qualification scaffolding, and the large research-prototype archive from operator-frequency counts. Those sources remain useful for discovering additional abstractions and failed designs, but mixing them into the first frequency table would overweight experimental tooling rather than runtime demand.

## Interpretation rule

Occurrence means “previous code asked for this,” not “JSMinSys needs this.”

Every observed operation or abstraction is subject to deletion by:

1. representation redesign;
2. doing nothing when the consequence is tolerable;
3. lazy handling;
4. reuse of existing state/structure;
5. precomputation;
6. derivation from already-admitted primitives.

Only after those fail does an observed demand become evidence for admitting a new primitive.
