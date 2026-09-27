# Worker, memory, profile and admission interaction screen

Tested JSMinSys 16f48306b3938787851a37b0dd2ad1be583db1b5; 12th Gen Intel(R) Core(TM) i5-12600K; Windows; Node v26.7.0.
Experimental IsoMax mode-capable engine, full CPC retained. Production unchanged.

234/234 trials returned the expected exact absolute P1 value (1); no timeout,
error or forced termination. This value is not mover-relative rootWdl.
11 targeted mode/activation tests passed; see tests.txt. This is not full NEES
qualification or a standard Fhourstones score.

There were 31 stage configurations: 13 resource configurations, 10 profile
configurations and 8 admission configurations. These are combinations of seven
named policies, not 234 distinct strategies. Screening used 186 trials; two
selected pairs received 48 confirmation trials. No dynamic candidate qualified
for confirmation under the predeclared gate.

## Findings

- One-worker base had the lowest overall resource-screen latency. Two workers
  were faster on A; eight workers were slower than one worker on all three roots.
- Four-worker shared-TT doubling screened 2.57% faster than same-count base.
  Confirmation did not establish a repeatable benefit.
- Four-worker wide-anchor (worker 0 wide, others deep) screened 2.58% faster than
  same-count all-deep. Its confirmation aggregate was effectively unchanged.
- Starting one and admitting on sustained positive pending-width deltas beat
  immediate full activation at four workers, but lost to keeping one active.
  At eight workers it helped A, hurt B/B15 versus fixed-all, and lost overall to
  fixed-one. Expansion alone did not identify economically useful parallelism.
- No candidate is promoted. This screen does not establish optimal memory or
  disprove mixed roles/PFIF. The windows are short and the games are related.

## Method and boundaries

Primary: common ready barrier to first exact evaluator completion, conditional
on validated result and clean shutdown. Joined time and cold process time are
also retained. Fresh process/caches, 20 warmups, 750 ms deadline, requested 5 ms
strategist cadence, sequential trials; no timeout or memory-policy changes.
Two rotated screening repetitions per root. Four alternating paired confirmation
repetitions on mirrors, which are correlated games, not independent new games.
Intervals below are descriptive, unadjusted paired t intervals with only 4 pairs.

A = 2053635233350500; B = 1320461024522311; B15 = 132046102452231.
Confirmation uses their reflected sequences. B15 is the parent of B, further
limiting generalization. No affinity control; this host has heterogeneous cores.
Eight worker indices reuse seven nominal move-order offsets.

Base capacities: 4096 private entries per worker, 16384 shared entries.
private2/shared2/both2 double those respective capacities. Cache MiB is allocated
payload, not process RSS or total retained memory. Increasing worker count also
increases total private storage. Memory selection for later stages: four workers
shared2; eight workers base. Selection is exploratory, not a proven optimum.

Profiles share the plain mode engine. Dynamic arms ALL use the observed mode
engine; do not attribute cross-stage timing differences solely to policy.
Wide means the existing exact shallow-band mode (stride 2), not heuristic leaves.
Worker 1 is helper; worker 0 is anchor; odd/even select half the pool.
Dynamic activation only admits preinitialized workers in ascending ID order.
There is no migration, suspension, arbitrary activation-order search or adaptive
wide/deep reassignment in this batch. The worker hot loop and TT are unchanged.

## Solve latency

Times are per-root medians (ms); GM is geometric mean across individual runs.
Tables use A/B/B15 ordering, reflected for confirmation.

### resources

| Configuration | Cache MiB | A | B | B15 | GM ms |
|---|---:|---:|---:|---:|---:|
| w1-base | 1.24 | 143.1 | 247.0 | 252.7 | 207.5 |
| w2-base | 1.48 | 137.9 | 256.2 | 257.7 | 208.8 |
| w2-private2 | 1.95 | 145.2 | 260.6 | 262.1 | 214.8 |
| w2-shared2 | 2.48 | 149.7 | 258.0 | 256.1 | 214.6 |
| w2-both2 | 2.95 | 145.1 | 259.8 | 274.4 | 217.9 |
| w4-base | 1.95 | 164.9 | 294.8 | 296.1 | 243.1 |
| w4-private2 | 2.91 | 161.8 | 286.4 | 294.1 | 238.7 |
| w4-shared2 | 2.95 | 162.4 | 286.0 | 286.6 | 236.9 |
| w4-both2 | 3.91 | 164.5 | 283.0 | 297.8 | 240.0 |
| w8-base | 2.91 | 211.3 | 257.7 | 279.3 | 247.4 |
| w8-private2 | 4.81 | 231.6 | 290.2 | 269.0 | 262.2 |
| w8-shared2 | 3.91 | 228.4 | 282.2 | 276.9 | 260.8 |
| w8-both2 | 5.81 | 220.0 | 261.0 | 296.1 | 257.1 |

### profiles

