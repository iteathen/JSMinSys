# IsoMax NEES audit — 2026-10-06

The audit is **not clean**. Source/provenance and preparation boundaries are substantially sound, but the enforced cost graph does not cover the active workers, several accounting checks are defective, and current optimized machine code contains numeric allocation paths. A successful catalog check cannot establish complete NEES cost conformance in this state.

This is an audit of the complete selected worker/support scope, including fallback paths, rather than a review of only the latest TT diff. It does not establish a wrong game result. It does not establish that every observed cost is avoidable, or that removing it improves whole-solve time. No solver, CPC, BSFP, package/default or main-branch implementation was changed.

## Targets and authority

| Target | Exact source | Scope |
| --- | --- | --- |
| Frozen production package 0.2.0-rc.4 | `40b19431f00174c5d52c442677d67ec698e8c50a` | 154 locked files, 77 runtime modules, 24 possible worker modules |
| Measured experimental partial24/banked TT | `6bc1dd047209664f9924c4cb49597a2154555107` | Current producer add-ons/support, including four partial24 and four partialMixed variants |
| Audit source observation | `c6f584a90e55851319225abce824f67f5adc5c82` | No `addons/` or `src/` diff from the measured candidate |
| Normative authority | NEES `7650bef0aecc0d2b226ecf253a1f8937ccf89d69` | Draft 0.5, NEES-EXTREME; JSMinSys SPEC supplies the local restricted/cost profile |

The frozen package is the 32-byte production route. The 24-byte/banked candidate is experimental; its qualification does not change that package. There is no whole-runtime JMS-SEALED claim. Complete cost conformance and performance qualification are separate questions.

The machine observation is Windows x64 / Intel i5-12600K, Node `v27.0.0-nightly20260928b59840b593`, V8 `14.6.202.34-node.36`. Six discovered physical P-core workers are verified on CPUs 0/2/4/6/8/10. Shared TT: 12 GiB, two banks of 2^28 24-byte rows; private TT: 2^23 rows / 192 MiB per worker. Root frontier is off, shared sample mask is zero, proof bounds and compiled support plans are retained. Inlining flags are 2400/9600. The primary solve boundary includes actual empty-root construction after READY; initialization and cleanup are separate. CPU-cycle measurement is unavailable for these diagnostic runs, not zero.

The inherited seven full-solve runs and correctness packet remain under `evidence/exact-tt-identity-20261006/` and Connect4 `docs/qualification/20261006-exact-tt-identity/`. Their 12 GiB mean is 36.857 s, not a <=10 s result. This audit adds two **10-second instrumented observations**, not new performance qualification. Both deliberately time out, return no WDL, and cleanly join all six workers. No full solve on 10x10 was attempted; sealed research holdout outcomes were not accessed.

## Confirmed accounting and enforcement defects

**L1 — The active compiled worker closure is outside the enforced graph.** `catalog/addon-cycle-ledger-v0.json` has 642 decomposed units, but its declared graph reaches only 168. All 12 current compiled/local32 module-main units are unreachable. In the frozen 563-unit ledger, all 24 packaged worker units exist but none of those worker roots is reachable. The current global name resolver sees 32 `negamax`, 32 `probeCache`, 32 `storeExact`, and 24 instances of each local-cache helper name. Selecting a function solely by global name cannot resolve this actual source-local/import closure. The 530 ambiguous/absent CALL records are an inventory statistic, not 530 proven active runtime defects. JavaScript module dispatch is not implicated. Required follow-up: root the actual prepared host and admitted worker variants, resolve local/import identities, and model admitted callback families. Authority: NEES-COST-003/007, JSMinSys SPEC sections 13–16.

**L2 — Callback expressions lose target-bound callee work.** `tools/ledger-index-partial-cache.mjs:6` emits `C(runtime.callback)` while its operations retain selected shared-store/probe targets. Renaming the targets at lines 54–55 and 72–76 does not create corresponding `CALLBACK(target)` expressions or update graph bindings. The verifier validates an expression's referenced operation but does not require every callback operation to have a reconstructible target-bound expression. The reproduction flags 43 current occurrences for investigation; this is not a blanket claim that all 43 violate the same active path. Partial24/partialMixed publication and probing are concrete affected paths. Authority: NEES-COST-003/007, local JMS-COST-001.

