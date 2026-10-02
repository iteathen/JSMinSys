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