| Configuration | Cache MiB | A | B | B15 | GM ms |
|---|---:|---:|---:|---:|---:|
| w4-modes-deep | 2.95 | 180.0 | 292.8 | 291.3 | 248.4 |
| w4-modes-wide-helper | 2.95 | 177.5 | 295.4 | 287.0 | 246.8 |
| w4-modes-wide-anchor | 2.95 | 160.9 | 301.4 | 292.2 | 242.0 |
| w4-modes-wide-odd | 2.95 | 182.1 | 293.3 | 298.2 | 251.5 |
| w4-modes-wide-even | 2.95 | 168.1 | 294.4 | 287.3 | 242.2 |
| w8-modes-deep | 2.91 | 217.6 | 268.0 | 282.9 | 254.4 |
| w8-modes-wide-helper | 2.91 | 214.1 | 270.8 | 276.5 | 251.9 |
| w8-modes-wide-anchor | 2.91 | 226.2 | 292.7 | 316.7 | 275.6 |
| w8-modes-wide-odd | 2.91 | 227.9 | 307.4 | 290.9 | 273.0 |
| w8-modes-wide-even | 2.91 | 216.3 | 357.9 | 332.5 | 294.9 |

### dynamic

| Configuration | Cache MiB | A | B | B15 | GM ms |
|---|---:|---:|---:|---:|---:|
| w4-fixed1 | 2.95 | 146.2 | 252.9 | 252.1 | 210.5 |
| w4-fixedAll | 2.95 | 173.4 | 304.5 | 309.7 | 253.7 |
| w4-grow1 | 2.95 | 149.8 | 284.3 | 270.6 | 225.8 |
| w4-grow2 | 2.95 | 159.4 | 295.5 | 281.3 | 236.4 |
| w8-fixed1 | 2.91 | 143.8 | 250.1 | 254.9 | 209.3 |
| w8-fixedAll | 2.91 | 226.0 | 269.8 | 281.1 | 257.7 |
| w8-grow1 | 2.91 | 145.1 | 277.0 | 320.7 | 234.3 |
| w8-grow2 | 2.91 | 163.2 | 326.5 | 309.1 | 254.1 |

### holdout-resources

| Configuration | Cache MiB | A | B | B15 | GM ms |
|---|---:|---:|---:|---:|---:|
| w4-base | 1.95 | 166.2 | 285.3 | 286.0 | 238.3 |
| w4-shared2 | 2.95 | 158.8 | 284.8 | 294.5 | 240.2 |

### holdout-profiles

| Configuration | Cache MiB | A | B | B15 | GM ms |
|---|---:|---:|---:|---:|---:|
| w4-modes-deep | 2.95 | 162.2 | 283.2 | 275.2 | 234.8 |
| w4-modes-wide-anchor | 2.95 | 169.6 | 278.8 | 285.3 | 234.9 |

## Paired confirmation

Negative means candidate faster. Every interval includes zero.

| Family | Mirrored root | Mean change | Descriptive 95% interval |
|---|---|---:|---|
| resources | 4613031433316166 | -3.3% | [-20.6, 14.0]% |
| resources | 5346205642144355 | 0.5% | [-9.0, 10.0]% |
| resources | 534620564214435 | 6.4% | [-10.1, 22.8]% |
| profiles | 4613031433316166 | 0.5% | [-14.2, 15.1]% |
| profiles | 5346205642144355 | -2.5% | [-11.6, 6.5]% |
| profiles | 534620564214435 | 2.7% | [-1.6, 7.0]% |

## Dynamic execution and whole-operation cost

Active counts below are observed evaluator entry, for the two repeats at each root.

| Configuration | A active | B active | B15 active |
|---|---|---|---|
| w4-fixed1 | 1, 1 | 1, 1 | 1, 1 |
| w4-fixedAll | 4, 4 | 4, 4 | 4, 4 |
| w4-grow1 | 3, 3 | 4, 4 | 4, 4 |
| w4-grow2 | 3, 4 | 4, 4 | 4, 4 |
| w8-fixed1 | 1, 1 | 1, 1 | 1, 1 |
| w8-fixedAll | 8, 8 | 8, 8 | 8, 8 |
| w8-grow1 | 1, 1 | 8, 5 | 8, 8 |
| w8-grow2 | 7, 3 | 8, 8 | 8, 8 |

Arithmetic means across the six screening runs per configuration. Evaluator cycles
cover search through return (including losing workers); strategist cycles are
separate. Process cycles include startup, warmups and other runtime threads, so
are not interchangeable with search cycles. Sum cycles/node is diagnostic, not
a promotion objective. Thread counts and allocation can raise cold costs.