**L3 — The symbolic-parameter check uses ineffective regexes.** `tools/verify-catalog.mjs:158–162` uses double-escaped word boundaries in regex literals. Ordinary terms never match. The independent count parser finds eight undeclared count occurrences: IC, FS, OA and ERR in both `createConnect4RbaSharedLayoutCache32` and `attachConnect4RbaSharedLayoutCache32`. These also exist in the frozen ledger. PARK_DURATION is an explicitly unbounded wait label and is not included as an undeclared numeric selector. Authority: NEES-COST-003/007; COST_ACCOUNTING sections 5–6.

**L4 — Completion publication misses one conditional atomic store.** `addons/rba-connect4-lazy-smp-worker-minimal-views-compiled-proofs-local32.mjs:277` through its winner branch contains four result stores plus `Atomics.store(control,CONTROL_DONE,1)`. The module-main ledger records four stores without a winner-path selector. Two RMW operations and one notification do not account for the missing store. Its TEST description also says CANCELLED handling was removed although the source retains the sentinel guard. The partial24 descendant inherits the same accounting problem. This is E2 completion work, not per-node diagnostic statistics. Authority: NEES-COST-003/004.

**L5 — Broad resealing can hide unrelated inventory drift.** The partial-cache and memory-profile ledger scripts refresh source-blob guards across decomposed files rather than only the reviewed causal set. That can bind unchanged operation inventories to changed source. No unrelated corruption is established here; the integrity hole is in the maintenance procedure. Source identity is necessary, but is not a proof of operation completeness. Authority: NEES-COST-003/005, local source-guard discipline.

**L6 — Frozen evidence must bind to its own ledger.** The package does not vendor a ledger, which is not itself a NEES violation. The correct reproducible ledger is upstream `40b1943`, Git blob `f697fe6bdf866a5f3be15ee86ec71b43c446801b`. All 70 packaged runtime/add-on files checked against that ledger's source guards match; all 77 runtime modules bind to their frozen source. Package verification establishes identity and import closure, not complete transitive cost coverage. A current 642-unit checker result must not be presented as validation of the frozen 563-unit package ledger.

## Current machine evidence

The second diagnostic uses V8's per-isolate code files to avoid interleaved assembly. Raw evidence is in Connect4 `docs/qualification/20261006-nees-audit/partial24-banked-code-gc-02/`. The producer manifest records hashes and coverage. These findings are qualified to the **partial24 candidate**; matching source patterns in production do not establish identical machine lowering there.

**M1 — Unsigned hash arguments can allocate HeapNumbers.** In `code-31656-1.asm:20847–20860`, the center worker loads the completed uint32 hash, compares it to `0x7fffffff`, and on the larger-value branch converts it to double, advances young allocation top by 16 bytes and installs `heap_number_map`. It then passes the boxed hash to the uninlined `storeExact` at line 20882. Source: center proofs partial24 line 175. The live worker has the corresponding sequence at `code-31656-2.asm:3315–3330`, publication call 3352, source line 190. This is an inline allocation path with explicit conditions, not merely an allocator slow stub. Reached-call frequency and actual allocation counts were not measured. The complete hash remains exactness-bearing for partial-key reconstruction; truncating it would be unsound.

**M2 — Recursive negation retains negative-zero allocation paths.** Center assembly lines 22888–22929 and live lines 5747–5788 test converted double values and the sign of zero; negative zero uses a 16-byte HeapNumber path before recursion. Source: center partial24 line 210 and live partial24 line 227, `negamax(...,-beta,-alpha)`. Zero windows occur in the game value domain; JS unary minus preserves -0. This is a plausibly reachable boxing mechanism, not a wrong WDL result. Integer-normalized internal windows are a candidate only after proving sentinel, window and result transport. Other generic overflow allocation guards may be unreachable in the admitted domain.

