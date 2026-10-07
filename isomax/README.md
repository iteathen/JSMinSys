# IsoMax 0.2.0-rc.5

Keep this folder together. It contains the launcher, exact solver, configuration,
verification, tests and evidence. No npm install or producer checkout is needed.

## Run

Install Node 26.7 or later, then run from this folder:

```sh
node verify.mjs
node run.mjs
```

The launcher supplies FFI and the retained 2400/9600 V8 startup flags. It solves
the actual empty 7×6 board, returning W/D/L and an optimal move. There is no
opening book, fixed prefix, RLC or prior-run solved cache. Persistent workers,
TTs, arenas and geometry plans initialize before READY; actual root construction
and exact solving follow READY. Primary time includes that root construction.

For a fast installation check or configuration help:

```sh
node run.mjs --columns 1 --rows 4 --shared-entries 256 --local-entries 256
node run.mjs --help
node run.mjs --list-memory-profiles
```

## Cores and memory

Default startup discovers physical performance cores and available memory.
Each selected core gets one deep worker, alternating center/live ordering.
SMT siblings do not become extra workers. Windows/Linux thread bindings are
verified before solver-module and private-TT initialization. Unknown topology
or a rejected binding fails initialization instead of silently using guessed
placement. The engine requires 2–64 workers; `--workers N` is an explicit override
within the discovered physical target count.

**macOS warning:** Apple provides scheduling hints, not supported hard CPU
pinning. IsoMax applies QoS and affinity tags where available and reports hints.
They cannot guarantee placement on a particular core or continuous P-core
residency. This best-effort exception was explicitly requested by the owner.

Standard 7×6 with admitted complete plans selects exact partial24 TTs. Every
locator bit and remaining exact-key field is retained; this is not probabilistic
hash equality. Other geometry or an incomplete-plan budget selects the retained
native32/generic implementation during initialization, with no hot profile branch.

Memory profiles are shared-TT budgets, not total RAM: 1, 2, 4, 8, 12, 16, 32, 64
and 128 GiB. Auto chooses the largest fitting allocation, including experimental
profiles. Equal actual capacities prefer the smaller budget. Power-of-two rows
mean actual bytes can be below the budget. Partial24 uses 24-byte records and
192 MiB private per worker under the 256 MiB private budget. Native/generic
widths depend on geometry. Separate support/runtime reserve is included.

The 12 GiB partial24 profile matches the measured six-worker allocation: two
6 GiB banks, 536,870,912 shared rows and 8,388,608 private rows per worker.
Banks retain admitted index limits; full locator bits are never truncated.
Earlier 1–8 GiB measurements used native32. The 16–128 GiB profiles are
experimental; metadata/address tests do not qualify full allocation or speed.
Results report actual bytes, banks, record widths, available headroom and the
exact evidence scope. Memory snapshots are not OS reservations.

```sh
node run.mjs --memory-profile 12
node run.mjs --columns 7 --rows 5
```

Dimensions 1..10 and winning length four are selected at initialization. Fast
correctness checks cover all 100 shapes. Full performance tests stay on 7×6;
larger boards can require much longer search. Explicit shared/private entry
counts cannot be combined with a numeric memory-profile option. Embedders can
disable automatic experimental choices with `allowExperimentalMemoryProfiles:false`.

## API

```js
import {prepareConnect4RbaGeometry, prepareLazySmpConnect4Rba32} from './index.mjs';
const geometry = prepareConnect4RbaGeometry({columns: 7, rows: 6});
const app = await prepareLazySmpConnect4Rba32({geometry});
try {
  const result = await app.solve([]); // zero-based history; empty here
  console.log(result.rootWdl, result.move);
} finally {
  await app.close();
}
```

Use the launcher to apply startup flags, or supply them before importing this
API. Prepared applications are one-shot. Close idle sessions. Close joins workers
and drops large owned buffer references while preserving scalar result metadata.
Caller-owned plans and immediate RSS reclamation are not guaranteed. Initialization
deadlines are cooperative checks around synchronous stages, not preemption.
Diagnostic node/cache counts are unavailable (`null`); no hot reporting was added.

## Evidence and contents

Matched localhost candidate runs averaged 33.245 seconds, best 33.163, versus
34.153 for the control. They used six pinned i5-12600K P-cores, actual 12 GiB shared
/192 MiB private TTs, Node `v27.0.0-nightly20260928b59840b593`, V8
`14.6.202.34-node.36`, and OneDrive stopped. Two samples per source are limited
evidence, not a portable speed guarantee. The ≤10-second goal remains unmet.
See [evidence/](evidence/README.md) and the Connect4 promotion record for the new
public-package confirmation. Whole-runtime NEES/allocation-free certification
remains unqualified.

- `run.mjs` / `cli.mjs`: portable startup and empty-board command.
- `index.mjs`: public prepared/one-shot API and initialization policy.
- `profile.json`: defaults and measured configuration.
- `runtime/`: unchanged producer kernels and support closure.
- `provenance.json` / `verify.mjs`: source, SHA-256 and closure verification.
- `test/`: bounded correctness, platform, lifecycle and corruption checks.
- `dist/`: standalone archive and download checksum.

AGPL-3.0-only. This is a repository distribution; npm registry publication is
disabled. Maintainers reproduce it using JSMinSys `isomax/prepare.mjs` at the
packaging revision; the consumer needs only this folder or the archive.
