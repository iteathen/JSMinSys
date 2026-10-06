# Memory profiles and current evidence

Current startup owns physical-core discovery and memory-profile selection.1/2/4/8GiB are tested profiles,16/32/64/128GiB experimental. Auto includes experimental sizes when they fit, as owner-authorized. Shared budgets are distinct from private-per-worker and support/runtime memory. The current setup is ../README.md.

Current six-worker8GiB mean41.124s/best39.822s and ordinary4GiB mean42.068s come from the exact source/configurations in https://github.com/iteathen/Connect4/tree/2ed014567c5630fc35d8823887d14acd062d0a2a/docs/qualification/20261006-large-shared-tt .1/2/4GiB by2..6-worker matrix is retained in the adjacent20261006-workers-shared-tt directory. The modest8GiB mean advantage overlaps timing variation; tested is not a universal optimum.16..128GiB have address/size/small-bank checks, without full-capacity performance evidence.

Records below are historical kernel qualification and explicit four-worker measurements. They do not prescribe current automatic sizing.

# Retained-candidate evidence

The default package solves directly from empty with no RLC. See CURRENT-CHECKPOINT.md for retained/rejected experiments and FINAL-REVIEW.md for the independent review and corrected cold reuse finding.

Those documents are snapshots from the research repository and retain its original paths. For this extracted package, `../profile.json` is the launch authority and `../README.md` is the setup guide; repository-only paths are not setup dependencies.

runs/ contains complete stdout, stderr, invocation, measurement, cleanup and affinity records for two matching controls, two retained candidate trials, and the final source confirmation. C66-CROSSOVER.json records candidate mean53,828.45145ms against control mean56,239.384ms; fusion-final-confirm.json records54,155.658ms separately. Process cycles include initialization and cleanup, not solve alone. Peak RSS is not TT occupancy. Node and shared-cache statistics are unavailable, not zero. C61-MEMORY-GRID.json preserves the earlier explicit memory selection; TT sizing is unchanged by the new geometry planes.

423 repository tests passed at the reviewed source, with physical checks across100 dimensions and actual four-worker independent minimax qualification. Correctness CI passed at1eddb12, which d2e4cca inherits unchanged. These records qualify the retained kernel, not an untested universal UC4A decoder. Both formula holdouts remain sealed. Older evidence belongs to historical package revisions.
