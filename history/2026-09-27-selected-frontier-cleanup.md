# Selected IsoMax root-frontier cleanup

Owner selection: six deep Lazy-SMP workers and one iterative root-frontier worker,
with the existing 4M shared / 1M private-per-worker entry budget. The preserved
pre-cleanup revision is `8af605338cd7b10ad06c53f7d7a5ad90e91ac447`.

The selected implementation now lives in native add-ons. Its generator runs at
build time, not at application startup. `tools/run-isomax.mjs` uses the public
host directly and `profiles/isomax-i5-12600k.json` owns the selected configuration.

Retired from the active tree:

- `experiments/strategist`: source-rewriting launchers, duplicated generated
  candidates, cadence/width/score studies and unused flag actions;
- `experiments/worker-scaling`: comparison loaders, plan drivers and temporary
  selected launcher;
- `experiments/cpc-factorial` and `experiments/cpc-objectives`: completed candidate
  drivers and source-rewriting instrumentation.

Those sources remain reproducible by checking out the preserved revision. Raw
evidence and reports remain under `evidence/`; their original revisions and
historical failures are not rewritten. Paths in historical plans/reports refer
to their recorded revision, not the cleaned current tree. Rejected candidates
are not supported runtime modes.

Retained: semantic/regression tests, node and operation-cycle accounting, exact
TT sharing, worker lifecycle, cancellation, per-completed-node behavior reads,
general runtime geometry, and the selected two-ply/one-obligation release rule.
No new move ordering, CPC rule, TT policy, scheduler or adaptive strategist was
introduced. The ordinary reusable library worker/solver remains supported;
it is not an alternate selected IsoMax scheduling model.

The direct integration also resets its last-observed flag at each new solve.
Otherwise automatic wide-to-deep release in a previous solve could suppress
reapplication of an unchanged initial command when prepared state is reused.
This is cold lifecycle repair; it does not add a per-node operation.

Qualification fixture note: initial synchronous empty/early-root smoke fixtures
were stopped when they exceeded their diagnostic bound. Isolated checks located
the long case in the unchanged reference solver (`001122`), before candidate
execution. Bounded known-cost fixtures replaced it; empty-root timeout/cleanup
remains explicitly tested. No solve-time limit was increased. These abandoned
smoke attempts are not benchmark samples.
