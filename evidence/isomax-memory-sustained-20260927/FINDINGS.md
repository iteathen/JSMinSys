# Interpretation and next decision

The short campaign was the wrong selection experiment for sustained memory
economics. Its results remain historical diagnostics only. This replacement ran
the empty board for five minutes at each of three sizes, with four native workers.

1M shared entries plus 1M private entries per worker had the highest observed
visitation rate: 5.207592 million/s. This is 64 MiB shared plus 61 MiB per worker,
308 MiB total cache payload (plus 12 bytes shared statistics). Use this as the
reference configuration for further sustained comparisons; it is not a new
production default or a proven time-to-solve optimum.

512K/512K used half the cache payload (154 MiB) and ran only 0.63% below the
1M reference. 2M/2M used 616 MiB and ran 3.21% below the reference. Thus this
sample gives no reason to spend more than 1M/1M, and suggests investigating a
practical throughput knee at or below 512K-1M. It does not establish that 512K
is the smallest sufficient allocation: smaller sustained controls are absent.

All three timed out with no WDL, after about 4.40 trillion process cycles each.
Larger memory can change which states are visited and how much work is reused.
Consequently lower visitation rate alone does not prove worse solve time, nor
does greater rate prove more solution progress. Hardware cache misses, private
occupancy, and duplicate-work fractions were not measured. Do not attribute the
2M result to a specific hardware or algorithmic cause from these data alone.

The shared exact-cache writer increments its store counter for every successful
publication, including replacements. Observed stores were 212488 / 199666 /
190203 at 512K / 1M / 2M. These are upper bounds on distinct shared slots written,
not occupancy measurements. The shared cache need not fill for collision/reuse
economics to change. They say nothing about private-cache occupancy. Treating
shared and private size as one variable leaves their separate contributions open.

Before pinning a minimum, repeat sustained 512K and 1M in reverse order and add
a sustained 256K control. Confirm any proposed smaller size with shared/private
axes separated. Keep duration and worker count matched; do not reuse the short
axis screen to select a sustained configuration. If the ranking changes with
duration, extend the shortlisted runs rather than adding a broad short sweep.
Use completed hard-position solves to qualify a time-to-solve claim. Current
evidence supports a reference configuration and a narrower candidate range, not
a final cap. Production settings remain unchanged.

Validation: three runs captured; 12 worker exits; cleanup true throughout;
no errors; all-worker node sums and bootstrap/setup/solve cycle partitions
verified. All pinned harness/solver/loader hashes remained unchanged through
the run. The analyzer and this report were added afterward. No solver, worker,
cache implementation, or hot-loop source was modified by this campaign.
