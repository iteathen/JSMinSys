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
