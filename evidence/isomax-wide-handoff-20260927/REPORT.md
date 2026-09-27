# IsoMax shallow-path cost and root handoff experiment

69/69 completed solves returned the declared WDL and joined cleanly. Same Windows i5-12600K / Node 26.7.0 host; full sharing, 4M shared and 1M private entries per worker. One-worker controls deliberately isolate work; seven-worker tests use the locked pool. No production addon or pinned resource setting changed.

## Result

The proposed split did not establish a repeatable performance improvement. Dormant shallow machinery had a small measured cost on the matched single-worker workload. Removing it was not faster there. The actual root-probe split preserved work/results but also failed to establish a consistent gain. Retain the selected native baseline; do not promote this prototype.

Shallow exploration itself remains valuable selectively. On fixture B it reduced visits from 40,439 to 2,544 and mean wall time from 133.75 to 59.41 ms. On A it increased visits from 11,406 to 15,904 and wall time from 96.82 to 106.18 ms. The current configuration therefore reproduces a strong benefit on B, not the historical improvement on both fixtures. Endpoint publication, memory and measurement boundaries differ from historical evidence; do not attribute the change to one factor or compare old/new percentages directly.

## Fairness repair before timing

At 6172113, `experiments/strategist/build.mjs --check` failed: generated experimental workers predated both exact endpoint cache-publication repairs. Commit 838586f regenerated all six experimental layers from the current behavior solver and updated one guarded cutoff seam in the one-band generator so it retains endpoint publication. Nine mode/one-band tests passed, including live switches and cancellation. Historical evidence was not rewritten.

## Dormant capability

All flags remain DEEP; no strategist runs. Native is ordinary recursion; poll adds existing completion polling. Mode carries horizons, incomplete propagation and pass retention. Deep-ablation replaces only the recursive body, retaining MODE state preparation, root logic and completion reader. It is a diagnostic counterfactual, not live-switch-capable production code.

Every single-worker run visited exactly 11,057,264 nodes. Mode versus ablation has matched witness and work. The root is `353335714`, a known-losing derived child of the standard Fhourstones input, not an official Fhourstones score.

| Workers | Arm | Repeats | Wall s | Search s | Solve-call cycles B | Total process cycles B | Visits M |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | native | 4 | 11.336 | 11.295 | 41.888 | 42.142 | 11.057 |
| 1 | poll | 4 | 11.402 | 11.358 | 42.129 | 42.390 | 11.057 |
| 1 | mode | 4 | 11.443 | 11.399 | 42.183 | 42.446 | 11.057 |
| 1 | deep-ablation | 4 | 11.467 | 11.423 | 42.338 | 42.594 | 11.057 |
| 7 | native | 5 | 5.344 | 5.285 | 141.051 | 141.308 | 30.509 |
| 7 | poll | 5 | 5.391 | 5.331 | 142.373 | 142.627 | 30.972 |
| 7 | mode | 5 | 5.405 | 5.345 | 142.654 | 142.912 | 31.042 |
| 7 | deep-ablation | 5 | 5.346 | 5.285 | 141.184 | 141.436 | 30.777 |

Paired differences below are candidate/base minus one. Intervals are descriptive paired t intervals across rotated repetitions (4 or 5), unadjusted for multiple comparisons; they are not proof of equivalence or zero cost.

| Stage | Comparison | Metric | Mean change | Descriptive 95% interval |
|---|---|---|---:|---|
| matched-single | poll / native | wallMs | 0.59% | -0.21% to 1.38% |
| matched-single | poll / native | solveCycles | 0.58% | -0.02% to 1.17% |
| matched-single | mode / poll | wallMs | 0.36% | 0.08% to 0.64% |
| matched-single | mode / poll | solveCycles | 0.13% | -0.13% to 0.38% |
| matched-single | deep-ablation / mode | wallMs | 0.21% | -0.34% to 0.76% |
| matched-single | deep-ablation / mode | solveCycles | 0.37% | -0.31% to 1.04% |
| locked-seven | poll / native | wallMs | 0.89% | -1.22% to 3.01% |
| locked-seven | poll / native | solveCycles | 0.95% | -1.03% to 2.92% |
| locked-seven | mode / poll | wallMs | 0.29% | -3.86% to 4.45% |
| locked-seven | mode / poll | solveCycles | 0.24% | -3.94% to 4.42% |
| locked-seven | deep-ablation / mode | wallMs | -1.07% | -2.52% to 0.38% |
| locked-seven | deep-ablation / mode | solveCycles | -1.01% | -2.40% to 0.37% |

The single-worker MODE versus polling cycle estimate is +0.13%; stripping shallow machinery is +0.37% versus MODE. At seven workers the ablation averages about 1.07% lower wall time, but its interval crosses zero and shared-TT races change work. These results do not demonstrate the large dormant-loop tax hypothesized from source inspection. They also do not prove all future live mode changes are free.

