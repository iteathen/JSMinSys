# Performance screen interruption

All 82 labels completed at 45612d4. During the performance phase, p16-7 and p16-5
each hit the existing 30-second solver limit in the single-worker probe arm.
Their matched deep controls completed below one second. Those timeout records
remain intact and are failures to solve within the bound, not timing scores.

The driver was stopped to avoid repeating those censored measurements. Its
in-flight p16-7/one-worker/round-1/probe process was also terminated; that attempt
has no collected result and is unscored. Completed records remain unchanged.

The repaired driver resumes missing trials only, suppressing repeated timeouts
for the same case/arm/worker count. It still tests seven workers separately,
because six deep peers can complete while the probing peer works. No timeout,
memory, ordering, solver or worker implementation changed. Resume source and
all skipped trials are recorded separately.
