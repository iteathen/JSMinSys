# JSMinSys

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

- 295 catalog functions implemented
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

### Runtime-configured RBA + TT + solver add-ons

The RBA add-on stack derives its carrier from application configuration at initialization. It does not assume a 7x6 board, 69-line basis, eight-word q, or seven actions.

- `addons/rba-tt32.mjs` takes initialization-selected `keyWords`, `basisCapacity`, and `edgeCapacity`.
- `addons/rba-connect4-geometry.mjs` derives winning lines, residual shapes, coordinate lanes, q layout, reflection, action order, and capacities from configured columns/rows.
- `addons/rba-connect4-coordinate.mjs` supplies native cofactor/basis/reflection mechanics over that prepared profile.
- `addons/rba-connect4-front.mjs` supplies the configured four-front algebra.
- `addons/rba-connect4-solver.mjs` supplies RBA-native evaluation, publication, reconciliation, and cold ingress.
- `addons/cpc-connect4.mjs` supplies conservative CPC/NDC closure: per-column XOR event parity, exact exhaustion/paired-response bounds, immediate terminal/fork closure, forced-block restriction, and non-authoritative projected future forks.
- `addons/rba-connect4-alphabeta.mjs` supplies the CPC-first exact negamax/alpha-beta control path. CPC-only mode iterates the immutable prepared action order directly and carries no per-depth action-order scratch.

Fixed 3-bit/fixed-lane helpers remain optional specializations only. The general paths use runtime-sized spans and one height word per configured column, so rows above seven and boards above 64 cells do not require board reconstruction or a new solver representation.

**Initialization-time specialization:** `prepareConnect4RbaExecutionProfile()` selects eligible fast paths once after geometry preparation. Current selectors include dense versus sparse residual transition/subset relations, 3-word versus runtime-span coordinate permutation, and 6-word versus runtime-span skyline/product. The hot path calls the selected implementation without re-testing board width/height. The dense-table choice is additionally bounded by the initialization specialization memory budget.

See `catalog/rba-addon-v0.json`.
**Four-Front A/B status:** recursive Four-Front remains available as an experimental/reference refinement, not the primary unresolved fallback. On the qualified unresolved rank-28 standard-7x6 control it reduced alpha-beta nodes from 54 to 37 but increased measured runner time from about 0.27 ms to 6.74 ms while performing 3,703 front steps. This is directional single-run evidence; broader performance qualification remains required.

