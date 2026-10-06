# Independent whole-batch review

Fresh read-only reviewer inspected base `c36d9748683ba4a4cfc09ab3456fa655c31914ad` through retained head `9e5c2f955734bf183cd6467f2d07c436ef486516`. One important finding, no critical findings. Requested changes for supplied compiled-plan reuse.

Reproduction: a 4x3 base plan reports 5,904 retained bytes; first compiled plan 13,072. Recompiling that result reported 20,240, although reachable arrays total 13,072. The public four-worker prepared session using the supplied plan solved EXACT/clean but also reported 20,240. This duplicates cold allocation/compiler work and inflates accounting. Original fixed-configuration timing always compiled a fresh base, so measured results remain valid.

Correction: after auxiliary budget admission, return the compatible native shared planes by identity. When rebuilding an incompatible plane, subtract its old transition-only retained/working footprint before adding the replacement. The hot worker/cofactor/search/cache sources are unchanged. Two regression tests failed against the reviewed head: host 20,240 != 13,072; direct reuse returned a different plan and buffers. Both passed after the correction, including budget rejection and incomplete-plane replacement. Final suite evidence is recorded separately. No new performance claim derives from this cold-path fix.

Review reported no other concrete defects. It checked compact key/seqlock behavior, independent cold shared-layout selection, mover-bound transport, canonical handle/reflection ownership, ordinary first-terminal versus proved-nonwinning licensing, bit-31 nonzero handling, tail masking, and independent owner absorption.

Reviewer fresh verification: 11 targeted cache/handle/compiler/transport tests; 96 actual worker-body window/frontier cases; native-private/native-or-split-shared four-worker regression; catalog 535 decomposed units; six generator checks. Reviewer Node26.7, no full timing/full suite/new physical-minimax run, no sealed holdout outcomes. No universal WDL/UC4A/statistical or solve-only hardware-cycle claim.

Independent recalculation confirms C66 4.287% primary improvement, 3.419% whole-operation cycle improvement, 1.165% whole-operation wall improvement. Primary mean53.828s; initialization2.018s->3.755s. The <=10s objective remains unmet.

Added missing retained generator checks to the correctness-only Verify workflow. GitHub timings are not performance authority. Main and the published isomax package remain untouched.