**M3 — Dead slot and tail arguments are emitted.** Center assembly lines 18427–18430 compute and spill `hash & 0x7fffff`; lines 18521–18523 separately compute the actual local record address. Lines 20843–20844 tag/reload the unused slot and line 20868 passes it to `storeExact`, which does not use it. A zero tail is also pushed at line 20863. The live worker repeats this pattern. The source/ABI residue therefore has actual emitted work. Removing parameters can alter inlining, code size and spills, so savings remain unqualified. By contrast, `coord.seen` appears only in representative raw-source sections and seems eliminated by inlining; its emitted cost is not established.

**M4 — Broad inlining does not make every helper a native operation.** The latest center and live bodies inline 27 and 30 functions respectively, but retain calls to frontier subset comparators, some publication routines, the live scorer's `popcount3x32`, and AtomicsLoad builtins. Atomics return-value handling contains tagged-number guards. They cannot be priced solely as bare native loads/popcounts. A frontier record boxing guard is preceded by a record bound below 0x80000: that allocation site is not evidence of actual allocation on the admitted path.

| Worker isolate | Policy | Latest instruction bytes | Allocator slow-call sites |
| --- | --- | ---: | ---: |
| 1 | center | 42,192 | 20 |
| 2 | live | 45,276 | 20 |
| 3 | center | 40,100 | 17 |
| 4 | live | 48,112 | 21 |
| 5 | center | 47,300 | 30 |
| 6 | live | 48,564 | 23 |

These are static code sizes/site counts, including conditional and cold exits. They are not executed allocation counts, cache-miss measurements, or proof of an instruction-cache bottleneck. The actual captured Smi checks use signed 32-bit range, with 64-bit tag shifts by 32; assuming a 31-bit range would misdiagnose valid TT indices.

GC records establish runtime GC activity. Isolate clocks, ingress, tiering, deoptimization materialization and builtin allocations prevent reliable attribution from line order alone. The earlier mixed-output diagnostic's event totals must not be assigned to these latest bodies. No source aggregate construction was found in successful recursion; **machine-allocation-free execution is not established and cannot be claimed**. Authority: NEES-COST-005, JIT-003, XTRM-001/002.

## Preparation, ownership and documentation

**C1 — “All solver-owned allocation before READY” is too strong.** Connect4 `components/isometric/NEES_PROFILE.md:19–20` makes that claim. Prepared host `solvePreparedConnect4Search32` starts the primary clock and calls `connect4RbaFromMoves` after READY; ingress lines 69–70 and 82–89 allocate scratch, typed arrays, slices and a result object. This is one-shot E3 root construction included in primary time, not per-node aggregate construction. Persistent workers, TTs, plans and arenas are prepared before READY. The package README's narrower statement about worker creation and table allocation does not imply every E3 allocation has disappeared.

**C2 — Initialization timeout does not preempt synchronous setup.** The prepared host compiles support plans before registering the abort listener, and fills/allocates/spawns before its first readiness deadline check. Public discovery precedes that host clock. The actual control is a checked readiness deadline, not a hard upper bound for total synchronous setup. This limitation is source-established; a new preemptive architecture was not added.

**C3 — Closing joins workers but retained application closures retain buffers.** `closePreparedConnect4Search32` closes the managed session but does not clear captured root/shared/workerGeometry/geometry-plan references. Keeping the closed app reachable therefore keeps its buffers reachable. This is retention, not a reproduced leak. Lifetime/ownership should be stated; release would require preserving scalar result metadata separately before clearing storage. Pooling is not automatically better.

**C4 — Invalid oversized histories allocate before a cheap bound.** `connect4RbaFromMoves` allocates `new Uint32Array(moves.length)` before per-move legality and first-terminal checks. A `moves.length <= cellCount` ingress bound is missing. No huge malicious allocation was attempted. This does not affect the empty-root benchmark but belongs in cold admission debt.

**C5 — Historical “current” documentation is stale.** `docs/minimal-worker-nees-optimization.md:14–27` and portions of `docs/isomax-current.md` still describe an older rc.2/four-worker setup. Historical evidence is valid within its original boundary; headings must not make it authority for current automatic discovery or the partial24 experiment.

