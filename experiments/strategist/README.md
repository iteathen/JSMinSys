# Asynchronous strategist campaign

Experimental opt-in worker controls, not production IsoMax policy. Built on
JSMinSys's existing RBA solver and optional per-completed-node behavior reader.
No src/addons files are changed; no Connect4 dependency is repinned.

The strategist owns flag publication and reads existing TT statistics. Workers
keep solving; no decision handshake, per-node reporting, or TT mutation by the
strategist. The host-only control has no strategist and owns its own STOP writes.
All cases use fresh trial storage and a ready barrier. Evaluators warm up before
the timed solve, finish or cooperatively cancel, and report cycles/metrics once.

## Candidate meaning

| Candidate | Behavior |
| --- | --- |
| host-only | Original behavior reader; no strategist; host stops peers |
| poll-only | Original behavior reader + observer/STOP strategist |
| inert | Experimental change-detection checkpoint, flags stay zero |
| fixed | One persistent extra cyclic tie-order shift |
| rotate | Periodically change tie-order shift |
| sparse | Use existing hash sampling for 1/16 shared TT accesses |
| adaptive | Switch full/1:16 sharing using sampled contention/store ratio |
| combined | Periodic rotation + adaptive sharing |
| fixed-sparse | Fixed extra tie-order shift + 1:16 sharing |

Rotation preserves live-line scores; it changes equal-score tie precedence in
FUTURE recursive nodes through prepared permutations. It does not rebuild live
move lists, change root ordering, drop actions, restart or transfer a frame.
Sampling changes only shared access eligibility, not private cache use or truth.
Counter deltas are coarse pressure estimates, not duplicate-work attribution.

Settings first take effect when observed at a completed-node boundary. These
initial policies are state-independent and persistent: delayed delivery cannot
refer to a different board accidentally. Chronological/context-bound commands
are not implemented or qualified. Such policies would require a scope/validity
contract before being admitted. Timer interval is a request, not a deadline;
trace timestamps record actual strategist wakeups. Trace is capped at 256 entries.

## Run

Use Node 26.7.0 on Windows for cycle measurements; FFI is experimental.

```text
node experiments/strategist/build.mjs --check
node --test experiments/strategist/*.test.mjs
node --experimental-ffi experiments/strategist/run.mjs screen screen.jsonl
node --experimental-ffi experiments/strategist/run.mjs screen2 screen2.jsonl
node --experimental-ffi experiments/strategist/run.mjs campaign campaign.jsonl
node --experimental-ffi experiments/strategist/run.mjs cadence cadence.jsonl
node --experimental-ffi experiments/strategist/run.mjs confirmation confirmation.jsonl
node experiments/strategist/summarize.mjs confirmation.jsonl
```

Output must not already exist. Each trial is appended immediately. Default
campaign uses two evaluators, 4,096 private slots each, 16,384 shared slots,
20 untimed 4x4 warmup solves per evaluator, and 750 ms case deadline. Screens
use 500 ms. Stop/cleanup grace is separate and included in tail accounting;
it does not convert late results into on-time successes. No timeout increase.

`COSTS.md` defines what the cycle meter includes and excludes. Treat initial
results as fast screens, not as standard Fhourstones scores or full NEES proof.
The mirrored fixture tests orientation sensitivity, not an independent game.

Results: [initial campaign](../../evidence/strategist-campaign-20260926/RESULTS.md).

## Strategy-first pass 2

The host, evaluator, generated solver, ordinary add-ons and TT are unchanged.
`JSMINSYS_FLAG_DISPATCH=early` selects the provisional integer early-return
handler for experiments; `integer` remains the default. `xor` and `masked` are
comparison variants. All perform the required per-completion shared read.

New strategist-only candidates, selected cold through
`JSMINSYS_STRATEGIST_POLICY`, are:

