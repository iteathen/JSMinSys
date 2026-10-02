# Historical frozen IsoMax version

The current prepared candidate is [the self-contained isomax package](../isomax/README.md).
This document and its source lock preserve the earlier measured version unchanged.

The owner selected the exact measured empty-board composition on 2026-10-02.
`profiles/isomax-current.json` is that historical configuration and source lock.
The immutable tag `isomax-tested-empty-structural-20261001` preserves the original
research evidence at `5ea441d8964077ee4de98f52ed74b1ad6a71c3e8`.

The solver remains byte-identical to `6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e`.
The structural calculator and measurement scripts are copied unchanged from the
measured version. Existing solver exports, CPC, RBA, TT, move ordering, and worker
semantics are unchanged. Unrelated research modules and the per-move self-play
selector are not part of this promotion.

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
affinity targets. All executable components are retained and hashed in the lock.

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

Keep the frozen tags and measured artifacts unchanged. Repository tag rules
reject tag updates and deletion. The existing required test suite now checks
the source and artifact hashes and selected capacities. Further experiments
belong on separate branches; replacing this current selection requires explicit
owner authorization and new evidence. The historical 10 GiB profile remains
unchanged for provenance and is overridden by the frozen experiment packet.
