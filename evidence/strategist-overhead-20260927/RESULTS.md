# Observer overhead and harder-position retest

Tested db5773ffd96be48c154543d8a9464bd690dfdf7e, 12th Gen Intel(R) Core(TM) i5-12600K, Windows, Node v26.7.0.
84 trials: 66 exact, 18 censored timeouts.
All returned exact values matched the declared oracle; all workers cleaned up.
Source changes are cold harness selection and strategist publication only.
No production implementation or generated recursive worker was changed.

## Measurement boundaries

Short: four rotated repetitions, one evaluator, roots A/B (15–16-ply family),
750 ms cap, private4096/shared16384. Hard: three repetitions, four prepared
workers, Fhourstones 45461667 (zero-based 34350556) and empty, 5-second cap,
private4096/shared32768. Same 20 warmups and common ready barrier; fresh caches
and process each run, no simultaneous benchmarks. Requested strategist cadence
5 ms. Timeout limits were not changed in the host.

Bare and stop-host have no strategist. Stop-strategist adds an inert one.
Mode-deep changes the execution implementation, including root query windows;
that contrast must not be presented as pure flag-decoding overhead even where
these fixtures happen to visit the same nodes. Observed-off tracks frames but
never publishes; observed-read additionally serves asynchronous raw snapshots.
General node/CPC/cache accounting remains in all arms. This is not a comparison
to an accounting-free solver. No timers or cycle reads occur per node.

Fixed-pool minimal arms use no observation storage or snapshot requests.
Observed-fixed1 retains the same observation machinery as observed-grow1.
The latter comparison isolates admission; minimal-fixed1 versus grow1 measures
the net implementation, including required observation. All active grow workers
stay DEEP. Wide0-deep3 has one shallow-band worker and no width observation.

Windows evaluator cycles cover solve through return, including losing workers.
Strategist cycles are separate; process cycles additionally include startup,
warmup, cleanup and other runtime threads. Atomic shared-TT stats and existing
solver counters remain real costs. No fixed cycle cost or speedup is inferred
from source line counts. Three/four repeats give only descriptive unadjusted
intervals; no affinity control, larger position-suite or full NEES qualification.

## Results

Solve ms is median only if every repetition solved. Timeout node counts are
work performed within the budget, not distance to solution. Mcycles are means.

| Stage/root | Arm | Solved | Solve ms | Nodes | Evaluator Mcycles | Strategist Mcycles | Process Mcycles | Active workers | Publications | Words copied |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|
| overhead/A | bare | 4/4 | 138.40 | 99114 | 502.37 | 0.00 | 1890.53 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/A | stop-host | 4/4 | 139.63 | 99114 | 507.29 | 0.00 | 1978.25 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/A | stop-strategist | 4/4 | 138.39 | 99114 | 504.02 | 8.22 | 2106.16 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/A | mode-deep | 4/4 | 140.52 | 99114 | 510.89 | 4.02 | 2407.76 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/A | observed-off | 4/4 | 142.72 | 99114 | 513.63 | 5.98 | 2472.47 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/A | observed-read | 4/4 | 144.45 | 99114 | 555.10 | 7.83 | 2530.82 | 1,1,1,1 | 10.25 | 951.50 |
| overhead/B | bare | 4/4 | 239.39 | 238251 | 872.92 | 0.00 | 2306.46 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/B | stop-host | 4/4 | 244.51 | 238251 | 888.60 | 0.00 | 2385.36 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/B | stop-strategist | 4/4 | 244.15 | 238251 | 886.68 | 9.99 | 2552.92 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/B | mode-deep | 4/4 | 248.04 | 238251 | 899.85 | 6.95 | 2848.62 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/B | observed-off | 4/4 | 249.85 | 238251 | 901.85 | 8.15 | 2869.47 | 1,1,1,1 | 0.00 | 0.00 |
| overhead/B | observed-read | 4/4 | 250.04 | 238251 | 902.71 | 9.06 | 2866.25 | 1,1,1,1 | 16.00 | 1737.75 |
| hard/F45461667 | deep4 | 3/3 | 1200.58 | 2852851 | 17486.38 | 23.45 | 25177.38 | 4,4,4 | 0.00 | 0.00 |
| hard/F45461667 | wide0-deep3 | 3/3 | 1205.10 | 2447095 | 17692.81 | 26.61 | 25320.30 | 4,4,4 | 0.00 | 0.00 |
| hard/F45461667 | minimal-fixed1 | 3/3 | 1192.98 | 806844 | 4331.39 | 24.70 | 10891.92 | 1,1,1 | 0.00 | 0.00 |
| hard/F45461667 | minimal-fixed4 | 3/3 | 1196.16 | 2811408 | 17471.70 | 25.10 | 25130.27 | 4,4,4 | 0.00 | 0.00 |
| hard/F45461667 | observed-fixed1 | 3/3 | 1201.79 | 806844 | 4375.61 | 31.04 | 11034.91 | 1,1,1 | 74.67 | 10432.67 |
| hard/F45461667 | observed-grow1 | 3/3 | 1296.86 | 2713233 | 16551.85 | 37.60 | 24335.49 | 4,4,4 | 281.67 | 39181.33 |
| hard/empty | deep4 | 0/3 | censored | 20580311 | 73413.41 | 96.72 | 81318.63 | 4,4,4 | 0.00 | 0.00 |
| hard/empty | wide0-deep3 | 0/3 | censored | 16169498 | 73378.63 | 94.86 | 81202.54 | 4,4,4 | 0.00 | 0.00 |
| hard/empty | minimal-fixed1 | 0/3 | censored | 6603122 | 18260.75 | 94.49 | 25113.91 | 1,1,1 | 0.00 | 0.00 |
| hard/empty | minimal-fixed4 | 0/3 | censored | 21001368 | 73339.02 | 94.39 | 81169.48 | 4,4,4 | 0.00 | 0.00 |
| hard/empty | observed-fixed1 | 0/3 | censored | 6568647 | 18238.25 | 111.47 | 25123.45 | 1,1,1 | 305.33 | 66515.33 |
| hard/empty | observed-grow1 | 0/3 | censored | 20395296 | 71493.81 | 125.07 | 79581.95 | 4,4,4 | 1199.33 | 259178.33 |