| Stage/configuration | Nodes | Evaluator Mcycles | Strategist Mcycles | Process Mcycles | Joined ms |
|---|---:|---:|---:|---:|---:|
| resources/w1-base | 191872 | 780.9 | 5.6 | 2727.6 | 226.2 |
| resources/w2-base | 393266 | 1615.9 | 5.8 | 5130.7 | 229.1 |
| resources/w2-private2 | 392806 | 1645.3 | 6.2 | 5186.3 | 231.2 |
| resources/w2-shared2 | 396687 | 1647.5 | 6.3 | 5205.0 | 232.6 |
| resources/w2-both2 | 396506 | 1684.9 | 6.5 | 5239.9 | 238.6 |
| resources/w4-base | 800072 | 3709.9 | 6.8 | 11170.3 | 259.6 |
| resources/w4-private2 | 808109 | 3696.1 | 7.1 | 11184.6 | 261.6 |
| resources/w4-shared2 | 789188 | 3648.4 | 6.7 | 11101.2 | 256.7 |
| resources/w4-both2 | 802320 | 3726.4 | 6.6 | 11163.6 | 262.7 |
| resources/w8-base | 1045484 | 7532.2 | 7.8 | 25607.5 | 267.5 |
| resources/w8-private2 | 1135005 | 7817.9 | 7.4 | 25937.8 | 276.3 |
| resources/w8-shared2 | 1120418 | 7816.2 | 8.8 | 25939.8 | 276.5 |
| resources/w8-both2 | 1093920 | 7812.5 | 7.9 | 26085.3 | 277.8 |
| profiles/w4-modes-deep | 797383 | 3766.9 | 7.1 | 11402.6 | 263.4 |
| profiles/w4-modes-wide-helper | 695905 | 3736.6 | 6.8 | 11291.8 | 261.0 |
| profiles/w4-modes-wide-anchor | 705458 | 3743.2 | 6.9 | 11245.4 | 261.5 |
| profiles/w4-modes-wide-odd | 598447 | 3849.0 | 7.4 | 11338.5 | 269.9 |
| profiles/w4-modes-wide-even | 595397 | 3686.7 | 7.1 | 11210.5 | 258.4 |
| profiles/w8-modes-deep | 1097309 | 7723.0 | 8.2 | 26060.0 | 273.5 |
| profiles/w8-modes-wide-helper | 1041344 | 7615.4 | 8.0 | 25643.8 | 269.6 |
| profiles/w8-modes-wide-anchor | 1159314 | 8324.5 | 9.5 | 26263.4 | 294.5 |
| profiles/w8-modes-wide-odd | 949875 | 8286.0 | 9.1 | 26582.8 | 293.3 |
| profiles/w8-modes-wide-even | 1059337 | 9017.1 | 9.1 | 27129.5 | 317.8 |
| dynamic/w4-fixed1 | 191872 | 787.5 | 7.6 | 7425.4 | 231.2 |
| dynamic/w4-fixedAll | 799219 | 3912.3 | 12.4 | 11531.7 | 274.0 |
| dynamic/w4-grow1 | 468088 | 2085.2 | 10.4 | 9324.6 | 247.4 |
| dynamic/w4-grow2 | 694014 | 3121.0 | 10.7 | 10792.2 | 258.0 |
| dynamic/w8-fixed1 | 191872 | 791.4 | 8.2 | 16468.9 | 232.5 |
| dynamic/w8-fixedAll | 1082528 | 7743.0 | 15.0 | 26355.3 | 273.3 |
| dynamic/w8-grow1 | 709015 | 3323.1 | 10.8 | 20201.4 | 264.7 |
| dynamic/w8-grow2 | 1007787 | 5125.3 | 12.0 | 22814.7 | 281.6 |

## Interpretation and next experiments

More workers did more aggregate work without reliably reducing these solve times.
Shared-hit counts do not identify cross-worker usefulness, and this evidence
cannot isolate contention from duplication, scheduling or cache effects.
Width-triggered admissions occurred, but that establishes implementation activity,
not strategically profitable work allocation. Requested cadence is not actual
delivery cadence: raw traces retain observed tick times and flag publication;
evaluator searchStarted records actual entry. Standbys still consume prepared
memory. There is no claim that these short trials predict empty-board scaling.

Next bounded contrasts should separate composition from order: same final deep/
wide roles with different admitted indices, then role changes tied to fresh width
contraction/expansion rather than simply adding more deep workers. Compare each
against matched fixed-role and fixed-count controls on harder independent roots.
Only then test memory interactions with surviving policies. These follow-ups are
not yet implemented or measured, and must stay within strategist/flag scope.

## Reproduction and evidence

See ../../experiments/strategist/INTERACTION_CAMPAIGN.md for predeclared selection.
At the tested SHA run node experiments/strategist/interaction-campaign.mjs into
a new evidence directory. Analyze with experiments/strategist/analyze-interactions.mjs.
The manifest pins runtime hashes; samples.jsonl contains every result/cycle count,
cache statistic, evaluator result and strategist trace. processes.jsonl preserves
subprocess output. summary.json holds per-root data and paired ratios. No historical
failure was overwritten and no production defaults were changed.
