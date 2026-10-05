# IsoMax audit corrections

The frozen audit is `5954a8c8fe069fec1067fbeefb6840065aa19ef4`. This packet addresses its lifecycle, validation, packaging and initialization defects. The missing 32-byte shared TT optimization is separately tested and retained for standard7×6 only.

* Completed work is observed before scheduling a deadline and again inside each deadline callback. Long waits use bounded timer chunks and monotonic elapsed time; intervals exceeding the Node timer limit are rejected.
* Capacity validation uses safe integers, bounded power-of-two checks and the largest native view length before allocating tables. No 32-bit truncation can authorize an oversized capacity.
* RLC accepts only indexed array/typed-array histories with a bounded length; DataView is rejected.
* `prepareLazySmpConnect4Rba32` initializes all workers and empty TT pages, waits for every worker, then exposes a one-shot `solve(moves)` and `close()`. Normal minimal calls use this same barrier. Caller application initialization can now precede RLC and position-specific work; a subsequent solve uses its actual supplied position. Closing an active or idle session joins every created worker and settles pending waits. Pre-aborted calls create no workers.
* The frozen package applies explicit, hashed cold corrections to its declared source revision. Verification now covers public exports, configuration, metadata, examples, tests and the runtime import closure. Missing or changed public files fail verification. Historical hot modules and measurements retain their original identities; corrected initialization is separately qualified. No package publication occurred.
* Current narrow-window exact sharing remains as deliberately restored by e3ecc; private search bounds remain private. The worker ledger now distinguishes this from the obsolete MW-001B policy. No sharing semantics were reverted.

Cold-only checkpoint fcfbd61: 243 root tests pass; 43 package/source controls and 39 extracted-package tests pass. Independent post-return physical-board validation passes 26 four-worker cases, including 7×5. Independent transitions pass 21,022 child checks. Catalog: 298 sealed functions plus 222 add-on units, 30/30 blocks; generated center worker agrees with authority. Source identity checks cover the unchanged recursive worker suffixes, uncounted TT access, coordinate/CPC modules and packaged solver kernels. These bounded checks do not prove universal solver correctness.

Performance authority is the actual localhost invocation and raw evidence. Fresh pre-edit control: 161,348.4393 ms ready-empty-to-exact, 2,260,128,649,492 whole-operation process cycles, EXACT +1/c4, four clean exits. Shared table: 134,217,728 entries/5 GiB; private: 33,554,432 entries/1,056 MiB per worker. Four deep workers, center/live/center/live, rootFrontier false, sharedSampleMask 0, affinity 0/2/4/6 (mask 85), exact Node 27 nightly/V8 tuple and original inline flags. No RLC or supplied opening. Initialization and cleanup remain separate from primary wall; cycles include both. Native node/shared counters remain unavailable rather than adding hot counters. Completed matched trials and final disposition are recorded below.

Final qualification: 259 root tests and 42 package source tests pass; the extracted package independently passes42 tests. Package reproduction checks50 runtime modules,14 explicit cold corrections and380 locked files. The frozen-library binding also passes with no Git repository and an empty PATH, retaining19 independent frozen hashes and reverse/forward correction checks. Final catalog:298 sealed functions plus244 add-on units,30/30 blocks; target cycle constants remain symbolic rather than importing AMD timing into the Intel result. Both minimal-center and uncounted-cache generated checks pass.

Independent review additionally found and fixed cancellation during exact-result cleanup, package READY-abort worker leakage, and allocation before pre-aborted package initialization. Tests reproduced all three failures before fixing them. Later cancellation preserves observed DONE; early cancellation still takes precedence at application entry. No recursive reporting, timer work, allocation, layout branch, or worker creation was added. Native TT access is selected once during initialization. The hot identity comparison permits precisely the two declared bound accessor-call names and verifies every other compared worker/kernel body against the audit checkpoint.

Completed localhost solves:

| Stage | Ready-empty wall ms | Whole-operation process cycles |
|---|---:|---:|
| Before fixes |161348.4393|2260128649492|
| Cold fixes |161315.7666|2254317855979|
| Bound40 control1 |160644.3627|2247547872942|
| Native32 trial1 |149995.7777|2100711018902|
| Bound40 control2 |159704.4079|2236135776581|
| Native32 trial2 |150135.9557|2105373263597|

Both native trials passed the outcome-independent retention rule in TT-TRIAL.md. Matched means:160174.3853→150065.8667ms,6.3109% lower wall;2241841824761.5→2103042141249.5 cycles,6.1913% lower cycles. Peak RSS native8,841,793,536 and8,848,183,296bytes, versus old-layout9,913,987,072 and9,912,913,920bytes. Shared entry count remains134,217,728; payload5GiB→4GiB. Private entries and all other declared settings remain unchanged. All six full runs return EXACT +1/c4 with four verified P-core placements, no error, no remaining benchmark processes and four clean exits. No <=10s result. The old external wrapper's exit3/false promotion field is preserved; exit3 represents this completed exact result missing10s, not a timeout. This explicitly authorized localhost comparison governs retention.

Automatic layout selection chooses native32 only for matching standard7×6 compact geometry within the native view limit; generic geometries and larger valid capacities keep the previous split storage. Explicit native generic storage is correctness-tested but performance-unqualified;7×5 pads56→64bytes and is not selected automatically. The standalone frozen package retains its original solver identities, with only hashed cold corrections; its historical performance is not relabeled as qualification of the corrected lifecycle.

The legacy behavior generator CI check already failed at5954a8c and still fails atfcfbd61. That unrelated legacy generated search and generator are unchanged; they were not regenerated to change search semantics or manufacture green performance evidence. Relevant regression/generated/catalog/package checks above are separately recorded. See raw/ci-legacy-generator-failure.txt.

Raw audit reproductions are preserved in the original packet. This packet contains corrected tests and fresh results; it does not rewrite failed historical evidence. Formula holdouts remain sealed, and production CPC/NDC/BSFP semantics remain unchanged. No package publication or main merge occurred; the requested active research branch contains the durable corrections and performance evidence.
