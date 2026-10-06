# JSMinSys

**IsoMax 0.2.0-rc.2 is promoted on main. Start at [isomax/](isomax/README.md).**
The public API, runtime, configuration, launchers, tests and evidence are together
in that folder. Node 26 or later is required; no npm install is needed.

From the repository root:

```sh
cd isomax
node verify.mjs
node run.mjs
```

This solves the empty 7×6 board with four minimal deep workers, a **4 GiB shared
TT and 256 MiB private TT per worker**, plus geometry plans. Observed peak RSS is
**6.44 GiB**. All workers and memory are prepared before search. The default path
uses current-run exact search without RLC, an opening book or persisted solutions.

The retained localhost candidate mean is **53.828 s**; the standalone extracted
package confirmation took **55.326 s**. Both measure empty-root construction and
solving after readiness, with initialization and cleanup recorded separately.
The ≤10 s target remains unmet. Portable unpinned runs have no timing qualification.

[Download the complete archive](isomax/dist/iteathen-isomax-0.2.0-rc.2.tgz),
[check its SHA-256](isomax/dist/SHA256SUMS), or read the
[current configuration, evidence and version history](docs/isomax-current.md).
The package supports board dimensions selected at initialization. Registry
publication remains disabled.

JSMinSys is an experimental project for deriving a minimal-cost computational substrate for high-performance JavaScript.

The current normative draft is [SPEC.md](SPEC.md). JSMinSys is a strict NEES-EXTREME execution profile: NEES supplies the governing optimization, evidence, qualification, and cost-accounting standard; JSMinSys adds narrower admissible data, operations, blocks, and mechanical sealing.

The project works upward from the cheapest qualified operations rather than downward from conventional software abstractions. The initial workload corpus is the Connect4 solver family; Connect4 is a proving workload, not part of the JSMinSys API.

## Method

1. Catalog the primitive operations actually demanded by real implementations.
2. Catalog recurring higher-level abstractions built from those primitives.
3. Catalog recurring whole-block solutions.
4. Map all three layers onto a minimal computational basis.
5. Challenge every operation: remove it, derive it, or justify it by total physical cost.
6. Qualify admitted JavaScript forms against optimized V8 assembly and CPU cost data.
7. Prefer representation changes, structural reuse, doing nothing, and lazy handling over added machinery.

## Optimization order

1. Design or redesign the representation for leverage.
2. Do nothing.
3. Do the laziest thing that works.
4. Exploit existing structure.
5. Redesign the representation when the structure is not doing enough work.
6. Add machinery only under extreme pressure.

## Runtime configuration

Geometry is configured at initialization and is immutable during hot execution. JSMinSys uses initialization to prepare constants/tables, but hot functions remain correct across supported configured widths and heights unless explicitly documented as representation-specific specializations.

## Numerical direction

The working hypothesis is a 32-bit word domain for hot computation. Wider logical values are composed from additional 32-bit words rather than BigInt unless measurement produces contrary evidence.

## Status

Draft 0.2 implementation bootstrap. The current function catalog implements every research block expressible with the admitted vocabulary; missing-primitive cases are isolated in `catalog/deferred-primitives.md`. See `SPEC.md` for normative intent and `catalog/` for the Connect4-derived research inventory.


## Admission principle

Slow operations are allowed when their cost can be accounted for faithfully. JSMinSys makes cost visible; it does not forbid an operation merely because it is expensive. Application authors decide whether a function's cost is justified.

## Implementation status

The current catalog implementation is exported from `src/index.mjs`.

- 298 catalog functions implemented
- 30 of 30 research blocks implemented
- fixed-width relational/RBA-enabling blocks cover 3/6/8-lane sets, six-word skylines, exact wide keys, durable intervals, sparse remaps, and generation-stamped intrusive work lists
- worker execution substrate covers stamped take/validate/release, runtime-count dependency publication, retained-child handoff, wake/park, and stop/done polling while leaving the outer loop and evaluator application-owned
- typed capacity allocation admitted and costed through NEES
- coordinate decode is implemented only as a comparison/reference anti-candidate
- `Number.isInteger` was reviewed and rejected as unnecessary inside the sealed scope

