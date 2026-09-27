# IsoMax on the four standard Fhourstones inputs

Tested JSMinSys/IsoMax revision: `b6ce1c541807b0123cf8f5dab759dcccd6a93f3b`.
Source: [John Tromp's Fhourstones 3.1 benchmark](https://tromp.github.io/c4/fhour.html).
Official input order and expected WDL: 45461667 win, 35333571 loss, 13333111 draw,
empty board win. These positions all have P0 to move; absolute P0 WDL agrees
with mover-relative WDL. No derived fixtures were substituted.

## Result

**2/4 solved correctly; 2/4 reached the 120-second per-position ceiling.**
Both timeout results have null WDL. All four runs joined all seven workers and
reported clean shutdown. No crash, retry or source modification during testing.

| Position | Result | Wall seconds | All-worker visits | Million visits/sec | Process cycles/visit | Operation cycles, billions |
|---|---|---:|---:|---:|---:|---:|
| `45461667` | Win | 0.209 | 151,009 | 0.723 | 46,923 | 7.086 |
| `35333571` | Loss | 83.133 | 412,368,568 | 4.960 | 5,183 | 2137.317 |
| `13333111` | TIMEOUT | 120.040 | 604,445,979 | 5.035 | 5,101 | 3083.065 |
| Empty board | TIMEOUT | 120.037 | 751,864,729 | 6.264 | 4,103 | 3084.881 |

Summed operation cycles: 8312349375773; total visits: 1,768,830,285;
summed operation wall time: 323.419 seconds.

## Profile and interpretation

- 12th Gen Intel(R) Core(TM) i5-12600K; Windows 10.0.26200; 16 logical processors.
- Node v26.7.0; V8 14.6.202.34-node.28.
- Six deep workers plus one iterative root-frontier worker, full exact sharing.
- Shared TT: 4,194,304 entries; private TT: 1,048,576 entries per worker.
- Cache payload: 716,177,420 bytes (~683 MiB), excluding other state/runtime costs.
- One run per input, official order, sequential fresh processes, no trace flags.
- Existing historical Fhourstones containment: 120s per input; outer subprocess
  watchdog 145s only for failed shutdown. The outer watchdog never fired.

Wall time includes preparation, worker startup, solving and joined cleanup.
QueryProcessCycleTime measures summed process-thread CPU cycles, including JIT,
GC and shutdown; cycles/visit is this total divided by all-worker recursive visits.
It is not a hardware-instruction count or isolated inner-loop cost. Counters are
read after all workers join and passed safe-integer checks. Raw records include
per-worker visits, timings, memory and lifecycle outcomes.

These are **IsoMax results on the standard Fhourstones inputs**, not an official
Fhourstones implementation score. IsoMax's work accounting and parallel duplicate
visits differ from the reference solver. The two timeouts make the suite incomplete;
their throughput must not be presented as solved-position throughput. Single runs
do not establish a statistically reliable speedup over any earlier version.

## Reproduction and evidence

With the pinned Node runtime, execute the following once for each move string
45461667, 35333571, 13333111, then an empty string:

```text
node --experimental-ffi tools/run-isomax.mjs '{"moves":"45461667","timeoutMs":120000}'
```

The selected profile fixes worker count and cache capacities. `manifest.json`
records host/runtime/profile and expected answers. `results.jsonl` preserves
each full result and argv; numbered stdout/stderr logs are unchanged captures.
`runner.mjs` is the exact cold evidence driver used (it refuses to overwrite
its evidence directory). It introduces no per-node instrumentation or source
rewriting. The temporary working copy of that driver was removed after capture.
