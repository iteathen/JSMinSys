# Cycle reduction round-098 — primary-first symmetry canonicalization

The pinned IsoMax gameplay key has a two-element horizontal-reflection orbit.

The older order reflected both residual classes and compared residual content first, then used packed support to finish/tie-break orientation. That pays residual reflection/comparison even when support alone already determines the canonical member.

The qualified issue-97 change reverses the lexicographic order:

1. compute/obtain reflected packed support;
2. compare original support with reflected support;
3. if original support is smaller, select original immediately and perform no residual reflection;
4. if reflected support is smaller, reflect residual classes for output but perform no residual comparison;
5. only when support is equal reflect and compare residual content.

The orbit is unchanged: reflection swaps the same two complete tuples and the selected total order still chooses exactly one canonical minimum. Action orientation transport changes with the selected gameplay-key order; proof-facing structural orientation remains independent.

## JSMinSys profile

`canonicalPrimaryCompare32(value, reflected)` returns:

- -1: original primary is smaller;
- +1: reflected primary is smaller;
- 0: primary tie; secondary comparison is required.

The helper itself is only a routing primitive. Its optimization claim belongs to the enclosing canonicalization unit where it deletes secondary work.

## Pinned governing evidence

Issue 97 qualified this exact ordering with unchanged exact decisions:

- serial: 1715.52 -> 1560.44 ms (~9.0% lower);
- one worker: 2079.27 -> 1916.43 ms (~7.8% lower);
- four workers: 1761.16 -> 1683.46 ms (~4.4% lower).

All nine paired totals favored the candidate. The qualification included orbit-partition equivalence, action-orientation transport, support-symmetric ties, proof-orientation disagreement, and a trap proving that original-support minima perform no residual reflection/comparison.

## Composition with existing rounds

Round 083 can maintain reflected support incrementally for one ADD per child. Round 098 then uses that already-owned scalar as the first canonical discriminator. These compose: incremental reflection removes support-transform work; primary-first routing removes unnecessary residual reflection/comparison.

## Falsifiers

- primary-first ordering changes semantic identity rather than only choosing an orbit representative;
- action/witness transport is not updated to the same gameplay orientation;
- the primary coordinate is not cheaper than the secondary transform/comparison;
- primary ties dominate enough that the extra routing comparisons outweigh skipped work;
- reflected secondary values are omitted when the reflected orientation is selected and those values are required as the canonical output.
