# Per-node behavior worker repair

Tested implementation: `095d66d63894247ebdbc1003d65b2d63b5b1f94b`.
Earlier argument-address implementation: `7c0bb71503e3837befaaab761503ba908f044992`.
Ordinary solver/worker baseline: `93aca1758718bcbf0635c11a957a67ca6387d50c`.
Windows / Intel i5-12600K / Node 26.7.0 / V8 14.6.202.34-node.28.

## Delivered execution

The optional Lazy SMP worker reads the strategist-owned primary word after
every completed q/terminal child/root and at each forced-transit boundary.
It does not sample. Setup prepares the memory, reader, byte address and scratch.
Bit 0 is cooperative STOP. An individual retired worker does not stop peers.
All workers retiring returns INTERRUPTED with null WDL; cancellation cannot
publish an unfinished parent as exact. No strategist/ordering/PFIF policy is
implemented. Existing default solver/worker source is unchanged.

The prepared reader encodes the worker's byte address as an i32.const in a tiny
Wasm atomic-load function. Its exported load takes no arguments. The ordinary
JS Atomics reader still handles the rare multiword publication protocol. The
scope/cost deviation is explicit in `docs/worker-behavior.md`; this is not full
NEES qualification or a global sealed-catalog admission of arbitrary Wasm.

## Verification

- Full suite: 156/156 PASS; full output in `tests.txt`.
- Catalog: 298 sealed functions and 137 add-on units cycle-ledgered, 30/30 blocks.
- Generated-source exact-regeneration and runtime-geometry audits PASS.
- Real worker: start a 7x6 empty-board search; wait for at least 100 shared-cache
  publications; publish STOP; observe clean retirement with no WDL/winner.
- One retired worker leaves its peer able to solve.
- Injected stops at checks 1/2/10/100/500 stop exactly there; cleared flags allow
  a subsequent correct solve retaining valid shared exact rows.
- Zero-flag 4x4 and 7x6 solves match values, moves, node counts and metrics;
  observed checks equal cofactors+1, including terminal children and root.
- Independent review found the forced-terminal missing child check; it was
  independently reproduced by the exact count test and repaired before commit.
  Final follow-up review verified signed-LEB address encoding, sliced views,
  unsigned flags and actual reads through 4 MiB. Larger offsets had encoding/
  module-validation evidence only.

## Actual solve cycles

Reproduction (Windows):

```text
node --experimental-ffi tools/bench-behavior-search.mjs report.json
```

Four ABBA blocks, 200 complete solves per arm/sample, eight samples per arm,
one prepared reader per evaluator, 100 warmup solves per fixture/variant.
No per-node test counter is present in measured production execution.

| Case | Plain cycles/visited node | Controlled cycles/visited node | Added | Change |
| --- | ---: | ---: | ---: | ---: |
| 4x4 empty | 1584.11 | 1599.42 | 15.30 | +0.966% |
| 7x6 late fixture | 1790.93 | 1794.63 | 3.70 | +0.207% |

The 7x6 move sequence and full expected outputs are in `fixed-address.json`.
Its result is P0 win, caller move 4 (zero-based). 4x4 empty is draw, move 0.
Across both arms: 42,822,400 visited 4x4 nodes and 748,800 visited 7x6 nodes.
Visited-node accounting is the baseline counter, distinct from completed nodes;
per-completed-node cycles and exact counts are also in the JSON.

These are whole-solve loop measurements, including flags, branching, return
value preservation, cancellation tests, cache/solver work and runtime effects.
They are not the isolated ~6-cycle load loop previously discussed.

The earlier argument-address version, measured cleanly at 7c0bb71, added 25.08
cycles/visited node on 4x4 (+1.590%) and 39.76 on 7x6 (+2.237%). Binding the
address during initialization was therefore retained as the justified candidate.

Do not claim a strict sub-1% upper bound: paired-block deltas at the final head
range from -1.65 to +26.97 cycles/node on 4x4 and -17.18 to +21.36 on 7x6.
No CPU affinity was imposed on this hybrid CPU. More sustained, affinity-aware
qualification is needed for a tight bound and for a claim about other roots.
There is no concurrent writer in the timing run. Live publication is correctness
tested, but strategist-frequency/coherence and full SMP overhead remain unmeasured.

## Total accounting and retained experiments

`fixed-address.json` records 74,778,399,542 process CPU cycles through its final
checkpoint, with exact startup/setup+warmup/measured/between-sample partition.
The isolated reader preparation subtotal is 7,934,115 cycles, included in setup.
Shared memory minimum: 65,536 bytes; one 128-byte worker region and 12 bytes of
private extension scratch per worker, plus module/instance/runtime overhead.
Report construction and shutdown occur after the final checkpoint and are
excluded. Compiler tier scheduling remains runtime-controlled.

`argument-address.json` is the earlier clean-head serial comparison.
`exploratory-multiple-readers.json` records the initial two-reader-identity JIT
profile and uncommitted setup; it is not the production one-reader profile.
`exploratory-fixed-address.json` records the precommit fixed-address screen
(about 7.5 extra cycles/node on both fixtures); final-head results above supersede
that point estimate. `overlapped-verification-run.json` overlapped full tests
during warmup/early timing and is explicitly excluded from conclusions.
All are retained, not silently discarded.

`prepared-load-assembly.txt` shows the address-bound atomic function and JS/Wasm
wrapper after additional diagnostic warmup; constant +0x80 identifies worker 1.
It is mechanism evidence, not a claim that wrapper or load costs are zero or that
the entire solver has received assembly qualification.

PR remains draft. No baseline replacement, Connect4 dependency repin, PFIF
strategist, memory/timeout expansion or merge is part of this repair.
