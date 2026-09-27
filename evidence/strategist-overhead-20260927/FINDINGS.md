# Reviewed findings

84 bounded runs at `db5773ffd96be48c154543d8a9464bd690dfdf7e`: 66 exact
results, 18 empty-board timeouts, no errors or forced terminations. All completed
results matched the declared absolute-value oracle. Tests passed 22/22 before
measurement. No recursive worker or production code changed in this pass.

## Did instrumentation affect the earlier measurements?

It is a real operating cost, but these measurements do not support treating it
as the sole cause of the previous negative policy results. The short controls
visit exactly 99,114 nodes on A and 238,251 on B across all six implementations.
That makes traversal differences an unlikely explanation for their timing
differences on these specific fixtures, though execution code and runtime effects
can still differ.

Paired mean estimates for optional STOP polling over bare native were +1.00%
and +1.83% evaluator cycles (A/B). Both descriptive intervals include zero.
Tracking frames without snapshots over mode DEEP estimated +0.56% and +0.24%
cycles, also unresolved by these four repetitions. These are not fixed costs
per load or promises of negligible overhead on other machines/positions.

Snapshot serving on A has a retained 191.27 ms run among otherwise
138.61–146.16 ms runs, producing a wide interval. It was not removed or retried;
the sample does not identify whether the spike came from the observer, scheduling,
runtime compilation or another cause. B's snapshot contrast estimated +0.11%
cycles, again with an interval crossing zero. Small estimates do not prove zero
cost, and the outlier does not prove that snapshots caused an 8% overhead.

The useful longer solved comparison is Fhourstones 45461667: minimal fixed-one
versus observed fixed-one, with four workers prepared in both. Both visited
806,844 nodes. Observation plus snapshot service estimated +0.93% wall time
and +1.02% evaluator cycles; descriptive 95% intervals are [-0.81, 2.67]% and
[-0.72, 2.76]%. About 75 snapshots/10,433 copied words were served per solve.

## Retested strategy effects, including required costs

Median solve times on 45461667:

| Configuration | ms |
|---|---:|
| Minimal fixed one active, four prepared | 1192.98 |
| Minimal fixed four active | 1196.16 |
| Four DEEP, no standby gate | 1200.58 |
| Observed fixed one active | 1201.79 |
| One WIDE / three DEEP | 1205.10 |
| Observed width-growth from one to four | 1296.86 |

The growth policy admitted all four workers in each run. Relative to the
already-observed fixed-one control, paired mean latency increased 7.56%
([2.43, 12.69]% descriptive interval). Relative to minimal fixed-one, the net
increase was 8.56% ([3.06, 14.06]%). Observation alone therefore does not explain
the growth policy's loss on this fixture. Compared with minimal fixed-four,
growth used about 5% fewer aggregate evaluator cycles but took about 9% longer:
aggregate cycles are not the parallel solve-time objective.

One WIDE / three DEEP visited about 14.2% fewer aggregate nodes than all DEEP
(2.447M versus 2.853M), yet the paired latency estimate was +1.55%, with a wide
[-6.56, 9.66]% interval. Node reduction did not establish a time-to-solve win.
These totals include losing workers; they are not unique-state counts or proof
that a specific worker helped another through the TT.

All 18 empty-board trials timed out at five seconds and shut down cooperatively.
They establish execution and control delivery over a longer run, not faster
completion or proximity to a solution. No policy is ranked from their node counts.
Required observation/growth work remains fully included in reported cycles.

## What changes in the campaign

Keep the new minimal fixed-pool control. A fixed policy must not pay for unused
width observations; its mode worker now receives only activation/STOP flags.
Retain both that net-benefit control and the observed fixed-one attribution
control for future dynamic policies. Preserve the native/polling/mode distinctions.

No promotion from this batch. Do not discard long-horizon candidates merely
because these short or single-fixture comparisons lost. Further claims need
additional independent positions that complete and bounded longer exposure
where appropriate. Do not subtract estimated observer overhead from a strategy
that requires observation; improve that implementation or count the cost.

This pass did not test a new timing cadence, change move ordering, strip general
solver accounting, or establish full NEES qualification. Requested 5 ms cadence
is not guaranteed delivery timing; measured intervals are in summary.json and
the raw trace (retained up to the existing 256-entry cap).

See [RESULTS.md](RESULTS.md) for complete tables, intervals and measurement
boundaries; [source-checks.json](source-checks.json) for source-scope verification;
and samples.jsonl/processes.jsonl for unfiltered trial evidence.
