# Fixed-candidate review

Read-only source review of A `a3cf7f9` through B `00ecc7d`, independent of the
benchmark controller's author. No reviewer tests competed with timed samples.
This review is supporting inspection, not an independent mathematical oracle.

- Only canonical alpha-beta, generated behavior/frontier mirrors, cycle ledger,
  and endpoint-cache tests change in the fixed solver diff.
- LOWER0/UPPER0 stores remain local, protect existing exact rows, and do not call
  shared publication. Public probes hide these carriers. Exact publication is
  unchanged. Bound cutoffs and tightening use the current q's mover/window.
- Worker mix, profile, search ordering, CPC and shared-cache implementation are
  unchanged. No Stage-9/support-plan wiring or solved-game priors are introduced.
- Generated-source checks pass. Catalog accounts for 298 sealed functions plus
  156 add-on units, all 30 blocks, zero deferred functions. Whole-process timing
  includes preparation, startup/JIT, every thread, closure and cleanup. Symbolic
  path accounting is not an instruction-retirement measurement.
- No blocking semantic defect found in the bounded diff review.

Coverage limitation: endpoint-cache tests check carrier membership (4 or 5),
public hiding, aggregate bound presence, directed search inequalities, and exact
oracle results. They do not separately require both bound kinds to occur or
directly assert each stored bound's inequality against the oracle. This remains
a nonblocking coverage opportunity; no solver/test changes belong in this run.

Existing short/derived-long results remain separate in
../isomax-phase2-selected-production-20260927/RESULT.md. They cannot replace the
official-hard gate. Any local timeout leaves that exact comparison gate open.

The evidence pushes automatically triggered repeat GitHub hosted qualification
workflows because PR-wide changed paths include the workflow. Task-created runs
36365040033 and 36365241495 were cancelled to avoid unnecessary unrelated repeats.
Historical completed run 36362491564 and pre-existing run 36364201395 were retained.
Verify/schema/Node compatibility checks were not cancelled.
