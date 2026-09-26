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
