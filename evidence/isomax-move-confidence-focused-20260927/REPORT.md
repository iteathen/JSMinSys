# IsoMax move-score confidence and wide/deep screening

## Decision

Do not promote a score-gap behavior trigger yet. A larger live-line gap is a
plausible input, but the initial correlation weakened substantially when CPC
already-exact positions and outcome-equivalent moves were separated. Gap alone
also did not predict whether the existing iterative root probe saved solve time.
Keep the owner-selected seven-worker memory/profile baseline unchanged.

This campaign changed experimental labeling, analysis and evidence only. It did
not change production addons, recursive workers, move order, CPC, TT, behavior
dispatch or pinned resource settings. No new live strategist trigger was added.

## What was measured

The score is the existing mover's live-line count through the landing cell.
Production CPC restrictions and stable root tie ordering remain in force. Gap is
the highest minus second-highest eligible score: tied=0, near=1, clear>=2. These
bins were fixed before collecting outcomes. Every legal move receives an exact
mover-relative WDL label, including moves excluded by CPC. Any optimal action
counts as correct; a single selected witness is not the gold label.

The first corrected cohort contains 80 surviving random-walk positions at plies
16/20/24/28/32 plus two historical diagnostics. The 48-position follow-up accepts
only CPC-unresolved, multichoice roots: eight per gap bin per side to move, from
interleaved plies 15/16/19/20/23/24/27/28. Selection uses neither WDL nor probe
timing. It was prompted by confounding in the first sample, so it is a follow-up
screen, not a preregistered confirmatory trial. All 130 labels completed within
their individual five-second bounds. Historical failed-pass labels are excluded.

These are random legal walks conditioned on survival, not the distribution of
positions visited by the solver or an empty-board benchmark. Acceptance quotas
also make the focused cohort unsuitable for estimating production gap frequency.
Root scoring is studied here; recursive worker tie offsets are not represented.

## Move-order accuracy

The broad cohort's first eligible move was optimal in 67/80 cases (83.75%). Raw
live-line order before CPC was optimal in 64/80. These figures include forced
moves, CPC-resolved roots and roots where every remaining move has the same WDL.

| Gap | Broad: differing move outcomes | Focused: all unresolved roots | Focused: differing move outcomes | Uniform eligible choice, focused differing outcomes |
|---|---:|---:|---:|---:|
| Tied (0) | 6/14 (42.9%) | 12/16 (75.0%) | 4/8 (50.0%) | 41.8% |
| Near (1) | 5/9 (55.6%) | 11/16 (68.8%) | 3/8 (37.5%) | 31.5% |
| Clear (>=2) | 13/14 (92.9%) | 13/16 (81.3%) | 4/7 (57.1%) | 53.1% |

Uniform-choice figures are the mean fraction of eligible actions with optimal
WDL, not timings or a proposed replacement policy. They expose how much apparent
accuracy comes from having many equally good moves. On these small focused bins,
the score ordering adds only about 4-8 percentage points above that reference.

The focused differing-outcome holdout results are tied 2/4, near 1/5, clear 2/4.
Thus the broad cohort's striking 92.9% clear-gap accuracy did not reproduce at
that magnitude. Both parity splits, first-optimal ranks and exact denominators
are retained in [summary.json](summary.json). No claim of statistical significance
or calibrated probability is supported by these sample sizes.

## Actual solve-cost screen

Six holdout cases from the broad cohort (first two per bin with nonexact CPC,
multiple choices and 200..2,000,000 native root nodes), plus the two historical
diagnostics, were tested with one and seven workers. Each completed arm has three
fresh-process repeats, alternating arm order. Same Node v26.7.0, i5-12600K,
4,194,304 shared entries and 1,048,576 local entries per worker; full TT sharing.

This reuses the existing root-frontier experiment. `probe` advances the horizon
in two-ply increments and releases to deep search when at most one unresolved
root action remains. Worker 0 probes; other workers search deep. `probe-deep`
uses the same full-window root wrapper with its frontier released immediately.
This is not a comparison against an unmodified native root alpha-beta window,
not a single two-ply prepass, not expansion-triggered PFIF, and not a live
asynchronous strategist. Classifier/communication overhead is not measured.

