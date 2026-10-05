# rc.3 canonical-library evidence

This evidence measures the historical frozen runtime. The current package applies
explicit cold audit corrections; these have correctness qualification only and
do not change the historical runtime identity or establish new timing results.

The canonical-library correction measured **5.45% slower on 7×6** and
**11.31% faster on 7×5** than rc.2 in separate matched comparisons:

| Geometry | rc.2 mean | rc.3 mean | Wall change | Exact root result |
|---|---:|---:|---:|---|
| 7×6 | 29.603 s | 31.217 s | +5.45% | WDL +1, column 4 |
| 7×5 | 6.954 s | 6.167 s | −11.31% | Draw, WDL 0, column 4 |

Each comparison contains four ABBA runs, two per arm. These are descriptive
observations on one host, not a statistical significance or universal speed
claim. Compare within geometry: the prefixes and TT entry sizes differ.
All controls, exact-result checks and worker cleanup passed.

The environment was the i5-12600K, Node 27 nightly
`v27.0.0-nightly20260928b59840b593`, and four deep workers pinned to logical
processors 0/2/4/6. Each arm used 4 GiB shared TT; private TT per worker was
576 MiB for 7×6 and 832 MiB for 7×5. Capacities matched within each comparison.
Each run computed its empty-board prefix and performed **one exact root search**:
five structural moves before ply 6 on 7×6; four before ply 5 on 7×5.
**These measurements do not cover a full game.**

Cold geometry preparation is outside the historical primary timer. Structural
calculations, solver/worker initialization, search and cleanup are inside it.
External runtime/affinity setup is excluded. Process cycles and peak RSS are
external measurements; hot node counters and TT statistics remain absent.

The canonical RBA support libraries now own geometry-dependent containment and
cofactor semantics. Initialization compiles and shares immutable superset groups,
selects native 8/16/32-bit word indices without encoding or decoding, and chooses
prepared or dense kernels for every supported geometry family. Tables and
scratch are allocated before search. Prepared canonicalization preserves the
public semantics without optional selected-set work. CPC, BSFP ordering, exact
gray-token TT identity and STOP behavior remain unchanged.

The blanket scalar-field hoist was rejected. Retained native-width storage does
not establish a measurable 7×6 benefit over the earlier generalized realization
and does not recover rc.2's 7×6 time. The scoped review records remaining JIT,
machine-cost and broader qualification limits; no all-code NEES certification
is claimed.

- Current 7×6: [report](benchmark/REPORT.md), [results](benchmark/RESULT.json),
  [samples](benchmark/samples.jsonl), [configuration](benchmark/manifest.json).
- Current 7×5: [report](benchmark-7x5/REPORT.md),
  [results](benchmark-7x5/RESULT.json), [samples](benchmark-7x5/samples.jsonl),
  [configuration](benchmark-7x5/manifest.json).
- Historical rc.2: [eight-run report](benchmark-rc2/REPORT.md). Its earlier
  improvement claim belongs to that revision and comparison.
- Intermediate screens: [unhoisted](screens/library-unhoisted/SUMMARY.json)
  and [rejected hoist](screens/library-hoisted/SUMMARY.json).
- [Canonical-library NEES review](LIBRARY_NEES_REVIEW.md).
- **253 source tests passed on each runtime**:
  [Node 26](library-qualification/qualification/native-node26-tests.txt) and
  [Node 27](library-qualification/qualification/native-node27-tests.txt).
- Separate small-cache machine diagnostics:
  [7×6](library-qualification/qualification/jit-native-7x6.txt) and
  [7×5](library-qualification/qualification/jit-native-7x5.txt).

Measured runtime: `8713baa11148a7723043d8c434ffb77343a96253`.
Evidence revision: `ab628f21fa8c989aa7fc1bc416b23ed126f82b93`.
[Package provenance](../provenance.json) pins them separately. Reports retain
original research paths; this index provides package-local links. Earlier
campaign material remains historical context. Formula holdouts stay sealed;
the package remains an unpublished prepared candidate.
