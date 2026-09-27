# Native worker-scaling diagnosis

Same native host, worker, CPC/Negamax, memory and node-count loader across
1/2/3/4 workers. Test-only loader relaxes the cold host's 2+ admission to 1+;
the public API is not changed. It timestamps search start/finish once per
worker. No timestamps or new counters enter recursive nodes.

Shared cache: 1M entries. Private cache: 1M entries PER WORKER. Sampling mask7.
No strategist or behavior-enabled engine. Complete three declared positions,
three repetitions with reversed arm order on alternate rounds. Thirty-second
deadline is failure containment, not a fixed-duration score. These are solved
workloads, not a repeat of the rejected short memory-sizing experiment.

Primary outcome: time to exact solution. Also report search-start-to-result,
startup/shutdown, all-thread CPU/cycles, all-worker visits, winner work, sharing
counters and per-worker contributions. No winner-node/aggregate-cycle divisor.

Diagnostic ablations: unshared1, unshared4 (same cold allocation but cache
disconnected), same-order4, solo offsets1/2/3. They isolate sharing, tie-order
effects, and duplicated deterministic traversal. They are not production
configuration changes. A native four-worker group includes offset0; rotations
only affect ties in the recursive live-line score ordering. Root move order
remains common across all native workers.

Run scaling.test.mjs first. Commit checkpoint, then run campaign.mjs with a new
evidence directory. Exact source hashes, subprocess failures, raw results and
cycle partitions are retained. No automatic retries. No claim about empty-board
completion or general scalability follows solely from these completed fixtures.

After endpoint retention, --density compares masks7/0/1/3 at workers1/4.
--hard compares full sharing at workers1/2/3/4 and unshared1/4, three repeats,
on 353335714 (a legal one-move continuation of the known P0-losing Fhourstones
35333571). The derived child's expected absolute WDL is -1. A separate first
diagnostic completed it in ~12 seconds; that probe is not a campaign replicate.
This longer completed task distinguishes steady search from cold overhead.
No memory or worker-count default is changed by either diagnostic mode.

## Joint resource campaign

See RESOURCE_CAMPAIGN.md and resource-{screen,axes,refine,sustained}.json.
`resources.mjs PLAN NEW_DIRECTORY` runs one declared stage sequentially.
`resource-report.mjs` checks the four captured stages and generates their
combined report. The host samples RSS once per second; recursive code is
unchanged. Cache payload follows geometry key width (14 words on 7x6, 7 on 4x4).
This cold accounting was generalized after the campaign; all captured 7x6
byte totals remain unchanged. The 4x4 smoke test protects the alternate width.

Owner-selected operating baseline (locked September 27, 2026):

```js
{
  workers: 7,
  sharedCacheCapacity: 4194304,
  localCacheCapacity: 1048576, // per worker
  sharedSampleMask: 0
}
```

The machine-readable owner is [locked-profile.json](locked-profile.json).
The selected worker mix is **six deep + one wide**: worker 0 iterates root
frontiers in two-ply increments, switching to deep search when at most one
unresolved root action remains. Workers 1-6 stay deep. The tested full-window
root wrapper, existing move order and exact TT sharing remain intact. There is
no asynchronous strategist or score-gap trigger in this selection.

Run the selected configuration (one-based move sequence; empty string for empty board):

```text
node experiments/worker-scaling/run-selected.mjs '{"moves":"2431572135633422"}'
```

The launcher selects the tested `probe` loader arm, pins all resource settings,
enables FFI for Windows cycle accounting, and retains the sample's 30-second
default timeout. An explicit `timeoutMs` may be supplied for a declared test.
Output includes the selected assignment, WDL, cleanup, nodes, timing and cycles.
Cycle accounting covers the child benchmark process; the cold launcher itself
is outside that measured operation. This locks the tested campaign configuration;
it does not silently promote the experimental root wrapper into library defaults.

`sample.mjs` alone uses only the profile's resource options, not its execution
selection. Historical comparison loaders still select their own explicit arms.
The historical `campaign.mjs` explicitly supplies its original memory
and sharing options so rerunning old experiments does not silently change them.
Resource plans already specify their comparison settings explicitly.

This baseline is scoped to native IsoMax RBA/CPC Lazy SMP with endpoint exact
publication, current move order and full sharing, on the Windows i5-12600K /
32 GiB / Node 26.7.0 host. It uses 683 MiB of cache payload. Generic library
defaults remain portable. Passing resource options alone to
`runLazySmpConnect4Rba32` does not enable the selected wide worker; use the launcher.

Use this baseline for subsequent same-scope campaigns unless the experiment
explicitly varies a pinned parameter. Changes of method, solver semantics, runtime
or hardware require fresh comparison. The owner selected the mixed worker plan
after the [move-confidence screen](../../evidence/isomax-move-confidence-focused-20260927/REPORT.md).
That report's recommendation preceded this owner decision and remains historical
evidence. The worker mix has short-case qualification, including losing comparisons;
it is not a proven global optimum. Sustained memory measurements and the three
five-minute empty-board timeouts belong to the earlier all-deep method. They do
not establish a sustained-memory optimum for the newly selected worker mix.

## Shallow-path cost experiment

[WIDE_PATH.md](WIDE_PATH.md) defines matched dormant-path controls and a fixed
root-probe handoff prototype. The [69-solve report](../../evidence/isomax-wide-handoff-20260927/REPORT.md)
does not establish a repeatable gain from splitting the recursive paths. Actual
probing still helps one fixture strongly and hurts another. The prototype is
the source of the subsequently selected `probe` execution path. Other arms remain
diagnostics. None implements general in-flight strategist switching.
