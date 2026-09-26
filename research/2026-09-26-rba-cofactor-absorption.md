# C1: completed child-coordinate closure absorption

## Scope and disposition

Candidate implementation: `f6080f7d08fee6f561142b533a67ee570c8bd7a5`, with
canonical source-hash correction `393b8a1ac98d13ece5109246620b072ee92878dd`.
Baseline: `04d37498607ace16dae33c79462ddfe1503c8a0d`.
This is an affected-scope JSMinSys / NEES-EXTREME review and bounded performance
screen, not a new certification of the entire solver or all supported runtimes.

NEES authority: Draft 0.5, `iteathen/NEES@7650bef0aecc0d2b226ecf253a1f8937ccf89d69`;
SPEC, CONFORMANCE, COST_ACCOUNTING and NODE_V8_METHODS. JSMinSys SPEC Draft 0.2
and the current RBA coordinate/geometry contracts govern realization and semantics.
Durable Connect4 campaign/evidence owner: `research/semantic-quotient`,
`research/isograph/discovery/2026-09-26-isomax-core019/optimization/`.

- Changed E0/E1 entry: `connect4RbaCofactorKnownHeight`, including its configured
  dense/sparse subset helpers. Ordinary cofactor and solver callers are affected.
- Governing performance unit: four-worker `runLazySmpConnect4Rba32`, including
  root ingress, worker startup, solving, termination and join. Prepared geometry,
  imports and native counter setup are outside the measured service boundary.
- Mechanism: SEMANTIC + DERIVATION. Causal role: COUPLED. Extra target membership
  loads/tests avoid repeated upward-closure work; their net cost must be measured.
- Regression surface: both players, arbitrary valid residual coordinates, first
  win, induced support bases, optional inverse maps, reflection consumers,
  dense/sparse geometry profiles and non-7x6 configurations.
- Runtime: Node 26.7.0 / V8 14.6.202.34-node.28, Windows x64,
  Intel Core i5-12600K. No affinity/power-state guarantee or universal claim.

## Guard and proof

The target is cleared before construction. Each previous insertion finishes its
principal upset in this same child basis. Thus an image already present implies
that its upward closure is present. Test this independently in each surviving
player's coordinate, before writing the current image. Expand only uncovered
players, or skip when both are covered. There is no cross-player inference.
Induction over completed insertions preserves the exact final coordinate.

The child-basis contract and cardinality-ordered superset enumeration are
unchanged. Terminal detection precedes this guard. Signed bit-31 results are
only tested for zero, never ordered. No new retained state, arena, allocation,
string operation, callback, conversion or synchronization is introduced.

Invalidating conditions: partial prior closure, a changed basis during insertion,
cross-player coverage, side-effectful subset helpers, or moving the check after
the current image write. The protected source comment records these obligations.

## Qualification and accounting

The new principal-upset regression fails on baseline (three preparations versus
one required) and passes on C1. The independent physical residual oracle checks
over 1,000 transitions across 4x4, 7x6 and 10x10, dense/sparse profiles, both
players, terminal metadata and reused buffers. Its expected basis still uses
the unchanged support-basis generator; this is not an independent geometry proof.
Full library tests: 159/159. Catalog and runtime-geometry gates pass. An independent
bounded implementation review found no blocking correctness or hot-path issue.

`catalog/addon-cycle-ledger-v0.json` exposes additional membership loads, address
arithmetic, masks and conservative control terms, while absorption reduces PS/U
expansions. It is an inherited symbolic source-operation envelope, not exact
Intel instruction/cycle accounting. Canonical source blob:
`6c10f0b4b2bc9371bfb1ada4d44cde5eb6ea31f6`.
JIT lowering, overlap, cache effects and worker race work remain measured unknowns.
The first ledger hash was based on mixed checkout line endings; the separate
correction binds canonical bytes. No verifier requirement was weakened.

Real whole-process cycles use Windows QueryProcessCycleTime through the existing
Connect4 counter, summing all threads without nominal-GHz conversion. Six fresh
process samples per variant/root, three ABBA blocks, four workers, unchanged
cache capacities 65536, sample mask 7, CPC-only policy and five-second cap:

| Input | Baseline ms | C1 ms | Baseline process cycles | C1 process cycles | Cycle change |
|---|---:|---:|---:|---:|---:|
| 45461667 | 1116.62 | 1053.27 | 18,460,174,998 | 17,541,083,126 | -4.98% |
| 13333111271421 | 928.85 | 883.47 | 15,206,157,609 | 14,563,022,063 | -4.23% |
| 13333111444444 | 2045.45 | 1980.04 | 31,502,592,588 | 30,490,548,316 | -3.21% |

All 36 results and moves matched; cleanup succeeded. All nine block comparisons
favored C1 in time and cycles. The node field is winner-only; no process
cycles/node or all-worker throughput is inferred from it. These are quick solved
controls, not a complete Fhourstones score, empty-board result or eight-worker claim.

Separate diagnostics: 271 prefix/action transitions have identical output digest;
subset tests fall 188,885 -> 179,160. This is mechanism evidence, not full-tree
operation accounting. V8 emits TurboFan code for both versions; one separate
traced run each records two baseline and three candidate eager deopts, all with
`Insufficient type feedback for binary operation` at bytecode offset 461.
This is an existing deopt signature, not proof of equal deopt rates. Trace timings
are excluded. No claim of allocation-free generated machine code or exact
per-instruction cycles follows from these observations.

## Rule disposition and reopening

CONFORMS for the changed scope: semantic preservation under the stated guard;
numeric/preallocated hot execution; general configured geometry; no added hot
allocation or representation conversion; explicit whole-operation causal unit;
symbolic cost unknowns; isolated diagnostics and bounded measured admission.
NOT-APPLICABLE to this delta: new concurrency/lifetime/FFI/resource ownership,
new builtins, q identity changes, serialization or boundary machinery.
UNVERIFIED beyond this screen: all workloads/platforms, full system conformance,
allocation/GC counts, all-worker dynamic node totals, exact assembly cycle costs.
No deviation is used to turn missing evidence into a conformance claim.

Admit C1 to repository review on this evidence. Reopen on changed coordinate/
basis/helper contracts, runtime/profile changes, differential mismatch, or an
enclosing workload regression. C2/C3 remain separate experiments. Connect4's
dependency pin and qualified IsoGraph rendering are not changed by this PR.
