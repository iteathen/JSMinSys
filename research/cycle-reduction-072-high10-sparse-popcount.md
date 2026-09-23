# Cycle reduction round-072 — combine high-10 lookup with sparse-high early return

For configured high lanes with at most 10 live bits, the existing table profile counts high by one table load.

If the high lane is frequently zero, that load is unnecessary.

The combined profile computes the unavoidable low-lane 14-cycle SWAR count first, then:

- hi == 0: branch/test and return, 16 cycles;
- hi != 0: add one table load and one add.

With an L1-resident table the nonzero path is 21 cycles, still below the fixed 23-cycle fused two-lane SWAR path.

Compared with the branch-free 19-cycle high10-table profile, the combined profile wins in expectation when hi is zero more than 40% of calls.

L2/L3 scenarios remain explicit because cache residency can reverse the choice.
