# Per-node worker controls implementation plan

**Goal:** repair the optional worker so shared behavior is observed at every completed-node boundary during an actual search.

**Architecture:** ordinary Lazy SMP remains unchanged. A prepared optional worker uses an atomic i32 reader over shared WebAssembly memory; JS owns the existing extension publication protocol. A reproducibly generated control-enabled search variant instruments the ordinary solver's exact completion/forced-transition boundaries, with explicit cancellation propagation. The ordinary solver remains the single algorithmic source, with no runtime source rewriting.

**Spec:** owner-approved per-completed-node contract; `docs/worker-behavior.md`; `SPEC.md`. The narrow WebAssembly mechanism needs an explicit scoped JSMinSys deviation and cost ledger; no claim of full NEES qualification.

**Constraints:** sole strategist writer; primary read per completed node, no sampling; extension reads only if marked; no messages, allocations, strings, or dynamic generation in search; no TT mutation by strategist; keep the plain worker path. Cooperative stop is the first concrete flag, pending owner steering. PFIF decisions remain out of scope.

## Review focus

- Publication during search: real worker must cancel before root completion.
- Cache/CPC/cutoff/terminal and forced-chain paths: completion reads cannot be bypassed.
- Cancellation: no unfinished-parent value or WDL publication; retained exact cache rows remain valid.
- Extension publication races: defer inconsistent snapshots, preserve unsigned payloads.
- Ordinary baseline: source unchanged, deterministic zero-flags node/value/move equality; quantify whole-solve cost.

## Tasks

- [x] Add failing tests for the prepared atomic reader and live optional-worker cancellation.
- [x] Add cold reader preparation and the bounded WebAssembly deviation; qualify primary and extension publication.
- [x] Generate the opt-in solver variant from baseline source; propagate cancellation separately from WDL. Select it in the host only when shared behavior is supplied.
- [x] Add exact differential, completion-path, cross-worker and plain-worker isolation tests.
- [x] Update all affected cost ledgers and generated-source guards; run catalog, geometry and full test checks.
- [x] Benchmark actual searches in paired order with total process cycles, setup/search breakdown, nodes and checks. Record raw results without a full-NEES claim.
- [x] Independent review and implementation commits: 7c0bb71 and 095d66d. Final publication accompanies this record in PR #51.

## Execution record

Ruling: cooperative STOP is the first concrete flag; no owner alternative was
received after the question/notice. Other bits remain reserved, not invented
ordering or PFIF policy. STOP never represents a WDL value.

Ruling: a separately generated module avoids recurring enable checks in ordinary
search and avoids maintaining two manual algorithms. CI enforces regeneration.

Ruling: bind the worker's byte address as a constant during initialization. The
argument-address candidate was functionally correct but more expensive in the
whole-solve probe. Retain both measurements in the evidence directory.

Qualified scope: 156 tests; catalog/regeneration/geometry checks; live publication
and two paired actual-solve fixtures. No full NEES claim, no hard sub-1% bound,
no SMP throughput claim. See `evidence/worker-behavior-search-20260926/RESULTS.md`.
