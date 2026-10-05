# Immediate-win correction

Production change: `connect4RbaImmediateWinningColumn` in the RBA coordinate support library scans the cardinality-sorted singleton prefix for an active mover residual at the current playable frontier. It returns a current-frame column or -1, allocates nothing, and constructs no child. The minimal worker calls it after cache handling and before child descent, returns mover-relative +1 on success, publishes a non-root proof through the existing exact TT path, and uses the existing root reflection transporter for the chosen move.

No CPC/NDC, forced-block, heuristic scoring, TT layout, memory sizing, runtime or worker topology changes. Ordinary unresolved-node move ordering remains center-first. When multiple immediate wins exist, the helper returns the first playable winning singleton in canonical basis order; each is an optimal move.

Before correction: the new four-worker 141412 regression reached its 5000 ms timeout without a result. After correction: all eight off-center cases (both movers, both reflections, 7x6 and 7x5) pass. Tests also compare the support primitive directly with independent physical-board rules across 7x6, 7x5, 4x4 and 3x3, including nonzero arena offsets and nonmutation checks. The center-win, lifecycle, shared exact-tag, cofactor, reflection and last-cell win-before-draw tests pass.

Validation: 28 targeted tests passed; catalog verifies 298 sealed functions and 188 ledgered add-on units, zero deferred. The ledger includes the helper scan and early exact-store path with symbolic operation costs. No measured cycle savings or full-empty-board speedup is claimed. No full performance run is part of this correction.
