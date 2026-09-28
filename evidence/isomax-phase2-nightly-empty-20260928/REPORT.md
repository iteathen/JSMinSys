# Nightly runtime screen and interrupted empty-board comparison

Official Node27.0.0-nightly20260928b59840b593 installed alongside26.7.0;
archive SHA256 and sourceURL in runtime.json. No global PATH or production-profile
change. Nightly passed174/174 baseline tests,180/180 candidate tests; Windows
QueryProcessCycleTime worked. Both source trees remained unchanged.

## Runtime-only screen

Fixed selected solver be7c2887defcefb37080fa61de7ce1dc38dc2990,353335714,
ABBAABBA with A=26.7.0,B=nightly. All8 exact WDL=-1,move4,clean shutdown.
Four workers(one wide+three deep),shared4194304,private1048576 each.
Mean process cycles:37.482B stable,37.229B nightly.
Paired delta:-0.665%,descriptive95% t(df3) interval[-2.570%,+1.240%].
Mean wall:2.41737s stable,2.41004s nightly.
No established runtime speed improvement. Do not generalize to all Node workloads.
Raw records and complete configuration are in runtime-*.json/jsonl.

## Ten-minute empty board on nightly

Baseline be7c2887:TIMEOUT at600.017s,rootWdl=null,move=-1.
Nodes1478258352; whole-process cycles8158168537640.
All four workers active,cleanup=true,workersExited=4,HOST_DEADLINE102.
This is a full-game attempt,not a completed empty-board solve.

Candidate7f74e32 was stopped at the owner's explicit request before completion.
The recorded child exit4294967295 and empty stdout are operator cancellation,
not a solver defect. No partial node metrics were emitted. The driver then
failed its nonzero-exit check; it did not relaunch the sample. See cancellation.json.
There is no valid A/B empty-board speed comparison and no guessed candidate data.
The previously saved analyzer requires a complete valid pair and intentionally
cannot qualify this cancelled series. Do not rerun it to manufacture completeness.

## Next experiment

Owner requested16x shared TT:4194304 ->67108864 entries,private sizes unchanged.
No such run has occurred yet. Then investigate P-core pinning and L2-informed
private-cache sizes as separate variables. Canonical preparation is in Connect4
research/semantic-quotient,SHARED_TT_L2_EXPERIMENT_PLAN.md.
No benchmark process remains from this interrupted series. No solver or runtime
promotion follows from these results. Prior long exact8-run comparison remains
separate and published under evidence/isomax-phase2-proof-mask-long-hard-20260928.
