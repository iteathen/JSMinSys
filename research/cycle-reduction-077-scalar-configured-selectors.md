# Cycle reduction round-077 — scalar-producer selectors for all configured widths

Round 040 removed all seven score-array loads when the score producer already held the seven values as live scalars.

That ownership pattern is not specific to seven columns. Runtime-configured candidate counts 2..10 now have matching scalar selectors.

For count N:

(N - 1) * COMPARE_SELECT

With the current 2-cycle compare/select upper ledger:

cost = 2*(N - 1)

Examples: N=4 -> 6 cycles, N=7 -> 12, N=10 -> 18.

The reduction is valid only when score production already owns the scalars. Loading or spilling an array solely to populate scalar arguments does not qualify as a governing-unit win.
