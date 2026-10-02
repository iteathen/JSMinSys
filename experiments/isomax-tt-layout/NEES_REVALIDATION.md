# Reopened TT performance qualification

User review correctly challenged the incomplete machine-cost audit. Prior
correctness and full-size publication results remain valid; they did not prove
that the new representation carried no avoidable execution machinery. Earlier
small-cache inlining checks missed the relevant numeric index domain.

NEES authority fetched live: Draft 0.5, repository iteathen/NEES,
7650bef0aecc0d2b226ecf253a1f8937ccf89d69. Applied SPEC, CONFORMANCE,
NODE_V8_METHODS (especially M03/M05/M09/M13/M20/M27/M28/M44–M52), and COST_ACCOUNTING.
Scope is the changed shared TT and its callers; production semantics are inherited
unchanged, not a fresh NEES certification of the entire solver.

## Conformance declaration and realization record

- Target standard/level: NEES Draft 0.5 / NEES-EXTREME, JSMinSys Draft 0.2.
- Declared scope: compact shared TT accessors and preparation, generated from
  `cache-body.mjs`; their composition with the unchanged private TT and search.
- Execution classes: E1 probes/stores executed in E0 recursive node work;
  shared publication remains at that frequency (not mislabeled as infrequent E2).
  Geometry/layout/view preparation and evidence collection are COLD. Host startup
  and cleanup are unchanged E3 and included in the governing benchmark interval.
- Runtime profile: Node v27.0.0-nightly20260928b59840b593,
  V8 14.6.202.34-node.36, Windows 10.0.26200 x64, Intel Core i5-12600K;
  four deep workers pinned to P-core logical processors 0/2/4/6.
- Semantic owner: existing RBA canonical key, shared exact WDL 1/2/3 and seqlock
  contract in `addons/rba-connect4-shared-exact-cache.mjs`; only physical layout
  changes. Source files remain unchanged; no new independent WDL premise.
- Mechanism classes: REPRESENTATION, JIT-ENGINE, ALLOCATION-LIFETIME, LOCALITY.
- Causal role: COUPLED. Narrow field widths, address domain and memory footprint
  jointly affect the whole solve; diagnostic GC counts are subordinate evidence.
- Admission: valid prepared 7x6 compact keys, exact shared values 1/2/3; original
  runtime and 2^27 shared slots for the Smi-domain performance qualification.
  The general dimension-selected TT remains a correctness fallback, not a claim
  of measured performance at all sizes/capacities.
- Falsifiers: lost key distinction, publication mismatch, extra codecs, high-index
  boxing reappearing, or worse governing-unit cost/unsafe geometry fallback.
- Requalification triggers: Node/V8/platform change, table capacity above 2^27,
  different key/value domain, altered view layout, Atomics implementation or
  compiler lowering, changed topology, allocation lifecycle or workload.
- Cycle ledger: symbolic executed-path ledger below; no unsupported numeric
  instruction-latency table. Whole-process cycles are QueryProcessCycleTime on the
  exact CPU/runtime profile, not a sum of guessed one-cycle source operations.
- Conformance claim boundary: this records the affected methods and remaining
  debt. It does not self-certify the complete solver as JMS-SEALED/NEES-EXTREME.

| Applicable rules/methods | Disposition in this changed scope |
| --- | --- |
| EVID-001..007; M44/M47..M51 | CONFORMS: pinned authority/runtime, negative and positive domain controls, exact-revision whole-solve comparison; no promotion from a proxy |
| COST-001..007; M52 | CONFORMS: executed-path atomic counts, symbolic guards/memory/builtin/coherence costs, externally measured all-thread cycles; no zero-cost unknowns |
| CORE-001..005; XTRM-001..007; M45/M46 | New index-allocation mechanism REMOVED; coupled locality/operation cost qualified at whole-solve boundary; inherited optimization debt remains visible below |
| BOUND-001..004; REP-001..004; M01/M03/M05/M06/M08/M09/M10 | CONFORMS for declared domain: geometry preparation, stable two-view representation, native field access, unchanged exact identity/hash; controlled full-size numeric-domain evidence |
| ALLOC-001..004; M11/M13/M14 | New index boxing REMOVED; no per-node view/aggregate allocation, views rebuilt cold on the same backing. Other potential inherited payload boxing remains UNVERIFIED-DEBT |
| COMP-001..004; FINITE-001..002; M15/M16/M19/M38/M42 | CONFORMS: no additional node traversal or codec, no change to search complexity, existing compile-time specialization and cold layout choice |
| CF-001..002; JIT-001..003; M02/M17/M20/M22 | Stable signatures and branch-free dimension specialization retained; final generated-code evidence required before final lowering claims |
| CONC-001..004; M26/M27/M28 | CONFORMS for safety: same publishers/readers and seqlock order, no added global counters/retries; coherence cost remains symbolic and coupled to the measured layout |
| NATIVE-001; M31..M34 | No new hot native boundary; existing Atomics builtins costed symbolically. FFI cycle accounting is unchanged and outside the hot loop |
| DIAG-001; M35/M36 | CONFORMS: no added hot reporting; GC/JIT diagnostics run separately from scored solves |
| M29/M30 | Host worker creation/transport/cleanup unchanged; no claim of a newly reusable pool or a new lifetime optimization |

