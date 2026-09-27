# IsoMax cofactor support-plan reuse census — 2026-09-27

Status: diagnostic result; instrumentation-only; no timing claim.

## Purpose

Measure whether the geometric part of Connect4 RBA cofactor work is repeatedly
reconstructed for the same gravity support and landing column.

For standard 7x6, the current basis is a deterministic function of support.
For a legal landing column, therefore, these are support-derived:

- landing cell;
- removed parent-shape -> child-image mapping;
- child basis;
- child image -> child index mapping;
- cardinality boundaries;
- upset/superset placement within the child basis.

P0/P1 coordinate membership and W/D/L are deliberately excluded from this plan
identity.

## Provenance

Workflow: `IsoMax cofactor plan census`  
Run: `36343835908` — success  
Artifact: `10939283146`  
Artifact digest:
`sha256:e4031e296d0af41390042f2f57ed57081b9acef39c6ebd97729348250194d762`

Runtime:
- Windows GitHub hosted VM;
- AMD EPYC 7763;
- Node 26.7.0 / V8 14.6.202.34-node.28.

The source hook changes only measurement behavior. Instrumented elapsed time is
not admissible performance evidence. Exact solver result and normal production
metrics are checked.

## Long control — 353335714

Exact result:
- absolute WDL = 1;
- mover-relative = +1;
- 11,755,731 solver nodes;
- 11,813,310 production cofactor metric.

Census entry count differs by root/ingress calls as expected:
- all known-height cofactor calls: **11,813,319**;
- deep nonterminal cofactor constructions: **11,755,740**.

### Reuse

- unique gravity supports observed: **34,393**;
- unique `(support,column)` keys: **137,913**;
- unique deep plan keys: **137,909**;
- repeated all-call occurrences: **11,675,406 / 11,813,319 = 98.8326%**;
- repeated deep occurrences: **11,617,831 / 11,755,740 = 98.8269%**.

The hottest plan occurs **82,883 times**.

Reuse is highly concentrated:

| Calls per plan key | Keys | Calls | Share of all calls |
|---|---:|---:|---:|
| 1 | 25,748 | 25,748 | 0.22% |
| 2 | 16,138 | 32,276 | 0.27% |
| 3–4 | 19,112 | 65,596 | 0.56% |
| 5–8 | 19,775 | 123,983 | 1.05% |
| 9–16 | 17,596 | 210,763 | 1.78% |
| 17–32 | 13,974 | 324,352 | 2.75% |
| 33–64 | 9,824 | 449,509 | 3.81% |
| 65–256 | 10,455 | 1,312,446 | 11.11% |
| 257+ | **5,291** | **9,268,646** | **78.46%** |

Thus:
- 3.84% of unique plan keys carry 78.46% of calls;
- 11.42% of keys (65+ calls) carry 89.57% of calls;
- 18.54% of keys (33+ calls) carry 93.37% of calls;
- 28.67% of keys (17+ calls) carry 96.12% of calls.

Reuse strengthens sharply with rank:
- rank 20: 81.19% repeated;
- rank 24: 91.07%;
- rank 28: 97.10%;
- rank 30: 98.60%;
- rank 32: 99.34%;
- rank 34: 99.72%;
- rank 36: 99.90%;
- rank 38: 99.97%;
- rank 39: 99.989%;
- rank 41: 99.993%.

## Short control — 45461667

- cofactor calls: **62,073**;
- unique supports: **6,037**;
- unique plan keys: **14,443**;
- repeated calls: **47,630 = 76.73%**;
- deep repeated fraction: **76.72%**;
- hottest plan: 111 calls.

The reuse effect is therefore not unique to the long fixture, although its
magnitude grows dramatically in the deeper workload.

## Interpretation

The hypothesis survives very strongly.

The current solver repeatedly rebuilds support-derived cofactor geometry. This is
not a marginal reuse opportunity: on the long control nearly 99% of deep cofactor
calls have a prior occurrence of the same support/column plan, and a very small
hot subset dominates traffic.

This does **not** prove a plan cache will be faster. Historical IsoMax results
show that high hit rate can still lose when lookup/storage overhead exceeds
recomputation. Any implementation must therefore compare total solve cycles
against direct recomputation.

The concentration result materially changes the candidate design. A bounded
hot-plan store does not need to cover all 5.76M possible 7x6 support/column keys.
A relatively small retained set can potentially cover most dynamic calls.

## Candidate payload boundary

A plan may contain only geometry/support-derived data, for example:

- child basis size/content;
- parent-basis index -> child image/index;
- cardinality boundaries;
- precomputed child-coordinate closure/upset masks for surviving images;
- terminal landing metadata derivable from support.

It must not contain:

- W/D/L;
- exact-cache values;
- CPC conclusions;
- player coordinate membership;
- solved-position labels;
- best moves or other solution-derived information.

This preserves the strict solver-information provenance rule discussed for
IsoMax.

## Next gate

1. Finish the dense-remove / dense-subset / dense-both C1 factorial.
2. Use its winner as the direct-recompute baseline.
3. Build the smallest bounded support-plan representation capable of replacing
   the expensive support-derived work.
4. Keep the plan lookup numeric/fixed-width and allocation-free in the hot path.
5. Measure equal-search-work cycles on the long local control.
6. Reject if total solve cycles regress even with a high hit rate.
7. Only after local qualification test selected six-deep/one-wide whole-solve
   economics.

This result is strong enough to justify implementation of a bounded plan-store
experiment, but not promotion.