All 90 completed trials returned the expected root WDL and cleaned up. Two
single-worker probe trials timed out at 30 seconds:

- Near-gap p16-7: deep median 565.70 ms / 305,546 nodes; probe reached 15,921,154
  nodes without solving. The highest-ranked move was already optimal.
- Clear-gap p16-5: deep median 837.28 ms / 724,018 nodes; probe reached 18,945,374
  nodes without solving. All legal choices lose, so first-move accuracy is trivial.

Neither failure is hidden in a successful-only average. Four planned repeats of
those censored arms were skipped. One in-flight repeat was stopped and unscored;
the [interruption record](../isomax-move-confidence-corrected-20260927/INTERRUPTION.md)
preserves that deviation. There are 92 scored trials, not 96 completed solves.

With seven workers every case completed. Examples of median wall time:

- Near diagnostic: 141.19 -> 87.06 ms; operation cycles -45.6%.
- Clear p16-5: 412.99 -> 363.30 ms; operation cycles -11.2%.
- Near p16-7: 305.50 -> 308.45 ms; operation cycles +1.4%.
- Tied p16-9: 91.47 -> 88.73 ms; operation cycles -4.3%.

The clear-gap case benefiting from a probing peer while a near-gap case does not
is evidence against selecting modes from gap alone. It does not invalidate the
idea of allocating one worker to wide work: six deep peers change the economic
cost and usefulness of that work. This experiment does not isolate whether a
benefit came from shared exact entries, ordering or scheduling interactions.

[PERFORMANCE.md](PERFORMANCE.md) contains all matched medians. Raw records retain
total visited nodes, operation/process cycles, cycles per node, nodes/sec, worker
timing and cleanup. Windows QueryProcessCycleTime sums user+kernel cycles over
all process threads. Operation cycles and wall time cover the host solve call,
including worker startup/JIT/cleanup; process cycles additionally retain earlier
startup. These are not isolated recursive-loop cycle counts. Small late roots
are startup dominated; three repeats and modest percentage changes cannot justify
promotion. No long-memory or full empty-board conclusion follows from this screen.

## Integrity, qualification and reproduction

The initial labeling run at 03f1f26 stopped on strict equality of signed-zero
draw values. The actual solver WDL was consistent. Harness repair 45612d4 added
a reproducer and deliberately treats +0/-0 as the same WDL. That failed pass is
preserved in `../isomax-move-confidence-20260927/`, not pooled with the rerun.

Corrected labels/performance began at 45612d4; performance resumed at 20d7a61
after adding timeout-repeat suppression; focused labels ran at
1156cedfdc66acaeb33a2c3e5de8d93136804200. Manifests preserve hashes, corpora,
thresholds, runtime and source revisions. No solver changes occurred between arms.

Six targeted tests passed: signed-zero worker regression; tied optimal-label
accounting; root order/reflection/CPC agreement; independent physical minimax
labels on small boards; dormant controls; root-probe release/exactness. The
generated frontier source check passed. The 7x6 labels themselves use the native
exact solver, so root/child agreement is internal consistency, not an independent
7x6 oracle. Full repository qualification was not run for this research-only unit.

From repository root with the pinned Windows Node:

```text
node --test experiments/strategist/move-confidence.test.mjs experiments/worker-scaling/wide-path.test.mjs
node experiments/strategist/build-frontier.mjs --check
node experiments/strategist/move-confidence-report.mjs
```

The last command reconstructs summary.json and PERFORMANCE.md from immutable raw
records and asserts label/count/WDL/cleanup consistency. For new measurements,
the campaign requires a clean checkout and a new output directory:

```text
node experiments/strategist/move-confidence-campaign.mjs <new-output-directory>
node experiments/strategist/move-confidence-campaign.mjs <another-new-directory> --focused
```

## Next candidate, not implemented

Treat score spread as a cheap prior, alongside observed progress in narrowing
unresolved obligations. Investigate the cost/benefit of one probing peer while
preserving deep peers, rather than directing all workers wide from score ties.
Any live decision needs evidence tied to the relevant position, not a stale
stack-width sample. First validate on longer CPC-unresolved roots with differing
action outcomes, including both timeout counterexamples. Keep decision work on
the strategist and reuse existing worker actions; do not add per-node score-gap
machinery on the strength of this screen.
