# Worker and memory joint campaign

Objective: minimum wall time to an exact solution, preserving native Lazy SMP,
full exact sharing, move order, and recursive code. Endpoint publication fixes
change sharing economics, so historical memory knees are not assumed current.

1. Screen workers 4 through 12 with 1M/1M and 2M/2M shared/private entries.
   Private capacity is PER WORKER. Three counterbalanced fresh-process solves
   of 353335714, absolute WDL -1; this is a derived Fhourstones child, not an
   official input. Thirty seconds is failure containment, never a timeout score.
2. Use observed worker/memory interactions to choose independent shared/private
   axes and larger capacities near the strongest configurations. Confirm close
   contenders; do not choose an optimum from a single fastest run.
3. Sustain shortlisted configurations on the empty board for five minutes each.
   Preserve TIMEOUT as incomplete. Visits/sec and cycles/visit do not establish
   time-to-solve or a universal memory saturation point. If no solve closes,
   explicitly leave the sustained solve-time optimum unresolved.

Initial screen: 54 completed solves, expected roughly 6-12 minutes. Adaptive
follow-up avoids a full Cartesian sweep. Five-minute confirmation is reserved
for finalists rather than multiplying every configuration into hours of runs.

Accounting: all-worker visits, whole-process cycles/CPU, cold start and cleanup,
shared hits/stores/contention, exact cache payload, and process RSS sampled once
per second by the host. RSS is an observed maximum, not a guaranteed peak.
Shared entry payload = 64 bytes plus 12 fixed bytes; local entry = 61 bytes.
Total cache payload = shared*64 + 12 + workers*private*61.
No timers, counters or policy machinery are added to recursive search.

Host: i5-12600K, 10 cores / 16 logical processors, roughly 32 GiB RAM. Worker
order offset repeats modulo seven; 8-12 workers do not introduce new nominal
tie rotations. Both hardware topology and repeated orders are explanatory
hypotheses, not isolated causal results. No affinity or ordering is changed.

Run `resources.mjs PLAN_JSON NEW_EVIDENCE_DIRECTORY` from a clean committed tree.
Plans declare all arms, repeats, root, oracle, deadline and timeout acceptance.
Source hashes and raw subprocess output are retained before result validation;
failure stops the campaign without retry. Per-campaign HEAD is fixed.
