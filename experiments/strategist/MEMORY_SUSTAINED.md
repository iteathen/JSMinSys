# Campaign correction: sustained search is required

Owner correction: short bounded tests cannot select the memory plateau. The
72 completed short solves and four completed 30-second empty-board samples are
retained as diagnostics only. They are not a memory recommendation.

The short controller was stopped before the sweep completed. Its fifth sample
had started; that child was allowed to finish its existing 30-second deadline,
but its result was not collected after controller termination. It is excluded.
No solver processes remained afterward. No failure or success is inferred for
that uncollected sample.

Replacement: --sustained, four workers, empty board, native solver unchanged,
sharedSampleMask=7, existing node-count loader, 300000 ms per case. Three fresh
processes in order 1M/1M, 512K/512K, 2M/2M shared/private entries per worker.
Total intended search time: 15 minutes. Cache backing: 308,154,616 MiB +12 bytes.
This is a bracket around the earlier five-minute observed throughput plateau.
One sample per size does not establish equivalence or a universal solve-time
optimum. Retain all outcomes and compare only equal-duration sustained samples.

Run:
node experiments/strategist/memory-campaign.mjs evidence/isomax-memory-sustained-20260927 --sustained

No production cache default changes. Any recommendation must identify its
workload, duration, worker count, and whether it measures completion or timeout
throughput. Shared/private tradeoffs remain unresolved by a diagonal bracket.