| Candidate | Hypothesis/behavior |
| --- | --- |
| anchor-private | Anchor shares fully, helpers sample 1/16 to reduce duplicate shared accesses |
| wide-private | Same plus broader prepared tie offsets between workers |
| harvest | Start asymmetric; enable full helper sharing once two sampled exact records have at least eight remaining cells |
| wide-harvest | Combine harvest and broader tie offsets |
| seed-retire | Share initially; STOP helpers once 256 stores and one sampled record with eight remaining cells are observed |
| wide-seed | Combine seed retirement and broader tie offsets |
| thin-sharing | Sample 1/256 shared accesses on all evaluators |

The observer examines at most 256 committed shared rows without writing TT
content or statistics. Store count and remaining cells are proxies, not proof
that a helper contributed useful work. Retirement always leaves anchor 0 alive.
Trace distinguishes threshold eligibility from actual helper STOP publication.
Historical pass-2 traces used `retired`/`harvested` for eligibility; read them with
the named policy. They do not alone establish retirement or harvesting.

```powershell
node --experimental-ffi experiments/strategist/explore-dispatch.mjs dispatch.jsonl
node --experimental-ffi experiments/strategist/explore-strategies.mjs screen screen.jsonl
$env:JSMINSYS_FLAG_DISPATCH='early'
node --experimental-ffi experiments/strategist/explore-strategies.mjs strategies strategies.jsonl
node --experimental-ffi experiments/strategist/explore-strategies.mjs confirmation confirmation.jsonl
Remove-Item Env:JSMINSYS_FLAG_DISPATCH
node experiments/strategist/analyze-pass2.mjs evidence/strategist-pass2-20260926
```

The strategy driver sets policy and geometry environment values per trial; the
existing host interface is preserved. Run without externally supplied campaign
environment overrides. Independent trials use fresh workers and storage.
Pass 2 uses a fixed requested 5 ms observation interval, not cadence tuning.

Results: [flag dispatch and strategy screening](../../evidence/strategist-pass2-20260926/RESULTS.md).

## Research-guided worker actions

The [action campaign](ACTION_CAMPAIGN.md) records the consulted IsoGraph/DP
research, primary external sources, action semantics, hypotheses and scope.
It adds an opt-in `actions` handler and policies for shared-cache bypass,
existing optional CPC proof effort, reversed prepared tie precedence, and their
combinations. Exact values and deterministic root moves remain required.
No production solver, TT, existing host/evaluator or default handler changes.

```text
node --experimental-ffi experiments/strategist/action-campaign.mjs screen NEW-SCREEN.jsonl
node --experimental-ffi experiments/strategist/action-campaign.mjs actions NEW-ISOLATED.jsonl
node experiments/strategist/analyze-actions.mjs evidence/strategist-actions-20260926
```

The first mode screens 60 trials; the second isolates action costs and proof
benefits in 72 interleaved trials including one-worker controls and a winning
mover root. Fixed 750 ms case limits and requested 5 ms observation interval.
Results: [action campaign evidence](../../evidence/strategist-actions-20260926/RESULTS.md).

## PFIF worker actions

The [frontier campaign](FRONTIER_CAMPAIGN.md) supplies native bounded traversal,
stride changes and full-continuation release inside an opt-in experimental
worker. The evaluator now selects that specialization cold for `frontier-*`
policies. Ordinary solver, host and TT remain unchanged. Results and limitations:
[42-trial screen](../../evidence/strategist-frontier-20260926/RESULTS.md).

The [implementation audit and corrected test](../../evidence/strategist-frontier-audit-20260926/RESULTS.md)
found the fixed-pass candidate omitted the narrowing stop condition. The new
`frontier-*-narrow` policies release at a flag-selected remaining-root-action
target. The original timeout screen is not a test of the complete PFIF strategy.

```text
node experiments/strategist/build-frontier.mjs --check
node --experimental-ffi experiments/strategist/frontier-campaign.mjs NEW-FRONTIER.jsonl
node experiments/strategist/analyze-frontier.mjs evidence/strategist-frontier-20260926
```
