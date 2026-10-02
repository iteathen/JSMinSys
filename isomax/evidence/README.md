# Candidate evidence

The eight-run localhost comparison held entry counts, runtime and affinity
constant. All seven structural controls passed in every run. Five moves were
computed without search; one exact search began at ply 6 from `44444` and
returned WDL +1 and column 4. This is not full self-play.

| | Previous 40-byte TT | Packaged 32-byte candidate |
| --- | ---: | ---: |
| Mean complete interval | 37.3645604 s | 37.21110975 s |
| Maximum peak RSS | 7.362873 GiB | 6.362946 GiB |
| Shared TT memory | 5 GiB | 4 GiB |
| Shared entries | 134217728 | 134217728 |
| Private memory per worker | 576 MiB | 576 MiB |

All eight runs completed under 60 seconds. The nominal 0.41% speed improvement
is within paired measurement uncertainty (-0.48% to +1.29%); the supported
conclusion is **20% less shared TT memory with effectively unchanged time**.

- [Machine-readable summary](benchmark/SUMMARY.json)
- [All measured samples](benchmark/samples.jsonl), [raw process output](benchmark/raw.jsonl)
- [Paired uncertainty](benchmark/BLOCK_ANALYSIS.json)
- [Environment and exact revisions](benchmark/manifest.json)
- Actual worker placement: `benchmark/affinity-<run>-<worker>.json`
- [217-test qualification](qualification/full-suite-final.txt)
- [30 focused tests on benchmark Node nightly](qualification/nightly-tests-final.txt)
- [Original protocol](INITIALIZATION_PROTOCOL.md) and [original detailed report](benchmark/REPORT.md)

The last two documents are preserved historical snapshots: their original
repository-relative paths and statements about promotion describe the pre-package
research commit. This page is the package-local index. The current package status
is prepared on main and unpublished. The new standalone packaging smoke tests
live in `../test/`; they supplement, rather than replace, the recorded qualification.

Correctness covers twelve nonstandard dimension configurations plus standard
7x6, independent late-position board minimax, reference traversal/cache equivalence,
CPC guards, STOP/reuse and cleanup. Formula holdouts remain sealed.
Runtime modules are SHA-256 locked and unchanged by packaging. Generic large-cache
latency and further variable-width specialization remain unqualified.
