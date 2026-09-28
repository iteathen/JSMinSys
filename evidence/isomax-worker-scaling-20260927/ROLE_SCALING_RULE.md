# IsoMax worker-count scaling rule

Date: 2026-09-27

## Rule

When reducing IsoMax search-worker count to match a smaller CPU allocation,
preserve the selected architectural role split:

- exactly **one** worker remains the wide / iterative root-frontier worker;
- every remaining search worker is a deep Lazy-SMP worker.

For total search-worker count W >= 2:

    wide workers = 1
    deep workers = W - 1

Do **not** convert a reduced-worker benchmark into an all-deep configuration.
Doing so changes the search algorithm rather than merely scaling it to the
available hardware.

Examples:

- selected 7-worker profile: 1 wide + 6 deep;
- 4-worker profile: 1 wide + 3 deep;
- 3-worker profile: 1 wide + 2 deep;
- 2-worker minimum: 1 wide + 1 deep.

The wide worker retains the selected root-frontier semantics:
- iterative root probing;
- frontier stride 2;
- release target at one unresolved root action.

The deep workers begin released to unrestricted depth.

## Hardware matching

For hardware-constrained comparisons, choose a total worker count that does not
materially oversubscribe the available CPU execution slots, while retaining the
1-wide/(W-1)-deep split.

A standard 4-vCPU GitHub Windows runner should therefore be tested with a
reduced profile such as 1-wide + 3-deep (and, if host/runtime overhead proves
material, 1-wide + 2-deep as a secondary control), rather than seven search
workers time-sliced across four CPUs.

Any worker-count change is a materially different operating profile and must be
qualified separately from the selected 7-worker i5-12600K profile.

## Benchmark interpretation

When comparing control/candidate on reduced hardware:
- both arms must use the identical worker count and role split;
- do not compare absolute timings directly with the 7-worker selected profile;
- use same-runner paired A/B evidence;
- record available CPU count and worker topology in the artifact;
- preserve the no-single-worker rule.
