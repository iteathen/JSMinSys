# IsoMax thorough NEES audit scope

Direct owner request on2026-10-06: perform a thorough NEES check after the12GiB
TT measurement. This is an audit, not permission to change solver semantics or
apply every suspected optimization. Preserve failures/debt and distinguish
source structure, accounting, artifacts, runtime realization and performance.

## Exact authorities and targets

- NEES Draft0.5 / NEES-EXTREME: `iteathen/NEES` at
  `7650bef0aecc0d2b226ecf253a1f8937ccf89d69`; live remote main confirmed identical.
  Local authority: `C:/r/NEES-isomax-rebuild-ref`.
- JSMinSys local profile: `SPEC.md`, including JMS-NEES/COST/DATA rules and
  restricted/transitive enforcement. No JMS-SEALED whole-runtime claim assumed.
- Producer initial planning head: `5cbc567b327bb0f7e780ae5414ce761b1cf4a1f8` on
  `work/isomax-auto-workers-20261006`.
- Actual measured partial24/banked runtime:
  `6bc1dd047209664f9924c4cb49597a2154555107`; producer head changes docs only.
- Consumer initial planning head: `87018ae7f01943b081202b1acf45f03e56438ca8` on the same
  branch name in `iteathen/Connect4`.
- Diagnostic observations later used producer `c6f584a90e55851319225abce824f67f5adc5c82`
  and consumer harness `919856663dcde038a9847594a40916f080946351`;
  `REPORT.md` and `manifest.json` distinguish these from the planning heads.
- Frozen production package0.2.0-rc.4 source:
  `40b19431f00174c5d52c442677d67ec698e8c50a`,154 locked files/77 runtime modules.
  The24-byte candidate is not the production package/default/main.
- Actual localhost realization: Windows x64, i5-12600K, six discovered verified
  pinned P-core workers0/2/4/6/8/10, Node27nightly20260928b59840b593,
  V8 `14.6.202.34-node.36`,2400/9600 inline flags and frozen startup preload.

The old private coordination router was inspected read-only. Its last exchanges
are2026-09-22 manager-era roles/tasks; this audit uses the current direct owner
instruction and does not resurrect those assignments or claim a registered role.
No external/control messages are sent. BSFP and sealed3x6-k4/5x3-k4 outcomes are
outside scope. No10x10 full solves.

## Audit work

1. Reconstruct both actual runtime closures and their cold/E0/E1/E2/E3 ownership.
   Compare retained native32 and measured partial24/banked routes; inspect generic
   fallback and initialization-selected widths through10x10 separately.
2. Check hot aggregate allocation/growth, redundant traversals/extraction, dead
   or absorbed ABI work, expensive operations, gate ordering and shared overhead.
   Preserve exact guards and existing qualified composite choices.
3. Check every actual function/callback/module-main against the cost inventory:
   source identity, executed branches, native widths, callee aggregation, unresolved
   symbols, synchronization, and stale lower-level profiles/claims.
4. Check worker creation, page warming, resource admission, timeout/cancellation,
   close/retention and package/provenance/thin-consumer boundaries.
5. Inspect existing current-runtime JIT evidence and identify missing machine
   evidence. Use read-only or bounded diagnostic probes where they can resolve
   uncertainty; no hot counters or new performance promotion from diagnostics.
6. Produce a normative rule-disposition matrix, reproducible concrete findings,
   source/coverage manifest, positive findings and persistent optimization debt.
   Conformance and performance are separate; a green checker is not a proof.

Three independent read-only domains are assigned under the parallel-audit skill:
hot realization, ledger/enforcement, and cold/package lifecycle. Primary integrates
and independently checks their findings. No automatic hot-code rewrites from
static findings (NEES-EVID-005 / XTRM-002). Potential follow-up fixes must name
their real causal boundary and preserve the frozen performance evidence.

## Initial concrete signals awaiting integrated verification

- Active compiled module-main units absent from enforced graph roots.
- Double-escaped symbolic regexes fail to reject undeclared path selectors.
- Partial callback expression generation loses target-bound callee aggregation.
- Completed winner publication has an uncounted conditional atomic store.
- Broad ledger scripts can refresh unrelated source locks without inventory review.
- Cold root ingress allocates after READY; current all-allocation prose overclaims.
- Setup timeout checks do not preempt synchronous setup; close joins workers but
  retaining the closed app also retains buffers; oversized invalid history allocates
  before a bounded length check. These are lifecycle/debt distinctions, not presumed
  E0 performance violations.

Final conclusions must classify each as CONFORMS, NOT-APPLICABLE, DEVIATION or
UNVERIFIED with exact normative authority. Suspected recurring work remains
UNVERIFIED-DEBT until emitted-code/governing-unit evidence establishes benefit.
