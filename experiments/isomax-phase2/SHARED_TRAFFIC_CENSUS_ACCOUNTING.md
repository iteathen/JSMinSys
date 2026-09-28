# Shared-traffic census accounting

This experiment adds no production solver operation and does not alter the
frozen measured solver source. It uses a Node module-load hook solely to count
events in an instrumented diagnostic execution.

The added operations are intentionally **not** assigned production-cycle values:
the hook adds Float64 counter loads/stores, rank loads/shifts, branches, widened
metric-buffer copies, JSON construction, and host reporting. Their aggregate
cost is instrumentation-dependent and invalidates timing/cycle measurements.

For this experiment the admissible outputs are event counts and distributions
only. Any timing/cycle value observed during the hooked execution is rejected by
design and must not enter the canonical NEES solver ledger.

Production candidate cycle accounting remains the frozen canonical JSMinSys
ledger at the source revision under diagnosis.
