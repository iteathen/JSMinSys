# IsoMax PFIF trigger screen

108/108 exact solves; all returned the known absolute P1 win (rootWdl -1) and
joined cleanly. **No trigger qualified for promotion.** No production addon,
worker loop, observation layout, TT, move order or locked resource default changed.

Tested JSMinSys e1420ec, Windows i5-12600K, Node 26.7.0. Four strategist triggers
use the SAME existing two-ply one-band action. One-worker controls and the locked
seven-worker pool both use 4M shared / 1M private entries per worker, full sharing.
Three rotated repetitions on A, B and B's predecessor: 108 trials, all completed
in 45–106 ms from ready barrier. This is a mechanism screen, not independent
holdout, an official benchmark score, or final NEES qualification.

## What was compared

- `native`: existing native behavior worker with STOP polling, no strategist.
  This is not the production no-poll worker; the comparison includes the normal
  experimental host preparation/warmup and its root execution path.
- `read`: same one-band-capable worker as the candidates, snapshots requested,
  strategist observes but never issues an exploration command.
- `sustained`: historical two consecutive positive pending-width deltas.
- `growth`: any positive pending-width delta.
- `relative25`: a positive delta of at least 25% of previous width.
- `density`: width increases AND `(width-1)/activeFrames` increases; discounts
  growth caused solely by more equally branching active frames.

All triggers preserve revision, solve scope, DEEP-mode and unchanged-horizon-stop
guards, and wait for command completion before rearming. They do not guarantee
same-q or same-region observations. The density calculation is strategist-only.
No new node counter, branch test, per-node timer or telemetry was added to workers.

## Results

Percentages are geometric means of paired candidate/control ratios across the
nine root/repetition pairs at each worker count. Positive means more time/cycles.
Three repeats and two related fixtures do not support small-difference rankings.

| Trigger | 1-worker solve time vs native | 7-worker solve time vs native | 7-worker solve time vs read | 7-worker evaluator cycles vs native | 7-worker total trial process cycles vs native |
|---|---:|---:|---:|---:|---:|
| Observation only | +6.4% | +3.2% | 0% | +3.2% | +22.1% |
| Two increases | +5.8% | +18.3% | +14.7% | +18.6% | +25.6% |
| Any increase | +5.3% | +15.6% | +12.0% | +14.6% | +22.9% |
| At least 25% | +4.3% | +7.3% | +4.0% | +7.0% | +22.4% |
| Increasing density | +3.9% | +7.5% | +4.2% | +7.3% | +23.4% |

Relative growth and density are the least costly active candidates in this screen,
not winners. The historical sustained-growth trigger is particularly weak here.
At seven workers it visits 4.4% fewer nodes but takes 18.3% longer: reducing work
did not repay execution cost. Single-worker visits change by under 0.07% for every
trigger; these commands barely change the proof traversal on these positions.

## What the traces reveal

Requested observation cadence is 5 ms. Actual strategist iteration gaps have a
16.03 ms median, range 5.27–26.30 ms. This is measured delivery behavior, not a
controlled attribution to timers, OS scheduling or CPU competition. It is not a
recommendation to tune cadence independently of strategy.

Example B, one worker, first `growth` trial:

- At 16.18 ms, strategist reads root snapshot: width 7, one active frame, zero nodes.
- At 32.66 ms, it reads width 58 across 18 frames, relative depth 22, 3,204 nodes,
  and publishes the one-band command.
- The worker eventually completes one band. Total visits remain exactly 40,439;
  that band has zero horizon stops and changes none of the recorded core work.

This jump is not evidence that one local frontier expanded from 7 to 58 choices.
The observer measures pending obligations along a changing active stack. The
command is deliberately consumed by the next eligible non-root branch; it carries
no reference to the branch responsible for the observed change. Exactness remains
safe, but the experiment does not establish that intervention reaches its intended
economic opportunity. A depth number alone would not establish branch identity.

The earlier successful B experiment explored ROOT alternatives before descending
and reduced 40,439 visits to 2,544. This action operates at a future NON-ROOT branch.
It is not the same intervention delivered late, and these results do not refute
that root result or PFIF generally. Choosing a different width threshold cannot
by itself resolve this difference in action scope.

## Decision and next experiment boundary

Keep the selected native baseline. Do not select density over relative growth on
these small differences or promote any current trigger. Do not tune a large
threshold grid on these same two families.

The next useful question is whether a proactive bounded command reaches the
specific retained frontier whose expansion makes exploration economical. Establish
that correspondence before further trigger ranking. Reuse native numeric frame
information if possible, with stale-command handling and all added costs measured;
do not introduce a competing scheduler, TT mutation or physical-state replay.
The present flags/action contract does not provide this correspondence.

First validate the intended intervention on a known positive control, then compare
activation before the opportunity versus activation after measured expansion.
Only after that should thresholds and renewal yield be ranked on independent,
longer completed solves. An observed width decrease across unrelated frames is
not proof that the preceding command eliminated those alternatives.

## Accounting, validation and reproduction

Primary solve time is ready barrier to first exact worker result, validated after
join. QueryThreadCycleTime reports evaluator and strategist thread cycles separately.
QueryProcessCycleTime additionally captures every process thread, preparation,
warmups and cleanup across the complete trial. The latter's larger percentage
includes the extra strategist worker startup; it is not a per-node overhead claim.
Raw records also retain total process cycles since process creation, whole trial
wall time, nodes, command counts, snapshots and cleanup. Startup/JIT remains a
material fraction of these short runs.

16/16 targeted tests passed: trigger distinctions, stale/duplicate/scope guards,
one-band execution, native-root restoration, live modes and asynchronous shutdown.
All six generated worker freshness checks passed before timing. New trigger tests
failed for the intended absent behaviors before implementation. No worker source
or generated worker changed during this pass. Prior historical evidence is intact.

```text
node --test experiments/strategist/trigger-policy.test.mjs experiments/strategist/pending-policy.test.mjs experiments/strategist/one-band.test.mjs
node experiments/strategist/trigger-campaign.mjs NEW_DIRECTORY
node experiments/strategist/trigger-report.mjs NEW_DIRECTORY
```

Use the pinned Node runtime on Windows; child samples enable experimental FFI.
Fresh processes, 20 existing 4x4 warmups, fixed 750 ms containment deadline, no
retries or timeout changes. The source manifest identifies the exact tested SHA
and hashes. [Raw trials](samples.jsonl), [process output](processes.jsonl),
[aggregate/trigger evidence](summary.json), [manifest](manifest.json).
