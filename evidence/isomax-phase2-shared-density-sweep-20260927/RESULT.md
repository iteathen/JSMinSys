# IsoMax Phase-2 shared density sweep result

Date: 2026-09-27
Status: reduced uniform sharing is rejected; retain full sharing.

## Authority

Fixed solver source:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Workflow:
`36401142544` — success.

Artifact:
`10960878113`

Digest:
`sha256:b7140b2b1ce81e3fa6c2d8f46478856040749e02bcf6f8f624b9d27c891c964b`

Verify:
`36401142450` — success.

All arms:
- identical solver source;
- 4 workers = 1 wide + 3 deep;
- rootFrontier=true;
- same cache capacities;
- Node 26.7.0;
- no single-worker runs.

Only `sharedSampleMask` changed:
- A mask 0: full sharing;
- B mask 1: approximately 1/2 admitted;
- C mask 3: approximately 1/4 admitted;
- D mask 7: approximately 1/8 admitted.

## Exact derived-long — 353335714

Eight balanced four-arm blocks / 32 fresh processes.
All samples completed exactly with root WDL -1 / move 4.

Means:

| arm | cycles | nodes | cycles/node | shared hits | shared stores | contention |
|---|---:|---:|---:|---:|---:|---:|
| A full | 54.600 B | 4.525 M | 12,067.5 | 519.6 K | 1.596 M | 45.4 K |
| B half | 59.020 B | 5.260 M | 11,221.2 | 495.4 K | 807.8 K | 6.6 K |
| C quarter | 68.365 B | 6.399 M | 10,683.5 | 413.3 K | 410.1 K | 1.6 K |
| D eighth | 80.033 B | 7.780 M | 10,287.0 | 309.4 K | 209.3 K | 266 |

Paired whole-process cycle change versus full sharing:
- B half: **+8.098%**, 95% interval **[+7.304%, +8.892%]**;
- C quarter: **+25.214%**, interval **[+24.571%, +25.856%]**;
- D eighth: **+46.584%**, interval **[+45.860%, +47.309%]**.

Node expansion is correspondingly large:
- B: +16.25%;
- C: +41.43%;
- D: +71.95%.

Reduced sharing lowers cycles/node:
- B: -7.01%;
- C: -11.47%;
- D: -14.75%.

But the lost shared evidence expands the exact tree much faster than per-node
cost falls. Whole-process cycles are the acceptance authority, so all three
reduced-density arms are rejected.

## Official hard fixed window — 35333571

One four-arm block, unchanged 120000 ms ceiling.
All arms timed out. No exact solve-speed ratio is admissible.

Descriptive fixed-window observations versus A:
- B half: cycles -4.83%, nodes -0.19%, cycles/node -4.64%;
- C quarter: cycles +0.26%, nodes +11.70%, cycles/node -10.24%;
- D eighth: cycles -8.90%, nodes +0.91%, cycles/node -9.72%.

The censored hard window again shows that lower sharing can reduce per-node cost,
but this cannot override the completed exact result.

## Structural conclusion

Uniform sharing density is not the correct optimization axis.

The existing shared table is expensive, but its exact evidence materially
reduces the completed search tree. Full sharing remains the preferred policy.

Do not change the selected profile sharing mask from 0.

The next structural target should preserve shared evidence while reducing the
cost of representing, validating, and publishing exact shared identity.

The current standard 7x6 shared key is 14 uint32 words. Successful shared hits
must validate the complete exact key, and stores publish the complete key.

Next investigate whether the 14-word q identity contains exactly derivable or
redundant components that can be removed from the shared-cache identity without
weakening equality. Any reduction must be proved exact for arbitrary configured
geometry; no probabilistic hash may replace full identity.

PR #84 remains draft/open; this result gives no merge authorization.
