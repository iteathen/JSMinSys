# Localhost minimal-worker requalification

Owner-directed continuation of `work/cpc-rebuild-20261004`. Performance authority is the actual Windows i5-12600K localhost. All implemented accepted and rejected optimization changes are in scope for retesting; GitHub fixture decisions are historical evidence only.

## Recovery and baseline

- Fetched source head: `b2518a606055a91abd95e390c54154234bff66bd`.
- Fetched main: `1b843981ba7d68c118656dad1a6c7591453e7686`; branch is 175 commits ahead, zero behind.
- No existing local branch was present in the recovered JSMinSys worktree registry. Created a tracking worktree at `C:/r/jsminsys-cpc-rebuild-20261004` without altering source or history. The desktop's native worktree tool targets the unrelated current UMCGS project, so repository-specific Git worktree creation was used.
- Configuration authority: the last successful selected-package localhost run, recorded in Connect4's `research/benchmarks/c4-0011-external-20261004/campaign-20261004-pass1/isomax/`. Its actual invocation and result establish Node, launch environment, affinity, and entry counts. Its 34.664-second result is a structural-prefix composition, **not** a minimal empty-root baseline.
- Recovered entry counts: 134,217,728 shared; 16,777,216 private per worker. Four deep workers, root frontier false, shared sample mask zero, P-core logical CPUs 0/2/4/6, process mask 85.
- Recovered runtime: Node `v27.0.0-nightly20260928b59840b593`, V8 `14.6.202.34-node.36`, `--experimental-ffi --import <worker-affinity-preload>`. No memory-related Node flag was present.
- Current branch uses 40-byte shared and 33-byte private rows: 5 GiB shared and 528 MiB private per worker. The previously selected package used 32/36-byte rows. Entry counts are preserved; this intrinsic source-layout difference is disclosed instead of silently changing capacity.

The unchanged `tools/bench-minimal-i5.mjs` invokes the minimal solver on `[]`, without RLC, CPC/NDC closures, or live-line scoring. Its 600,000 ms internal safety limit is preserved. An external 650,000 ms limit provides cleanup protection. The original package's 300,000 ms limit is not substituted into the current launcher.

Primary solver interval is the existing launcher's `performance.now()`/QueryProcessCycleTime interval around the complete host invocation through worker cleanup. External process wall/CPU/peak RSS are also recorded. The existing launcher's position-independent geometry/FFI setup is outside its internal interval and inside external process measurement.

## Execution rules

1. Two sequential fresh-process unchanged baselines first. If exact, add a third observation for dispersion. Two timeouts establish repeated censoring, not a completed-solve distribution.
2. No simultaneous benchmark or correctness process during measured solves. Verify prior benchmark exit and affinity; retain raw stdout/stderr, invocation, runtime/source hashes and OS measurements.
3. Retest every implemented accepted/rejected item in `RETEST_INVENTORY.json`. Restore historical changes as isolated causal experiments on the retained source, including necessary coupled library/host and ledger changes. Do not silently accumulate hypotheses.
4. Preserve canonical RBA exactness, multiworker execution, CPC/NDC separation and runtime input independence. Historical noncanonical execution, if measured, is an explanatory control, not an eligible replacement for the declared canonical contract.
5. Qualification requires source/ledger consistency, relevant exactness/lifecycle tests, and matched full-empty-root localhost evidence. Small fixtures are correctness controls only.
6. Censored A/B pairs remain UNQUALIFIED. They cannot establish which implementation has a lower complete-solve time. Retain/reject only from governing evidence; do not use lower timeout CPU consumption as a solved-work speedup.
7. Record each disposition before the next candidate. The current 16-item inventory includes early prepared-order/tie-diversification and canonicalization changes as well as MW-001 through MW-014 implementations. Unimplemented debt entries are hypotheses, not previously accepted/rejected implementations.

Live measurements are initially written outside OneDrive at `C:/r/minimal-worker-localhost-20261004`, then copied here after each process exits. The initial commit records recovery and the retest inventory only; no optimization has been changed or qualified.