Run:

```sh
node tools/verify-catalog.mjs
node --test test/*.test.mjs
```

to verify catalog/admission consistency and behavior.

## Cold host add-ons

Optional shared behavior controls: [worker behavior contract](docs/worker-behavior.md).
Select `BehaviorWorker` during initialization to consume a strategist-owned,
four-word extensible flag set. Ordinary `Worker` and current Lazy SMP execution
remain unchanged. The flag transport does not define PFIF or domain behaviors.

Host lifecycle that is intentionally outside JMS-RESTRICTED/JMS-SEALED hot
execution lives under `addons/`. These modules may use Node host mechanisms
such as worker threads, promises, timers, rich errors, and ordinary objects when
their cost belongs to cold session setup/teardown rather than the hot kernel.

`addons/branch-manager-host.mjs` provides reusable branch-manager-style thread
session mechanics:

- file-worker execArgv sanitation;
- worker/error/exit bookkeeping;
- fail-closed first-error signaling;
- deadline and AbortSignal cancellation;
- stop/wake teardown and terminate+join cleanup;
- prepared numeric metric views and aggregation; and
- shared TypedArray byte accounting.

Applications still own root/table initialization, thread roles and workerData,
domain result/status interpretation, and the external solve API. The cold add-on
is cataloged separately in `catalog/addons-v0.json`; it does not enlarge the
sealed hot vocabulary.

### Connect4 parallel execution

The canonical libraries expose `runLazySmpConnect4Rba32` for exact Connect4
parallel execution. The promoted package also exposes `prepareLazySmpConnect4Rba32`
to allocate tables, create workers and complete the readiness barrier before
`solve()`. Both preserve the 2+ worker contract; the package defaults to four.

- `workerMode: 'legacy'` is the compatibility default. It uses
  `rba-connect4-lazy-smp-worker.mjs` and retains the existing CPC/NDC-first
  alpha-beta path plus Behavior/Root-Frontier compatibility.
- `workerMode: 'minimal'` selects the admitted generic, native-cache, basis-view
  or compiled-transition workers during initialization. It uses exact
  canonical-RBA Negamax/alpha-beta, guarded current-position tactical certificates,
  and local/shared TT access. The promoted configuration alternates center and
  live-line move ordering across its four deep workers. Neutral/gray-token
  ownership is quotiented by RBA q, and child reflection is canonicalized before
  TT identity.

Prepared minimal execution rejects legacy-only Behavior and Root-Frontier options.
The promoted `sharedProofBounds:true` configuration shares committed exact W/D/L
and licensed zero bounds; hash equality alone never licenses a cache hit. Node,
cutoff and cache-hit counters are unavailable in this path. Cold session lifecycle
mechanics remain in the support libraries; no shared surplus task queue is used.

The current prepared candidate is [the self-contained IsoMax package](isomax/README.md):
four deep workers, initialization-selected geometry, and a 32-byte standard TT.
The following records the **historical frozen version**, preserved for recovery.

The earlier owner-selected localhost configuration was **one wide/root-frontier
worker and three deep workers**, pinned to four P-cores on the Windows
i5-12600K. Its shared TT is **5 GiB** and each private cache is **576 MiB**. This is a
hardware-specific measured selection, not a portable default or a proven
empty-board optimum. Full sharing and exact-only shared publication are retained.

The [historical version lock](profiles/isomax-current.json) preserves the exact
measured composition: one structural phase from empty computes five moves,
then one unchanged exact search starts at the unresolved position. The combined
operation measured **47.033 seconds**. See [reproduction and preservation](docs/isomax-current.md).
The lock records source hashes, capacities, worker roles, affinity, runtime, and
evidence. Affinity is set before solver initialization. The earlier 10 GiB profile
and its [promotion record](evidence/isomax-selected-promotion-20260929/REPORT.md)
remain historical evidence, not the current selection.