Methods about strings, priority structures, callbacks, dynamic aggregates, native
addons and arena generation redesign introduce no changed mechanism here. Existing
transitive contracts remain inherited, not reclassified as universally inapplicable.

## Established defect and controlled repair

At 134217728 entries, a byte-view index can reach 4294967291. On the qualified
Node/V8 Windows x64 runtime this exceeds Smi range. Full-size actual-accessor
diagnostics with small-valued keys and 200000 store/probe pairs show:

| Accessor/domain | Scavenges (whole diagnostic process) |
| --- | ---: |
| Old 40-byte table, highest slot | 4 |
| First 32-byte table, low slot | 4 |
| First 32-byte table, highest slot | 29 |
| Repaired 32-byte table, highest slot | 4 |

The counter is diagnostic GC trace output, not hot-loop reporting or a claimed
whole-solve GC attribution. `%IsSmi` confirms the index distinction. The
full-size domain regression failed before repair and passes after repair.
No scored timing uses native-syntax, GC, or compiler diagnostic flags.

Repair: native Uint16 heights at byte offsets 24/26; tail at 28; exact value
at 30. Sequence, support, and four full coordinate lanes remain Uint32.
Shared exact values are 1/2/3, so narrowing their storage to 16 bits is lossless.
The sequence counter retains all 32 bits, including original rollover behavior.
No new encoding, decoding, masks or shifts of key/value data are introduced.
Only two array views remain. Maximum halfword index at this capacity is 2^31-1.
Larger capacities may need separate runtime qualification; ordinary Number
address arithmetic is retained, with no unsafe forced int32 truncation.

## Governing unit and accounting

Target: complete existing four-deep localhost structural-prefix + single exact
solve, including cold host allocation/startup/cleanup. Private cache, hash,
move order, TT replacement, worker policy and solver/CPC are unchanged.
Regression surface: exact/terminal/gray key distinctions, collisions, concurrent
publication, cancellations, every source-frame offset, full-capacity last slot,
configured dimensions, allocation and actual compiled callers.

All narrow fields occupy disjoint byte ranges. Same synchronization ordering:
read current, CAS to odd, store key/value, publish even. Probe reads sequence,
compares key, reads value, checks sequence again. No synchronization is removed.

Successful full shared probe: 11 atomic loads (7 Uint32 + 4 Uint16), plus
unchanged support/tail construction and exact comparisons. Early returns execute
only the consumed prefix. Successful store: 1 atomic Uint32 load, 1 Uint32 CAS,
6 Uint32 stores and 4 Uint16 stores. Same total atomic operation counts as before.
Failed CAS and locked-slot paths retain their original work and semantics.

Costs remain symbolic: C(load32, locality/contention) and C(load16, ...),
C(store32, ...), C(store16, ...), C(CAS, ...), address arithmetic, guards,
view-property loads, builtin boundaries, and boxes/GC where realized. No native
one-cycle estimate is substituted for a V8 Atomics builtin. Whole-process cycles
are measured externally; no invented per-node frequency or cache-stall fraction.

Disposition of affected costs:

- New byte-index boxing: removed in the benchmark's full-capacity domain;
  caused by the first implementation, not intrinsic to 32-byte entries.
- Added third view/base calculation: removed; halfword base reused for all four
  narrow fields. Remaining two views enable lossless direct narrow access.
- Key packing: unchanged existing support/tail helpers; no new codecs.
- Generic geometry selection: cold only, direct fallback preserved. No new
  dimension checks inside the standard lookup/store.
- Integer overflow/typed-array bounds guards and Atomics builtin calls: observed
  in actual compiled caller, shared with baseline. Do not remove bounds checks
  or force signed indices without a full capacity-domain proof. Inherited guard/
  builtin optimization remains unverified debt, not claimed zero-cost.
- Uint32 payload boxing: potentially inherited in both versions; the index
  diagnostic isolates it by using small-valued payloads. No claim to have removed
  all solver allocation or certified the entire hot closure as optimal.
- Narrow operations/coherence: measured as a coupled whole-solve tradeoff;
  smaller storage or diagnostic GC reduction alone does not justify promotion.

Protocol frozen before repaired timing: one unscored warm-up then eight scored
ABBA BAAB runs. Same old 40-byte baseline, repaired 32-byte candidate, original
runtime/affinity and identical entry counts. Shared bytes differ 5→4 GiB;
private remains 576 MiB per worker. Retain all samples and paired uncertainty.
No promotion based on a single sample or only on a local diagnostic.