## Paired contrasts

Negative means candidate cheaper/faster. Intervals are descriptive 95% paired t intervals.

| Root | Control → candidate | Same nodes | Wall change [interval] % | Evaluator-cycle change [interval] % |
|---|---|---|---|---|
| A | bare → stop-host | true | 0.51 [-2.96, 3.99] | 1.00 [-2.36, 4.36] |
| B | bare → stop-host | true | 1.62 [-1.83, 5.08] | 1.83 [-2.08, 5.74] |
| A | stop-host → stop-strategist | true | -0.22 [-4.13, 3.68] | -0.62 [-4.14, 2.89] |
| B | stop-host → stop-strategist | true | -0.33 [-1.84, 1.19] | -0.21 [-1.31, 0.89] |
| A | stop-strategist → mode-deep | true | 1.46 [-2.84, 5.76] | 1.40 [-3.53, 6.32] |
| B | stop-strategist → mode-deep | true | 1.65 [-0.03, 3.32] | 1.48 [-0.16, 3.12] |
| A | mode-deep → observed-off | true | 1.26 [-1.43, 3.96] | 0.56 [-3.06, 4.18] |
| B | mode-deep → observed-off | true | 0.19 [-2.89, 3.27] | 0.24 [-2.94, 3.41] |
| A | observed-off → observed-read | true | 8.52 [-18.97, 36.01] | 8.10 [-18.75, 34.94] |
| B | observed-off → observed-read | true | 0.41 [-2.32, 3.14] | 0.11 [-2.43, 2.65] |
| A | mode-deep → observed-read | true | 9.74 [-15.88, 35.36] | 8.45 [-14.65, 31.55] |
| B | mode-deep → observed-read | true | 0.57 [-0.71, 1.85] | 0.33 [-2.02, 2.67] |
| F45461667 | deep4 → wide0-deep3 | false | 1.55 [-6.56, 9.66] | 1.23 [-6.33, 8.79] |
| empty | deep4 → wide0-deep3 | — | censored | censored |
| F45461667 | minimal-fixed1 → observed-fixed1 | true | 0.93 [-0.81, 2.67] | 1.02 [-0.72, 2.76] |
| empty | minimal-fixed1 → observed-fixed1 | — | censored | censored |
| F45461667 | observed-fixed1 → observed-grow1 | false | 7.56 [2.43, 12.69] | 278.32 [230.63, 326.01] |
| empty | observed-fixed1 → observed-grow1 | — | censored | censored |
| F45461667 | minimal-fixed1 → observed-grow1 | false | 8.56 [3.06, 14.06] | 282.10 [239.76, 324.45] |
| empty | minimal-fixed1 → observed-grow1 | — | censored | censored |
| F45461667 | minimal-fixed4 → observed-grow1 | false | 8.83 [7.92, 9.74] | -5.22 [-19.42, 8.99] |
| empty | minimal-fixed4 → observed-grow1 | — | censored | censored |

No automatic promotion. Interpret these contrasts together with their censored outcomes and mechanism boundaries. See FINDINGS.md for the reviewed conclusions.

Reproduce at the tested SHA: `node experiments/strategist/overhead-campaign.mjs <new-directory>`. Analyze using `node experiments/strategist/analyze-overhead.mjs <directory>`. The manifest pins sources; raw samples include thread cycles, metrics and strategist traces; subprocess output is retained separately.