`tools/run-isomax.mjs` retains the historical seven-worker Node 26.7 comparison
profile in `profiles/isomax-i5-12600k.json`. It does **not** automatically select
the prepared candidate's memory/affinity profile. Both historical tools use the native root-frontier
worker; no strategist or runtime source rewriting is involved.

See [scope and conformance](docs/isomax-root-frontier-nees.md) and
[campaign cleanup history](history/2026-09-27-selected-frontier-cleanup.md).

Lazy SMP requires at least two search workers. Generic TT, worker, and
BranchManager primitives remain reusable library/research building blocks, but
they no longer constitute a supported Connect4 execution composition.

### Runtime-configured RBA and Lazy SMP add-ons

The RBA add-on stack derives its carrier from application configuration at initialization. It does not assume a 7x6 board, 69-line basis, eight-word q, or seven actions.

- `addons/rba-connect4-geometry.mjs` derives winning lines, residual shapes, coordinate lanes, q layout, reflection, action order, and capacities from configured columns/rows.
- `addons/rba-connect4-coordinate.mjs` supplies native cofactor/basis/reflection mechanics over that prepared profile.
- `addons/rba-connect4-front.mjs` supplies the configured four-front algebra.
- `addons/rba-connect4-ingress.mjs` supplies cold external-root conversion only.
- `addons/cpc-connect4.mjs` supplies conservative CPC/NDC closure: per-column XOR event parity, exact exhaustion/paired-response bounds, immediate terminal/fork closure, forced-block restriction, and non-authoritative projected future forks.
- `addons/rba-connect4-alphabeta.mjs` supplies the CPC-first exact negamax/alpha-beta control path. CPC-only mode scores live-line contributions and packs sorted action rows into per-depth numeric scratch; prepared action order breaks score ties.

Fixed 3-bit/fixed-lane helpers remain optional specializations only. The general paths use runtime-sized spans and one height word per configured column, so rows above seven and boards above 64 cells do not require board reconstruction or a new solver representation.

**Compiled containment:** Geometry initialization builds exact grouped strict-superset masks in two bounded passes over the residual catalogue (at most 14 proper nonempty subsets per shape). The immutable tables are shared with workers and borrowed by their execution profiles. This applies to every admitted board size, including 7x5; it has no fixed shape-count or byte-sized word-index limit. Word indices select native Uint8/Uint16/Uint32 storage at initialization; mask/offset words remain Uint32. `containmentBytes` reports required table storage separately from the optional dense specialization budget.

**Prepared coordinate APIs:** `rba-connect4-coordinate-prepared.mjs` and `rba-connect4-coordinate-dense.mjs` are generated from the canonical coordinate implementation. Select dense only when `geometry.removeByCell !== null`; use prepared otherwise. Both require the distinct, preallocated `map`, `inverse`, and `seen` arrays produced by `prepareConnect4RbaCoordinateScratch`, with seen offset zero. The public optional cofactor also supports omitted scratch and nonzero seen offsets; its seen span must remain disjoint from target/inverse storage throughout closure. The generic Worker base still owns identity/execution; these game-specific functions belong to RBA support libraries.

**Initialization-time specialization:** `prepareConnect4RbaExecutionProfile()` selects eligible fast paths once after geometry preparation. Current selectors include dense versus sparse residual transition/subset relations, 3-word versus runtime-span coordinate permutation, and 6-word versus runtime-span skyline/product. The hot path calls the selected implementation without re-testing board width/height. The dense-table choice is additionally bounded by the initialization specialization memory budget.

See `catalog/rba-addon-v0.json`.
**Four-Front A/B status:** recursive Four-Front remains available as an experimental/reference refinement, not the primary unresolved fallback. On the qualified unresolved rank-28 standard-7x6 control it reduced alpha-beta nodes from 54 to 37 but increased measured runner time from about 0.27 ms to 6.74 ms while performing 3,703 front steps. This is directional single-run evidence; broader performance qualification remains required.


Retired execution models and source recovery: [Lazy SMP cleanup history](history/2026-09-26-lazy-smp-only.md).
