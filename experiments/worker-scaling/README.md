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
`sample.mjs` uses its options by default; explicit comparison settings override
them. The historical `campaign.mjs` now explicitly supplies its original memory
and sharing options so rerunning old experiments does not silently change them.
Resource plans already specify their comparison settings explicitly.

This baseline is scoped to native IsoMax RBA/CPC Lazy SMP with endpoint exact
publication, current move order and full sharing, on the Windows i5-12600K /
32 GiB / Node 26.7.0 host. It uses 683 MiB of cache payload. Generic library
defaults remain portable; consumers of this hardware profile should pass the
locked options to `runLazySmpConnect4Rba32` during initialization.

Use this baseline for subsequent same-scope campaigns unless the experiment
explicitly varies a pinned parameter. Changes of method (including enabling
PFIF/strategist), solver semantics, runtime or hardware require fresh comparison.
The owner has selected the operating point; historical experimental evidence is
unchanged. The three five-minute empty-board runs all timed out cleanly, so the
selection does not assert a proven empty-board solve-time optimum.