## Actual probe followed by deep continuation

The existing root-concentration primitive issues a two-ply probe with narrowing target 1. It retains native state/exact results and releases when one root action remains. The split prototype keeps the bounded function for probing and dispatches to ordinary behavior recursion only at a root action boundary after release. Deep recursive calls are direct; no horizon or unfinished-probe handling is inserted into that body. Both versions use the same completion reader. All preparation, code/JIT effects, root dispatch and repeated work remain charged.

A = `3164746344461611`, B = `2431572135633422`, both absolute WDL -1. Five repetitions per arm. Both probe versions have identical visits, witness and probe counters on each fixture. A performs four passes and 5,300 horizon stops; B one pass and 25 stops; each records one narrowing release.

| Fixture | Arm | Repeats | Wall ms | Search ms | Solve-call cycles M | Total process cycles M | Visits |
|---|---|---:|---:|---:|---:|---:|---:|
| probe-A | probe-deep | 5 | 96.82 | 54.06 | 513.98 | 773.23 | 11406 |
| probe-A | probe | 5 | 106.18 | 62.93 | 568.33 | 830.19 | 15904 |
| probe-A | probe-split | 5 | 107.60 | 64.15 | 586.57 | 844.92 | 15904 |
| probe-B | probe-deep | 5 | 133.75 | 89.68 | 795.86 | 1061.41 | 40439 |
| probe-B | probe | 5 | 59.41 | 17.34 | 354.03 | 619.47 | 2544 |
| probe-B | probe-split | 5 | 59.87 | 17.40 | 351.31 | 617.07 | 2544 |
| locked-probe-stress | probe-deep | 1 | 5440.01 | 5377.64 | 143753.93 | 144010.85 | 30908039 |
| locked-probe-stress | probe | 1 | 5670.47 | 5611.84 | 149244.50 | 149507.02 | 29047515 |
| locked-probe-stress | probe-split | 1 | 5979.67 | 5920.22 | 157215.14 | 157468.87 | 30835887 |

The seven-worker stress case uses worker 0 probing and six fully released peers, on the longer derived root. Only one trial per arm: it is a smoke/stress observation, not a statistical ranking. Worker 0 did not finish before the host selected a deep peer; its final probe counters were unavailable. Zeros for those unfinished workers do not mean no probe work occurred. Aggregate visits include every worker.

This prototype is ROOT-BOUNDARY ONLY. It does not implement arbitrary retained-frame switching, recurring frontier control, width sensing or asynchronous strategist policy. Fixed prepublished commands isolate the execution mechanism. No copies, root replay or extra unwinding are introduced by this split, but that does not establish a cheap general live-switch mechanism. The prototype remains opt-in through a diagnostic loader; no parallel production solver is installed.

## Disposition and next seam

Keep the seven-worker/4M-shared/1M-private native baseline. Do not justify a broad worker rewrite with this dormant-cost result. The next optimization question is whether a cheap selective trigger distinguishes B-like short refutations from A-like extra probing, and whether benefits survive shared-TT interaction. Count active probe work, repeated bands and control-delivery costs; source-level fewer branches is not a speed result. The split mechanism is preserved as measured experimental evidence, not promoted.

## Evidence and limits

The final targeted suite passed 35/35 tests, including independent physical-oracle cases, reflection, live mode changes, cancellation, root restoration and the matched handoff controls; see [test output](tests.txt). All six experimental generator freshness checks and patch hygiene passed.

- isomax-wide-path-20260927: tested `b118c85c79f0a9b51580f8493518a86b1c83a564`; 36 solves; [manifest](../isomax-wide-path-20260927/manifest.json), [samples](../isomax-wide-path-20260927/samples.jsonl), [raw output](../isomax-wide-path-20260927/processes.jsonl).
- isomax-wide-handoff-20260927: tested `758fafbc43a29e6ac0302d9091034597f57cd9a6`; 33 solves; [manifest](../isomax-wide-handoff-20260927/manifest.json), [samples](../isomax-wide-handoff-20260927/samples.jsonl), [raw output](../isomax-wide-handoff-20260927/processes.jsonl).

Run the targeted `wide-path.test.mjs`, then `wide-path-campaign.mjs NEW_DIRECTORY` or add `--active`, from a clean committed tree. The driver enables FFI and the source-guarded diagnostic loader. Source inputs/hashes and errors are retained; no retries. The ordinary production solver is unchanged.

Cycles are Windows QueryProcessCycleTime summed over all process threads. Solve-call cycles include native host setup, worker preparation and joining; total process cycles also include earlier startup. Search timestamps isolate first worker entry to first exact result. Short A/B wall times contain substantial startup/JIT costs; search-only timings are reported alongside complete-operation costs. Node counting redirects the existing increment to padded per-worker storage. It adds no second per-node counter. Final probe telemetry is written cold after completed solves. These are scoped performance/semantic tests, not full NEES machine-code certification.
