# Twelve GiB extension result

Runtime source:6bc1dd047209664f9924c4cb49597a2154555107. Full measurement packet:
[Connect4 twelve-GiB qualification](https://github.com/iteathen/Connect4/blob/work/isomax-auto-workers-20261006/docs/qualification/20261006-exact-tt-identity/TWELVE-GIB-RESULT.md).

Full24 now supports shared banks with cold attachment/accessor binding. Twelve
GiB uses two6GiB banks of2^28rows; private TT remains192MiB per six pinned worker.
Bank selection retains all row locator bits and the full32bit sequence protocol.
RBA/CPC/tactics/ordering/window/first-terminal semantics and private accessors are
unchanged. Single-bank full24 and mixed hot function bodies are unchanged.
The banked path adds three field reads, one array-reference load (guards included),
one unsigned shift and mask before the existing shared row probe/store.

Owner-freed memory allowed the15.125GiB preflight (12GiB shared +1.125GiB private
+2GiB reserve). Three fresh sequential12GiB runs:34.805,38.467,37.298s, mean36.857s.
Matched post-cleanup6GiB/two-bank controls:38.677,37.486,38.942s, mean38.368s.
One separate fresh6GiB/single-bank reference:37.921s. All seven returned
EXACT/WIN/c4, six verified pins and six clean exits. The runtime, JIT flags,
support plans and hardware are fixed. No RLC, opening prefix, oracle/book or
persisted TT enters runtime. Primary solve excludes only initialization/cleanup.

12GiB mean solve is3.94% lower than matched6GiB, with overlapping small samples.
Whole-process CPU is0.74% lower. Initialization means5.576s versus4.473s and
external wall means both approximately43.3s. The primary goal excludes setup.
Peak RSS14.593GiB for12GiB,8.594GiB for6GiB. Process cycles and hot counters are
not collected. Do not promote the fastest sample as the typical solve or claim
the10-second objective achieved. Raw data/statistics live in the consumer packet.

Qualification before performance replay:467/467 root tests;26 independent bounded
physical-minimax comparisons1340nodes; four tiny banks/all five tags/same local
slots across banks/busy/wrap/clone/alias; host all-ready/cleanup and source-generator
checks;298 sealed functions+642 add-on units,30/30blocks,0deferred. No10x10 full
solve. Other board dimensions preserve their exact initialization-selected fallback.

Review found no runtime correctness blocker. Its ledger finding (array-reference
load was charged as a fourth field read) is fixed at6bc1dd0 and independently
confirmed. Factory topology/whole-object-clone attachment is the supported boundary;
arbitrary manually assembled SAB-handle alias topologies are unsupported, matching
the existing native-bank contract. JIT diagnostics on actual12GiB show banked
probe/store inlined into Negamax and actual two-bank payload before timing.

RETAINED as the experimental capacity extension needed for this measurement.
No production package/default/main change. The test qualifies this7x6/six-worker
localhost capacity, not arbitrary large capacities/platforms. Per-bank native
index bounds remain enforced; current factory max bank capacity2^28, global2^32
and existing max64-bank constraint. Unmeasured larger allocations stay unqualified.
