# CPC proof mask: completed long hard comparison

All8 planned fresh-process solves of35333571 completed EXACT, WDL=-1 and move=4,
with four active workers and clean shutdowns. No retries, timeouts, errors or
source changes. The owner authorized300000ms per run; actual124.39-125.50seconds.
The former120-second ceiling censored this fixture just before completion.
This follow-up closes the absence of a completed long-duration comparison.

Fixed A=be7c2887defcefb37080fa61de7ce1dc38dc2990;
B=7f74e324457c4237590bc6b0f924852f6d728e4c.
Windows11Pro10.0.26200, i5-12600K10physical/16logical, RAM34088599552bytes,
Node26.7.0/V8 14.6.202.34-node.28. QueryProcessCycleTime whole-process bracket.
One wide + three deep; shared4194304, private1048576 each, full sharing.
Clean fixed worktrees; no added hot instrumentation. CPU cycles include JIT,
GC, startup and cleanup; visits include parallel duplicate work.

## Results

| Metric | Baseline mean | Candidate mean | Paired delta | Descriptive95% interval |
|---|---:|---:|---:|---:|
|Process cycles|1705955161423|1703222391654|-0.160%|[-0.738%,+0.419%]|
|Wall seconds|124.944|125.196|+0.202%|[-0.319%,+0.724%]|
|CPU seconds|462.922|462.078|-0.182%|[-0.806%,+0.442%]|
|All-worker nodes|228976600|228474673|-0.218%|[-1.064%,+0.628%]|
|Winner nodes|68255306|68079738|-0.254%|[-1.611%,+1.103%]|
|Cycles/node|7450.36|7454.77|+0.059%|[-0.410%,+0.529%]|
|Shared hits|37362706|37115440|-0.644%|[-3.563%,+2.275%]|
|Shared stores|25684055|25672798|-0.044%|[-0.370%,+0.282%]|

ABBAABBA order; four adjacent paired ratios, Student t(df3). Small-sample
intervals are descriptive, not evidence of exact machine-cycle equivalence.
The two full ABBA block cycle ratios were0.9968891 and0.9999139.
Neither this long comparison nor the earlier short fixture establishes a
whole-solve improvement. Do not pool their denominators. Proof-mask remains
unselected; six-state algebra remains exact. No production PR is merged.

## Scope and evidence

Full7x6 root at ply8,34 remaining cells; each exact solve visited about229M nodes.
These are completed game-theoretic WDL solves, not depth-limited searches.
They are NOT empty-board solves. This fixed solver exports no live ply histogram;
no unmeasured maximum/typical depth is claimed. No ten-minute extension was needed.

Raw stdout/stderr:processes.jsonl; full parsed samples:samples.jsonl;
environment/sources/config:manifest.json; completion:completion.json;
reproducible analysis:analyze.mjs and summary.json; individual runs:table.md.
run.mjs retains completed samples on resume. Minor repository evidence checkpoints
occurred while later samples ran; localhost was not a dedicated isolated runner.
No benchmark processes remained after completion. Pending owner follow-up:
validate official Node nightly, then attempt empty-board solves for both sources
with600000ms each. Those results will remain a separate runtime population.

Cold analysis accounting: O(raw bytes) parsing/I/O and fixed8-row arithmetic,
formatting and aggregation, outside timed search; none is zero-cost hot work.
