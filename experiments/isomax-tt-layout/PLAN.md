# Initialization-selected TT layout experiment

Approved objective: shrink shared TT storage without adding key encoding or
decoding, weakening exact identity, or fixing the engine to one board size.
Choose layout/accessors once from prepared geometry. Preserve production CPC,
BSFP, search policy, move order, hash, TT replacement/publication semantics,
private TT, worker topology, and reporting-free hot loop.

Baseline: cbc4ddf995be83334ea26190c749028435e353fa (runtime equals eefbdf5).
Frozen main: e76e9ab3ca0e7a292badf9d9ac38a811d7971c99.

Candidate: replace the standard 40-byte entry with a 32-byte record. The same
eight logical key fields are loaded/stored using native Uint8/Uint16/Uint32
atomics in disjoint ranges. Existing support/tail packing is unchanged. The
sequence counter and exact value retain all 32 bits. No unpacking is introduced.
Byte addresses require additional address arithmetic/view accesses; fewer bytes
is not proof of fewer CPU cycles. Measure the whole solve before disposition.

Other dimensions select direct coordinate/meta storage and native 8/16/32-bit
column heights at initialization. Generic entries round up to a multiple of 32
bytes. The cold accessor factory selects compact or direct operations, with no
dimension dispatch inside either probe/store. This experiments with the TT
layer; the existing lean benchmark solver still requires standard 7x6 geometry.
The general production engine and its cache are unchanged. No claim of a
new generalized lean solver is made.

32-byte stride improves alignment opportunities; JS does not guarantee physical
64-byte alignment of the backing address, so cache-line containment is not
asserted from byteOffset alone. No native allocator or padding is added.

Qualification: compare every logical shared entry after deterministic solves;
multiple board geometries and offsets; gray-owner reuse; bit-distinguishing
collisions; sequence rollover/locked entries; four-worker collision stress;
exact 4-GiB allocation structured-clone attachment and last-slot publication;
complete suite, source-generation and existing hot-loop/geometry audits.

Performance protocol frozen before measurements: one unscored candidate warm-up,
then eight scored cold solves ABBA BAAB. A = preceding all-four candidate;
B = this layout. Original Node nightly, four pinned deep workers on 0/2/4/6,
134217728 shared entries, 16777216 private entries per worker, same sample mask,
same 300-second timeout. Equal shared entry capacity intentionally changes its
allocation from 5 GiB to 4 GiB; private memory remains 576 MiB per worker. Do not
describe this as equal-byte-budget comparison. The existing benchmark computes
five structural moves from empty and makes one exact search from 44444, including
host allocation/worker startup and cleanup. It is not a whole self-play game.
No profiling flags in scored runs. Report all runs and paired uncertainty;
no promotion based only on reduced footprint or a favorable isolated time.

Do not promote main during this experiment. Preserve candidate, evidence and
honest disposition on the task branch.
