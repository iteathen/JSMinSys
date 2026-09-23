# Cycle reduction round-071 — preclassify required-mask lane occupancy

A two-lane owned position does not imply every required winning/proof mask spans both lanes.

Required masks are immutable configuration data, so initialization can partition them into:

- low-only;
- high-only;
- cross-lane.

For low-only or high-only masks, full two-lane containment is exactly equivalent to one-lane containment on the occupied required lane.

Signed bit-pattern path:

- two-lane: 3-5 cycles;
- one-lane preclassified: 2 cycles.

Unsigned path:

- two-lane: 4-7 cycles;
- one-lane preclassified: 3 cycles.

The lists should be partitioned during initialization so no hot per-mask lane dispatch is introduced. Tests include bit-31 low-only and high-only masks and compare the one-lane and two-lane results.
