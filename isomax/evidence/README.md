# Candidate evidence

The final eight-run localhost comparison measured **29.729 seconds** for the
prepared-closure candidate versus **37.295 seconds** for the qualified baseline:
**20.29% less wall time and 20.25% fewer process cycles**.

Both arms used the same i5-12600K, Node27 nightly, four pinned deep workers,
4 GiB shared TT and 576 MiB private TT per worker. Maximum candidate peak RSS
was **6.363 GiB**. Candidate runs ranged from **29.591 to 29.903 seconds**.
All runs passed the seven controls, computed five structural moves, then made
one exact search from `44444` at ply 6. Every search returned WDL +1 and column 4;
all workers exited. This measures one root solve, not a complete self-play game.

The four-pair descriptive interval for wall reduction is 19.42–21.14%.
This is bounded evidence on one host, not a universal speed guarantee.
No 50% result is claimed. Hot node counters and TT statistics remain absent.

- [Final report](benchmark/REPORT.md), [summary](benchmark/SUMMARY.json)
- [Per-run results](benchmark/samples.jsonl), [raw output](benchmark/raw.jsonl)
- [Exact configuration and revisions](benchmark/manifest.json), [paired analysis](benchmark/BLOCK_ANALYSIS.json)
- [All ten optimization claims](CLAIM_AUDIT.md), [scoped NEES review and remaining debt](NEES_REVIEW.md)
- [Sampled CPU attribution](campaign/profile/ANALYSIS.json); raw profiles are beside it
- [236 source tests on Node26](campaign/qualification/node26-final.txt)
- [236 source tests on the benchmark Node27](campaign/qualification/nightly-final.txt)
- [Compiler evidence before Boolean normalization](campaign/qualification/dense-jit.txt)
  and [after](campaign/qualification/boolean-jit.txt)
- [Earlier 32-byte TT evidence](tt-layout/REPORT.md)

`screens/` preserves the CSR, constants, grouped-mask, prepared-kernel screens
and the pre-Boolean eight-run confirmation. The slower first list realization
was not used to reject the compiled-transition approach. Grouped masks, cold
specialization and compiler-guided Boolean normalization were tested next.

All tables and scratch are prepared before search; the selected hot path adds
no allocation, reporting or geometry dispatch. Search order, exact gray-token
TT identity, CPC and general-dimension kernels are preserved. Broader proposed
search changes remain unqualified research, with explicit dispositions in the audit.
Formula holdouts stay sealed.

Source reports and logs retain their original research-repository paths and
pre-package context. This is the package-local index. The standalone package
tests in `../test/` additionally verify selected cofactors and real workers,
including sparse standard initialization. Runtime bytes and evidence are pinned
by `../provenance.json`. The candidate is on main and remains unpublished.
