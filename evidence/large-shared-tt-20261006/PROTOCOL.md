# Larger native32 shared TT candidate

Owner-directed experiment: determine 8/16GiB ROI after the 1/2/4GiB capacity matrix favored 4GiB. Not promoted and no production default/package changed.

Candidate banks retain the exact existing compact32 field packing, atomic seqlock/CAS and proof tags. Global hash slot bits split into bank number and intra-bank slot. Every bank has at most 2^27 records, retaining the optimized halfword index range. No state-dependent initialization, lookup allocation, diagnostic counter, clock, retry, compression or decoding is added. Extra bank selection (three fields, shift, mask, bank-reference access, potentially an inlined call) is explicitly charged and must earn its cost.

Unbanked <=4GiB still selects the original access functions cold. Shared auto layout behavior above4GiB is unchanged; the experimental harness explicitly selects native banks. Wider/noncompact geometries retain their prior path and reject a bank override. The candidate is a standard7x6 cache experiment, not a new universal geometry layout.

Controls: untouched packaged4GiB baseline; candidate unbanked4GiB; banked4GiB with two2GiB banks; 8GiB with two4GiB banks; 16GiB with four4GiB banks when physical and commit headroom admit it. Use discovered six verified P-core workers,256MiB private/worker, original runtime/JIT/geometry/plans/proof policy. Primary interval excludes initialization/cleanup. Memory/commit/paging observations are required; resource-censored16GiB is not a failed performance result.

Fast checks cover exact-key collisions, distinct bank slots, proof tags, attachment/alias guards, concurrent publication and prepared multiworker lifecycle. Catalog now554units. Existing hot protocol bodies are unchanged, and generated worker hot bodies remain unchanged. Full-root correctness and performance remain unqualified until measured.
