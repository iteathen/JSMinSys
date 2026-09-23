# Cycle reduction round-076 — exact selectors for all configured candidate counts

Only candidate count 7 previously had a fully unrolled array-backed selector. That made one configured width structurally cheaper even though candidate count is immutable after initialization.

The packed 3-bit support domain bounds configured columns to at most 10, so exact selectors now cover counts 2..10. Count 7 retains the existing implementation.

For exact count N:

N * LOAD + (N - 1) * COMPARE_SELECT

With L1 score loads and a 2-cycle compare/select upper ledger:

L1 = 6*N - 2

Examples: N=4 -> 22, N=6 -> 34, N=7 -> 40, N=8 -> 46, N=10 -> 58 cycles.

The generic pairwise selector remains for other counts or integrations that do not select an exact function at initialization. Strict greater-than preserves first/preferred tie semantics.
