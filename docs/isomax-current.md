# Historical frozen IsoMax version

The current prepared candidate is [the self-contained isomax package](../isomax/README.md).
The promoted minimal-worker package is `0.2.0-rc.1`, with direct empty-board
execution and a 56.893-second retained localhost mean. Its own profile/provenance
is authoritative for setup. The remainder of this document preserves older evidence.
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

## Reproduce the exact localhost measurement

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

## Preserve this selection

Keep the frozen tags, archive, lock and measured artifacts unchanged. Repository
tag rules reject tag updates and deletion. The required lock test checks archived
source and artifact hashes and selected capacities, and independently checks the
original evidence record at the repository root. The calculator controls remain
checks against the canonical library. Owner-authorized library upgrades therefore
do not replace the frozen version or inherit its performance qualification; they
and the current package require their own evidence. The historical 10 GiB profile
remains unchanged for provenance and is overridden by the frozen experiment packet.
