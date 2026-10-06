# Mixed narrow/wide identity test

Frozen before16-byte-only performance replay. Preserve full identity coverage:
same n<=32 narrow domain gets16-byte entries; n>32 uses the qualified24-byte key.
Classification is deterministic from support geometry, not outcomes or witnesses.
One cold-preallocated pool per class, no resizing/async publishing/telemetry.

Controlled allocation: narrow capacityN, wide capacityN/2. At retainedNshared
134217728 andNprivate8388608, shared payload3.5GiB and private224MiB/worker.
There are1.5times as many total entries as baseline32, using12.5%fewer TTbytes.
Both classes have fixed native accessors; the tagged packed-support scalar
carries class so preparation occurs once. Wider fields are never truncated.

At most one class branch per local/shared probe/store; existing cache/readiness,
full32bit seq/CAS/wrap, proof transport, search/tactical/frontier and first-terminal
guards remain. Exact q equality implies equal support, hence equal basis count
and class. No cross-class proof aliasing. Generic dimensions preserve original
cold wider fallback. Benchmarks remain empty7x6 only. After correctness/source/
cycle/JIT gates, measure against full24 and native32. A16-only loss does not
falsify the mixed layout or the exact index-partial identity parent hypothesis.
