# Worker-scaling baseline checkpoint

90/90 native diagnostic runs EXACT; oracle WDL and joined lifecycle passed.
Tested 6c0fecc, four worker counts, three completed positions, three repetitions,
1M shared entries and 1M private entries per worker. No solver mutation.

The source guard admits one worker into the otherwise identical native path.
Cold start/finish timestamps separate worker startup from actual search. Existing
all-worker node redirection is common to every arm. Public 2+ API unchanged.

The slowdown reproduces inside search. The 45461667 native1 visits 806844 nodes;
native2 winner0 still visits exactly 806844 despite thousands of shared hits.
Solo offsets2/3 visit exactly 708500/716450: the corresponding native winners
retain these same counts. Sharing is not reducing those solved trajectories.
Unshared controls remove atomics without changing the private memory allocation.
Same-order4 increases duplication; rotating ties supplies some diversity but
not effective parallel solution progress on these roots.

Source explains a missing opportunity: recursive fail-high winning endpoints
return before exact-cache publication. Relevant prior research: Connect4
research/semantic-quotient, research/isograph/discovery/2026-09-26-isomax-core019/
DP_REPORT.md C2. It explicitly distinguishes V>=1 => V=1 from non-exact interior
bounds and warns about forced-tail current-key/mover/sign ownership.

Next hypothesis: retaining proven recursive winning endpoints enables workers
to reuse expensive conclusions. Test only that directed publication first;
do not add ordinary bound sharing, a scheduler, root rotation, or change memory.
Baseline evidence remains immutable regardless of candidate outcome.
