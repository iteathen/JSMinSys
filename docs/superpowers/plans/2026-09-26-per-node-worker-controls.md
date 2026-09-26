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

- [ ] Add failing tests for the prepared atomic reader and live optional-worker cancellation.
- [ ] Add cold reader preparation and the bounded WebAssembly deviation; qualify primary and extension publication.
- [ ] Generate the opt-in solver variant from baseline source; propagate cancellation separately from WDL. Select it in the host only when shared behavior is supplied.
- [ ] Add exact differential, completion-path, cross-worker and plain-worker isolation tests.
- [ ] Update all affected cost ledgers and generated-source guards; run catalog, geometry and full test checks.
- [ ] Benchmark actual searches in paired order with total process cycles, setup/search breakdown, nodes and checks. Record raw results without a full-NEES claim.
- [ ] Review, commit, push, and update PR #51 with the actual integrated scope and remaining limits.