Positive checks: workers are created once during preparation; all-ready gating and TT page initialization precede search; Windows/Linux pinning is verified before private worker setup; macOS scheduling hints are documented honestly. Geometry-selected widths and budgeted fallbacks exist through 10x10. Large experimental profiles are labeled; auto-selection was explicitly owner-authorized. Resource admission considers available physical/process/commit constraints. Startup preload sets V8 flags and does not solve a position. Search metrics remain null rather than guessed zero. Exact partial-key equality and atomic sequence protocols are preserved. Recursive scratch is rank-owned; scalars needed after descendant calls are saved. No opening books, prior solved inputs or orchestration/Branch Manager solver role was introduced.

## Remaining recurring-cost inventory

`debt.json` carries mechanism, causal role, evidence, regression surface, admissible question and revisit trigger for each item. Principal source candidates beyond M1–M4:

1. Eager frontier-child/live-word construction before child-cache or tactical return (coupled pruning overhead).
2. Reflection scans every basis slot, including inactive coordinates; prepared active-union work may be shareable.
3. Compiled transitions load image data for some parent bits that neither owner retains after absorption.
4. CPC rechecks terminal/controller/mover facts proved by the caller; narrow-domain response limits could share extraction. CPC proof guards must remain intact.
5. Repeated full-column checks after live ordering, and pair-hub singleton-prefix scans/forced recursion. Existing fused pair-hub work must not be split back into old passes.
6. Generic proof workers re-extract mover facts; ordinary fallback cache paths retain fixed-layout dispatch/repacking.
7. General basis/inverse reconstruction remains needed on admitted fallback paths; C66 supersedes it only when complete compiled plans are admitted.

The review preserves prior economics: C34+C63 is a retained composite; C24 copying is superseded by C44 basis views, not all inverse construction. C64/C64P alternatives were rejected; C59/C60/C67 were unqualified and removed. C55/C56/C57 gates are already absorbed. Zero-live-word branches were rejected; current three-lane SWAR is intentional. None is silently reintroduced or globally declared useless. Changed overhead sharing or JIT behavior is a revisit trigger.

A stale-reflection-metadata suspicion was independently dismissed: metadata precedes the compared player coordinates, so it is not read by that comparison. No new missed-win, gray-token-identity or pruning correctness defect was reproduced by this audit.

## Disposition and next qualification boundary

`rule-dispositions.json` covers all 55 named rules in the pinned NEES SPEC; `method-dispositions.json` also records consideration of all 52 Node/V8 recipes, including explicit inapplicability where no priority queue or Fast API exists. Confirmed incomplete accounting is recorded as blocking UNVERIFIED with failed checks, rather than inventing owner-approved deviations. Source-established strengths are scoped; runtime-wide claims remain UNVERIFIED where machine/profile coverage is insufficient. Unknown cost is not silently zero. This packet is not a global-optimality or whole-runtime NEES certificate.

Priority follow-up is (1) repair actual-root/import/callback enforcement, selectors and conditional publication accounting; (2) qualify hash/window/ABI numeric realization together against the retained complete empty-board engine; (3) examine eager work and shared preparation without removing proof guards; (4) correct allocation/lifetime/current-profile documentation and cold admission. Each solver change needs bounded independent correctness across board dimensions and multiworker standard-7x6 whole-solve comparison. Neither a shorter function nor fewer nodes alone decides retention.

## Reproduction

From the producer root, use the recorded Node executable to run:

```text
node evidence/isomax-nees-audit-20261006/reproduce.mjs
node evidence/isomax-nees-audit-20261006/finalize.mjs
node tools/verify-catalog.mjs
node isomax/verify.mjs
```

The first two tools read source/evidence and write audit artifacts only. The catalog checker is expected to pass despite L1–L4; that is the reproduced enforcement gap. Package verification checks the frozen package, not current candidate costs. For optional assembly reproduction, use Connect4's `run-diagnostic.ps1 -RedirectCode` only with the recorded memory headroom and no competing solve. Its timing is deliberately diagnostic and must not promote or reject performance.
