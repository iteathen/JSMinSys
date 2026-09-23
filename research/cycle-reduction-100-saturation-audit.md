# Cycle reduction round-100 — saturation audit after admitted structural wins

This round deliberately adds **no new hot function**.

After round 099, the remaining pinned IsoMax campaign candidates were re-audited against:

- the current JSMinSys function catalog;
- the complete accepted/rejected worker qualification record;
- the current NEES cost vocabulary;
- the actual ownership/preparation boundaries of the pinned workload.

The purpose is to stop variant manufacture and identify the real next boundary.

## Qualified mechanisms now represented

The strongest accepted hot mechanisms from the pinned campaign are represented by current JSMinSys profiles or stronger structural successors:

- recursive scalar prepared-key reuse -> retained/scalar key, probe, publication and caller-carried profiles;
- support-first canonicalization -> round 098;
- repeated residual-word load reuse -> round 097;
- singleton metadata direct projection -> round 099;
- signed/raw hash carriage -> earlier signed locator/hash rounds;
- prepared masks / integer bit formation -> existing shift, known-cell and prepared-geometry transition profiles;
- fixed residual transition lookup -> existing prepared residual-transition profiles;
- transition state packing/caller ownership -> the packed, center-omitted and caller-carried transition families.

## Strong remaining measured opportunities

### 1. Residual transition prefix size — configuration-owned

The pinned issue-75 experiment enlarged the preallocated residual transition memo prefix from 4K to 64K classes.

Measured medians:

- serial: 2304.59 -> 1943.12 ms (~15.7% lower);
- one worker: 2666.45 -> 2375.84 ms (~10.9% lower);
- four workers: 2362.54 -> 2065.04 ms (~12.6% lower).

Cost: two 65,536 x 42 Int32 tables, about 21 MiB per pool in that workload, with higher observed process RSS.

This is **not a missing JSMinSys hot primitive**. The hot hit is already the configured residual lookup shape represented by `residualTransition32` / prepared-base variants. The unresolved decision is how much memo domain an application should reserve at initialization given its reuse distribution and memory budget.

JSMinSys should not hard-code 65,536. The application may select that exact profile when its measured workload proves the same economics.

### 2. Narrow WDL payload storage — blocked by cost authority

Pinned issue 101 specialized the ordinary exact cache payload from generic Array storage to Int8Array because the semantic value domain is exactly {-1,0,+1}.

Measured medians:

- serial: 1426.74 -> 1398.97 ms (~1.95% lower);
- one worker: 1794.91 -> 1752.34 ms (~2.37% lower);
- four workers: 1551.05 -> 1520.15 ms (~1.99% lower).

The mechanism is credible and independently qualified.

However, the active JSMinSys/NEES emission vocabulary provides `LD32` / `ST32` and the NEES reference model provides 32-bit memory load/store costs. It does **not** currently provide a qualified 8-bit typed load/store operation.

Therefore JSMinSys must not admit the Int8 profile while pretending its memory operations cost the same as already-modeled 32-bit emissions. The opportunity remains explicit unresolved debt until the parent cost authority supplies a valid model/evidence.

## Falsified candidates kept rejected

The audit rechecked several locally attractive changes that already failed at the governing worker boundary:

- terminal-before-q: ~0.44% serial slower and ~0.14% one-worker slower;
- affected-slot blocker traversal: serial ~0.95% slower despite ~1.53% one-worker improvement;
- dense blocker fusion: ~1.51% serial slower and ~0.71% one-worker slower;
- hit-first growth/interning: slower/neutral under real reserved tasks;
- blocker chunk memo layers: measured reuse was high but both memo layouts regressed;
- checked/unchecked primitive split: serial slower, worker neutral;
- manager visitation epochs and extra cache reservation: confirmation runs rejected them;
- no-win/exhaustion shortcuts: reduced work in strata but failed worker timing / interaction qualification.

They are not eligible for resurrection merely because a local ledger appears favorable.

## What remains irreducible versus removable

A precise percentage of total runtime is **not defensible from the JSMinSys catalog alone**.

The catalog is a static serial cost authority over reusable primitives; the pinned worker timings are measured on integrated historical implementations. The current set of JSMinSys profiles has not been substituted wholesale into one measured Connect4 build. Summing historical percentage wins would double-count interacting changes and violate NEES governing-unit accounting.

Accordingly this audit makes no fabricated “X% irreducible” claim.

What can be stated safely:

**Currently required / not shown removable under admitted evidence**

- exact residual/key equality after locator narrowing;
- actual residual transition computation on memo misses;
- required final normalized-state materialization;
- required recursive child evaluation not eliminated by semantic proofs;
- memory accesses that remain authoritative state rather than mirrors;
- cache collision traversal that survives exact locator/equality requirements.

**Still structurally removable or unresolved**

- application-selected memo coverage when memory buys enough avoided recomputation;
- narrow payload storage once LD8/ST8 receives valid NEES cost/lowering authority;
- integration-specific spill/frame traffic for caller-carried state profiles;
- any remaining workload-specific coordination/parallel duplicate work, which belongs to the E2/application governing unit rather than a new arithmetic helper.

## Saturation conclusion

For the current admitted JSMinSys vocabulary and pinned Connect4 workload evidence, no additional high-confidence hot helper is justified after round 099.

The next legitimate optimization frontier is one of:

1. integrate the best selected profiles into a measured governing workload and expose the new dominant cost;
2. extend NEES cost authority for a genuinely needed operation such as 8-bit typed memory, with current runtime evidence;
3. obtain new workload evidence that falsifies one of the present “required/unresolved” classifications.

Until one of those occurs, adding more narrowly named variants would reduce auditability without establishing lower total machine cost.
