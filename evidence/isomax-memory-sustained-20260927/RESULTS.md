# Sustained IsoMax memory bracket

Tested 9e5a334dc7388788f4b0e72dfa18ea79efedf6d8 on 12th Gen Intel(R) Core(TM) i5-12600K, Windows, Node v26.7.0.
Four native Lazy SMP workers, sharedSampleMask=7, empty board, 300 seconds per
run. Order: 1M,512K,2M. No strategist or worker behavior changes. Existing
all-worker node-count loader; identical instrumentation across sizes.

The owner rejected the earlier short selection campaign. Its 72 short solves
and four captured 30-second diagnostics are retained separately and excluded
from this comparison. The next short sample was uncollected after controller
termination. No short sample selects memory.

| Shared entries / private entries per worker | Cache MiB total | Status | Seconds | Total visits | Mvisits/s | Cycles/visit | Sampled peak RSS MiB | Rate vs 1M |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| S512K-P512K | 154.00 | TIMEOUT | 300.017 | 1,552,581,513 | 5.175 | 2832.5 | 274.9 | -0.63% |
| S1024K-P1024K | 308.00 | TIMEOUT | 300.035 | 1,562,458,155 | 5.208 | 2813.9 | 429.9 | 0.00% |
| S2048K-P2048K | 616.00 | TIMEOUT | 300.038 | 1,512,325,013 | 5.040 | 2911.5 | 738.0 | -3.21% |

Cache payload formula: shared entries *64 +12 bytes, plus four private caches
at 61 bytes/entry each. Total cache payload excludes runtime and geometry.
RSS is sampled once per second and is a lower bound on actual peak.
Cycles/visit uses all-process cycles during the native operation divided by
all-worker visits, not just winner nodes. Raw data preserves bootstrap, setup,
solve, and total-process cycle counts separately.

All three runs exited all four workers with cleanup true and no errors.
TIMEOUT is censored; it produces no root WDL or completed-solve time.
Visit rate is work throughput, not proof progress. Different cache sizes may
change search paths and duplicate work. One run per size does not measure
repeatability, establish equivalence, or locate a universal solve-time cap.
Shared and private capacities changed together; their independent effects are
not identified by this bracket.

Earlier five-minute evidence at another revision found ~4.28% higher visitation
throughput from 64K to 1M and ~0.29% from 1M to 2M. It motivated this bracket
but is not pooled with current results. No production default was changed.
See FINDINGS.md for interpretation.

Reproduce at the tested SHA:

    node experiments/strategist/memory-campaign.mjs <new-output-directory> --sustained

Use the pinned Node runtime with experimental FFI available. Manifests record
source hashes, arms, host, Node/V8, and revision. Raw subprocess logs preserve
per-second RSS/cycle samples and exact final outcomes.
