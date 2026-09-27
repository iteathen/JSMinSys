# CPC factorial screen

Owner: JSMinSys experimental campaign; Connect4 owns game semantics. No production promotion.

Question: which predictive family has net cycle value on the pinned 45461667 four-worker solve?

A full CPC; B exhaustion removed; C response removed; D both removed. All start at JSMinSys 93aca1758718bcbf0635c11a957a67ca6387d50c. The checked cofactor, cache, move order and worker model are identical. No strategist.

Use unmodified sample, counter, node instrumentation and validation from Connect4 7a1a41665d3f5b1a679c16598d60ae3d1035706d. Process creation through joined solve, including all process threads; excludes subsequent JSON/git/report and parent controller. Four workers, 65536 local/shared entries, sharing mask 7, 30s ceiling.

Run a balanced four-arm Williams order (ABDC, BCAD, CDBA, DACB), repeated twice: eight blocks, 32 fresh-process production samples. Pair within blocks; report descriptive intervals and interaction, not promotion. Then two instrumented samples per arm, separately; these cannot replace production economics. Fail on oracle, cleanup, identity or partition mismatch; no silent retries.

First protect the treatment boundaries and run existing independent exact-oracle, tactical and Lazy SMP tests on all arms. Capture source diffs, revisions and raw subprocess output before analysis. Retain every failure. No full NEES qualification claimed by this screen.
