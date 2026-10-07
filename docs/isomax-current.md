# Current memory-profile package — 2026-10-06

IsoMax0.2.0-rc.4 runtime freeze40b19431f00174c5d52c442677d67ec698e8c50a. See [package setup](../isomax/README.md). Cold startup discovers physical P-cores and available physical/process/Windows-commit memory, then selects the largest fitting profile, including experimental sizes as owner-authorized.

Shared budgets1/2/4/8GiB are tested profiles;16/32/64/128GiB are experimental. Their real allocation depends on geometry/record width, reported before search. All workers are retained, with256MiB private budget each; reserve includes support/runtime memory. No per-node sizing or allocation. Standard128GiB uses32 independently addressed4GiB banks; metadata/boundary tests do not qualify actual128GiB allocation or performance. Current local8GiB tests averaged41.124s with six workers, not a universal optimum.

The records below are historical versions and explicit configurations, not current defaults. Main/registry promotion is separate from this prepared package.

# Historical rc.2 package and configuration

The earlier promoted package was **0.2.0-rc.2**, available together under
[isomax/](../isomax/README.md). Runtime promotion commit:
`8e176bc03bec4a0f8d7871d49595f7e0a4fd88be`, through
[PR #125](https://github.com/iteathen/JSMinSys/pull/125). Later documentation commits
may advance main without changing this runtime.

## Setup

With Node 26 or later, from the repository root:

```sh
cd isomax
node verify.mjs
node run.mjs
```

Alternatively, extract the complete `package/` folder from
[iteathen-isomax-0.2.0-rc.2.tgz](../isomax/dist/iteathen-isomax-0.2.0-rc.2.tgz)
and run those two Node commands inside it. No installation or manual dependency
assembly is needed. The archive SHA-256 is
`26b1c5232ced8fa7c1e12f0bb3ccf0e6fd9c55788a7dab6caeab18e034d162e1`.

The default operation is one exact solve from the actual empty 7×6 board.
No RLC, supplied prefix, opening book, prior-run proof cache or solved knowledge
is consumed. Preparation creates all workers and tables and completes an
all-ready barrier; root construction and search begin afterward. This measures
a root outcome and optimal move, not a complete self-play game.

For a small installation check or a different board, inside `isomax/`:

```sh
node run.mjs --columns 1 --rows 4 --shared-entries 256 --local-entries 256
node run.mjs --columns 7 --rows 5
```

Winning length is four. Geometry, native widths, key/cache layout and the complete
plan or fallback path are selected during initialization. Fast physical checks
cover all 100 dimensions from 1×1 through 10×10; full performance qualification
is on 7×6. Different dimensions may require substantially longer searches.

## Retained configuration

[profile.json](../isomax/profile.json) is the package launch authority.
Historical target profiles and GitHub runner cache sizes are not substitutes.

| Setting | Promoted value |
|---|---|
| Workers | Four deep workers, center/live/center/live |
| Shared TT | 134,217,728 native 32-byte entries, 4 GiB |
| Private TT | 8,388,608 native 32-byte entries, 256 MiB per worker |
| Root frontier / shared sampling | Disabled / mask 0 |
| Shared proof bounds | Enabled |
| Base support-plan budget | 1 GiB, closures and reflection enabled |
| Compiled-transition auxiliary budget | 512 MiB; actual 7×6 planes 466,948,881 bytes |
| Total retained 7×6 geometry plans | 1,323,433,629 bytes |
| V8 inlining flags | 2400 / cumulative 9600, applied before initialization |
| Search / initialization deadlines | 600 s / 120 s |

Compiled transitions are admitted only when they fit; otherwise initialization
selects the retained fallback workers. The new planes contain rule-derived
transitions and stability, with no game values. Their memory is additional to
the TT allocation. Peak RSS is whole-process memory, not a measurement of TT
occupancy. Production node/cache counters are unavailable rather than zero.

For the measured Windows machine, use PowerShell 7:

```powershell
./run-i5.ps1 -NodePath 'C:/path/to/recorded-node27/node.exe'
```

That launcher requires the i5-12600K and
`v27.0.0-nightly20260928b59840b593` / V8 `14.6.202.34-node.36`. Process affinity is
85, with workers pinned to verified logical processors 0/2/4/6 before solver
initialization. The portable launcher is unpinned; its timings are unqualified.

## Results and qualification

| Measurement | Primary time | Evidence |
|---|---:|---|
| Matching pre-C66 control mean | 56.239 s | [Crossover](../isomax/evidence/C66-CROSSOVER.json) |
| Retained C66 candidate mean, two trials | 53.828 s | Same crossover |
| Final reviewed source confirmation | 54.156 s | [Raw confirmation](../isomax/evidence/runs/fusion-final-confirm-01/stdout.json) |
| Standalone extracted package confirmation | 55.326 s | [Archive verification](../isomax/dist/VERIFICATION-0.2.0-rc.2.json) |

Primary time runs from all workers ready and cold tables initialized through
actual empty-root construction and the observed exact result. Initialization and
cleanup are reported separately. Process cycles in the research evidence include
initialization and cleanup. Standalone confirmation is one packaging check,
not another repeated performance comparison. The ≤10 s target remains unmet.

The extracted package returned WIN/column 4, with four workers ready/exited and
clean termination. Peak RSS was about 6.44 GiB. Fresh post-promotion checks passed
423 repository tests, 46 package tests, source/closure reproduction, archive
identity and the 535-unit NEES catalog. Read the
[review and its limits](../isomax/evidence/FINAL-REVIEW.md) and
[packaging review](../evidence/isomax-overhead-fusion-20261005/promotion/PACKAGE-REVIEW.md).
These checks do not establish a universal UC4A evaluator; both formula holdouts
remain sealed.

## Version preservation

The package runtime is copied unchanged from
`d2e4ccadcef6d67bc97a53679476e1ef6a5a9916`, preserved by
`isomax-0.2.0-rc.2-source`. [provenance.json](../isomax/provenance.json) locks 72
runtime modules, all 24 selectable worker variants, and public package files.
Maintainers can run `node isomax/prepare.mjs --check` in a full Git checkout.
Keep the versioned archive and [checksums](../isomax/dist/SHA256SUMS) immutable.
Registry publication remains disabled. Prior archives are retained under
[dist/](../isomax/dist/).

## Historical structural-prefix version

The remainder preserves the earlier selection; its configuration and timing
do not describe the promoted 0.2.0-rc.2 package.
Canonical support libraries in `src/` and `addons/` may receive owner-authorized
upgrades. This document, the unchanged source lock, and the
[historical archive](../profiles/frozen-isomax-20261001/) preserve the earlier
measured version separately from those libraries and the current package.

The owner selected the exact measured empty-board composition on 2026-10-02.
`profiles/isomax-current.json` is that historical configuration and source lock.
The immutable tag `isomax-tested-empty-structural-20261001` preserves the original
research evidence at `5ea441d8964077ee4de98f52ed74b1ad6a71c3e8`.

The archive contains all 63 paths listed in `profiles/isomax-current.json`,
preserving their relative paths. Each file was read from immutable repository
revision `4b8329a2a8af660cd7027c90cfe94093702d9f9b`, normalized to LF as specified
by the lock, and verified against its original SHA-256. No upgraded working-tree
library was used to populate the archive. The archived solver preserves the
measured `6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e` version, together with the
recorded structural calculator, measurement scripts and artifacts. Its evidence
does not qualify subsequent canonical-library or package changes.

The selected configuration is four pinned i5-12600K P-cores, logical processors
0/2/4/6, worker 0 wide and workers 1/2/3 deep; 5 GiB shared TT and 576 MiB private
TT per worker; full sharing; the recorded Node 27 nightly; and a 600-second
search ceiling. One pre-search phase computes moves from the actual empty board
until unresolved. It computed `44444`, then invoked the historical solver once.
The total was 47,033.1095 ms, including 0.1552 ms for the structural phase.

This evidence covers a structural prefix followed by one exact root solve. It
does not cover a full self-play game or qualify a persistent-worker application.
The exact W/D/L belongs to the computed search root. The timing observation does
not independently prove the structural opening rule for arbitrary positions.

### Reproduce the historical localhost measurement

The saved harness intentionally retains its recorded Windows paths. Preserve
the clean solver checkout at `C:/r/isomax-p2-memory-source` on `6bbba7c`, the
structural module at `C:/r/isomax-rank-local-benchmark`, the pinned runtime path
in `evidence/isomax-memory-affinity-20260928/runtime.json`, and the four recorded
affinity targets. Locked components are retained under
`profiles/frozen-isomax-20261001/` and checked against the unchanged lock. The
archive preserves original imports and harness paths; it does not rewrite the
historical harness to run against upgraded canonical libraries.

From a clean checkout containing this promotion, copy the packet from
`evidence/isomax-empty-structural-once-5g-576-20261001/` into
`evidence/isomax-memory-affinity-20260928/`, giving it a new filename and a new
`id` to preserve previous raw results. Leave its empty fixture and all settings
unchanged. Run the pinned Node executable with:

```text
evidence/isomax-memory-affinity-20260928/run-packet-structural-once.mjs <new-packet-path>
```

The runner checks the clean solver SHA, runtime, worker affinity, errors, and
cleanup. The sample checks seven calculator controls before timing and obtains
every opening move from the calculator. Allocation, worker startup, and teardown
inside the historical solver invocation remain in the measured wall interval.

### Preserve the historical selection

Keep the frozen tags, archive, lock and measured artifacts unchanged. Repository
tag rules reject tag updates and deletion. The required lock test checks archived
source and artifact hashes and selected capacities, and independently checks the
original evidence record at the repository root. The calculator controls remain
checks against the canonical library. Owner-authorized library upgrades therefore
do not replace the frozen version or inherit its performance qualification; they
and the current package require their own evidence. The historical 10 GiB profile
remains unchanged for provenance and is overridden by the frozen experiment packet.
