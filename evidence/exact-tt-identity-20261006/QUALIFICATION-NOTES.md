# Qualification findings

Full suite initially459/462 passed. Three stale baseline contracts failed:
isomax-library-binding expected older e6580e9 runtime lock; isomax-promotion-package
expected rc3/static capacities; rba-shared-layout-integration treated an8GiB total
table as invalid even though banked profiles now support it. All three test files
were unchanged by the TT candidate. The capacity failure was independently
reproduced against the untouched packaged40b1943 host. The first baseline probe
used a legacy host absent from the package; that import failure was not counted.

Requalified contracts pin current frozen40b1943 closure, rc4/auto memory with
historical explicit defaults, and an oversized8GiB leaf-bank override (which
must reject before allocation). Seven focused contract tests pass. No production
runtime changes were made to satisfy these stale assertions.

Fresh read-only review at45504db found no runtime correctness blocker for the
stated nonterminal normalized domain and no generated search/transport changes.
It found eight address additions and one unsigned shift missing in the new
packing ledger; these emitted operations are now charged. Catalog verifies598units.
The full32bit publication sequence was retained; no new hot clocks/counters.

Fresh native32 control:40,976.5024ms,6pinned workers,4GiBshared and256MiBprivate
per worker,EXACT/WIN/c4 and clean exits. Raw evidence is in Connect4
docs/qualification/20261006-large-shared-tt/partial-key-native32-control-01.
Current24byte candidate holds the same number of entries,3GiBshared and192MiB
private per worker. Fewer bytes is a footprint claim; full solve decides speed.
