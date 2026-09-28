# IsoMax Phase-2 shared publisher-origin census result

Date: 2026-09-27
Status: publisher-role census complete; do not continue worker-0 role specialization.

## Authority

Fixed solver:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Workflow:
`36390835169` — success.

Artifact:
`10956531994`

Digest:
`sha256:27a6c56548c2f00536d66ac5e1461b5670d885820e98bd2b01f97f9e722a4a0f`

Instrumentation changes execution cost/interleaving. Timing/cycles are invalid.

## Exact derived-long — 353335714

Four exact runs.

Aggregated publisher economics:

| publisher | store attempts | successful stores | hits served | hits/success |
|---|---:|---:|---:|---:|
| worker 0 wide | 26,194 | 26,194 | 1,434 | 0.055 |
| worker 1 deep | 2,125,691 | 2,072,888 | 642,417 | 0.310 |
| worker 2 deep | 2,207,301 | 2,160,784 | 754,043 | 0.349 |
| worker 3 deep | 2,158,049 | 2,092,117 | 652,681 | 0.312 |

Worker 0 generated only about **0.40%** of shared store attempts and its rows
served only **0.070%** of all shared hits.

Deep readers received only 1,310 hits from worker-0 rows, about **0.064%** of
all deep-reader shared hits.

## Official hard fixed window — 35333571

One instrumented 120-second window; TIMEOUT.

Publisher economics:

| publisher | store attempts | successful stores | hits served | hits/success |
|---|---:|---:|---:|---:|
| worker 0 wide | 31,890 | 31,890 | 1,258 | 0.039 |
| worker 1 deep | 5,102,410 | 4,922,505 | 6,488,958 | 1.318 |
| worker 2 deep | 5,323,219 | 5,142,701 | 5,609,128 | 1.091 |
| worker 3 deep | 5,470,684 | 5,265,416 | 6,109,947 | 1.160 |

Worker 0 generated about **0.20%** of store attempts and its rows served
**0.0069%** of shared hits.

Only 213 deep-reader hits came from worker-0 rows: about **0.0012%** of
deep-reader shared hits.

## Disposition

The wide worker is nearly independent of the shared exact table in both
directions:
- it rarely benefits as a reader;
- it rarely contributes useful rows as a publisher.

But the clean read-suppression experiment already failed to establish a
whole-solve gain, and removing worker-0 writes can eliminate only another
0.2–0.4% of store attempts.

Under minimum-machinery discipline, stop the worker-role specialization path.
Retain the simpler preferred solver `f549dcf...`.

## Next structural target

The admission census showed that on the hard workload roughly 70% of shared
probes reach an occupied direct-map slot whose full q key does not match.

The caller already has the 32-bit q locator hash.

Next experiment:
pack a hash fingerprint into the otherwise-unused high bits of the shared exact
value word:
- low two bits remain exact W/D/L code 1..3;
- high bits carry locator fingerprint;
- probe loads the packed value after the initial even sequence check;
- fingerprint mismatch fails closed before full q-key comparison;
- fingerprint match still requires full q-key and final sequence validation;
- no extra table or per-slot allocation.

This reuses already-computed structure and targets the dominant hard shared-probe
mismatch class without weakening correctness.

PR #84 remains draft/open; no merge authorization follows.
